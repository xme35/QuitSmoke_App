
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import Slider from '@react-native-community/slider';
import { NICOTINE_ESTIMATES } from '../../data/constants';

const ProductDetailsScreen = () => {
  const { appState, setAppState } = useAppContext();
  const { sources } = appState;

  // Initialize states with 0 if not already set
  useEffect(() => {
    const initialAppState = { ...appState };
    let needsUpdate = false;

    if (sources?.includes('Cigarettes') && appState.cigarettes?.amount === undefined) {
      initialAppState.cigarettes = { ...initialAppState.cigarettes, amount: 0, type: 'Regular' };
      needsUpdate = true;
    }
    if (sources?.includes('Vapes') && appState.vapes?.puffs === undefined) {
      initialAppState.vapes = { ...initialAppState.vapes, puffs: 0, strength: 'Medium' };
      needsUpdate = true;
    }
    // Correctly check for 'Nicotine Pouches'
    if (sources?.includes('Nicotine Pouches') && appState.nicotinePouches?.pouches === undefined) {
      initialAppState.nicotinePouches = { ...initialAppState.nicotinePouches, pouches: 0, strength: 'Medium' };
      needsUpdate = true;
    }
    if (sources?.includes('Heated Tobacco') && appState.heatedTobacco?.sticks === undefined) {
      initialAppState.heatedTobacco = { ...initialAppState.heatedTobacco, sticks: 0 };
      needsUpdate = true;
    }

    if (needsUpdate) {
      setAppState(initialAppState);
    }
  }, [sources]);

  const [estimatedIntake, setEstimatedIntake] = useState(0);

  const handleCigarettesChange = (value: number) => {
    setAppState(prev => ({ ...prev, cigarettes: { ...prev.cigarettes, type: prev.cigarettes?.type ?? 'Regular', amount: value } }));
  };
  const handleVapesChange = (value: number) => {
    setAppState(prev => ({ ...prev, vapes: { ...prev.vapes, strength: prev.vapes?.strength ?? 'Medium', puffs: value } }));
  };
  const handlePouchesChange = (value: number) => {
    setAppState(prev => ({ ...prev, nicotinePouches: { ...prev.nicotinePouches, strength: prev.nicotinePouches?.strength ?? 'Medium', pouches: value } }));
  };
  const handleHeatedTobaccoChange = (value: number) => {
    setAppState(prev => ({ ...prev, heatedTobacco: { ...prev.heatedTobacco, sticks: value } }));
  };

  useEffect(() => {
    let total = 0;
    if (sources?.includes('Cigarettes')) {
      total += (appState.cigarettes?.amount || 0) * NICOTINE_ESTIMATES.Cigarettes;
    }
    if (sources?.includes('Vapes')) {
      total += (appState.vapes?.puffs || 0) * NICOTINE_ESTIMATES.Vapes;
    }
    if (sources?.includes('Nicotine Pouches')) {
      total += (appState.nicotinePouches?.pouches || 0) * NICOTINE_ESTIMATES['Nicotine Pouches'];
    }
    if (sources?.includes('Heated Tobacco')) {
      total += (appState.heatedTobacco?.sticks || 0) * NICOTINE_ESTIMATES['Heated Tobacco'];
    }
    setEstimatedIntake(total);
  }, [appState, sources]);

  const handleNext = () => {
    router.push('/(onboarding)/duration');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ThemedText type="title" style={styles.title}>
          How much do you use daily?
        </ThemedText>

        {sources?.includes('Cigarettes') && (
          <View style={styles.productContainer}>
            <View style={styles.productHeader}>
              <ThemedText style={styles.productLabel}>Cigarettes</ThemedText>
              <ThemedText style={styles.productValue}>{(appState.cigarettes?.amount || 0)} units</ThemedText>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={70}
              step={1}
              value={appState.cigarettes?.amount || 0}
              onValueChange={handleCigarettesChange}
              minimumTrackTintColor={Colors.light.tint}
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={Colors.light.tint}
            />
          </View>
        )}

        {sources?.includes('Vapes') && (
          <View style={styles.productContainer}>
            <View style={styles.productHeader}>
              <ThemedText style={styles.productLabel}>Vapes</ThemedText>
              <ThemedText style={styles.productValue}>{(appState.vapes?.puffs || 0)} puffs</ThemedText>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={500}
              step={10}
              value={appState.vapes?.puffs || 0}
              onValueChange={handleVapesChange}
              minimumTrackTintColor={Colors.light.tint}
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={Colors.light.tint}
            />
          </View>
        )}

        {sources?.includes('Nicotine Pouches') && (
          <View style={styles.productContainer}>
            <View style={styles.productHeader}>
              <ThemedText style={styles.productLabel}>Nicotine Pouches</ThemedText>
              <ThemedText style={styles.productValue}>{(appState.nicotinePouches?.pouches || 0)} units</ThemedText>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={30}
              step={1}
              value={appState.nicotinePouches?.pouches || 0}
              onValueChange={handlePouchesChange}
              minimumTrackTintColor={Colors.light.tint}
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={Colors.light.tint}
            />
          </View>
        )}

        {sources?.includes('Heated Tobacco') && (
          <View style={styles.productContainer}>
            <View style={styles.productHeader}>
              <ThemedText style={styles.productLabel}>Heated Tobacco</ThemedText>
              <ThemedText style={styles.productValue}>{(appState.heatedTobacco?.sticks || 0)} units</ThemedText>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={40}
              step={1}
              value={appState.heatedTobacco?.sticks || 0}
              onValueChange={handleHeatedTobaccoChange}
              minimumTrackTintColor={Colors.light.tint}
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={Colors.light.tint}
            />
          </View>
        )}
        
        <View style={styles.estimationContainer}>
          <ThemedText style={styles.estimationLabel}>Estimated Daily Nicotine Intake</ThemedText>
          <ThemedText style={styles.estimationValue}>{estimatedIntake.toFixed(1)} mg</ThemedText>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Back</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <ThemedText style={styles.nextButtonText}>Next</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
    },
    scrollContainer: {
        paddingBottom: 120, // To ensure estimation is not hidden by footer
    },
    title: {
        textAlign: 'center',
        marginTop: 60,
        marginBottom: 50,
        fontSize: 28,
    },
    productContainer: {
        marginBottom: 32,
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    productLabel: {
        fontSize: 18,
        color: '#374151',
    },
    productValue: {
        fontSize: 16,
        color: Colors.light.tint,
        fontWeight: '600',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    estimationContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    estimationLabel: {
        fontSize: 16,
        color: '#6B7280',
    },
    estimationValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: Colors.light.tint,
        marginTop: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 24,
        right: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: '#FFFFFF'
    },
    backButtonText: {
        fontSize: 18,
        color: '#6B7280',
        fontWeight: '500',
    },
    nextButton: {
        backgroundColor: Colors.light.tint,
        paddingVertical: 18,
        paddingHorizontal: 50,
        borderRadius: 30,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
});

export default ProductDetailsScreen;
