
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

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
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>
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
        <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
          <ThemedText style={styles.finishButtonText}>Finish</ThemedText>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
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
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  finishButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
