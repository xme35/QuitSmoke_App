
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/theme';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { AppState, useAppContext, TaperingPhase } from '../../context/AppContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

const steps = [
  'Connecting to AI consciousness...',
  'Analyzing your unique profile...',
  'Calculating current nicotine intake...',
  'Simulating personalized outcomes...',
  'Compiling your liberation plan...',
];

// Use the environment variable for the API key
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// --- Helper function to calculate current daily nicotine intake ---
const calculateCurrentNicotine = (appState: AppState): number => {
  let totalNicotine = 0;
  const { cigarettes, vapes, heatedTobacco, nicotinePouches } = appState;

  const getDailyValue = (value: number, frequency: string) => {
    if (frequency === 'week') return value / 7;
    if (frequency === 'month') return value / 30;
    return value;
  };

  if (cigarettes && cigarettes.amount > 0) {
    totalNicotine += getDailyValue(cigarettes.amount, cigarettes.frequency) * 1.2;
  }
  if (vapes && vapes.puffs > 0) {
    const strengthPercent = parseFloat(vapes.strength.replace('%', '')) / 100;
    const mgPerPuff = 0.05 * (strengthPercent * 1000) * 0.5;
    totalNicotine += getDailyValue(vapes.puffs, vapes.frequency) * mgPerPuff;
  }
  if (heatedTobacco && heatedTobacco.sticks > 0) {
    totalNicotine += getDailyValue(heatedTobacco.sticks, heatedTobacco.frequency) * 1.0;
  }
  if (nicotinePouches && nicotinePouches.pouches > 0) {
    const strengthMg = parseInt(nicotinePouches.strength.replace('mg', '')) || 0;
    totalNicotine += getDailyValue(nicotinePouches.pouches, nicotinePouches.frequency) * strengthMg * 0.9;
  }

  return Math.round(totalNicotine);
};

/**
 * Generates a personalized quit plan by calling a generative AI model.
 */
const generatePlan = async (appState: AppState, currentIntake: number) => {
  const {
    quittingPace,
    age,
    smokingHistory,
    countryName,
    sources,
  } = appState;

  const model = genAI.getGenerativeModel({ model: "gemini-pro"}); // Corrected Model

  const prompt = `
    You are an expert in smoking cessation. Your task is to create a personalized tapering plan.
    Analyze the user\\'s data and return a JSON object with the structure: { "taperingSchedule": TaperingPhase[], "estimatedSavings": number }.

    - "taperingSchedule": An array of objects, where each object is a "phase". The structure for each phase is { "phase": number, "durationDays": number, "nicotineGoalMg": number }.
      - "phase": The sequence number of the phase, starting at 1.
      - "durationDays": How many days this phase lasts (integer).
      - "nicotineGoalMg": The daily nicotine goal in milligrams for this phase (integer). This should gradually decrease with each phase, ending at or near 0.
    - "estimatedSavings": Total estimated money saved over the plan\\'s duration (integer), based on the user\\'s country.

    User Data:
    - Current Estimated Daily Nicotine Intake: ${currentIntake}mg
    - Age: ${age || 'not provided'}
    - Country for price estimation: ${countryName || 'not provided'}
    - Products Used: ${sources?.join(', ') || 'not provided'}
    - Smoking History: ${smokingHistory || 'not provided'}
    - Quitting Pace Preference: ${quittingPace || 'not provided'}
    
    Based on this data, provide a realistic tapering schedule. The first phase\\'s nicotineGoalMg should be slightly lower than the user\\'s current intake.
    A user with high intake and a slow pace preference should have a longer plan with more phases and gradual reduction.
    The sum of all \`durationDays\` will be the total plan duration.
    Return only the JSON object, with no other text or markdown formatting.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonString = response.text().replace(/\\\`\\\`\\\`json|\\\`\\\`\\\`/g, '').trim();
    const plan: { taperingSchedule: TaperingPhase[], estimatedSavings: number } = JSON.parse(jsonString);

    const totalDuration = plan.taperingSchedule.reduce((sum, phase) => sum + phase.durationDays, 0);

    return {
      ...plan,
      totalDuration,
      planStartDate: new Date().toISOString(),
    };

  } catch (error) {
    console.error("AI plan generation failed:", error);
    // Fallback to a default plan
    const fallbackSchedule: TaperingPhase[] = [
      { phase: 1, durationDays: 14, nicotineGoalMg: 150 },
      { phase: 2, durationDays: 14, nicotineGoalMg: 120 },
      { phase: 3, durationDays: 14, nicotineGoalMg: 90 },
      { phase: 4, durationDays: 14, nicotineGoalMg: 60 },
      { phase: 5, durationDays: 14, nicotineGoalMg: 30 },
      { phase: 6, durationDays: 20, nicotineGoalMg: 10 },
    ];
    const totalDuration = fallbackSchedule.reduce((sum, phase) => sum + phase.durationDays, 0);
    return {
      taperingSchedule: fallbackSchedule,
      estimatedSavings: 500,
      totalDuration,
      planStartDate: new Date().toISOString(),
    };
  }
};

export default function CreatingPlanScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const { appState, setAppState } = useAppContext();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentStep === steps.length - 1) {
      const createPlan = async () => {
        const initialNicotineIntake = calculateCurrentNicotine(appState);
        const planDetails = await generatePlan(appState, initialNicotineIntake);
        
        setAppState(prev => ({ 
          ...prev, 
          ...planDetails, 
          initialIntake: initialNicotineIntake 
        }));
        
        setTimeout(() => {
          router.replace('/(onboarding)/success' as any);
        }, 1500);
      };
      createPlan();
    }
  }, [currentStep, appState, setAppState, router]);

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size="large" color={Colors.light.tint} />
      <ThemedText type="title" style={styles.title}>Crafting your plan...</ThemedText>
      <ThemedText style={styles.subtitle}>Our AI is analyzing your profile to create the perfect plan for you.</ThemedText>
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <ThemedText key={index} style={[styles.step, { opacity: index <= currentStep ? 1 : 0.3 }]}>
            {index <= currentStep ? '✓' : '...'} {step}
          </ThemedText>
        ))}
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
  title: {
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 40,
    textAlign: 'center',
  },
  stepsContainer: {
    alignSelf: 'flex-start',
    width: '100%',
  },
  step: {
    fontSize: 16,
    marginBottom: 12,
  },
});
