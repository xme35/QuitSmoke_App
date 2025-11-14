import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, View, TouchableOpacity, Dimensions, useColorScheme, ScrollView, Animated, Platform } from 'react-native';
import { AppState, ConsumptionLog, initialAppState, useAppContext } from '../../context/AppContext';
import { Colors } from '../../constants/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useMemo, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const MS_IN_DAY = 1000 * 60 * 60 * 24;

const normalizeDailyAmount = (rawValue?: number, frequency?: string | null) => {
  if (!Number.isFinite(rawValue) || !rawValue) {
    return 0;
  }
  switch ((frequency ?? 'day').toLowerCase()) {
    case 'week':
      return Number(rawValue) / 7;
    case 'month':
      return Number(rawValue) / 30;
    default:
      return Number(rawValue);
  }
};

const computeBaselineIntake = (state: AppState): number => {
  const defaultPrefs = initialAppState.preferences!;
  const prefs = state.preferences ?? defaultPrefs;

  const safeNumber = (value: number | undefined, fallback: number) =>
    Number.isFinite(value) && value != null ? Number(value) : fallback;

  let total = 0;

  if (state.cigarettes?.amount && state.cigarettes.amount > 0) {
    const perCig = safeNumber(prefs.nicotineStrengthMgPerCigarette, defaultPrefs.nicotineStrengthMgPerCigarette);
    total += normalizeDailyAmount(state.cigarettes.amount, state.cigarettes.frequency) * perCig;
  }

  if (state.vapes?.puffs && state.vapes.puffs > 0) {
    const mgPerMl = safeNumber(prefs.nicotineStrengthMgPerMl, defaultPrefs.nicotineStrengthMgPerMl);
    const puffsPerPod = safeNumber(prefs.vapePuffsPerPod, defaultPrefs.vapePuffsPerPod);
    if (puffsPerPod > 0) {
      const perPuff = (mgPerMl * 2) / puffsPerPod;
      total += normalizeDailyAmount(state.vapes.puffs, state.vapes.frequency) * perPuff;
    }
  }

  if (state.heatedTobacco?.sticks && state.heatedTobacco.sticks > 0) {
    const perStick = safeNumber(
      prefs.nicotineStrengthMgPerHeatedTobacco,
      defaultPrefs.nicotineStrengthMgPerHeatedTobacco,
    );
    total += normalizeDailyAmount(state.heatedTobacco.sticks, state.heatedTobacco.frequency) * perStick;
  }

  if (state.nicotinePouches?.pouches && state.nicotinePouches.pouches > 0) {
    const perPouch = safeNumber(prefs.nicotineStrengthMgPerPouch, defaultPrefs.nicotineStrengthMgPerPouch);
    total += normalizeDailyAmount(state.nicotinePouches.pouches, state.nicotinePouches.frequency) * perPouch;
  }

  return Math.max(0, Math.round(total));
};

// Spacing constants for consistent design
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const gap = SPACING.md;
const cardSize = Math.min((width - 4 * gap) / 2, 180); // Max size for larger screens

const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
}

const getProgressStatus = (percentage: number) => {
  if (percentage < 50) return { message: 'Excellent progress! 🎉', color: '#10B981' };
  if (percentage < 80) return { message: 'Great job! Keep it up! 💪', color: '#10B981' };
  if (percentage < 100) return { message: "You're on track 👍", color: '#F59E0B' };
  if (percentage === 100) return { message: 'Goal reached! 🎯', color: '#F59E0B' };
  return { message: "You've exceeded your goal ⚠️", color: '#EF4444' };
};

export default function DashboardScreen() {
  const { appState, setAppState } = useAppContext();
  const {
    consumptionLog: rawConsumptionLog,
    preferences,
    taperingSchedule: rawTaperingSchedule,
    planStartDate,
    initialIntake,
    cigarettes,
    vapes,
    heatedTobacco,
    nicotinePouches,
    primaryDailyTargetMg,
  } = appState;
  const consumptionLog = useMemo(
    () => (Array.isArray(rawConsumptionLog) ? rawConsumptionLog : []),
    [rawConsumptionLog],
  );
  const taperingSchedule = useMemo(
    () => (Array.isArray(rawTaperingSchedule) ? rawTaperingSchedule : []),
    [rawTaperingSchedule],
  );
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    dailyGoal,
    fallbackPrimaryGoal,
    schedulePrimaryTarget,
    baselineIntake,
    currentConsumption,
    consumptionCounts,
  } = useMemo(() => {
    const schedule = taperingSchedule;
    const hasSchedule = schedule.length > 0;
    const planStartDateIso = planStartDate;

    const resolveGoalFromSchedule = (): number | null => {
      if (!hasSchedule) {
        return null;
      }

      const today = new Date();

      const resolveTarget = (phase: typeof schedule[number], dayIndex: number): number | null => {
        if (!phase) return null;
        if (Array.isArray(phase.dailyTargetsMg) && phase.dailyTargetsMg.length > 0) {
          const safeIndex = Math.min(Math.max(dayIndex, 0), phase.dailyTargetsMg.length - 1);
          const target = phase.dailyTargetsMg[safeIndex];
          if (Number.isFinite(target)) {
            return target;
          }
        }
        return Number.isFinite(phase.nicotineGoalMg) ? phase.nicotineGoalMg : null;
      };

      if (!planStartDateIso) {
        return resolveTarget(schedule[0], 0);
      }

      const planStartDate = new Date(planStartDateIso);
      if (Number.isNaN(planStartDate.getTime())) {
        return resolveTarget(schedule[0], 0);
      }

      let daysSinceStart = Math.floor((today.getTime() - planStartDate.getTime()) / MS_IN_DAY);
      if (!Number.isFinite(daysSinceStart)) {
        daysSinceStart = 0;
      }
      if (daysSinceStart < 0) {
        return resolveTarget(schedule[0], 0);
      }

      let cumulativeDays = 0;
      for (const phase of schedule) {
        const phaseEndDay = cumulativeDays + phase.durationDays;
        if (daysSinceStart < phaseEndDay) {
          const dayInPhase = daysSinceStart - cumulativeDays;
          const target = resolveTarget(phase, dayInPhase);
          if (target != null) {
            return target;
          }
          break;
        }
        cumulativeDays = phaseEndDay;
      }

      const lastPhase = schedule[schedule.length - 1];
      return resolveTarget(lastPhase, lastPhase?.dailyTargetsMg?.length ?? 1 - 1);
    };

    const scheduleGoal = resolveGoalFromSchedule();
    const fallbackPrimaryGoal = Number.isFinite(primaryDailyTargetMg ?? NaN)
      ? Number(primaryDailyTargetMg)
      : null;
    const schedulePrimaryTarget = schedule.length
      ? (() => {
          const firstPhase = schedule[0];
          if (!firstPhase) return null;
          if (Array.isArray(firstPhase.dailyTargetsMg) && firstPhase.dailyTargetsMg.length > 0) {
            return Number(firstPhase.dailyTargetsMg[0]);
          }
          return Number(firstPhase.nicotineGoalMg ?? null);
        })()
      : null;
    const initialFallback = Number.isFinite(initialIntake ?? NaN) ? Number(initialIntake) : null;
    const baselineSource: AppState = {
      ...initialAppState,
      preferences: preferences ?? initialAppState.preferences,
      cigarettes,
      vapes,
      heatedTobacco,
      nicotinePouches,
    };
    const computedBaseline = computeBaselineIntake(baselineSource);
    const baselineIntake = Number.isFinite(computedBaseline) && computedBaseline > 0 ? computedBaseline : null;

    let dailyGoal =
      scheduleGoal ??
      fallbackPrimaryGoal ??
      schedulePrimaryTarget ??
      initialFallback ??
      baselineIntake ??
      0;

    if (!Number.isFinite(dailyGoal) || dailyGoal < 0) {
      dailyGoal = 0;
    }

    const todaysConsumptions = consumptionLog.filter(log => isToday(new Date(log.timestamp)));

    const consumptionCounts = {
      Cigarette: 0,
      'Vape (Puff)': 0,
      'Heated Tobacco': 0,
      'Nicotine Pouch': 0,
    };

    let totalNicotine = 0;
    todaysConsumptions.forEach(log => {
      if (log.product in consumptionCounts) {
        consumptionCounts[log.product as keyof typeof consumptionCounts] += 1;
      }

      switch (log.product) {
        case 'Cigarette':
          totalNicotine += preferences?.nicotineStrengthMgPerCigarette || 0;
          break;
        case 'Vape (Puff)': {
          const nicotinePerMl = preferences?.nicotineStrengthMgPerMl || 0;
          const puffsPerPod = preferences?.vapePuffsPerPod || 1;
          const vapeNicotinePerPuff = puffsPerPod > 0 ? (nicotinePerMl * 2) / puffsPerPod : 0;
          totalNicotine += vapeNicotinePerPuff;
          break;
        }
        case 'Heated Tobacco':
          totalNicotine += preferences?.nicotineStrengthMgPerHeatedTobacco || 0;
          break;
        case 'Nicotine Pouch':
          totalNicotine += preferences?.nicotineStrengthMgPerPouch || 0;
          break;
      }
    });
 
    return {
      dailyGoal,
      fallbackPrimaryGoal,
      schedulePrimaryTarget,
      baselineIntake,
      currentConsumption: totalNicotine,
      consumptionCounts,
    };
  }, [
    consumptionLog,
    preferences,
    taperingSchedule,
    planStartDate,
    initialIntake,
    cigarettes,
    vapes,
    heatedTobacco,
    nicotinePouches,
    primaryDailyTargetMg,
  ]);

 const baselineIntakeFromUsage = baselineIntake ?? 0;
  const displayDailyGoal =
    dailyGoal > 0
      ? dailyGoal
      : fallbackPrimaryGoal ??
        (schedulePrimaryTarget && schedulePrimaryTarget > 0
          ? schedulePrimaryTarget
          : baselineIntakeFromUsage);
  const safeDailyGoal = displayDailyGoal > 0 ? displayDailyGoal : 1;
  const percentage = (currentConsumption / safeDailyGoal) * 100;
  const progressStatus = getProgressStatus(percentage);

  const handleAddConsumption = (product: string) => {
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const newLog: ConsumptionLog = {
      product,
      timestamp: new Date().toISOString(),
    };

    setAppState(prevState => ({
      ...prevState,
      consumptionLog: [...(prevState.consumptionLog || []), newLog],
    }));
  };

  const handleDeleteLog = (index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setAppState(prevState => ({
      ...prevState,
      consumptionLog: prevState.consumptionLog?.filter((_, i) => i !== index) || [],
    }));
  };

  const consumptionTypes = [
    { name: 'Cigarette', icon: 'smoking', count: consumptionCounts.Cigarette },
    { name: 'Vape (Puff)', icon: 'wind', count: consumptionCounts['Vape (Puff)'] },
    { name: 'Heated Tobacco', icon: 'fire-alt', count: consumptionCounts['Heated Tobacco'] },
    { name: 'Nicotine Pouch', icon: 'grip-lines', count: consumptionCounts['Nicotine Pouch'] },
  ];

  const size = Math.min(width * 0.58, 280); // Max size for larger screens
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Circle with Status */}
        <View style={styles.progressWrapper}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Defs>
                  <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={progressStatus.color} stopOpacity="1" />
                    <Stop offset="100%" stopColor={progressStatus.color} stopOpacity="0.7" />
                  </LinearGradient>
                </Defs>
                <Circle
                    stroke={colorScheme === 'dark' ? '#2A2A2A' : '#F0F0F0'}
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <Circle
                    stroke="url(#progressGradient)"
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90, ${size / 2}, ${size / 2})`}
                />
            </Svg>
            <View style={styles.progressTextContainer}>
                <ThemedText style={styles.progressValue}>
                    {currentConsumption.toFixed(1)}
                </ThemedText>
                <ThemedText style={styles.progressLabel}>
                    / {displayDailyGoal.toFixed(0)}mg
                </ThemedText>
            </View>
        </View>

        {/* Consumption Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <ConsumptionCard 
              style={styles.cardTopLeft} 
              type={consumptionTypes[0]} 
              onPress={() => handleAddConsumption('Cigarette')} 
            />
            <ConsumptionCard 
              style={styles.cardTopRight} 
              type={consumptionTypes[1]} 
              onPress={() => handleAddConsumption('Vape (Puff)')} 
            />
          </View>
          <View style={styles.gridRow}>
            <ConsumptionCard 
              style={styles.cardBottomLeft} 
              type={consumptionTypes[2]} 
              onPress={() => handleAddConsumption('Heated Tobacco')} 
            />
            <ConsumptionCard 
              style={styles.cardBottomRight} 
              type={consumptionTypes[3]} 
              onPress={() => handleAddConsumption('Nicotine Pouch')} 
            />
          </View>
        </View>

        {/* Activity Logs Section */}
        <View style={styles.logsSection}>
          <View style={styles.logsSectionHeader}>
            <ThemedText style={styles.logsSectionTitle}>Recent Activity</ThemedText>
            {consumptionLog.length > 3 && (
              <TouchableOpacity 
                onPress={() => router.push('/activity-logs' as any)}
                accessibilityLabel="View all activity logs"
                accessibilityRole="button"
              >
                <ThemedText style={[styles.viewMoreText, { color: themeColors.tint }]}>View More</ThemedText>
              </TouchableOpacity>
            )}
          </View>
          
          {consumptionLog.length === 0 ? (
            <View style={[styles.emptyLogsContainer, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}>
              <FontAwesome5 name="clipboard-list" size={48} color={themeColors.icon} style={{ opacity: 0.3, marginBottom: SPACING.md }} />
              <ThemedText style={styles.emptyLogsText}>No activity logged yet</ThemedText>
              <ThemedText style={[styles.emptyLogsSubtext, { opacity: 0.5 }]}>
                Tap a card above to start tracking
              </ThemedText>
            </View>
          ) : (
            <View style={styles.logsContainer}>
              {consumptionLog
                .map((log, index) => ({ log, index }))
                .slice(-3)
                .reverse()
                .map(({ log, index }) => (
                  <LogItem
                    key={`${log.timestamp}-${index}`}
                    log={log}
                    onDelete={() => handleDeleteLog(index)}
                    colorScheme={colorScheme}
                    themeColors={themeColors}
                  />
                ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const ConsumptionCard = ({ 
  type, 
  onPress, 
  style 
}: { 
  type: { name: string, icon: any, count: number }, 
  onPress: () => void, 
  style: any 
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        style={[
          styles.card, 
          { 
            backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF',
          }, 
          style
        ]} 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityLabel={`Log ${type.name}`}
        accessibilityHint="Double tap to record consumption"
        accessibilityRole="button"
      >
        <View style={[styles.cardIconContainer, { backgroundColor: `${themeColors.tint}15` }]}>
          <FontAwesome5 name={type.icon} size={24} color={themeColors.tint} />
        </View>
        <ThemedText style={styles.cardText}>{type.name}</ThemedText>
        <ThemedText style={[styles.cardCount, { color: themeColors.tint }]}>{type.count}</ThemedText>
        {type.count > 0 && (
          <View style={[styles.badge, { backgroundColor: themeColors.tint }]}>
            <ThemedText style={styles.badgeText}>{type.count}</ThemedText>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const LogItem = ({
  log,
  onDelete,
  colorScheme,
  themeColors
}: {
  log: ConsumptionLog,
  onDelete: () => void,
  colorScheme: 'light' | 'dark',
  themeColors: any
}) => {
  const logDate = new Date(log.timestamp);
  const timeStr = logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = isToday(logDate)
    ? 'Today'
    : logDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

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
          size={18}
          color={themeColors.tint}
        />
      </View>
      <View style={styles.logTextContainer}>
        <ThemedText style={styles.logProduct}>{log.product}</ThemedText>
        <ThemedText style={styles.logTime}>{dateStr} at {timeStr}</ThemedText>
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
  progressWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    position: 'relative',
    marginBottom: SPACING.md,
  },
  progressTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    flex: 1,
  },
  progressValue: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 0,
    padding: 0,
    lineHeight: 52,
  },
  progressLabel: {
    fontSize: 15,
    marginTop: 2,
    opacity: 0.7,
  },
  gridContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  gridRow: {
    flexDirection: 'row',
  },
  card: {
    width: cardSize,
    height: cardSize,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    padding: SPACING.md,
    position: 'relative',
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  cardTopLeft: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 80,
    marginRight: gap / 2,
    marginBottom: gap / 2,
  },
  cardTopRight: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 80,
    marginLeft: gap / 2,
    marginBottom: gap / 2,
  },
  cardBottomLeft: {
    borderBottomLeftRadius: 24,
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderTopRightRadius: 80,
    marginRight: gap / 2,
    marginTop: gap / 2,
  },
  cardBottomRight: {
    borderBottomRightRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderTopLeftRadius: 80,
    marginLeft: gap / 2,
    marginTop: gap / 2,
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  cardCount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logsSection: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  logsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  viewMoreText: {
    fontSize: 15,
    fontWeight: '600',
  },
  logsContainer: {
    gap: SPACING.sm,
  },
  emptyLogsContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
    borderRadius: 16,
  },
  emptyLogsText: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.6,
  },
  emptyLogsSubtext: {
    fontSize: 14,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 14,
    gap: SPACING.md,
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
  deleteIconButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
});
