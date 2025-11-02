import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { StyleSheet, View, ScrollView, useColorScheme, TouchableOpacity, Platform } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Colors } from '../constants/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const isToday = (someDate: Date) => {
  const today = new Date();
  return someDate.getDate() === today.getDate() &&
         someDate.getMonth() === today.getMonth() &&
         someDate.getFullYear() === today.getFullYear();
}

export default function ActivityLogsScreen() {
  const { appState, setAppState } = useAppContext();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleDeleteLog = (index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const reversedIndex = (appState.consumptionLog?.length || 0) - 1 - index;
    setAppState(prevState => ({
      ...prevState,
      consumptionLog: prevState.consumptionLog?.filter((_, i) => i !== reversedIndex) || [],
    }));
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color={themeColors.tint} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Activity Logs</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {(appState.consumptionLog || []).length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="clipboard-list" size={60} color={themeColors.tint} style={{ opacity: 0.3 }} />
            <ThemedText style={styles.emptyText}>No activity logged yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Start tracking your nicotine consumption from the dashboard
            </ThemedText>
          </View>
        ) : (
          <View style={styles.logsContainer}>
            {[...(appState.consumptionLog || [])]
              .reverse()
              .map((log, index) => {
                const logDate = new Date(log.timestamp);
                const timeStr = logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = isToday(logDate)
                  ? 'Today'
                  : logDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                
                return (
                  <View
                    key={`${log.timestamp}-${index}`}
                    style={[
                      styles.logItem,
                      { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }
                    ]}
                  >
                    <View style={[styles.logIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)' }]}>
                      <FontAwesome5
                        name={
                          log.product === 'Cigarette' ? 'smoking' :
                          log.product === 'Vape (Puff)' ? 'wind' :
                          log.product === 'Heated Tobacco' ? 'fire-alt' :
                          'grip-lines'
                        }
                        size={18}
                        color={themeColors.tint}
                      />
                    </View>
                    <View style={styles.logTextContainer}>
                      <ThemedText style={styles.logProduct}>{log.product}</ThemedText>
                      <ThemedText style={styles.logTime}>{dateStr} at {timeStr}</ThemedText>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteLog(index)}
                      accessibilityLabel="Delete log entry"
                      accessibilityRole="button"
                      style={styles.deleteIconButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <FontAwesome5 name="times-circle" size={20} color={themeColors.icon} style={{ opacity: 0.5 }} />
                    </TouchableOpacity>
                  </View>
                );
              })}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  logsContainer: {
    gap: 12,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  logIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTextContainer: {
    flex: 1,
  },
  logProduct: {
    fontSize: 16,
    fontWeight: '600',
  },
  logTime: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  deleteIconButton: {
    padding: 8,
    marginLeft: 4,
  },
});