
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Modal, TextInput, Pressable } from 'react-native';
import { useAppContext, Frequency, AppState } from '../../context/AppContext';
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
  const vapes = Math.round(puffsToVapes(puffCount));
  return vapes.toString();
};

const getVapeMaxVapes = (frequency: Frequency) => {
  const maxPuffs = frequency === 'day' ? 4000 : frequency === 'week' ? 16000 : 40000;
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

// Long Press Button Component with continuous increment
const LongPressButton: React.FC<{
  onIncrement: () => void;
  children: React.ReactNode;
  style?: any;
}> = ({ onIncrement, children, style }) => {
  const [isPressed, setIsPressed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handlePressIn = () => {
    setIsPressed(true);
    // Execute immediately on press
    onIncrement();
    
    // Initial delay before starting continuous press
    timeoutRef.current = setTimeout(() => {
      let currentInterval = 150;
      let counter = 0;
      
      const executeIncrement = () => {
        onIncrement();
        counter++;
        
        // Progressive acceleration based on number of executions
        if (counter > 40 && currentInterval !== 30) {
          // After ~6 seconds, very fast
          currentInterval = 30;
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = setInterval(executeIncrement, currentInterval);
        } else if (counter > 20 && currentInterval !== 50) {
          // After ~3 seconds, faster
          currentInterval = 50;
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = setInterval(executeIncrement, currentInterval);
        } else if (counter > 7 && currentInterval !== 80) {
          // After ~1 second, a bit faster
          currentInterval = 80;
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = setInterval(executeIncrement, currentInterval);
        }
      };
      
      intervalRef.current = setInterval(executeIncrement, currentInterval);
    }, 300);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    clearTimers();
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, isPressed && styles.stepperButtonPressed]}
    >
      {children}
    </Pressable>
  );
};

// Text Input Modal Component
const TextInputModal: React.FC<{
  visible: boolean;
  value: number;
  onClose: () => void;
  onSave: (value: number) => void;
  maxValue: number;
  label: string;
  unit: string;
}> = ({ visible, value, onClose, onSave, maxValue, label, unit }) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    if (visible) {
      setInputValue(value.toString());
    }
  }, [visible, value]);

  const handleSave = () => {
    const numValue = parseFloat(inputValue) || 0;
    const clampedValue = Math.min(Math.max(0, numValue), maxValue);
    onSave(clampedValue);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <ThemedText style={styles.modalTitle}>Enter {label}</ThemedText>
          <ThemedText style={styles.modalSubtitle}>Maximum: {maxValue} {unit}</ThemedText>
          
          <TextInput
            style={styles.modalInput}
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
            placeholder="0"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalButtonCancel} onPress={onClose}>
              <ThemedText style={styles.modalButtonTextCancel}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButtonSave} onPress={handleSave}>
              <ThemedText style={styles.modalButtonTextSave}>Save</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const ProductDetailsScreen = () => {
  const { appState, setAppState } = useAppContext();
  const { sources } = appState;
  const [estimatedIntake, setEstimatedIntake] = useState(0);
  const [modalState, setModalState] = useState<{
    visible: boolean;
    product: ProductKey | null;
    field: string;
    value: number;
    maxValue: number;
    label: string;
    unit: string;
  }>({
    visible: false,
    product: null,
    field: '',
    value: 0,
    maxValue: 0,
    label: '',
    unit: '',
  });

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

  const openModal = (product: ProductKey, field: string, value: number, maxValue: number, label: string, unit: string) => {
    setModalState({
      visible: true,
      product,
      field,
      value,
      maxValue,
      label,
      unit,
    });
  };

  const handleModalSave = (value: number) => {
    if (modalState.product && modalState.field) {
      handleProductChange(modalState.product, modalState.field as any, value);
    }
  };

  return (
    <ThemedView style={styles.container}>
        <View style={styles.mainContent}>
            <ThemedText type="title" style={styles.title}>How much do you use?</ThemedText>
            {sources && sources.length > 3 && <ThemedText style={styles.scrollIndicator}>Scroll for more</ThemedText>}
            
            <ScrollView>
              {sources?.includes('Cigarette') && appState.cigarettes && (() => {
                const maxValue = appState.cigarettes.frequency === 'day' ? 70 : (appState.cigarettes.frequency === 'week' ? 500 : 2000);
                return (
                  <View style={styles.productContainer}>
                      <View style={styles.productHeader}>
                          <ThemedText style={styles.productLabel}>Cigarette</ThemedText>
                          <FrequencySwitch
                              value={appState.cigarettes.frequency}
                              onValueChange={(value) => handleFrequencyChange('cigarettes', value)}
                          />
                      </View>
                      
                      <TouchableOpacity
                        onPress={() => openModal('cigarettes', 'amount', appState.cigarettes!.amount, maxValue, 'Cigarettes', 'cigs')}
                        style={styles.valueContainer}
                      >
                        <ThemedText style={styles.productValue}>{appState.cigarettes.amount} cigs / {appState.cigarettes.frequency}</ThemedText>
                      </TouchableOpacity>
                      
                      <View style={styles.sliderRow}>
                        <LongPressButton
                          onIncrement={() => {
                            setAppState(prev => ({
                              ...prev,
                              cigarettes: {
                                ...prev.cigarettes!,
                                amount: Math.max(0, prev.cigarettes!.amount - 1)
                              }
                            }));
                          }}
                          style={styles.stepperButton}
                        >
                          <ThemedText style={styles.stepperText}>−</ThemedText>
                        </LongPressButton>
                        
                        <Slider
                          style={styles.sliderFlex}
                          minimumValue={0}
                          maximumValue={maxValue}
                          step={1}
                          value={appState.cigarettes.amount}
                          onValueChange={(value) => handleProductChange('cigarettes', 'amount', value)}
                          minimumTrackTintColor={Colors.light.tint}
                          thumbTintColor={Colors.light.tint}
                        />
                        
                        <LongPressButton
                          onIncrement={() => {
                            setAppState(prev => ({
                              ...prev,
                              cigarettes: {
                                ...prev.cigarettes!,
                                amount: Math.min(maxValue, prev.cigarettes!.amount + 1)
                              }
                            }));
                          }}
                          style={styles.stepperButton}
                        >
                          <ThemedText style={styles.stepperText}>+</ThemedText>
                        </LongPressButton>
                      </View>
                  </View>
                );
              })()}

              {sources?.includes('Vape') && appState.vapes && (() => {
                const maxValue = getVapeMaxVapes(appState.vapes.frequency);
                const currentVapes = puffsToVapes(appState.vapes.puffs);
                return (
                  <View style={styles.productContainer}>
                      <View style={styles.productHeader}>
                          <ThemedText style={styles.productLabel}>Vape</ThemedText>
                          <FrequencySwitch
                              value={appState.vapes.frequency}
                              onValueChange={(value) => handleFrequencyChange('vapes', value)}
                          />
                      </View>
                      
                      <TouchableOpacity
                        onPress={() => openModal('vapes', 'puffs', appState.vapes!.puffs, vapesToPuffs(maxValue), 'Vapes', 'puffs')}
                        style={styles.valueContainer}
                      >
                        <ThemedText style={styles.productValue}>{formatVapeCount(appState.vapes.puffs)} vapes / {appState.vapes.frequency}</ThemedText>
                      </TouchableOpacity>
                      
                      <View style={styles.sliderRow}>
                        <LongPressButton
                          onIncrement={() => {
                            setAppState(prev => ({
                              ...prev,
                              vapes: {
                                ...prev.vapes!,
                                puffs: Math.max(0, prev.vapes!.puffs - VAPE_PUFFS_PER_DEVICE)
                              }
                            }));
                          }}
                          style={styles.stepperButton}
                        >
                          <ThemedText style={styles.stepperText}>−</ThemedText>
                        </LongPressButton>
                        
                        <Slider
                          style={styles.sliderFlex}
                          minimumValue={0}
                          maximumValue={maxValue}
                          step={1}
                          value={currentVapes}
                          onValueChange={(value) => handleProductChange('vapes', 'puffs', vapesToPuffs(value))}
                          minimumTrackTintColor={Colors.light.tint}
                          thumbTintColor={Colors.light.tint}
                        />
                        
                        <LongPressButton
                          onIncrement={() => {
                            setAppState(prev => ({
                              ...prev,
                              vapes: {
                                ...prev.vapes!,
                                puffs: Math.min(vapesToPuffs(maxValue), prev.vapes!.puffs + VAPE_PUFFS_PER_DEVICE)
                              }
                            }));
                          }}
                          style={styles.stepperButton}
                        >
                          <ThemedText style={styles.stepperText}>+</ThemedText>
                        </LongPressButton>
                      </View>
                  </View>
                );
              })()}

              {sources?.includes('Nicotine Pouch') && appState.nicotinePouches && (() => {
                const maxValue = appState.nicotinePouches.frequency === 'day' ? 30 : (appState.nicotinePouches.frequency === 'week' ? 210 : 900);
                return (
                  <View style={styles.productContainer}>
                      <View style={styles.productHeader}>
                          <ThemedText style={styles.productLabel}>Nicotine Pouch</ThemedText>
                          <FrequencySwitch
                              value={appState.nicotinePouches.frequency}
                              onValueChange={(value) => handleFrequencyChange('nicotinePouches', value)}
                          />
                      </View>
                      
                      <TouchableOpacity
                        onPress={() => openModal('nicotinePouches', 'pouches', appState.nicotinePouches!.pouches, maxValue, 'Nicotine Pouches', 'pouches')}
                        style={styles.valueContainer}
                      >
                        <ThemedText style={styles.productValue}>{appState.nicotinePouches.pouches} pouches / {appState.nicotinePouches.frequency}</ThemedText>
                      </TouchableOpacity>
                      
                      <View style={styles.sliderRow}>
                        <LongPressButton
                          onIncrement={() => {
                            setAppState(prev => ({
                              ...prev,
                              nicotinePouches: {
                                ...prev.nicotinePouches!,
                                pouches: Math.max(0, prev.nicotinePouches!.pouches - 1)
                              }
                            }));
                          }}
                          style={styles.stepperButton}
                        >
                          <ThemedText style={styles.stepperText}>−</ThemedText>
                        </LongPressButton>
                        
                        <Slider
                          style={styles.sliderFlex}
                          minimumValue={0}
                          maximumValue={maxValue}
                          step={1}
                          value={appState.nicotinePouches.pouches}
                          onValueChange={(value) => handleProductChange('nicotinePouches', 'pouches', value)}
                          minimumTrackTintColor={Colors.light.tint}
                          thumbTintColor={Colors.light.tint}
                        />
                        
                        <LongPressButton
                          onIncrement={() => {
                            setAppState(prev => ({
                              ...prev,
                              nicotinePouches: {
                                ...prev.nicotinePouches!,
                                pouches: Math.min(maxValue, prev.nicotinePouches!.pouches + 1)
                              }
                            }));
                          }}
                          style={styles.stepperButton}
                        >
                          <ThemedText style={styles.stepperText}>+</ThemedText>
                        </LongPressButton>
                      </View>
                  </View>
                );
              })()}

              {sources?.includes('Heated Tobacco') && appState.heatedTobacco && (() => {
                const maxValue = appState.heatedTobacco.frequency === 'day' ? 40 : (appState.heatedTobacco.frequency === 'week' ? 280 : 1200);
                return (
                  <View style={styles.productContainer}>
                      <View style={styles.productHeader}>
                          <ThemedText style={styles.productLabel}>Heated Tobacco</ThemedText>
                          <FrequencySwitch
                              value={appState.heatedTobacco.frequency}
                              onValueChange={(value) => handleFrequencyChange('heatedTobacco', value)}
                          />
                      </View>
                      
                      <TouchableOpacity
                        onPress={() => openModal('heatedTobacco', 'sticks', appState.heatedTobacco!.sticks, maxValue, 'Heated Tobacco Sticks', 'sticks')}
                        style={styles.valueContainer}
                      >
                        <ThemedText style={styles.productValue}>{appState.heatedTobacco.sticks} sticks / {appState.heatedTobacco.frequency}</ThemedText>
                      </TouchableOpacity>
                      
                      <View style={styles.sliderRow}>
                        <LongPressButton
                          onIncrement={() => {
                            setAppState(prev => ({
                              ...prev,
                              heatedTobacco: {
                                ...prev.heatedTobacco!,
                                sticks: Math.max(0, prev.heatedTobacco!.sticks - 1)
                              }
                            }));
                          }}
                          style={styles.stepperButton}
                        >
                          <ThemedText style={styles.stepperText}>−</ThemedText>
                        </LongPressButton>
                        
                        <Slider
                          style={styles.sliderFlex}
                          minimumValue={0}
                          maximumValue={maxValue}
                          step={1}
                          value={appState.heatedTobacco.sticks}
                          onValueChange={(value) => handleProductChange('heatedTobacco', 'sticks', value)}
                          minimumTrackTintColor={Colors.light.tint}
                          thumbTintColor={Colors.light.tint}
                        />
                        
                        <LongPressButton
                          onIncrement={() => {
                            setAppState(prev => ({
                              ...prev,
                              heatedTobacco: {
                                ...prev.heatedTobacco!,
                                sticks: Math.min(maxValue, prev.heatedTobacco!.sticks + 1)
                              }
                            }));
                          }}
                          style={styles.stepperButton}
                        >
                          <ThemedText style={styles.stepperText}>+</ThemedText>
                        </LongPressButton>
                      </View>
                  </View>
                );
              })()}
            </ScrollView>
        </View>
        
        <TextInputModal
          visible={modalState.visible}
          value={modalState.value}
          onClose={() => setModalState({ ...modalState, visible: false })}
          onSave={handleModalSave}
          maxValue={modalState.maxValue}
          label={modalState.label}
          unit={modalState.unit}
        />
        
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
  valueContainer: {
    marginBottom: 8,
  },
  productValue: { fontSize: 16, color: Colors.light.tint, fontWeight: '600' },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderFlex: {
    flex: 1,
    height: 40,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepperButtonPressed: {
    backgroundColor: '#E5E7EB',
    transform: [{ scale: 0.95 }],
  },
  stepperText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalButtonSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
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
