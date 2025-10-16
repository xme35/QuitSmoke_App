import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { CountryPickerModal } from '../../components/CountryPickerModal';

export default function CountryScreen() {
  const { appState, setAppState } = useAppContext();
  const [countryName, setCountryName] = useState<string | null>(appState.countryName || null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const onSelect = (country: { name: string; code: string }) => {
    setCountryName(country.name);
    setAppState((prevState) => ({ 
      ...prevState, 
      countryName: country.name, 
      countryCode: country.code as any
    }));
    setPickerVisible(false);
  };

  const handleNext = () => {
    if (countryName) {
      // @ts-ignore
      router.push('/(onboarding)/source');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mainContent}>
        <ThemedText type="title" style={styles.title}>
          Where do you live?
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          This helps us show your savings{'\n'}in your local currency.
        </ThemedText>
        
        <TouchableOpacity 
          style={styles.pickerButton} 
          onPress={() => setPickerVisible(true)}
        >
          <ThemedText style={styles.pickerButtonText}>
            {countryName || 'Select a country'}
          </ThemedText>
        </TouchableOpacity>
        
        <CountryPickerModal
          visible={pickerVisible}
          onSelect={onSelect}
          onClose={() => setPickerVisible(false)}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText>Back</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.nextButton, !countryName && styles.nextButtonDisabled]}
          onPress={handleNext} 
          disabled={!countryName}
        >
          <ThemedText style={styles.nextButtonText}>Next</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 44, 
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 48,
    fontSize: 16,
    color: '#6B7280',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  pickerButton: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  pickerButtonText: {
    fontSize: 18,
    color: '#1F2937',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  nextButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});