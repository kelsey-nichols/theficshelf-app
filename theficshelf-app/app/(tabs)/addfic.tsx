import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Picker, Platform } from 'react-native';

const ratings = ['G', 'T', 'M', 'E', 'Not Rated'];
const archiveWarnings = [
  'Choose Not To Use Archive Warnings',
  'No Archive Warnings Apply',
  'Graphic Depictions Of Violence',
  'Major Character Death',
  'Rape/Non-Con',
  'Underage',
];
const categories = ['F/F', 'F/M', 'Gen', 'M/M', 'Multi', 'Other', 'Not Categorized'];

export default function AddFicScreen() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [link, setLink] = useState('');
  const [rating, setRating] = useState('');
  const [archiveWarning, setArchiveWarning] = useState('');
  const [category, setCategory] = useState('');

  const [fandom, setFandom] = useState('');
  const [relationship, setRelationship] = useState('');
  const [characters, setCharacters] = useState('');
  const [tags, setTags] = useState('');

  const [words, setWords] = useState('');
  const [chapters, setChapters] = useState('');
  const [hits, setHits] = useState('');
  const [kudos, setKudos] = useState('');

  // TODO: Hook up autocomplete suggestions for fandom, relationship, etc.
  // TODO: Add button + logic for saving and/or navigating to shelf assignment

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Add Fic Details</Text>

      {/* Manual text fields */}
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Author" value={author} onChangeText={setAuthor} />
      <TextInput style={styles.input} placeholder="Link" value={link} onChangeText={setLink} keyboardType="url" />

      {/* Dropdown fields */}
      <Text style={styles.label}>Rating</Text>
      <Picker selectedValue={rating} onValueChange={setRating}>
        <Picker.Item label="Select Rating" value="" />
        {ratings.map((r) => <Picker.Item key={r} label={r} value={r} />)}
      </Picker>

      <Text style={styles.label}>Archive Warning</Text>
      <Picker selectedValue={archiveWarning} onValueChange={setArchiveWarning}>
        <Picker.Item label="Select Archive Warning" value="" />
        {archiveWarnings.map((w) => <Picker.Item key={w} label={w} value={w} />)}
      </Picker>

      <Text style={styles.label}>Category</Text>
      <Picker selectedValue={category} onValueChange={setCategory}>
        <Picker.Item label="Select Category" value="" />
        {categories.map((c) => <Picker.Item key={c} label={c} value={c} />)}
      </Picker>

      {/* Autocomplete fields (stubbed as TextInput for now) */}
      <TextInput style={styles.input} placeholder="Fandom" value={fandom} onChangeText={setFandom} />
      <TextInput style={styles.input} placeholder="Relationship" value={relationship} onChangeText={setRelationship} />
      <TextInput style={styles.input} placeholder="Characters" value={characters} onChangeText={setCharacters} />
      <TextInput style={styles.input} placeholder="Additional Tags" value={tags} onChangeText={setTags} />

      {/* Numeric fields */}
      <TextInput style={styles.input} placeholder="Words" value={words} onChangeText={setWords} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Chapters" value={chapters} onChangeText={setChapters} />
      <TextInput style={styles.input} placeholder="Hits" value={hits} onChangeText={setHits} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Kudos" value={kudos} onChangeText={setKudos} keyboardType="numeric" />

      {/* TODO: Add Save Button + logic */}
    </ScrollView>
  );
}

function StyledInput({ label, ...props }) {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <TextInput style={styles.input} {...props} />
      </View>
    );
  }
  
  function StyledPicker({ label, selectedValue, onValueChange, options }) {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={selectedValue} onValueChange={onValueChange}>
            <Picker.Item label={`Select ${label}`} value="" />
            {options.map((opt) => (
              <Picker.Item key={opt} label={opt} value={opt} />
            ))}
          </Picker>
        </View>
      </View>
    );
  }
  
  // ----- Styles -----
  
  const styles = StyleSheet.create({
    container: {
      padding: 16,
      paddingBottom: 100,
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
    },
    section: {
      backgroundColor: '#f8f8f8',
      borderRadius: 10,
      padding: 12,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 10,
    },
    inputGroup: {
      marginBottom: 12,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      padding: 10,
      fontSize: 16,
      backgroundColor: '#fff',
    },
    pickerWrapper: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: Platform.OS === 'ios' ? '#fff' : 'transparent',
    },
  });