
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View, Image } from 'react-native';

export default function WelcomeScreen() {

  const handleNext = () => {
    // @ts-ignore
    router.push('/(onboarding)/age');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mainContent}>
        <Image 
          source={require('../../assets/images/evolution.png')} 
          style={styles.illustration} 
        />
        <ThemedText type="title" style={styles.title}>Let's create your personalized plan</ThemedText>
        <ThemedText style={styles.subtitle}>
          This short questionnaire will help create a tailored plan to help you quit successfully.
        </ThemedText>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <ThemedText style={styles.nextButtonText}>Start</ThemedText>
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
    backgroundColor: '#F9FAFB',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  illustration: {
    width: 250,
    height: 250,
    marginBottom: 48,
    resizeMode: 'contain',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  footer: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
