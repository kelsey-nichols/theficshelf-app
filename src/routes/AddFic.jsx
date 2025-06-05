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

return (
  <div className="min-h-screen bg-[#d3b7a4] flex justify-center items-start py-10 px-4">
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl w-full bg-[#202d26] text-[#d3b7a4] shadow-md space-y-6 font-serif rounded-xl p-8"
    >
      <h2 className="text-3xl font-semibold text-[#d3b7a4] mb-6">add a new fic</h2>

      {/* Fic Link */}
      <div>
        <label className="block mb-2 font-medium text-[#d3b7a4]">Fic Link:</label>
        <input
          type="text"
          value={formData.link}
          onChange={(e) => {
            const raw = e.target.value.trim().toLowerCase();
            const cleaned = raw.replace(/^https?:\/\//, "").replace(/^www\./, "");
            handleChange("link", cleaned);
          }}
          required
          className="w-full bg-[#dfdad6] border-2 placeholder-[#886146] border-[#886146] text-[#202d26] rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
        />
      </div>

      {/* Title */}
      <div>
        <label className="block mb-2 font-medium text-[#d3b7a4]">Title:</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          className="w-full bg-[#dfdad6] border-2 placeholder-[#886146] border-[#886146] text-[#202d26] rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
        />
      </div>

      {/* Author */}
      <div>
        <label className="block mb-2 font-medium text-[#d3b7a4]">Author:</label>
        <input
          type="text"
          value={formData.author}
          onChange={(e) => handleChange("author", e.target.value)}
          className="w-full bg-[#dfdad6] border-2 placeholder-[#886146] border-[#886146] text-[#202d26] rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
        />
      </div>

      {/* Summary */}
      <div>
        <label className="block mb-2 font-medium text-[#d3b7a4]">Summary:</label>
        <textarea
          value={formData.summary}
          onChange={(e) => handleChange("summary", e.target.value)}
          rows={4}
          className="w-full resize-y bg-[#dfdad6] border-2 placeholder-[#886146] border-[#886146] text-[#202d26] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
        />
      </div>

      {/* Rating */}
      <div>
        <label className="block mb-2 font-medium text-[#d3b7a4]">Rating:</label>
        <select
          value={formData.rating}
          onChange={(e) => handleChange("rating", e.target.value)}
          required
          className="w-full bg-[#dfdad6] border-2 placeholder-[#886146] border-[#886146] text-[#202d26] rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
        >
          <option value="">Select a rating</option>
          <option value="General Audiences">General Audiences</option>
          <option value="Teen And Up Audiences">Teen And Up Audiences</option>
          <option value="Mature">Mature</option>
          <option value="Explicit">Explicit</option>
          <option value="Not Rated">Not Rated</option>
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block mb-2 font-medium text-[#d3b7a4]">Category:</label>
        <select
          value={formData.category}
          onChange={(e) => handleChange("category", e.target.value)}
          required
          className="w-full bg-[#dfdad6] border-2 placeholder-[#886146] border-[#886146] text-[#202d26] rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
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
      </div>

      {/* Archive Warnings */}
      <fieldset className="border border-[#d3b7a4] rounded-md p-4">
        <legend className="text-lg font-medium mb-2 text-[#d3b7a4]">Archive Warnings</legend>
        <div className="space-y-2">
          {[
            "Choose Not To Use Archive Warnings",
            "No Archive Warnings Apply",
            "Graphic Depictions Of Violence",
            "Major Character Death",
            "Rape/Non-Con",
            "Underage",
          ].map((warning) => (
            <label
              key={warning}
              className="flex items-center text-[#d3b7a4] text-sm"
            >
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
                className="appearance-none h-5 w-5 border-2 border-[#d3b7a4] rounded-sm mr-3 checked:bg-[#886146] checked:border-[#d3b7a4] focus:outline-none cursor-pointer transition"
              />
              {warning}
            </label>
          ))}
        </div>
      </fieldset>

      {/* AsyncCreatableSelect Fields */}
      {[
        ["Fandoms", "fandoms"],
        ["Relationships", "relationships"],
        ["Characters", "characters"],
        ["Tags", "tags"],
      ].map(([label, field]) => (
        <div key={field}>
          <label className="block mb-2 font-medium text-[#d3b7a4]">{label}:</label>
          <AsyncCreatableSelect
            isMulti
            cacheOptions
            defaultOptions
            value={formData[field]}
            loadOptions={(input) => loadOptions(field, input)}
            onChange={(vals) => handleChange(field, vals || [])}
            styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
          />
        </div>
      ))}

      {/* Numeric Inputs */}
      {[
        ["Words", "words"],
        ["Chapters", "chapters"],
        ["Hits", "hits"],
        ["Kudos", "kudos"],
      ].map(([label, key]) => (
        <div key={key}>
          <label className="block mb-2 font-medium text-[#d3b7a4]">{label}:</label>
          <input
            type={key === "chapters" ? "text" : "number"}
            min={key !== "chapters" ? "0" : undefined}
            value={formData[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full bg-[#dfdad6] border-2 placeholder-[#886146] border-[#886146] text-[#202d26] rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
          />
        </div>
      ))}

      {/* Submit Button */}
      <div className="flex justify-center mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className={`px-6 py-2 rounded-md text-[#202d26] font-semibold ${
            isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-[#d3b7a4] hover:bg-[#6f4b34]"
          }`}
        >
          {isLoading ? "Submitting..." : "ADD FIC"}
        </button>
      </div>
    </form>
  </div>
);

};

export default AddFic;
