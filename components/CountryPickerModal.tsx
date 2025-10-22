
import { Modal, FlatList, TouchableOpacity, View, TextInput, StyleSheet } from 'react-native';
import { useState } from 'react';
import { ThemedText } from './themed-text';
import { countries } from '../data/countries';
import { getCountryFlagEmoji } from '../helpers/get-country-flag';

interface CountryPickerModalProps {
  visible: boolean;
  onSelect: (country: { name: string; code: string; currency: string; symbol: string; }) => void;
  onClose: () => void;
}

export function CountryPickerModal({ visible, onSelect, onClose }: CountryPickerModalProps) {
  const [search, setSearch] = useState('');

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <ThemedText style={styles.modalTitle}>Select a Country</ThemedText>
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          value={search}
          onChangeText={setSearch}
        />
        <FlatList
          data={filteredCountries}
          keyExtractor={item => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.countryItem} onPress={() => onSelect(item)}>
              <ThemedText style={styles.countryEmoji}>{getCountryFlagEmoji(item.code)}</ThemedText>
              <ThemedText style={styles.countryName}>{item.name}</ThemedText>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <ThemedText style={styles.closeButtonText}>Close</ThemedText>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchInput: {
    height: 45,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  countryEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  countryName: {
    fontSize: 18,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#6B7280',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
