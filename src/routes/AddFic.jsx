import { useState, useEffect, useRef } from 'react';
import AsyncCreatableSelect from 'react-select/async-creatable';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const mapToOptions = (data) =>
  data.map((item) => ({ value: item.id, label: item.name || item.title }));

const AddFic = () => {
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
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (!formData.link) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const { data: fic, error } = await supabase
          .from('fics')
          .select('*')
          .eq('link', formData.link)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching fic by link:', error);
          return;
        }

        if (fic) {
          setFormData((prev) => ({
            ...prev,
            title: fic.title || '',
            author: fic.author || '',
            summary: fic.summary || '',
            rating: fic.rating || '',
            archive_warning: fic.archive_warning || [],
            category: fic.category || '',
            fandoms: fic.fandoms || [],
            words: fic.words ? fic.words.toString() : '',
            chapters: fic.chapters || '',
            hits: fic.hits ? fic.hits.toString() : '',
            kudos: fic.kudos ? fic.kudos.toString() : '',
          }));
        }
      } catch (e) {
        console.error('Error loading fic on link change:', e);
      }
    }, 500);

    return () => clearTimeout(debounceTimer.current);
  }, [formData.link]);

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

  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data: { user } = {}, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('You must be logged in to submit a fic.');
        return;
      }

      const { data: existingFic, error: checkError } = await supabase
        .from('fics')
        .select('id')
        .eq('link', formData.link)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      let ficId;

      if (existingFic) {
        alert('Fic already exists!');
        ficId = existingFic.id;
      } else {
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

        const fandomIDs = await getOrCreateEntries('fandoms', formData.fandoms);
        const relationshipIDs = await getOrCreateEntries('relationships', formData.relationships);
        const characterIDs = await getOrCreateEntries('characters', formData.characters);
        const tagIDs = await getOrCreateEntries('tags', formData.tags);

        const joinTableInsert = async (table, column, ids) => {
          if (!ids.length) return;
          const rows = ids.map((id) => ({ fic_id: ficId, [column]: id }));
          const { error } = await supabase.from(table).insert(rows);
          if (error) throw error;
        };

        await joinTableInsert('fic_fandoms', 'fandom_id', fandomIDs);
        await joinTableInsert('fic_relationships', 'relationship_id', relationshipIDs);
        await joinTableInsert('fic_characters', 'character_id', characterIDs);
        await joinTableInsert('fic_tags', 'tags_id', tagIDs);

        alert('Fic added!');
        setFormData(initialFormState);
      }

      // Navigate after submit (existing or new fic)
      navigate(`/log-fic/${ficId}`);

    } catch (err) {
      console.error('Submission error:', err);
      alert('Something went wrong. Please try again.');
    }
  };

  const sanitizeLink = (url) => {
  return url
    .replace(/^https?:\/\//, '')  // Remove http:// or https:// at start
    .replace(/^www\./, '');        // Remove www. at start
};


  return (
    <form onSubmit={handleSubmit}>
      <label>
        Fic Link:
        <input
        type="text"
        value={formData.link}
        onChange={(e) => handleChange('link', sanitizeLink(e.target.value))}
        required
        />
    </label>

      <label>
        Title:
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </label>

      <label>
        Author:
        <input
          type="text"
          value={formData.author}
          onChange={(e) => handleChange('author', e.target.value)}
        />
      </label>

      <label>
        Summary:
        <textarea
          value={formData.summary}
          onChange={(e) => handleChange('summary', e.target.value)}
        />
      </label>

      <label>
        Rating:
            <select
                value={formData.rating}
                onChange={(e) => handleChange('rating', e.target.value)}
                required
            >
                <option value="">Select a rating</option>
                <option value="General Audiences">General Audiences</option>
                <option value="Teen And Up Audiences">Teen And Up Audiences</option>
                <option value="Mature">Mature</option>
                <option value="Explicit">Explicit</option>
                <option value="Not Rated">Not Rated</option>
            </select>
      </label>

      <label>
            Category:
            <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
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

      <label>
        Archive Warnings:
        <select
            multiple
            value={formData.archive_warning}
            onChange={(e) =>
            handleChange(
                'archive_warning',
                Array.from(e.target.selectedOptions, (option) => option.value)
            )
            }
            required
        >
            <option value="Choose Not To Use Archive Warnings">Choose Not To Use Archive Warnings</option>
            <option value="No Archive Warnings Apply">No Archive Warnings Apply</option>
            <option value="Graphic Depictions Of Violence">Graphic Depictions Of Violence</option>
            <option value="Major Character Death">Major Character Death</option>
            <option value="Rape/Non-Con">Rape/Non-Con</option>
            <option value="Underage">Underage</option>
        </select>
      </label>

      <label>
        Fandoms:
        <AsyncCreatableSelect
          isMulti
          cacheOptions
          defaultOptions
          loadOptions={(input) => loadOptions('fandoms', input)}
          onChange={(selected) => handleChange('fandoms', selected)}
          value={formData.fandoms}
        />
      </label>

      <label>
        Relationships:
        <AsyncCreatableSelect
          isMulti
          cacheOptions
          defaultOptions
          loadOptions={(input) => loadOptions('relationships', input)}
          onChange={(selected) => handleChange('relationships', selected)}
          value={formData.relationships}
        />
      </label>

      <label>
        Characters:
        <AsyncCreatableSelect
          isMulti
          cacheOptions
          defaultOptions
          loadOptions={(input) => loadOptions('characters', input)}
          onChange={(selected) => handleChange('characters', selected)}
          value={formData.characters}
        />
      </label>

      <label>
        Tags:
        <AsyncCreatableSelect
          isMulti
          cacheOptions
          defaultOptions
          loadOptions={(input) => loadOptions('tags', input)}
          onChange={(selected) => handleChange('tags', selected)}
          value={formData.tags}
        />
      </label>

      <label>
        Words:
        <input
          type="number"
          value={formData.words}
          onChange={(e) => handleChange('words', e.target.value)}
        />
      </label>

      <label>
        Chapters:
        <input
          type="text"
          value={formData.chapters}
          onChange={(e) => handleChange('chapters', e.target.value)}
        />
      </label>

      <label>
        Hits:
        <input
          type="number"
          value={formData.hits}
          onChange={(e) => handleChange('hits', e.target.value)}
        />
      </label>

      <label>
        Kudos:
        <input
          type="number"
          value={formData.kudos}
          onChange={(e) => handleChange('kudos', e.target.value)}
        />
      </label>

      <button type="submit">Add Fic</button>
    </form>
  );
};

export default AddFic;