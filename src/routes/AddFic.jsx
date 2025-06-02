import { useState, useEffect, useRef } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const mapToOptions = (data) =>
  data.map((item) => ({ value: item.id, label: item.name || item.title }));

const AddFic = () => {
  const navigate = useNavigate();
  const initialFormState = {
    link: "",
    title: "",
    author: "",
    summary: "",
    rating: "",
    archive_warning: [],
    category: "",
    fandoms: [],
    relationships: [],
    characters: [],
    tags: [],
    words: "",
    chapters: "",
    hits: "",
    kudos: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef(null);

  // 1) SANITIZE IMMEDIATELY on every keystroke
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 2) Whenever formData.link changes, wait 500ms and query Supabase
  useEffect(() => {
    if (!formData.link) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const { data: fic, error } = await supabase
          .from("fics")
          .select(
            `
            id,
            link,
            title,
            author,
            summary,
            rating,
            archive_warning,
            category,
            words,
            chapters,
            hits,
            kudos,
            fandoms:fandoms(id, name),
            relationships:relationships(id, name),
            characters:characters(id, name),
            tags:tags(id, name)
          `
          )
          .eq("link", formData.link)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching fic by link:", error);
          return;
        }

        if (fic) {
          setFormData({
            link: fic.link || "",
            title: fic.title || "",
            author: fic.author || "",
            summary: fic.summary || "",
            rating: fic.rating || "",
            archive_warning: fic.archive_warning || [],
            category: fic.category || "",
            fandoms:
              fic.fandoms?.map((f) => ({ value: f.id, label: f.name })) || [],
            relationships:
              fic.relationships?.map((r) => ({ value: r.id, label: r.name })) ||
              [],
            characters:
              fic.characters?.map((c) => ({ value: c.id, label: c.name })) ||
              [],
            tags: fic.tags?.map((t) => ({ value: t.id, label: t.name })) || [],
            words: fic.words ? fic.words.toString() : "",
            chapters: fic.chapters || "",
            hits: fic.hits ? fic.hits.toString() : "",
            kudos: fic.kudos ? fic.kudos.toString() : "",
          });
        }
      } catch (e) {
        console.error("Error loading fic on link change:", e);
      }
    }, 500);

    return () => clearTimeout(debounceTimer.current);
  }, [formData.link]);

  // Load options for AsyncCreatableSelect
  const loadOptions = async (table, inputValue) => {
    if (!inputValue) return [];
    const { data, error } = await supabase
      .from(table)
      .select("id, name")
      .ilike("name", `%${inputValue}%`)
      .limit(20);
    if (error || !data) {
      console.error(`Error loading ${table}:`, error);
      return [];
    }
    return mapToOptions(data);
  };

  // For any multi‐select field, either return existing ID or create a new row
  const getOrCreateEntries = async (table, values) => {
    const names = values.map((v) => (typeof v === "string" ? v : v.label));
    const ids = [];

    for (const name of names) {
      const { data: existing, error: fetchError } = await supabase
        .from(table)
        .select("id")
        .ilike("name", name)
        .limit(1);

      if (fetchError) throw fetchError;

      if (existing && existing.length > 0) {
        ids.push(existing[0].id);
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from(table)
          .insert([{ name }])
          .select("id");
        if (insertError) throw insertError;
        ids.push(inserted[0].id);
      }
    }
    return ids;
  };

  // When the user submits, create a new fic (if it doesn’t already exist)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Ensure the user is authenticated
      const {
        data: { user } = {},
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("You must be logged in to submit a fic.");
        setIsLoading(false);
        return;
      }

      // Normalize and sanitize the link before insertion
      let rawLink = formData.link.trim().toLowerCase();
      rawLink = rawLink.replace(/^https?:\/\//, "").replace(/^www\./, "");
      formData.link = rawLink;

      // Check if a fic with this link already exists
      const { data: existingFic, error: checkError } = await supabase
        .from("fics")
        .select("id")
        .eq("link", formData.link)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

      let ficId;
      if (existingFic) {
        alert("Fic already exists! Redirecting to log page...");
        ficId = existingFic.id;
      } else {
        // Insert into main fics table
        const { data: ficInsert, error: ficError } = await supabase
          .from("fics")
          .insert([
            {
              link: formData.link,
              title: formData.title,
              author: formData.author,
              summary: formData.summary,
              rating: formData.rating,
              archive_warning: formData.archive_warning,
              category: formData.category,
              words: parseInt(formData.words, 10) || null,
              chapters: formData.chapters,
              hits: parseInt(formData.hits, 10) || null,
              kudos: parseInt(formData.kudos, 10) || null,
            },
          ])
          .select("id");

        if (ficError) throw ficError;
        ficId = ficInsert[0].id;

        // For each multi‐select field, get or create IDs
        const fandomIDs = await getOrCreateEntries("fandoms", formData.fandoms);
        const relationshipIDs = await getOrCreateEntries(
          "relationships",
          formData.relationships
        );
        const characterIDs = await getOrCreateEntries(
          "characters",
          formData.characters
        );
        const tagIDs = await getOrCreateEntries("tags", formData.tags);

        // Insert into join tables
        const joinTableInsert = async (table, column, ids) => {
          if (!ids.length) return;
          const rows = ids.map((id) => ({ fic_id: ficId, [column]: id }));
          const { error } = await supabase.from(table).insert(rows);
          if (error) throw error;
        };

        await joinTableInsert("fic_fandoms", "fandom_id", fandomIDs);
        await joinTableInsert(
          "fic_relationships",
          "relationship_id",
          relationshipIDs
        );
        await joinTableInsert("fic_characters", "character_id", characterIDs);
        await joinTableInsert("fic_tags", "tags_id", tagIDs);

        alert("Fic added successfully!");
        setFormData(initialFormState);
      }

      // Redirect to the “log this fic” page
      navigate(`/log-fic/${ficId}`);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Inline styles are copied from EditFic
  const formContainerStyle = {
    maxWidth: 700,
    margin: "auto",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  };

  const labelStyle = { display: "block", marginBottom: 10 };
  const inputStyle = { width: "100%", padding: 8, marginTop: 4 };
  const numberInputStyle = { width: "100%", padding: 8, marginTop: 4, minWidth: 0 };

  return (
    <form onSubmit={handleSubmit} style={formContainerStyle}>
      <h2>Add a New Fic</h2>

      {/* Fic Link */}
      <label style={labelStyle}>
        Fic Link:
        <input
          type="text"
          value={formData.link}
          onChange={(e) => {
            // strip https://, www., lowercase immediately
            const raw = e.target.value.trim().toLowerCase();
            const cleaned = raw
              .replace(/^https?:\/\//, "")
              .replace(/^www\./, "");
            handleChange("link", cleaned);
          }}
          required
          style={inputStyle}
        />
      </label>

      {/* Title */}
      <label style={labelStyle}>
        Title:
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          style={inputStyle}
        />
      </label>

      {/* Author */}
      <label style={labelStyle}>
        Author:
        <input
          type="text"
          value={formData.author}
          onChange={(e) => handleChange("author", e.target.value)}
          style={inputStyle}
        />
      </label>

      {/* Summary */}
      <label style={labelStyle}>
        Summary:
        <textarea
          value={formData.summary}
          onChange={(e) => handleChange("summary", e.target.value)}
          style={{ ...inputStyle, minHeight: 80 }}
        />
      </label>

      {/* Rating */}
      <label style={labelStyle}>
        Rating:
        <select
          value={formData.rating}
          onChange={(e) => handleChange("rating", e.target.value)}
          required
          style={inputStyle}
        >
          <option value="">Select a rating</option>
          <option value="General Audiences">General Audiences</option>
          <option value="Teen And Up Audiences">Teen And Up Audiences</option>
          <option value="Mature">Mature</option>
          <option value="Explicit">Explicit</option>
          <option value="Not Rated">Not Rated</option>
        </select>
      </label>

      {/* Category */}
      <label style={labelStyle}>
        Category:
        <select
          value={formData.category}
          onChange={(e) => handleChange("category", e.target.value)}
          required
          style={inputStyle}
        >
          <option value="">Select a category</option>
          <option value="F/F">F/F</option>
          <option value="F/M">F/M</option>
          <option value="Gen">Gen</option>
          <option value="M/M">M/M</option>
          <option value="Multi">Multi</option>
          <option value="Other">Other</option>
          <option value="Not Categorized">Not Categorized</option>
        </select>
      </label>

      {/* Archive Warnings */}
      <fieldset style={{ marginBottom: 20 }}>
        <legend>Archive Warnings</legend>
        {[
          "Choose Not To Use Archive Warnings",
          "No Archive Warnings Apply",
          "Graphic Depictions Of Violence",
          "Major Character Death",
          "Rape/Non-Con",
          "Underage",
        ].map((warning) => (
          <label key={warning} style={{ display: "block" }}>
            <input
              type="checkbox"
              checked={formData.archive_warning.includes(warning)}
              onChange={(e) => {
                let newWarnings = [...formData.archive_warning];
                if (e.target.checked) {
                  if (warning === "No Archive Warnings Apply") {
                    newWarnings = [warning];
                  } else {
                    newWarnings = newWarnings.filter(
                      (w) => w !== "No Archive Warnings Apply"
                    );
                    newWarnings.push(warning);
                  }
                } else {
                  newWarnings = newWarnings.filter((w) => w !== warning);
                }
                handleChange("archive_warning", newWarnings);
              }}
            />
            {warning}
          </label>
        ))}
      </fieldset>

      {/* Fandoms */}
      <label style={labelStyle}>
        Fandoms:
        <AsyncCreatableSelect
          isMulti
          cacheOptions
          defaultOptions
          value={formData.fandoms}
          loadOptions={(input) => loadOptions("fandoms", input)}
          onChange={(vals) => handleChange("fandoms", vals || [])}
          styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
        />
      </label>

      {/* Relationships */}
      <label style={labelStyle}>
        Relationships:
        <AsyncCreatableSelect
          isMulti
          cacheOptions
          defaultOptions
          value={formData.relationships}
          loadOptions={(input) => loadOptions("relationships", input)}
          onChange={(vals) => handleChange("relationships", vals || [])}
          styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
        />
      </label>

      {/* Characters */}
      <label style={labelStyle}>
        Characters:
        <AsyncCreatableSelect
          isMulti
          cacheOptions
          defaultOptions
          value={formData.characters}
          loadOptions={(input) => loadOptions("characters", input)}
          onChange={(vals) => handleChange("characters", vals || [])}
          styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
        />
      </label>

      {/* Tags */}
      <label style={labelStyle}>
        Tags:
        <AsyncCreatableSelect
          isMulti
          cacheOptions
          defaultOptions
          value={formData.tags}
          loadOptions={(input) => loadOptions("tags", input)}
          onChange={(vals) => handleChange("tags", vals || [])}
          styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
        />
      </label>

      {/* Words */}
      <label style={labelStyle}>
        Words:
        <input
          type="number"
          min="0"
          value={formData.words}
          onChange={(e) => handleChange("words", e.target.value)}
          style={numberInputStyle}
        />
      </label>

      {/* Chapters */}
      <label style={labelStyle}>
        Chapters:
        <input
          type="text"
          value={formData.chapters}
          onChange={(e) => handleChange("chapters", e.target.value)}
          style={inputStyle}
        />
      </label>

      {/* Hits */}
      <label style={labelStyle}>
        Hits:
        <input
          type="number"
          min="0"
          value={formData.hits}
          onChange={(e) => handleChange("hits", e.target.value)}
          style={numberInputStyle}
        />
      </label>

      {/* Kudos */}
      <label style={{ display: "block", marginBottom: 20 }}>
        Kudos:
        <input
          type="number"
          min="0"
          value={formData.kudos}
          onChange={(e) => handleChange("kudos", e.target.value)}
          style={numberInputStyle}
        />
      </label>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          padding: "10px 20px",
          backgroundColor: isLoading ? "#ccc" : "#0070f3",
          color: "white",
          border: "none",
          cursor: isLoading ? "not-allowed" : "pointer",
          borderRadius: 4,
          fontSize: 16,
        }}
      >
        {isLoading ? "Submitting..." : "Add Fic"}
      </button>
    </form>
  );
};

export default AddFic;
