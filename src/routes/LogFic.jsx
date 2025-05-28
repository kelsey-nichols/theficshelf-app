import { useState, useEffect } from 'react';
import AsyncCreatableSelect from 'react-select/async-creatable';
import ReactSelect from 'react-select';
import { supabase } from '../supabaseClient';

const mapToOptions = (data) =>
  data.map((item) => ({ value: item.id, label: item.name || item.title }));

const LogFic = () => {
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
    shelves: [],
    status: '',
    date_started: new Date().toISOString().split('T')[0],
    date_finished: '',
    reread_dates: [],
    current_chapter: '',
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [shelfOptions, setShelfOptions] = useState([]);

  useEffect(() => {
    const fetchShelves = async () => {
      const { data, error } = await supabase.from('shelves').select('id, title');
      if (!error && data) {
        setShelfOptions(data.map((shelf) => ({ value: shelf.id, label: shelf.title })));
      }
    };
    fetchShelves();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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

  const insertShelfFic = async (ficId, shelves, user) => {
    if (!user || !user.id) {
      throw new Error('User ID is required for shelf ownership verification.');
    }

    const shelfIds = shelves?.filter(id => typeof id === 'string' && id.length > 0) || [];

    if (shelfIds.length === 0) {
      console.log('No valid shelves selected, skipping shelf_fic insert.');
      return;
    }

    // Verify user owns all shelves before inserting
    const { data: ownedShelves, error: ownershipError } = await supabase
      .from('shelves')
      .select('id')
      .eq('user_id', user.id)
      .in('id', shelfIds);

    if (ownershipError) throw ownershipError;

    if (ownedShelves.length !== shelfIds.length) {
      throw new Error('Shelf ownership verification failed: some shelves are not owned by user.');
    }

    // Query existing shelf_fic links to prevent duplicates
    const { data: existingLinks, error: existingError } = await supabase
      .from('shelf_fic')
      .select('shelf_id')
      .eq('fic_id', ficId)
      .in('shelf_id', shelfIds);

    if (existingError) throw existingError;

    const existingShelfIds = existingLinks.map(link => link.shelf_id);

    // Filter out shelf IDs already linked to this fic
    const newShelfIds = shelfIds.filter(id => !existingShelfIds.includes(id));

    if (newShelfIds.length === 0) {
      console.log('No new shelf_fic entries to insert (all duplicates).');
      return;
    }

    const rows = newShelfIds.map((shelf_id, index) => ({
      shelf_id,
      fic_id: ficId,
      position: index + 1,
    }));

    const { error: insertError } = await supabase.from('shelf_fic').insert(rows);
    if (insertError) throw insertError;
  };

  const insertJoin = async (tableName, columnName, ficId, relatedIds) => {
  if (!Array.isArray(relatedIds) || relatedIds.length === 0) {
    console.log(`No valid IDs for ${tableName}, skipping insert.`);
    return;
  }

  // Query existing join rows to prevent duplicates
  const { data: existingLinks, error: existingError } = await supabase
    .from(tableName)
    .select(columnName)
    .eq('fic_id', ficId)
    .in(columnName, relatedIds);

  if (existingError) throw existingError;

  const existingIds = existingLinks.map(link => link[columnName]);

  // Filter out IDs already linked to this fic
  const newIds = relatedIds.filter(id => !existingIds.includes(id));

  if (newIds.length === 0) {
    console.log(`No new entries to insert into ${tableName} (all duplicates).`);
    return;
  }

  // Prepare rows for insertion
  const rows = newIds.map(id => ({
    fic_id: ficId,
    [columnName]: id,
  }));

  const { error: insertError } = await supabase.from(tableName).insert(rows);
  if (insertError) throw insertError;
};


  try {
    const { data: { user } = {}, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert('You must be logged in to submit a fic.');
      return;
    }

    // Check if fic already exists by link
    const { data: existingFic, error: checkError } = await supabase
      .from('fics')
      .select('id')
      .eq('link', formData.link)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    let ficId;

    if (existingFic) {
      ficId = existingFic.id;

      await insertShelfFic(ficId, formData.shelves, user);

      const { error: logError } = await supabase.from('reading_logs').insert([{
        user_id: user.id,
        fic_id: ficId,
        status: formData.status,
        date_started: formData.date_started,
        date_finished: formData.date_finished || null,
        reread_dates: formData.reread_dates,
        current_chapter: parseInt(formData.current_chapter, 10) || null,
        notes: formData.notes,
      }]);

      if (logError) throw logError;

      alert('Fic already existed; reading log added!');
      setFormData(initialFormState);
      return;
    }

    // Insert new fic
    const { data: ficInsert, error: ficError } = await supabase
      .from('fics')
      .insert([{
        link: formData.link,
        title: formData.title,
        author: formData.author,
        summary: formData.summary,
        rating: formData.rating,
        archive_warning: formData.archive_warning,
        category: formData.category,
        words: parseInt(formData.words, 10),
        chapters: formData.chapters,
        hits: parseInt(formData.hits, 10),
        kudos: parseInt(formData.kudos, 10),
      }])
      .select('id');

    if (ficError) throw ficError;
    ficId = ficInsert[0].id;

    // Insert or get IDs for related entries
    const fandomIDs = await getOrCreateEntries('fandoms', formData.fandoms);
    const relationshipIDs = await getOrCreateEntries('relationships', formData.relationships);
    const characterIDs = await getOrCreateEntries('characters', formData.characters);
    const tagIDs = await getOrCreateEntries('tags', formData.tags);

    await insertJoin('fic_fandoms', 'fandom_id', ficId, fandomIDs);
    await insertJoin('fic_relationships', 'relationship_id', ficId, relationshipIDs);
    await insertJoin('fic_characters', 'character_id', ficId, characterIDs);
    await insertJoin('fic_tags', 'tag_id', ficId, tagIDs);

    await insertShelfFic(ficId, formData.shelves, user);

    const { error: logError } = await supabase.from('reading_logs').insert([{
      user_id: user.id,
      fic_id: ficId,
      status: formData.status,
      date_started: formData.date_started,
      date_finished: formData.date_finished || null,
      reread_dates: formData.reread_dates,
      current_chapter: parseInt(formData.current_chapter, 10) || null,
      notes: formData.notes,
    }]);

    if (logError) throw logError;

    alert('Fic logged successfully!');
    setFormData(initialFormState);

  } catch (err) {
    console.error('Error submitting fic:', err);
    alert('Failed to log fic.');
  }
};


  return (
    <form onSubmit={handleSubmit}>
      <label>Link</label>
      <input
        type="text"
        value={formData.link}
        onChange={(e) =>
          handleChange('link', e.target.value.replace(/^https?:\/\/(www\.)?/, ''))
        }
      />

      <label>Title</label>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
      />

      <label>Author</label>
      <input
        type="text"
        value={formData.author}
        onChange={(e) => handleChange('author', e.target.value)}
      />

      <label>Summary</label>
      <textarea
        value={formData.summary}
        onChange={(e) => handleChange('summary', e.target.value)}
      />

      <label>Rating</label>
      <ReactSelect
        options={[
          { value: 'General Audiences', label: 'General Audiences' },
          { value: 'Teen And Up Audiences', label: 'Teen And Up Audiences' },
          { value: 'Mature', label: 'Mature' },
          { value: 'Explicit', label: 'Explicit' },
          { value: 'Not Rated', label: 'Not Rated' },
        ]}
        value={
          formData.rating
            ? { value: formData.rating, label: formData.rating }
            : null
        }
        onChange={(option) => handleChange('rating', option?.value || '')}
      />

      <label>Archive Warnings</label>
      <ReactSelect
        isMulti
        options={[
          { value: 'Choose Not To Use Archive Warnings', label: 'Choose Not To Use Archive Warnings' },
          { value: 'No Archive Warnings Apply', label: 'No Archive Warnings Apply' },
          { value: 'Graphic Depictions Of Violence', label: 'Graphic Depictions Of Violence' },
          { value: 'Major Character Death', label: 'Major Character Death' },
          { value: 'Rape/Non-Con', label: 'Rape/Non-Con' },
          { value: 'Underage', label: 'Underage' },
        ]}
        value={formData.archive_warning.map((val) => ({ value: val, label: val }))}
        onChange={(options) =>
          handleChange(
            'archive_warning',
            (options || []).map((o) => o.value)
          )
        }
      />

      <label>Category</label>
      <ReactSelect
        options={[
          { value: 'F/F', label: 'F/F' },
          { value: 'F/M', label: 'F/M' },
          { value: 'Gen', label: 'Gen' },
          { value: 'M/M', label: 'M/M' },
          { value: 'Multi', label: 'Multi' },
          { value: 'Other', label: 'Other' },
          { value: 'Not Categorized', label: 'Not Categorized' },
        ]}
        value={
          formData.category
            ? { value: formData.category, label: formData.category }
            : null
        }
        onChange={(option) => handleChange('category', option?.value || '')}
      />

      <label>Fandoms</label>
      <AsyncCreatableSelect
        isMulti
        cacheOptions
        defaultOptions
        loadOptions={(inputValue) => loadOptions('fandoms', inputValue)}
        onChange={(selected) => handleChange('fandoms', selected || [])}
        value={formData.fandoms}
      />

      <label>Relationships</label>
      <AsyncCreatableSelect
        isMulti
        cacheOptions
        defaultOptions
        loadOptions={(inputValue) => loadOptions('relationships', inputValue)}
        onChange={(selected) => handleChange('relationships', selected || [])}
        value={formData.relationships}
      />

      <label>Characters</label>
      <AsyncCreatableSelect
        isMulti
        cacheOptions
        defaultOptions
        loadOptions={(inputValue) => loadOptions('characters', inputValue)}
        onChange={(selected) => handleChange('characters', selected || [])}
        value={formData.characters}
      />

      <label>Additional Tags</label>
      <AsyncCreatableSelect
        isMulti
        cacheOptions
        defaultOptions
        loadOptions={(inputValue) => loadOptions('tags', inputValue)}
        onChange={(selected) => handleChange('tags', selected || [])}
        value={formData.tags}
      />

      <label>Words</label>
      <input
        type="number"
        value={formData.words}
        onChange={(e) => handleChange('words', e.target.value)}
      />

      <label>Chapters</label>
      <input
        type="text"
        value={formData.chapters}
        onChange={(e) => handleChange('chapters', e.target.value)}
      />

      <label>Hits</label>
      <input
        type="number"
        value={formData.hits}
        onChange={(e) => handleChange('hits', e.target.value)}
      />

      <label>Kudos</label>
      <input
        type="number"
        value={formData.kudos}
        onChange={(e) => handleChange('kudos', e.target.value)}
      />

      {/* Shelves */}
      <label>Shelves</label>
      <ReactSelect
        isMulti
        options={shelfOptions.filter((shelf) => shelf.label !== 'Archive')}
        value={shelfOptions.filter((shelf) =>
          formData.shelves.includes(shelf.value)
        )}
        onChange={(selected) =>
          handleChange(
            'shelves',
            (selected || []).map((s) => s.value)
          )
        }
      />

      {/* Status Selection */}
      <label>Status</label>
      <ReactSelect
        options={[
          { value: 'tbr', label: 'To Be Read' },
          { value: 'currently_reading', label: 'Currently Reading' },
          { value: 'read', label: 'Read' },
        ]}
        value={
          formData.status
            ? {
                value: formData.status,
                label: formData.status
                  .replace('_', ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase()),
              }
            : null
        }
        onChange={(option) => handleChange('status', option?.value || '')}
      />

      {(formData.status === 'currently_reading' || formData.status === 'read') && (
  <>
    <label>Date Started</label>
    <input
      type="date"
      value={formData.date_started}
      onChange={(e) => handleChange('date_started', e.target.value)}
    />
  </>
)}

{formData.status === 'currently_reading' && (
  <>
    <label>Reread Dates</label>
    <input
      type="text"
      placeholder="Comma-separated dates (YYYY-MM-DD)"
      value={formData.reread_dates.join(', ') || ''}
      onChange={(e) =>
        handleChange(
          'reread_dates',
          e.target.value
            .split(',')
            .map((d) => d.trim())
            .filter((d) => d)
        )
      }
    />
    <label>Current Chapter</label>
    <input
      type="text"
      value={formData.current_chapter}
      onChange={(e) => handleChange('current_chapter', e.target.value)}
    />
  </>
)}

{formData.status === 'read' && (
  <>
    <label>Date Finished</label>
    <input
      type="date"
      value={formData.date_finished}
      onChange={(e) => handleChange('date_finished', e.target.value)}
    />

    <label>Notes</label>
    <textarea
      value={formData.notes}
      onChange={(e) => handleChange('notes', e.target.value)}
    />
  </>
)}

      <button type="submit">Log Fic</button>
    </form>
  );
};

export default LogFic;

