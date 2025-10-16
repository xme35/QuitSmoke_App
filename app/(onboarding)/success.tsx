
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/theme';

// A simple map to get currency symbols from country codes
const currencySymbols = {
  'PT': '€',
  'US': '$',
  'GB': '£',
  'AU': '$',
  'default': '$',
};

export default function SuccessScreen() {
  const { appState } = useAppContext();
  const router = useRouter();

  const handleFinish = async () => {
    await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    router.replace('/dashboard');
  };

  const {
    quitDate,
    totalDuration,      // Direct from our AI engine
    reductionInterval,  // Direct from our AI engine
    estimatedSavings,   // Direct from our AI engine
    countryCode,        // To get the correct currency symbol
  } = appState;

  // @ts-ignore
  const currencySymbol = currencySymbols[countryCode] || currencySymbols.default;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Your Plan is Ready!</ThemedText>
      <ThemedText style={styles.subtitle}>Here are the highlights of your personalized journey to a smoke-free life.</ThemedText>
      
      <View style={styles.planContainer}>
        <View style={styles.planItem}>
          <ThemedText>Total Duration:</ThemedText>
           {/* @ts-ignore */}
          <ThemedText>{totalDuration} days</ThemedText>
        </View>
        <View style={styles.planItem}>
          <ThemedText>Reduction Interval:</ThemedText>
           {/* @ts-ignore */}
          <ThemedText>Every {reductionInterval} days</ThemedText>
        </View>
        <View style={styles.planItem}>
          <ThemedText>Final Quit Date:</ThemedText>
           {/* @ts-ignore */}
          <ThemedText>{quitDate ? new Date(quitDate).toLocaleDateString() : 'N/A'}</ThemedText>
        </View>
        
        <View style={styles.separator} />

        <View style={styles.savingsContainer}>
          <ThemedText style={styles.savingsLabel}>Estimated Savings</ThemedText>
          <ThemedText style={styles.savingsValue}>
             {/* @ts-ignore */}
            {currencySymbol}{estimatedSavings?.toLocaleString() || '0'}
          </ThemedText>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleFinish}>
        <ThemedText style={styles.buttonText}>Start My Journey</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  planContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 40,
  },
  planItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  savingsContainer: {
    alignItems: 'center',
  },
  savingsLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  savingsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
