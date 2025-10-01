
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { useEffect, useState } from 'react';
import { Colors } from '../../constants/theme';

export default function MainScreen() {
  const { appState } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const {
        name,
        age,
        country,
        sources,
        cigarettes,
        vapes,
        heatedTobacco,
        nicotinePouches,
        duration,
        quittingPace,
        motivation,
        quitDate,
      } = appState;

      if (!name || !quitDate) {
        setError('Could not generate a plan. Essential information is missing.');
        setLoading(false);
        return;
      }

      const finalQuitDate = new Date(quitDate);

      let planDetails = `Hello ${name}, based on your inputs, here is your personalized quitting plan:\n\n`;
      planDetails += `**Quit Date:** ${finalQuitDate.toDateString()}\n`;
      planDetails += `**Motivation:** \"${motivation || 'Not specified'}\"\n\n`;
      planDetails += `**Your Profile:**\n`;
      planDetails += `- Age: ${age || 'Not specified'}\n`;
      planDetails += `- Country: ${country || 'Not specified'}\n`;
      planDetails += `- Nicotine use duration: ${duration || 'Not specified'}\n`;
      planDetails += `- Quitting Pace: ${quittingPace || 'Not specified'}\n\n`;

      planDetails += `**Your Nicotine Sources:**\n`;
      if (sources.includes('Cigarettes') && cigarettes) {
        planDetails += `- Cigarettes: ${cigarettes.amount}/day (${cigarettes.type})\n`;
      }
      if (sources.includes('Vapes') && vapes) {
        planDetails += `- Vapes: ~${vapes.puffs} puffs/day (${vapes.strength} strength)\n`;
      }
      if (sources.includes('Heated Tobacco') && heatedTobacco) {
        planDetails += `- Heated Tobacco: ${heatedTobacco.sticks} sticks/day\n`;
      }
      if (sources.includes('Nicotine Pouches') && nicotinePouches) {
        planDetails += `- Nicotine Pouches: ${nicotinePouches.pouches}/day (${nicotinePouches.strength} strength)\n`;
      }

      setPlan(planDetails);
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [appState]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Our AI is crafting your personalized plan...</ThemedText>
      </ThemedView>
    );
  }
  
  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
        <View style={styles.content}>
            <ThemedText type="title" style={styles.title}>Your Personalized Plan</ThemedText>
            <ThemedText style={styles.planText}>{plan}</ThemedText>
        </View>
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
  content: {
    width: '100%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  planText: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
      fontSize: 16,
      color: 'red',
      textAlign: 'center',
  }
});
