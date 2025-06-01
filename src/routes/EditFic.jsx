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
    <form onSubmit={handleSubmit} style={{ maxWidth: 700, margin: 'auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>Edit Fic Information</h2>

      <label style={{ display: 'block', marginBottom: 10 }}>
        Fic Link:
        <input
          type="text"
          value={formData.link}
          onChange={(e) => handleChange('link', e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 10 }}>
        Title:
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 10 }}>
        Author:
        <input
          type="text"
          value={formData.author}
          onChange={(e) => handleChange('author', e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 10 }}>
        Summary:
        <textarea
          value={formData.summary}
          onChange={(e) => handleChange('summary', e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4, minHeight: 80 }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 10 }}>
        Rating:
        <select
          value={formData.rating}
          onChange={(e) => handleChange('rating', e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        >
          <option value="">Select a rating</option>
          <option value="General Audiences">General Audiences</option>
          <option value="Teen And Up Audiences">Teen And Up Audiences</option>
          <option value="Mature">Mature</option>
          <option value="Explicit">Explicit</option>
          <option value="Not Rated">Not Rated</option>
        </select>
      </label>

      <label style={{ display: 'block', marginBottom: 10 }}>
        Category:
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          required
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        >
          <option value="">Select a category</option>
          <option value="F/F">F/F</option>
          <option value="F/M">F/M</option>
          <option value="Gen">Gen</option>
          <option value="M/M">M/M</option>
          <option value="Multi">Multi</option>
          <option value="Other">Other</option>
        </select>
      </label>

      {/* Archive Warnings - checkbox group */}
      <fieldset style={{ marginBottom: 20 }}>
        <legend>Archive Warnings</legend>
        {['No Archive Warnings Apply', 'Graphic Depictions of Violence', 'Major Character Death', 'Rape/Non-Con', 'Underage'].map((warning) => (
          <label key={warning} style={{ display: 'block' }}>
            <input
              type="checkbox"
              checked={formData.archive_warning.includes(warning)}
              onChange={(e) => {
                let newWarnings = [...formData.archive_warning];
                if (e.target.checked) {
                  if (warning === 'No Archive Warnings Apply') {
                    newWarnings = [warning];
                  } else {
                    newWarnings = newWarnings.filter((w) => w !== 'No Archive Warnings Apply');
                    newWarnings.push(warning);
                  }
                } else {
                  newWarnings = newWarnings.filter((w) => w !== warning);
                }
                handleChange('archive_warning', newWarnings);
              }}
            />
            {warning}
          </label>
        ))}
      </fieldset>

      {/* Fandoms */}
      <label style={{ display: 'block', marginBottom: 10 }}>
        Fandoms:
        <AsyncCreatableSelect
          isMulti
          cacheOptions
          defaultOptions
          value={formData.fandoms}
          loadOptions={(input) => loadOptions('fandoms', input)}
          onChange={(vals) => handleChange('fandoms', vals || [])}
          styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
        />
      </label>

      {/* Relationships */}
      <label style={{ display: 'block', marginBottom: 10 }}>
        Relationships:
        <AsyncCreatableSelect
          isMulti
          cacheOptions
          defaultOptions
          value={formData.relationships}
          loadOptions={(input) => loadOptions('relationships', input)}
          onChange={(vals) => handleChange('relationships', vals || [])}
          styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
        />
      </label>

      {/* Characters */}
      <label style={{ display: 'block', marginBottom: 10 }}>
        Characters:
        <AsyncCreatableSelect
          isMulti
          cacheOptions
          defaultOptions
          value={formData.characters}
          loadOptions={(input) => loadOptions('characters', input)}
          onChange={(vals) => handleChange('characters', vals || [])}
          styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
        />
      </label>

      {/* Tags */}
      <label style={{ display: 'block', marginBottom: 10 }}>
        Tags:
        <AsyncCreatableSelect
          isMulti
          cacheOptions
          defaultOptions
          value={formData.tags}
          loadOptions={(input) => loadOptions('tags', input)}
          onChange={(vals) => handleChange('tags', vals || [])}
          styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
        />
      </label>

      {/* Numbers */}
      <label style={{ display: 'block', marginBottom: 10 }}>
        Words:
        <input
          type="number"
          min="0"
          value={formData.words}
          onChange={(e) => handleChange('words', e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 10 }}>
        Chapters:
        <input
          type="text"
          value={formData.chapters}
          onChange={(e) => handleChange('chapters', e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 10 }}>
        Hits:
        <input
          type="number"
          min="0"
          value={formData.hits}
          onChange={(e) => handleChange('hits', e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 20 }}>
        Kudos:
        <input
          type="number"
          min="0"
          value={formData.kudos}
          onChange={(e) => handleChange('kudos', e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 20 }}>
        <input
          type="checkbox"
          checked={confirmationChecked}
          onChange={(e) => setConfirmationChecked(e.target.checked)}
          required
          style={{ marginRight: 8 }}
        />
        I confirm that these changes affect all users and the information matches the AO3 source exactly.
      </label>

      <button
        type="submit"
        disabled={!confirmationChecked}
        style={{
          padding: '10px 20px',
          backgroundColor: confirmationChecked ? '#0070f3' : '#ccc',
          color: 'white',
          border: 'none',
          cursor: confirmationChecked ? 'pointer' : 'not-allowed',
          borderRadius: 4,
          fontSize: 16,
        }}
      >
        Save Changes
      </button>
    </form>
  );
};

export default EditFic;
