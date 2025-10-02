
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SummaryScreen() {

  const handleStart = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      // @ts-ignore
      router.replace('/(tabs)/'); // Navega para a home e remove o fluxo de onboarding da pilha
    } catch (error) {
      console.error("Failed to save onboarding status", error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mainContent}>
        <ThemedText type="title" style={styles.title}>
          Tudo pronto para começar!
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          A sua jornada para uma vida livre de nicotina começa agora. Você consegue!
        </ThemedText>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ThemedText>Back</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleStart}>
          <ThemedText style={styles.nextButtonText}>Começar Jornada</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 18,
    paddingHorizontal: 24,
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
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
