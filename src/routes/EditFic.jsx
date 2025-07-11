import { useState, useEffect, useRef } from 'react';
import AsyncCreatableSelect from 'react-select/async-creatable';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';

const mapToOptions = (data) =>
  data.map((item) => ({ value: item.id, label: item.name || item.title }));

const EditFic = () => {
  const { ficId } = useParams(); // Assume route like /edit-fic/:ficId
  const navigate = useNavigate();
  console.log('ficId:', ficId);

  const initialFormState = {
    link: '',
    title: '',
    author: '',
    summary: '',
    rating: '',
    archive_warning: [],
    category: '',
    fandoms: [],
    relationships: [],
    characters: [],
    tags: [],
    words: '',
    chapters: '',
    hits: '',
    kudos: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const debounceTimer = useRef(null);

  // Load the fic data by ID on mount and prefill
  useEffect(() => {
    if (!ficId) return;
    setIsLoading(true);
    supabase
      .from('fics')
      .select(`
            *,
            fandoms:fandoms(id, name),
            relationships:relationships(id, name),
            characters:characters(id, name),
            tags:tags(id, name)
            `)
      .eq('id', ficId)
      .single()
      .then(({ data: fic, error }) => {
        if (error) {
          console.error('Error fetching fic:', error);
          setIsLoading(false);
          return;
        }
        if (fic) {
          setFormData({
            link: fic.link || '',
            title: fic.title || '',
            author: fic.author || '',
            summary: fic.summary || '',
            rating: fic.rating || '',
            archive_warning: fic.archive_warning || [],
            category: fic.category || '',
            fandoms: fic.fandoms.map((f) => ({ value: f.id, label: f.name })) || [],
            relationships: fic.relationships.map((r) => ({ value: r.id, label: r.name })) || [],
            characters: fic.characters.map((c) => ({ value: c.id, label: c.name })) || [],
            tags: fic.tags.map((t) => ({ value: t.id, label: t.name })) || [],
            words: fic.words ? fic.words.toString() : '',
            chapters: fic.chapters || '',
            hits: fic.hits ? fic.hits.toString() : '',
            kudos: fic.kudos ? fic.kudos.toString() : '',
          });
        }
        setIsLoading(false);
      });
  }, [ficId]);

  // Helper to update form fields
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Async options loader for selects
  const loadOptions = async (table, inputValue) => {
    if (!inputValue) return [];
    const { data, error } = await supabase
      .from(table)
      .select('id, name')
      .ilike('name', `%${inputValue}%`)
      .limit(20);
    if (error || !data) {
      console.error(`Error loading ${table}:`, error);
      return [];
    }
    return mapToOptions(data);
  };

  // Get or create entries (same as AddFic)
  const getOrCreateEntries = async (table, values) => {
    const names = values.map((v) => (typeof v === 'string' ? v : v.label));
    const ids = [];

    for (const name of names) {
      const { data: existing, error: fetchError } = await supabase
        .from(table)
        .select('id')
        .ilike('name', name)
        .limit(1);

      if (fetchError) throw fetchError;

      if (existing && existing.length > 0) {
        ids.push(existing[0].id);
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from(table)
          .insert([{ name }])
          .select('id');
        if (insertError) throw insertError;
        ids.push(inserted[0].id);
      }
    }
    return ids;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const columnToTable = {
        fandom_id: 'fandoms',
        relationship_id: 'relationships',
        character_id: 'characters',
        tags_id: 'tags',
        };

    // Normalize the URL
    let rawLink = formData.link.trim().toLowerCase(); // Ensure it's lowercase and trimmed
    // Remove protocols and www
    rawLink = rawLink.replace(/^https?:\/\//, '').replace(/^www\./, '');

    // Reassign the cleaned link
    formData.link = rawLink;

    if (!confirmationChecked) {
      alert('You must confirm that you understand the changes affect all users and match AO3.');
      return;
    }

    try {
      const { data: { user } = {}, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('You must be logged in to edit a fic.');
        return;
      }

      // Update fic main info
      const { error: updateError } = await supabase
        .from('fics')
        .update({
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
        })
        .eq('id', ficId);

      if (updateError) throw updateError;

      // Update join tables: clear old ones and insert new ones
      const joinTables = [
        { table: 'fic_fandoms', column: 'fandom_id', values: formData.fandoms, refTable: 'fandoms' },
        { table: 'fic_relationships', column: 'relationship_id', values: formData.relationships, refTable: 'relationships' },
        { table: 'fic_characters', column: 'character_id', values: formData.characters, refTable: 'characters' },
        { table: 'fic_tags', column: 'tags_id', values: formData.tags, refTable: 'tags' },
      ];

      const columnToTable = {
    fandom_id: 'fandoms',
    relationship_id: 'relationships',
    character_id: 'characters',
    tags_id: 'tags',
    };

    for (const { table, column, values, refTable } of joinTables) {
    // 1. Get new desired IDs from form
    const newIds = await getOrCreateEntries(columnToTable[column], values);
    const uniqueNewIds = Array.from(new Set(newIds));

    // 2. Get currently stored IDs for this fic
    const { data: currentRows, error: fetchError } = await supabase
        .from(table)
        .select(column)
        .eq('fic_id', ficId);

    if (fetchError) throw fetchError;

    const currentIds = currentRows.map((row) => row[column]);

    // 3. Calculate differences
    const toDelete = currentIds.filter((id) => !uniqueNewIds.includes(id));
    const toInsert = uniqueNewIds.filter((id) => !currentIds.includes(id));

    // 4. Delete removed entries
    for (const id of toDelete) {
        const { error: delError } = await supabase
        .from(table)
        .delete()
        .match({ fic_id: ficId, [column]: id });

        if (delError) throw delError;
    }

    // 5. Insert new entries
    if (toInsert.length > 0) {
        const rows = toInsert.map((id) => ({ fic_id: ficId, [column]: id }));
        const { error: insertError } = await supabase.from(table).insert(rows);
        if (insertError) throw insertError;
    }
    }

      alert('Fic updated successfully!');
      navigate(`/fic/${ficId}`);
    } catch (err) {
      console.error('Update error:', err);
      alert('Something went wrong updating the fic. Please try again.');
    }
  };

  if (isLoading) return <p>Loading fic data...</p>;

  return (
  <div className="min-h-screen bg-[#d3b7a4] flex justify-center items-start py-10 px-4">
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl w-full bg-[#202d26] text-[#d3b7a4] shadow-md space-y-6 font-serif rounded-xl p-8"
    >
      <h2 className="text-3xl font-semibold text-[#d3b7a4] mb-6">
        Edit Fic Information
      </h2>
      <p className="text-xs text-[#826555]">
        Note: Editing a fic updates it for all users—please make sure your
        changes match the AO3 source exactly.
      </p>

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
        </select>
      </div>

      {/* Archive Warnings */}
      <fieldset className="border border-[#d3b7a4] rounded-md p-4">
        <legend className="text-lg font-medium mb-2 text-[#d3b7a4]">
          Archive Warnings
        </legend>
        <div className="space-y-2">
          {[
            "Creator Chose Not To Use Archive Warnings",
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

      {/* Async Selects */}
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

      {/* Confirmation */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={confirmationChecked}
          onChange={(e) => setConfirmationChecked(e.target.checked)}
          className="h-5 w-5 border-2 border-[#d3b7a4] rounded-sm checked:bg-[#886146] transition cursor-pointer"
        />
        <span className="text-sm text-[#d3b7a4]">
          I confirm these changes affect all users and match AO3 exactly.
        </span>
      </div>

      {/* Submit */}
      <div className="flex justify-center mt-6">
        <button
          type="submit"
          disabled={!confirmationChecked}
          className={`px-6 py-2 rounded-md text-[#202d26] font-semibold ${
            confirmationChecked
              ? "bg-[#d3b7a4] hover:bg-[#6f4b34]"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Save Changes
        </button>
      </div>
    </form>
  </div>
);
};

export default EditFic;
