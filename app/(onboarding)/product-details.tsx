
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { useAppContext, Frequency, AppState } from '../../context/AppContext'; // Corrected import
import Slider from '@react-native-community/slider';
import { NICOTINE_ESTIMATES } from '../../data/constants';

// Helper function to calculate daily nicotine intake from different frequencies
const calculateIntake = (amount: number, freq: Frequency, multiplier: number) => {
    if (freq === 'week') return (amount / 7) * multiplier;
    if (freq === 'month') return (amount / 30) * multiplier;
    return amount * multiplier; // Default to 'day'
};

const VAPE_PUFFS_PER_DEVICE = 400;

const puffsToVapes = (puffCount: number) => puffCount / VAPE_PUFFS_PER_DEVICE;
const vapesToPuffs = (vapeCount: number) => Math.round(vapeCount * VAPE_PUFFS_PER_DEVICE);

const formatVapeCount = (puffCount: number) => {
  const vapes = puffsToVapes(puffCount);
  if (vapes === 0) return '0';
  return Number.isInteger(vapes) ? vapes.toString() : vapes.toFixed(2).replace(/\.?0+$/, '');
};

const getVapeMaxVapes = (frequency: Frequency) => {
  const maxPuffs = frequency === 'day' ? 500 : frequency === 'week' ? 3500 : 15000;
  return maxPuffs / VAPE_PUFFS_PER_DEVICE;
};

// Capitalize for display
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type ProductKey = 'cigarettes' | 'vapes' | 'nicotinePouches' | 'heatedTobacco';

const sourceToProductKey: Record<string, ProductKey> = {
  Cigarette: 'cigarettes',
  Vape: 'vapes',
  'Nicotine Pouch': 'nicotinePouches',
  'Heated Tobacco': 'heatedTobacco',
};

const quantityFieldMap = {
  cigarettes: 'amount',
  vapes: 'puffs',
  nicotinePouches: 'pouches',
  heatedTobacco: 'sticks',
} as const;

const FrequencySwitch: React.FC<{ value: Frequency; onValueChange: (value: Frequency) => void }> = ({ value, onValueChange }) => (
  <View style={styles.frequencyContainer}>
    {(['day', 'week', 'month'] as Frequency[]).map(freq => (
      <TouchableOpacity
        key={freq}
        style={[styles.frequencyButton, value === freq && styles.frequencyButtonSelected]}
        onPress={() => onValueChange(freq)}
      >
        <ThemedText style={[styles.frequencyButtonText, value === freq && styles.frequencyButtonTextSelected]}>
          {capitalize(freq)}
        </ThemedText>
      </TouchableOpacity>
    ))}
  </View>
);

const ProductDetailsScreen = () => {
  const { appState, setAppState } = useAppContext();
  const { sources } = appState;
  const [estimatedIntake, setEstimatedIntake] = useState(0);

  // A generic handler to update any product detail
  const handleProductChange = <K extends ProductKey, V>(product: K, field: keyof NonNullable<AppState[K]>, value: V) => {
    setAppState(prev => ({
      ...prev,
      [product]: { ...prev[product]!, [field]: value },
    }));
  };

  const handleFrequencyChange = <K extends ProductKey>(product: K, frequency: Frequency) => {
    setAppState(prev => {
      const currentProduct = prev[product];
      if (!currentProduct) {
        return prev;
      }

      const quantityField = quantityFieldMap[product];

      return {
        ...prev,
        [product]: {
          ...currentProduct,
          frequency,
          [quantityField]: 0,
        } as NonNullable<AppState[K]>,
      };
    });
  };

  const getProductQuantity = (product: ProductKey) => {
    const productState = appState[product];
    if (!productState) {
      return 0;
    }

    if ('amount' in productState) return productState.amount;
    if ('puffs' in productState) return productState.puffs;
    if ('pouches' in productState) return productState.pouches;
    if ('sticks' in productState) return productState.sticks;

    return 0;
  };

  const hasZeroQuantityForSelectedSources =
    !sources?.length ||
    sources.some(source => {
      const productKey = sourceToProductKey[source];
      if (!productKey) return false;

      return getProductQuantity(productKey) <= 0;
    });

  useEffect(() => {
    let total = 0;
    
    if (sources?.includes('Cigarette') && appState.cigarettes) {
      total += calculateIntake(appState.cigarettes.amount, appState.cigarettes.frequency, NICOTINE_ESTIMATES.Cigarette);
    }
    if (sources?.includes('Vape') && appState.vapes) {
      total += calculateIntake(appState.vapes.puffs, appState.vapes.frequency, NICOTINE_ESTIMATES.Vape);
    }
    if (sources?.includes('Nicotine Pouch') && appState.nicotinePouches) {
      total += calculateIntake(appState.nicotinePouches.pouches, appState.nicotinePouches.frequency, NICOTINE_ESTIMATES['Nicotine Pouch']);
    }
    if (sources?.includes('Heated Tobacco') && appState.heatedTobacco) {
      total += calculateIntake(appState.heatedTobacco.sticks, appState.heatedTobacco.frequency, NICOTINE_ESTIMATES['Heated Tobacco']);
    }
    setEstimatedIntake(total);
  }, [appState, sources]);

  const isNextDisabled = estimatedIntake <= 0 || hasZeroQuantityForSelectedSources;

  const handleNext = () => {
    if (isNextDisabled) {
      return;
    }

    router.push('/(onboarding)/duration');
  };

  return (
    <ThemedView style={styles.container}>
        <View style={styles.mainContent}>
            <ThemedText type="title" style={styles.title}>How much do you use?</ThemedText>
            {sources && sources.length > 3 && <ThemedText style={styles.scrollIndicator}>Scroll for more</ThemedText>}
            
            <ScrollView>
              {sources?.includes('Cigarette') && appState.cigarettes && (
                <View style={styles.productContainer}>
                    <View style={styles.productHeader}>
                        <ThemedText style={styles.productLabel}>Cigarette</ThemedText>
                        <FrequencySwitch
                            value={appState.cigarettes.frequency}
                            onValueChange={(value) => handleFrequencyChange('cigarettes', value)}
                        />
                    </View>
                    <ThemedText style={styles.productValue}>{appState.cigarettes.amount} units / {appState.cigarettes.frequency}</ThemedText>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={appState.cigarettes.frequency === 'day' ? 70 : (appState.cigarettes.frequency === 'week' ? 500 : 2000)}
                      step={1}
                      value={appState.cigarettes.amount}
                      onValueChange={(value) => handleProductChange('cigarettes', 'amount', value)}
                      minimumTrackTintColor={Colors.light.tint}
                      thumbTintColor={Colors.light.tint}
                    />
                </View>
              )}

              {sources?.includes('Vape') && appState.vapes && (
                <View style={styles.productContainer}>
                    <View style={styles.productHeader}>
                        <ThemedText style={styles.productLabel}>Vape</ThemedText>
                        <FrequencySwitch
                            value={appState.vapes.frequency}
                            onValueChange={(value) => handleFrequencyChange('vapes', value)}
                        />
                    </View>
                    <ThemedText style={styles.productValue}>{formatVapeCount(appState.vapes.puffs)} vapes / {appState.vapes.frequency}</ThemedText>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={getVapeMaxVapes(appState.vapes.frequency)}
                      step={0.25}
                      value={puffsToVapes(appState.vapes.puffs)}
                      onValueChange={(value) => handleProductChange('vapes', 'puffs', vapesToPuffs(value))}
                      minimumTrackTintColor={Colors.light.tint}
                      thumbTintColor={Colors.light.tint}
                    />
                </View>
              )}

              {sources?.includes('Nicotine Pouch') && appState.nicotinePouches && (
                <View style={styles.productContainer}>
                    <View style={styles.productHeader}>
                        <ThemedText style={styles.productLabel}>Nicotine Pouch</ThemedText>
                        <FrequencySwitch
                            value={appState.nicotinePouches.frequency}
                            onValueChange={(value) => handleFrequencyChange('nicotinePouches', value)}
                        />
                    </View>
                    <ThemedText style={styles.productValue}>{appState.nicotinePouches.pouches} pouches / {appState.nicotinePouches.frequency}</ThemedText>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={appState.nicotinePouches.frequency === 'day' ? 30 : (appState.nicotinePouches.frequency === 'week' ? 210 : 900)}
                      step={1}
                      value={appState.nicotinePouches.pouches}
                      onValueChange={(value) => handleProductChange('nicotinePouches', 'pouches', value)}
                      minimumTrackTintColor={Colors.light.tint}
                      thumbTintColor={Colors.light.tint}
                    />
                </View>
              )}

              {sources?.includes('Heated Tobacco') && appState.heatedTobacco && (
                <View style={styles.productContainer}>
                    <View style={styles.productHeader}>
                        <ThemedText style={styles.productLabel}>Heated Tobacco</ThemedText>
                        <FrequencySwitch
                            value={appState.heatedTobacco.frequency}
                            onValueChange={(value) => handleFrequencyChange('heatedTobacco', value)}
                        />
                    </View>
                    <ThemedText style={styles.productValue}>{appState.heatedTobacco.sticks} sticks / {appState.heatedTobacco.frequency}</ThemedText>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={appState.heatedTobacco.frequency === 'day' ? 40 : (appState.heatedTobacco.frequency === 'week' ? 280 : 1200)}
                      step={1}
                      value={appState.heatedTobacco.sticks}
                      onValueChange={(value) => handleProductChange('heatedTobacco', 'sticks', value)}
                      minimumTrackTintColor={Colors.light.tint}
                      thumbTintColor={Colors.light.tint}
                    />
                </View>
              )}
            </ScrollView>
        </View>
        
        <View>
            <View style={styles.estimationContainer}>
                <ThemedText style={styles.estimationLabel}>Estimated Nicotine Intake</ThemedText>
                <ThemedText style={styles.estimationValue}>{estimatedIntake.toFixed(1)} mg</ThemedText>
            </View>
            <View style={styles.footer}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                  <ThemedText>Back</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextButton, isNextDisabled && styles.nextButtonDisabled]}
                  onPress={handleNext}
                  disabled={isNextDisabled}
                >
                  <ThemedText style={styles.nextButtonText}>Next</ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
      flex: 1,
      padding: 24,
      backgroundColor: Colors.light.background,
      justifyContent: 'space-between',
  },
  mainContent: { flex: 1, gap: 24 },
  title: {
      textAlign: 'center',
      marginTop: 40,
      marginBottom: 12,
      fontSize: 28,
  },
  productContainer: { marginBottom: 32 },
  productHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
  },
  productLabel: { fontSize: 18, color: '#374151' },
  productValue: { fontSize: 16, color: Colors.light.tint, fontWeight: '600', marginBottom: 8 },
  slider: { width: '100%', height: 40 },
  estimationContainer: {
      alignItems: 'center',
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
  },
  estimationLabel: { fontSize: 16, color: Colors.light.secondaryText },
  estimationValue: { fontSize: 36, fontWeight: 'bold', marginTop: 8, color: Colors.light.tint },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  backButton: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12 },
  nextButton: { backgroundColor: Colors.light.tint, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12 },
  nextButtonDisabled: { backgroundColor: '#D1D5DB' },
  nextButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  frequencyContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 2 },
  frequencyButton: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6 },
  frequencyButtonSelected: { backgroundColor: '#FFFFFF', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  frequencyButtonText: { color: '#6B7280', fontWeight: '500' },
  frequencyButtonTextSelected: { color: Colors.light.tint, fontWeight: 'bold' },
  scrollIndicator: { textAlign: 'center', color: '#A0A0A0', marginBottom: 10 },
});

export default ProductDetailsScreen;
