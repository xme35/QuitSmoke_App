
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function QuitDateScreen() {
  const { appState, setAppState } = useAppContext();
  const [date, setDate] = useState(appState.quitDate || new Date());

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
    setAppState((prevState) => ({ ...prevState, quitDate: currentDate }));
  };

  const handleFinish = () => {
    // @ts-ignore
    router.push('/(onboarding)/summary');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.mainContent}>
        <ThemedText type="title" style={styles.title}>When do you want to start?</ThemedText>
        <ThemedText style={styles.subtitle}>You can always change this later.</ThemedText>
        <View style={styles.pickerContainer}>
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            display="spinner"
            onChange={onDateChange}
            textColor={Platform.OS === 'ios' ? '#000000' : undefined}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ThemedText>Back</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleFinish}>
          <ThemedText style={styles.nextButtonText}>Finish</ThemedText>
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
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 50,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
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
    marginBottom: 32,
    color: '#6B7280',
  },
  pickerContainer: {
    borderRadius: 12,
    overflow: 'hidden', // Ensures the spinner respects the border radius
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  nextButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
