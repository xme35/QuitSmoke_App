
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
        <ThemedText type="title" style={styles.title}>
          Let's create your personalized plan
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          This short questionnaire will help create a tailored plan to help you quit successfully.
        </ThemedText>
        <TouchableOpacity style={styles.startButton} onPress={handleNext}>
          <ThemedText style={styles.startButtonText}>Start</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    backgroundColor: Colors.light.background,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  illustration: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.light.secondaryText,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    paddingHorizontal: 120,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
