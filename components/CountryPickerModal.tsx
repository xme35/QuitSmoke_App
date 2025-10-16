import { Modal, FlatList, TouchableOpacity, View, TextInput, StyleSheet } from 'react-native';
import { useState } from 'react';
import { ThemedText } from './themed-text';
import { countries } from '../constants/countries';

interface CountryPickerModalProps {
  visible: boolean;
  onSelect: (country: { name: string; code: string }) => void;
  onClose: () => void;
}

export function CountryPickerModal({ visible, onSelect, onClose }: CountryPickerModalProps) {
  const [search, setSearch] = useState('');

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Select Country</ThemedText>
          <TouchableOpacity onPress={onClose}>
            <ThemedText style={styles.closeButton}>✕</ThemedText>
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={styles.searchInput}
          placeholder="Search countries..."
          value={search}
          onChangeText={setSearch}
        />

        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.countryItem}
              onPress={() => {
                onSelect({ name: item.name, code: item.code });
                setSearch('');
              }}
            >
              <ThemedText style={styles.countryName}>{item.name}</ThemedText>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    fontSize: 16,
  },
  countryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  countryName: {
    fontSize: 16,
  },
});