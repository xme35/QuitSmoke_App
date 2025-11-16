import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Colors } from '../constants/theme';
import { ConsumptionLog, useAppContext } from '../context/AppContext';

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const isToday = (someDate: Date) => {
  const today = new Date();
  return someDate.getDate() === today.getDate() &&
         someDate.getMonth() === today.getMonth() &&
         someDate.getFullYear() === today.getFullYear();
};

const isYesterday = (someDate: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return someDate.getDate() === yesterday.getDate() &&
         someDate.getMonth() === yesterday.getMonth() &&
         someDate.getFullYear() === yesterday.getFullYear();
};

export default function ActivityLogsScreen() {
  const { appState, setAppState } = useAppContext();
  const { consumptionLog = [] } = appState;
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleDeleteLog = (index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setAppState(prevState => ({
      ...prevState,
      consumptionLog: prevState.consumptionLog?.filter((_, i) => i !== index) || [],
    }));
  };

  const groupedLogs = consumptionLog.reduce((groups, log, index) => {
    const logDate = new Date(log.timestamp);
    let dateKey: string;

    if (isToday(logDate)) {
      dateKey = 'Today';
    } else if (isYesterday(logDate)) {
      dateKey = 'Yesterday';
    } else {
      dateKey = logDate.toLocaleDateString([], { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push({ log, index });
    return groups;
  }, {} as Record<string, Array<{ log: ConsumptionLog; index: number }>>);

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
          }}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <FontAwesome5 name="arrow-left" size={20} color={themeColors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Activity Logs</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {consumptionLog.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}>
            <FontAwesome5 name="clipboard-list" size={64} color={themeColors.icon} style={{ opacity: 0.3, marginBottom: SPACING.lg }} />
            <ThemedText style={styles.emptyText}>No activity logged yet</ThemedText>
            <ThemedText style={[styles.emptySubtext, { opacity: 0.5 }]}>
              Start tracking your nicotine consumption from the dashboard
            </ThemedText>
          </View>
        ) : (
          Object.entries(groupedLogs)
            .reverse()
            .map(([dateKey, logs]) => (
              <View key={dateKey} style={styles.dateGroup}>
                <ThemedText style={styles.dateHeader}>{dateKey}</ThemedText>
                <View style={styles.logsContainer}>
                  {logs.reverse().map(({ log, index }) => (
                    <LogItem
                      key={`${log.timestamp}-${index}`}
                      log={log}
                      onDelete={() => handleDeleteLog(index)}
                      colorScheme={colorScheme}
                      themeColors={themeColors}
                    />
                  ))}
                </View>
              </View>
            ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const LogItem = ({
  log,
  onDelete,
  colorScheme,
  themeColors
}: {
  log: ConsumptionLog;
  onDelete: () => void;
  colorScheme: 'light' | 'dark';
  themeColors: any;
}) => {
  const logDate = new Date(log.timestamp);
  const timeStr = logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View
      style={[
        styles.logItem,
        { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }
      ]}
    >
      <View style={[styles.logIconContainer, { backgroundColor: `${themeColors.tint}15` }]}>
        <FontAwesome5
          name={
            log.product === 'Cigarette' ? 'smoking' :
            log.product === 'Vape (Puff)' ? 'wind' :
            log.product === 'Heated Tobacco' ? 'fire-alt' :
            'grip-lines'
          }
          size={20}
          color={themeColors.tint}
        />
      </View>
      <View style={styles.logTextContainer}>
        <ThemedText style={styles.logProduct}>{log.product}</ThemedText>
        <ThemedText style={styles.logTime}>{timeStr}</ThemedText>
      </View>
      <TouchableOpacity
        onPress={onDelete}
        accessibilityLabel="Delete log entry"
        accessibilityRole="button"
        style={styles.deleteIconButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <FontAwesome5 name="trash-alt" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: SPACING.sm,
    marginLeft: -SPACING.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
    borderRadius: 16,
    marginTop: SPACING.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.6,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: SPACING.xl,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.md,
    opacity: 0.6,
  },
  logsContainer: {
    gap: SPACING.sm,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 14,
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    marginTop: 2,
  },
  deleteIconButton: {
    padding: SPACING.sm,
    marginRight: -SPACING.xs,
  },
});