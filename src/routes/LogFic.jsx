import { useState } from 'react';
import AsyncCreatableSelect from 'react-select/async-creatable';
import ReactSelect from 'react-select';
import { supabase } from '../supabaseClient';

// helper to map Supabase data to react-select options
const mapToOptions = (data) => data.map(item => ({ value: item.id, label: item.name }));

const LogFic = () => {
  const [formData, setFormData] = useState({
    link: '',
    title: '',
    author: '',
    summary: '',
    rating: '',
    archiveWarnings: [],
    category: '',
    fandoms: [],
    relationships: [],
    characters: [],
    tags: [],
    words: '',
    chapters: '',
    hits: '',
    kudos: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Async loader for options from a given table filtered by input value
  const loadOptions = async (table, inputValue) => {
    if (!inputValue) return [];
    const { data, error } = await supabase
      .from(table)
      .select('id, name')
      .ilike('name', `%${inputValue}%`)
      .limit(20);

    if (error) {
      console.error(`Error loading ${table}:`, error);
      return [];
    }

    return mapToOptions(data);
  };

  return (
    <form>
      <label>Link</label>
      <input
        type="text"
        value={formData.link}
        onChange={(e) => handleChange('link', e.target.value.replace(/^https?:\/\/(www\.)?/, ''))}
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
        onChange={(option) => handleChange('rating', option?.value)}
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
        value={formData.archiveWarnings.map(val => ({
          value: val,
          label: val,
        }))}
        onChange={(options) =>
          handleChange('archiveWarnings', options.map(o => o.value))
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
        onChange={(option) => handleChange('category', option?.value)}
      />

      <label>Fandoms</label>
      <AsyncCreatableSelect
        isMulti
        cacheOptions
        defaultOptions
        loadOptions={(inputValue) => loadOptions('fandoms', inputValue)}
        onChange={(selected) => handleChange('fandoms', selected)}
        value={formData.fandoms}
      />

      <label>Relationships</label>
      <AsyncCreatableSelect
        isMulti
        cacheOptions
        defaultOptions
        loadOptions={(inputValue) => loadOptions('relationships', inputValue)}
        onChange={(selected) => handleChange('relationships', selected)}
        value={formData.relationships}
      />

      <label>Characters</label>
      <AsyncCreatableSelect
        isMulti
        cacheOptions
        defaultOptions
        loadOptions={(inputValue) => loadOptions('characters', inputValue)}
        onChange={(selected) => handleChange('characters', selected)}
        value={formData.characters}
      />

      <label>Additional Tags</label>
      <AsyncCreatableSelect
        isMulti
        cacheOptions
        defaultOptions
        loadOptions={(inputValue) => loadOptions('tags', inputValue)}
        onChange={(selected) => handleChange('tags', selected)}
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

      {/* Submit button and handler will go here */}
    </form>
  );
};

export default LogFic;
