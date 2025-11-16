import React, { useMemo } from 'react';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, View, TouchableOpacity, useColorScheme, ScrollView, Platform } from 'react-native';
import { useAppContext, ConsumptionLog } from '../../context/AppContext';
import { Colors } from '../../constants/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const isOnSameDay = (date1: Date, date2: Date) => {
  return startOfDay(date1).getTime() === startOfDay(date2).getTime();
};

const getDateLabel = (date: Date) => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMMM d, yyyy');
};

const getProductIcon = (product: string) => {
  switch (product) {
    case 'Cigarette':
      return 'smoking';
    case 'Vape (Puff)':
      return 'wind';
    case 'Heated Tobacco':
      return 'fire-alt';
    case 'Nicotine Pouch':
      return 'grip-lines';
    default:
      return 'circle';
  }
};

// Function to get nicotine amount based on product and user preferences
const getNicotineAmount = (product: string, preferences: any): number => {
  switch (product) {
    case 'Cigarette':
      return preferences?.nicotineStrengthMgPerCigarette || 12;
    case 'Vape (Puff)': {
      const nicotinePerMl = preferences?.nicotineStrengthMgPerMl === 3 ? 25 : (preferences?.nicotineStrengthMgPerMl || 25);
      const puffsPerPod = preferences?.vapePuffsPerPod || 500;
      return puffsPerPod > 0 ? Number(((nicotinePerMl * 2) / puffsPerPod).toFixed(2)) : 0.1;
    }
    case 'Heated Tobacco':
      return preferences?.nicotineStrengthMgPerHeatedTobacco || 6;
    case 'Nicotine Pouch':
      // If user has old default value (21), use new default (8)
      return preferences?.nicotineStrengthMgPerPouch === 21 ? 8 : (preferences?.nicotineStrengthMgPerPouch || 8);
    default:
      return 0;
  }
};

export default function ActivityLogsScreen() {
  const { appState, setAppState } = useAppContext();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const consumptionLog = appState.consumptionLog || [];

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: { date: Date; logs: Array<ConsumptionLog & { index: number }> } } = {};
    
    consumptionLog.forEach((log, index) => {
      const logDate = new Date(log.timestamp);
      const dateKey = format(logDate, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: logDate,
          logs: [],
        };
      }
      
      groups[dateKey].logs.push({ ...log, index });
    });

    // Sort by date (most recent first)
    const sortedGroups = Object.entries(groups)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(([_, group]) => group);

    // Sort logs within each group by timestamp (most recent first)
    sortedGroups.forEach(group => {
      group.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });

    return sortedGroups;
  }, [consumptionLog]);

  const handleDeleteLog = (index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setAppState(prevState => ({
      ...prevState,
      consumptionLog: prevState.consumptionLog?.filter((_, i) => i !== index) || [],
    }));
  };

  // Calculate total logs for empty state
  const totalLogs = consumptionLog.length;

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.xl }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
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

        {/* Logs List */}
        {totalLogs === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}>
            <FontAwesome5 name="clipboard-list" size={64} color={themeColors.icon} style={{ opacity: 0.3, marginBottom: SPACING.lg }} />
            <ThemedText style={styles.emptyTitle}>No activity logged yet</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { opacity: 0.5 }]}>
              Your consumption history will appear here
            </ThemedText>
          </View>
        ) : (
          <View style={styles.logsSection}>
            {groupedLogs.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <View style={[styles.dateDivider, { backgroundColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB' }]} />
                  <ThemedText style={[styles.dateLabel, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                    {getDateLabel(group.date)}
                  </ThemedText>
                  <View style={[styles.dateDivider, { backgroundColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB' }]} />
                </View>
                <View style={styles.logsContainer}>
                  {group.logs.map(({ index, product, timestamp }) => (
                    <LogItem
                      key={`${timestamp}-${index}`}
                      product={product}
                      timestamp={timestamp}
                      nicotineAmount={getNicotineAmount(product, appState.preferences)}
                      onDelete={() => handleDeleteLog(index)}
                      colorScheme={colorScheme}
                      themeColors={themeColors}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const LogItem = ({
  product,
  timestamp,
  nicotineAmount,
  onDelete,
  colorScheme,
  themeColors
}: {
  product: string;
  timestamp: string;
  nicotineAmount: number;
  onDelete: () => void;
  colorScheme: 'light' | 'dark';
  themeColors: any;
}) => {
  const logDate = new Date(timestamp);
  const timeStr = format(logDate, 'h:mm a');

  return (
    <View
      style={[
        styles.logItem,
        { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }
      ]}
    >
      <View style={[styles.logIconContainer, { backgroundColor: `${themeColors.tint}15` }]}>
        <FontAwesome5
          name={getProductIcon(product)}
          size={18}
          color={themeColors.tint}
        />
      </View>
      <View style={styles.logTextContainer}>
        <ThemedText style={styles.logProduct}>{product}</ThemedText>
        <ThemedText style={styles.logTime}>{timeStr}</ThemedText>
        <ThemedText style={[styles.logNicotine, { color: themeColors.tint }]}>
          {nicotineAmount} mg
        </ThemedText>
      </View>
      <TouchableOpacity
        onPress={onDelete}
        accessibilityLabel="Delete log entry"
        accessibilityRole="button"
        style={styles.deleteIconButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <FontAwesome5 name="times-circle" size={20} color={themeColors.icon} style={{ opacity: 0.5 }} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
    borderRadius: 16,
    marginTop: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  logsSection: {
    gap: SPACING.lg,
  },
  dateGroup: {
    marginBottom: SPACING.md,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  dateDivider: {
    flex: 1,
    height: 1,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    elevation: 1,
  },
  logIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTextContainer: {
    flex: 1,
  },
  logProduct: {
    fontSize: 15,
    fontWeight: '600',
  },
  logTime: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  logNicotine: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  deleteIconButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
});