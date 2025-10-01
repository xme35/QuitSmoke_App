
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Platform, ScrollView } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

const ProductDetailsScreen = () => {
  const { appState } = useAppContext();
  const { sources } = appState;

  const handleNext = () => {
    // @ts-ignore
    router.push('/(onboarding)/duration');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.mainContent}>
        <ThemedText type="title" style={styles.title}>
          Tell us more
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          This will help us calculate your nicotine intake.
        </ThemedText>
        {sources.includes('Cigarettes') && <CigarettesDetails />}
        {sources.includes('Vapes') && <VapesDetails />}
        {sources.includes('Heated Tobacco') && <HeatedTobaccoDetails />}
        {sources.includes('Nicotine Pouches') && <NicotinePouchesDetails />}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <ThemedText style={styles.nextButtonText}>Next</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

const RadioButton = ({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) => (
    <TouchableOpacity style={[styles.radioButton, selected && styles.radioButtonSelected]} onPress={onSelect}>
      <ThemedText style={styles.radioButtonText}>{label}</ThemedText>
    </TouchableOpacity>
  );

const CigarettesDetails = () => {
    const { appState, setAppState } = useAppContext();
    const [type, setType] = useState(appState.cigarettes?.type || 'Regular');
    const [amount, setAmount] = useState(appState.cigarettes?.amount || 10);
  
    const handleTypeChange = (newType: string) => {
      setType(newType);
      setAppState((prevState) => ({ ...prevState, cigarettes: { ...prevState.cigarettes, type: newType, amount: prevState.cigarettes?.amount || 10 } }));
    };
  
    const handleAmountChange = (newAmount: number) => {
      setAmount(newAmount);
      setAppState((prevState) => ({ ...prevState, cigarettes: { ...prevState.cigarettes, amount: newAmount, type: prevState.cigarettes?.type || 'Regular' } }));
    };
  
    return (
      <View style={styles.productContainer}>
        <ThemedText style={styles.productTitle}>Tell us about your cigarettes</ThemedText>
        <ThemedText style={styles.questionText}>What type?</ThemedText>
        <View style={styles.radioGroup}>
            <RadioButton label="Regular (10-12mg)" selected={type === 'Regular'} onSelect={() => handleTypeChange('Regular')} />
            <RadioButton label="Light (6-8mg)" selected={type === 'Light'} onSelect={() => handleTypeChange('Light')} />
            <RadioButton label="Strong (12-15mg)" selected={type === 'Strong'} onSelect={() => handleTypeChange('Strong')} />
        </View>
        <ThemedText style={styles.questionText}>How many per day? {amount}</ThemedText>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={70}
          step={1}
          value={amount}
          onValueChange={handleAmountChange}
          minimumTrackTintColor={Colors.light.tint}
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor={Colors.light.tint}
        />
      </View>
    );
  };
  
  const VapesDetails = () => {
    const { appState, setAppState } = useAppContext();
    const [strength, setStrength] = useState(appState.vapes?.strength || 'Medium');
    const [puffs, setPuffs] = useState(appState.vapes?.puffs || 100);

    const handleStrengthChange = (newStrength: string) => {
        setStrength(newStrength);
        setAppState((prevState) => ({ ...prevState, vapes: { ...prevState.vapes, strength: newStrength, puffs: prevState.vapes?.puffs || 100 } }));
    };

    const handlePuffsChange = (newPuffs: number) => {
        setPuffs(newPuffs);
        setAppState((prevState) => ({ ...prevState, vapes: { ...prevState.vapes, puffs: newPuffs, strength: prevState.vapes?.strength || 'Medium' } }));
    };

    return (
        <View style={styles.productContainer}>
            <ThemedText style={styles.productTitle}>Tell us about your vaping</ThemedText>
            <ThemedText style={styles.questionText}>Nicotine strength?</ThemedText>
            <View style={styles.radioGroup}>
                <RadioButton label="Low (0-3mg/ml)" selected={strength === 'Low'} onSelect={() => handleStrengthChange('Low')} />
                <RadioButton label="Medium (6mg/ml)" selected={strength === 'Medium'} onSelect={() => handleStrengthChange('Medium')} />
                <RadioButton label="High (12mg/ml)" selected={strength === 'High'} onSelect={() => handleStrengthChange('High')} />
                <RadioButton label="Very High (18mg+/ml)" selected={strength === 'Very High'} onSelect={() => handleStrengthChange('Very High')} />
            </View>
            <ThemedText style={styles.questionText}>Approximate puffs per day? {puffs}</ThemedText>
            <Slider
                style={styles.slider}
                minimumValue={10}
                maximumValue={500}
                step={10}
                value={puffs}
                onValueChange={handlePuffsChange}
                minimumTrackTintColor={Colors.light.tint}
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor={Colors.light.tint}
            />
        </View>
    );
  };
  
  const HeatedTobaccoDetails = () => {
    const { appState, setAppState } = useAppContext();
    const [sticks, setSticks] = useState(appState.heatedTobacco?.sticks || 10);

    const handleSticksChange = (newSticks: number) => {
        setSticks(newSticks);
        setAppState((prevState) => ({ ...prevState, heatedTobacco: { sticks: newSticks } }));
    };

    return (
        <View style={styles.productContainer}>
            <ThemedText style={styles.productTitle}>Tell us about your heated tobacco use</ThemedText>
            <ThemedText style={styles.questionText}>Sticks per day? {sticks}</ThemedText>
            <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={40}
                step={1}
                value={sticks}
                onValueChange={handleSticksChange}
                minimumTrackTintColor={Colors.light.tint}
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor={Colors.light.tint}
            />
        </View>
    );
  };
  
  const NicotinePouchesDetails = () => {
    const { appState, setAppState } = useAppContext();
    const [strength, setStrength] = useState(appState.nicotinePouches?.strength || 'Medium');
    const [pouches, setPouches] = useState(appState.nicotinePouches?.pouches || 10);

    const handleStrengthChange = (newStrength: string) => {
        setStrength(newStrength);
        setAppState((prevState) => ({ ...prevState, nicotinePouches: { ...prevState.nicotinePouches, strength: newStrength, pouches: prevState.nicotinePouches?.pouches || 10 } }));
    };

    const handlePouchesChange = (newPouches: number) => {
        setPouches(newPouches);
        setAppState((prevState) => ({ ...prevState, nicotinePouches: { ...prevState.nicotinePouches, pouches: newPouches, strength: prevState.nicotinePouches?.strength || 'Medium' } }));
    };

    return (
        <View style={styles.productContainer}>
            <ThemedText style={styles.productTitle}>Tell us about your nicotine pouch use</ThemedText>
            <ThemedText style={styles.questionText}>Nicotine strength per pouch?</ThemedText>
            <View style={styles.radioGroup}>
                <RadioButton label="Low (2-4mg)" selected={strength === 'Low'} onSelect={() => handleStrengthChange('Low')} />
                <RadioButton label="Medium (6-8mg)" selected={strength === 'Medium'} onSelect={() => handleStrengthChange('Medium')} />
                <RadioButton label="High (10-12mg)" selected={strength === 'High'} onSelect={() => handleStrengthChange('High')} />
                <RadioButton label="Extra High (15mg+)" selected={strength === 'Extra High'} onSelect={() => handleStrengthChange('Extra High')} />
            </View>
            <ThemedText style={styles.questionText}>Pouches per day? {pouches}</ThemedText>
            <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={30}
                step={1}
                value={pouches}
                onValueChange={handlePouchesChange}
                minimumTrackTintColor={Colors.light.tint}
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor={Colors.light.tint}
            />
        </View>
    );
  };

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 24,
        backgroundColor: '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: 48,
      paddingBottom: 10,
    },
    backButton: {
        padding: 8,
    },
    mainContent: {
        flex: 1,
    },
    title: {
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 44,
        ...Platform.select({
          android: {
            includeFontPadding: false,
          },
        }),
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 32,
    },
    productContainer: {
        marginBottom: 24,
    },
    productTitle: {
        fontWeight: "500",
        fontSize: 18, 
        marginBottom: 16,
    },
    questionText: {
        fontSize: 16,
        marginBottom: 8,
        color: '#374151',
    },
    slider: {
        width: '100%',
        height: 40,
        marginVertical: 8,
    },
    footer: {
        justifyContent: 'flex-end',
        alignItems: 'stretch',
        paddingTop: 16,
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
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        gap: 8,
    },
    radioButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
    },
    radioButtonSelected: {
        backgroundColor: '#F0F9FF',
        borderColor: Colors.light.tint,
    },
    radioButtonText: {
        fontSize: 14,
    }
});

export default ProductDetailsScreen;
