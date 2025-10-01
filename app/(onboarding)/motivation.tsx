
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { useAppContext } from '../../context/AppContext';

export default function MotivationScreen() {
  const { appState, setAppState } = useAppContext();
  const [motivation, setMotivation] = useState(appState.motivation || '');

  const handleMotivationChange = (text: string) => {
    setMotivation(text);
    setAppState((prevState) => ({ ...prevState, motivation: text }));
  };

  const handleNext = () => {
    if (motivation.trim()) {
      // @ts-ignore
      router.push('/(onboarding)/quit-date');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{flex: 1, justifyContent: 'space-between'}}
      >
        <View style={styles.mainContent}>
          <ThemedText type="title" style={styles.title}>What is your main motivation for quitting?</ThemedText>
          <ThemedText style={styles.subtitle}>Use this space to write a short, powerful reminder. You’ll see it every time you open the app.</ThemedText>
          <TextInput
            style={styles.input}
            multiline
            placeholder="E.g., 'To be healthier for my family and save money.'"
            value={motivation}
            onChangeText={handleMotivationChange}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ThemedText>Back</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.nextButton, !motivation.trim() && styles.nextButtonDisabled]} 
            onPress={handleNext} 
            disabled={!motivation.trim()}
          >
            <ThemedText style={styles.nextButtonText}>Next</ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20, // Adjust as needed
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 44,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 32,
    color: '#6B7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 140,
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
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
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
