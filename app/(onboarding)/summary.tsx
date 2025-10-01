
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

      <TouchableOpacity style={styles.startButton} onPress={handleStart}>
        <ThemedText style={styles.startButtonText}>Começar Jornada</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    alignItems: 'center',
    marginBottom: 48,
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
  startButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
