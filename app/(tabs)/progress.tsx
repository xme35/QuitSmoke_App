
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, useColorScheme, View, Dimensions, ScrollView, Animated, Pressable } from 'react-native';
import { useAppContext, TaperingPhase } from '../../context/AppContext';
import { Colors } from '../../constants/theme';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { differenceInDays, add, format, eachDayOfInterval, startOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import Svg, { G, Text as SvgText, Rect } from 'react-native-svg';
import { calculateLifeTimeGained, formatLifeTimeGained } from '../../helpers/calculate-lifetime-gained';
import { HealthImprovements } from '../../components/HealthImprovements';
import { AchievementBadges, TOTAL_BADGES } from '../../components/AchievementBadges';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 48;

const normalizeDailyAmount = (value?: number, frequency?: string | null) => {
    if (!Number.isFinite(value) || value == null || value <= 0) return 0;
    switch ((frequency ?? 'day').toLowerCase()) {
        case 'week':
            return value / 7;
        case 'month':
            return value / 30;
        default:
            return value;
    }
};

export default function ProgressScreen() {
    const { appState } = useAppContext();
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const [now, setNow] = useState(new Date());
    const scaleAnim = useMemo(() => new Animated.Value(1), []);
    const [healthModalVisible, setHealthModalVisible] = useState(false);
    const [badgesModalVisible, setBadgesModalVisible] = useState(false);
    const [streakPage, setStreakPage] = useState(0);
    const streakScrollRef = useRef<ScrollView>(null);
    const [chartView, setChartView] = useState<'week' | 'month'>('week');

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const { planStartDate, totalDuration, estimatedSavings, consumptionLog } = appState;

    const baselineDailyEvents = useMemo(() => {
        const dailyCigarettes = normalizeDailyAmount(appState.cigarettes?.amount, appState.cigarettes?.frequency);
        const dailyVapePuffs = normalizeDailyAmount(appState.vapes?.puffs, appState.vapes?.frequency);
        const dailyHeatedTobacco = normalizeDailyAmount(appState.heatedTobacco?.sticks, appState.heatedTobacco?.frequency);
        const dailyPouches = normalizeDailyAmount(appState.nicotinePouches?.pouches, appState.nicotinePouches?.frequency);

        const total = dailyCigarettes + dailyVapePuffs + dailyHeatedTobacco + dailyPouches;
        return total > 0 ? total : 1;
    }, [
        appState.cigarettes?.amount,
        appState.cigarettes?.frequency,
        appState.vapes?.puffs,
        appState.vapes?.frequency,
        appState.heatedTobacco?.sticks,
        appState.heatedTobacco?.frequency,
        appState.nicotinePouches?.pouches,
        appState.nicotinePouches?.frequency,
    ]);

    const effectiveBaselineIntake = useMemo(() => {
        const intake = appState.initialIntake ?? 0;
        if (intake > 0) return intake;
        const firstPhase = appState.taperingSchedule?.[0];
        if (!firstPhase) return 0;
        const firstTarget = firstPhase.dailyTargetsMg?.[0] ?? firstPhase.nicotineGoalMg ?? 0;
        return firstTarget;
    }, [appState.initialIntake, appState.taperingSchedule]);

    const nicotinePerEvent = useMemo(() => {
        if (baselineDailyEvents <= 0) return 1;
        if (effectiveBaselineIntake <= 0) return 1;
        return effectiveBaselineIntake / baselineDailyEvents;
    }, [baselineDailyEvents, effectiveBaselineIntake]);

    const timeUntilPlanEnds = useMemo(() => {
        if (!planStartDate || !totalDuration) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

        const endDate = add(new Date(planStartDate), { days: totalDuration });
        const diff = endDate.getTime() - now.getTime();

        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
    }, [planStartDate, totalDuration, now]);

    const daysSinceStart = useMemo(() => {
        if (!planStartDate) return 0;
        return differenceInDays(new Date(), new Date(planStartDate));
    }, [planStartDate]);

    // Streak animation
    useEffect(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [daysSinceStart, scaleAnim]);

    const moneySaved = useMemo(() => {
        if (!estimatedSavings || !totalDuration || daysSinceStart < 0) return '€0';
        const dailySavings = estimatedSavings / totalDuration;
        const savedSoFar = dailySavings * daysSinceStart;
        return `€${savedSoFar.toFixed(2)}`;
    }, [estimatedSavings, totalDuration, daysSinceStart]);

    const lifeTimeGained = useMemo(() => {
        if (!totalDuration || daysSinceStart < 0) return 'N/A';
        
        const smokingYears = appState.smokingHistory ? parseInt(appState.smokingHistory.split(' ')[0]) : 0;
        const totalYearsGainable = calculateLifeTimeGained(appState.age, smokingYears, appState.initialIntake);
        
        // Calcular proporcionalmente ao progresso (similar ao money saved)
        const dailyLifeTimeGain = totalYearsGainable / totalDuration;
        const lifeTimeGainedSoFar = dailyLifeTimeGain * daysSinceStart;
        
        return formatLifeTimeGained(lifeTimeGainedSoFar);
    }, [appState.age, appState.smokingHistory, appState.initialIntake, totalDuration, daysSinceStart]);

    // Helper function to calculate precise nicotine from logs
    const calculateNicotineFromLogs = (logs: any[]) => {
        let totalNicotine = 0;
        logs.forEach(log => {
            switch (log.product) {
                case 'Cigarette':
                    totalNicotine += appState.preferences?.nicotineStrengthMgPerCigarette || 12;
                    break;
                case 'Vape (Puff)': {
                    const nicotinePerMl = appState.preferences?.nicotineStrengthMgPerMl || 3;
                    const puffsPerPod = appState.preferences?.vapePuffsPerPod || 500;
                    const vapeNicotinePerPuff = puffsPerPod > 0 ? (nicotinePerMl * 2) / puffsPerPod : 0;
                    totalNicotine += vapeNicotinePerPuff;
                    break;
                }
                case 'Heated Tobacco':
                    totalNicotine += appState.preferences?.nicotineStrengthMgPerHeatedTobacco || 6;
                    break;
                case 'Nicotine Pouch':
                    totalNicotine += appState.preferences?.nicotineStrengthMgPerPouch || 21;
                    break;
            }
        });
        return totalNicotine;
    };

    const daysWithinLimits = useMemo(() => {
        if (!consumptionLog || !planStartDate || !appState.taperingSchedule) return 0;
        
        let withinLimitsCount = 0;
        const today = startOfDay(new Date());
        const start = startOfDay(new Date(planStartDate));
        
        // Get all days from start to today
        const allDays = eachDayOfInterval({ start, end: today });
        
        allDays.forEach((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const daysSinceStart = differenceInDays(day, start);
            
            // Find the current phase for this day
            let currentPhase: TaperingPhase | null = null;
            let cumulativeDays = 0;
            for (const phase of appState.taperingSchedule!) {
                if (daysSinceStart < cumulativeDays + phase.durationDays) {
                    currentPhase = phase;
                    break;
                }
                cumulativeDays += phase.durationDays;
            }
            
            if (!currentPhase) return;
            
            const dayInPhase = daysSinceStart - cumulativeDays;
            const dailyTarget =
                currentPhase.dailyTargetsMg?.[dayInPhase] ?? currentPhase.nicotineGoalMg ?? 0;
            
            // Count consumption for this day
            const dayConsumption = consumptionLog.filter(log => {
                return format(new Date(log.timestamp), 'yyyy-MM-dd') === dayStr;
            });
            
            // Calculate precise nicotine intake for the day
            const estimatedNicotine = calculateNicotineFromLogs(dayConsumption);
            
            if (estimatedNicotine <= dailyTarget) {
                withinLimitsCount++;
            }
        });
        
        return withinLimitsCount;
    }, [consumptionLog, planStartDate, appState.taperingSchedule, appState.preferences]);

    // Calculate current streak (consecutive days within limits)
    const currentStreak = useMemo(() => {
        if (!consumptionLog || !planStartDate || !appState.taperingSchedule) return 0;
        
        const today = startOfDay(new Date());
        const start = startOfDay(new Date(planStartDate));
        let streak = 0;
        
        // Count backwards from today to find consecutive days within limits
        for (let i = 0; i >= -daysSinceStart; i--) {
            const day = add(today, { days: i });
            const dayStr = format(day, 'yyyy-MM-dd');
            const daysSinceStartForDay = differenceInDays(day, start);
            
            // Find the current phase for this day
            let currentPhase: TaperingPhase | null = null;
            let cumulativeDays = 0;
            for (const phase of appState.taperingSchedule!) {
                if (daysSinceStartForDay < cumulativeDays + phase.durationDays) {
                    currentPhase = phase;
                    break;
                }
                cumulativeDays += phase.durationDays;
            }
            
            if (!currentPhase) break;
            
            const dayInPhase = daysSinceStartForDay - cumulativeDays;
            const dailyTarget =
                currentPhase.dailyTargetsMg?.[dayInPhase] ?? currentPhase.nicotineGoalMg ?? 0;
            
            // Count consumption for this day
            const dayConsumption = consumptionLog.filter(log => {
                return format(new Date(log.timestamp), 'yyyy-MM-dd') === dayStr;
            });
            
            // Calculate precise nicotine intake for the day
            const estimatedNicotine = calculateNicotineFromLogs(dayConsumption);
            
            if (estimatedNicotine <= dailyTarget) {
                streak++;
            } else {
                break; // Streak is broken
            }
        }
        
        return streak;
    }, [consumptionLog, planStartDate, appState.taperingSchedule, appState.preferences, daysSinceStart]);

    // Calculate longest streak (best consecutive streak in history)
    const longestStreak = useMemo(() => {
        if (!consumptionLog || !planStartDate || !appState.taperingSchedule) return 0;
        
        const today = startOfDay(new Date());
        const start = startOfDay(new Date(planStartDate));
        const allDays = eachDayOfInterval({ start, end: today });
        
        let maxStreak = 0;
        let currentStreakCount = 0;
        
        allDays.forEach((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const daysSinceStartForDay = differenceInDays(day, start);
            
            // Find the current phase for this day
            let currentPhase: TaperingPhase | null = null;
            let cumulativeDays = 0;
            for (const phase of appState.taperingSchedule!) {
                if (daysSinceStartForDay < cumulativeDays + phase.durationDays) {
                    currentPhase = phase;
                    break;
                }
                cumulativeDays += phase.durationDays;
            }
            
            if (!currentPhase) return;
            
            const dayInPhase = daysSinceStartForDay - cumulativeDays;
            const dailyTarget =
                currentPhase.dailyTargetsMg?.[dayInPhase] ?? currentPhase.nicotineGoalMg ?? 0;
            
            // Count consumption for this day
            const dayConsumption = consumptionLog.filter(log => {
                return format(new Date(log.timestamp), 'yyyy-MM-dd') === dayStr;
            });
            
            // Calculate precise nicotine intake for the day
            const estimatedNicotine = calculateNicotineFromLogs(dayConsumption);
            
            if (estimatedNicotine <= dailyTarget) {
                currentStreakCount++;
                maxStreak = Math.max(maxStreak, currentStreakCount);
            } else {
                currentStreakCount = 0;
            }
        });
        
        return maxStreak;
    }, [consumptionLog, planStartDate, appState.taperingSchedule, appState.preferences]);

    // Calculate smoking-off days (total days with 0 consumption)
    const smokeFreeDays = useMemo(() => {
        if (!consumptionLog || !planStartDate) return 0;
        
        let smokeFreeCount = 0;
        const today = startOfDay(new Date());
        const start = startOfDay(new Date(planStartDate));
        
        const allDays = eachDayOfInterval({ start, end: today });
        
        allDays.forEach((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayConsumption = consumptionLog.filter(log => {
                return format(new Date(log.timestamp), 'yyyy-MM-dd') === dayStr;
            });
            
            if (dayConsumption.length === 0) {
                smokeFreeCount++;
            }
        });
        
        return smokeFreeCount;
    }, [consumptionLog, planStartDate]);

    // Calculate current smoking-off streak (consecutive days with 0 consumption)
    const currentSmokeFreeStreak = useMemo(() => {
        if (!consumptionLog || !planStartDate) return 0;
        
        const today = startOfDay(new Date());
        let streak = 0;
        
        for (let i = 0; i >= -daysSinceStart; i--) {
            const day = add(today, { days: i });
            const dayStr = format(day, 'yyyy-MM-dd');
            
            const dayConsumption = consumptionLog.filter(log => {
                return format(new Date(log.timestamp), 'yyyy-MM-dd') === dayStr;
            });
            
            if (dayConsumption.length === 0) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }, [consumptionLog, planStartDate, daysSinceStart]);

    // Calculate longest smoking-off streak
    const longestSmokeFreeStreak = useMemo(() => {
        if (!consumptionLog || !planStartDate) return 0;
        
        const today = startOfDay(new Date());
        const start = startOfDay(new Date(planStartDate));
        const allDays = eachDayOfInterval({ start, end: today });
        
        let maxStreak = 0;
        let currentStreakCount = 0;
        
        allDays.forEach((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayConsumption = consumptionLog.filter(log => {
                return format(new Date(log.timestamp), 'yyyy-MM-dd') === dayStr;
            });
            
            if (dayConsumption.length === 0) {
                currentStreakCount++;
                maxStreak = Math.max(maxStreak, currentStreakCount);
            } else {
                currentStreakCount = 0;
            }
        });
        
        return maxStreak;
    }, [consumptionLog, planStartDate]);

    // Calculate health improvements completed (20 total health metrics)
    const healthImprovementsCompleted = useMemo(() => {
        const completionThresholds = [
            0.014, 0.5, 0.5, 1, 2, 3, 7, 7, 14, 14, 14, 14, 30, 30, 30, 90, 90, 90, 90, 90, 365, 3650
        ];
        return completionThresholds.filter(days => daysSinceStart >= days).length;
    }, [daysSinceStart]);

    // Calculate badge stats
    const badgeStats = useMemo(() => {
        const savedAmount = parseFloat(moneySaved.replace('€', ''));
        return {
            daysSinceStart,
            daysWithinLimits,
            moneySaved: savedAmount,
            healthMilestonesUnlocked: healthImprovementsCompleted,
            perfectDays: daysWithinLimits,
            longestStreak: daysSinceStart,
        };
    }, [daysSinceStart, daysWithinLimits, moneySaved, healthImprovementsCompleted]);

    // Calculate unlocked badges count - comprehensive count of ALL possible badges
    const unlockedBadgesCount = useMemo(() => {
        let count = 0;
        
        // Time-based badges - Days (1-6, 50, 100, 150, 200)
        if (daysSinceStart >= 1) count++;
        if (daysSinceStart >= 2) count++;
        if (daysSinceStart >= 3) count++;
        if (daysSinceStart >= 4) count++;
        if (daysSinceStart >= 5) count++;
        if (daysSinceStart >= 6) count++;
        if (daysSinceStart >= 50) count++;
        if (daysSinceStart >= 100) count++;
        if (daysSinceStart >= 150) count++;
        if (daysSinceStart >= 200) count++;
        
        // Time-based badges - Weeks (1-4)
        if (daysSinceStart >= 7) count++;
        if (daysSinceStart >= 14) count++;
        if (daysSinceStart >= 21) count++;
        if (daysSinceStart >= 28) count++;
        
        // Time-based badges - Months (1-11)
        if (daysSinceStart >= 30) count++;
        if (daysSinceStart >= 60) count++;
        if (daysSinceStart >= 90) count++;
        if (daysSinceStart >= 120) count++;
        if (daysSinceStart >= 150) count++;
        if (daysSinceStart >= 180) count++;
        if (daysSinceStart >= 210) count++;
        if (daysSinceStart >= 240) count++;
        if (daysSinceStart >= 270) count++;
        if (daysSinceStart >= 300) count++;
        if (daysSinceStart >= 330) count++;
        
        // Time-based badges - Years
        if (daysSinceStart >= 365) count++;
        
        // Health improvement badges (22 total)
        if (daysSinceStart >= 0.014) count++; // Pulse Rate
        if (daysSinceStart >= 0.5) count += 2; // Oxygen & CO
        if (daysSinceStart >= 1) count++; // Heart Attack Risk
        if (daysSinceStart >= 2) count++; // Taste & Smell
        if (daysSinceStart >= 3) count++; // Bad Breath
        if (daysSinceStart >= 7) count += 2; // Sleep Quality & Tooth Staining
        if (daysSinceStart >= 14) count += 4; // Circulation, Gum Texture, Energy, Concentration
        if (daysSinceStart >= 30) count += 3; // Gums & Teeth, Immunity, Mood
        if (daysSinceStart >= 90) count += 5; // Breathing, Lung Function, Physical Fitness, Skin, Fertility
        if (daysSinceStart >= 365) count++; // Heart Disease Risk
        if (daysSinceStart >= 3650) count++; // Lung Cancer Risk
        
        // Money-based badges
        const savedAmount = parseFloat(moneySaved.replace('€', ''));
        if (savedAmount >= 50) count++;
        if (savedAmount >= 100) count++;
        if (savedAmount >= 250) count++;
        if (savedAmount >= 1000) count++;
        if (savedAmount >= 10000) count++;
        
        return count;
    }, [daysSinceStart, moneySaved]);

    const planProgress = useMemo(() => {
        if (!totalDuration || daysSinceStart < 0) return 0;
        return Math.min((daysSinceStart / totalDuration) * 100, 100);
    }, [totalDuration, daysSinceStart]);

    // Weekly consumption data - daily breakdown for current week
    const weeklyData = useMemo(() => {
        if (!consumptionLog || !appState.taperingSchedule) return [];
        
        const days = [];
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const start = startOfDay(new Date(planStartDate || new Date()));
        
        // Get each day of the current week
        for (let i = 0; i < 7; i++) {
            const day = add(weekStart, { days: i });
            const dayStr = format(day, 'yyyy-MM-dd');
            const daysSinceStartForDay = differenceInDays(day, start);
            
            const dayLogs = consumptionLog.filter(log =>
                format(new Date(log.timestamp), 'yyyy-MM-dd') === dayStr
            );
            
            // Calculate precise nicotine intake for the day
            const estimatedNicotine = calculateNicotineFromLogs(dayLogs);
            
            // Find the daily target for this day
            let dailyTarget = 0;
            let cumulativeDays = 0;
            for (const phase of appState.taperingSchedule) {
                if (daysSinceStartForDay < cumulativeDays + phase.durationDays) {
                    const dayInPhase = daysSinceStartForDay - cumulativeDays;
                    dailyTarget = phase.dailyTargetsMg?.[dayInPhase] ?? phase.nicotineGoalMg ?? 0;
                    break;
                }
                cumulativeDays += phase.durationDays;
            }
            
            const isWithinLimits = estimatedNicotine <= dailyTarget;
            
            days.push({
                day: format(day, 'EEE'),
                date: format(day, 'd'),
                count: dayLogs.length,
                nicotine: Math.round(estimatedNicotine),
                target: dailyTarget,
                isWithinLimits,
            });
        }
        
        return days;
    }, [consumptionLog, appState.taperingSchedule, appState.preferences, planStartDate]);

    // Monthly consumption data - daily breakdown for current month
    const monthlyData = useMemo(() => {
        if (!consumptionLog || !appState.taperingSchedule) return [];
        
        const days: Array<{
            day: string;
            date: string;
            count: number;
            nicotine: number;
            target: number;
            isWithinLimits: boolean;
        }> = [];
        const today = new Date();
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const start = startOfDay(new Date(planStartDate || new Date()));
        
        // Get each day of the current month
        const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
        
        monthDays.forEach((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const daysSinceStartForDay = differenceInDays(day, start);
            
            const dayLogs = consumptionLog.filter(log =>
                format(new Date(log.timestamp), 'yyyy-MM-dd') === dayStr
            );
            
            // Calculate precise nicotine intake for the day
            const estimatedNicotine = calculateNicotineFromLogs(dayLogs);
            
            // Find the daily target for this day
            let dailyTarget = 0;
            let cumulativeDays = 0;
            if (appState.taperingSchedule) {
                for (const phase of appState.taperingSchedule) {
                    if (daysSinceStartForDay < cumulativeDays + phase.durationDays) {
                        const dayInPhase = daysSinceStartForDay - cumulativeDays;
                        dailyTarget = phase.dailyTargetsMg?.[dayInPhase] ?? phase.nicotineGoalMg ?? 0;
                        break;
                    }
                    cumulativeDays += phase.durationDays;
                }
            }
            
            const isWithinLimits = estimatedNicotine <= dailyTarget;
            
            days.push({
                day: format(day, 'EEE'),
                date: format(day, 'd'),
                count: dayLogs.length,
                nicotine: Math.round(estimatedNicotine),
                target: dailyTarget,
                isWithinLimits,
            });
        });
        
        return days;
    }, [consumptionLog, appState.taperingSchedule, appState.preferences, planStartDate]);


    const achievements = [
        {
            label: 'Money Saved',
            value: moneySaved,
            iconName: 'wallet',
            gradient: ['#0e7490', '#0c5a6e']
        },
        {
            label: 'Life Time Gained',
            value: lifeTimeGained,
            iconName: 'heartbeat',
            gradient: ['#b91c1c', '#991b1b']
        },
    ];

    const AchievementCard = ({ label, value, iconName, gradient, onPress }: {
        label: string;
        value: string;
        iconName: any;
        gradient: string[];
        onPress?: () => void;
    }) => {
        const isDark = colorScheme === 'dark';
        return (
            <Pressable onPress={onPress} disabled={!onPress} style={{ width: '48%' }}>
                <Animated.View style={[
                    styles.card,
                    {
                        backgroundColor: isDark ? '#1C1F20' : '#FFFFFF',
                        transform: [{ scale: scaleAnim }],
                        width: '100%',
                    }
                ]}>
                    <View style={[styles.iconContainer, { backgroundColor: `${gradient[0]}20` }]}>
                        <FontAwesome5 name={iconName} size={24} color={gradient[0]} />
                    </View>
                    <ThemedText style={[styles.cardValue, { color: gradient[0] }]} numberOfLines={1}>{value}</ThemedText>
                    <ThemedText style={[styles.cardLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]} numberOfLines={2}>
                        {label}
                    </ThemedText>
                    {onPress && (
                        <View style={styles.cardTapHint}>
                            <MaterialCommunityIcons
                                name="chevron-right"
                                size={14}
                                color={gradient[0]}
                            />
                        </View>
                    )}
                </Animated.View>
            </Pressable>
        );
    };

    return (
        <ThemedView style={{flex: 1, backgroundColor: themeColors.background}}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section with Countdown */}
                <View style={[styles.heroSection, { backgroundColor: themeColors.background }]}>
                    {/* Countdown Cards Grid */}
                    <View style={styles.countdownGrid}>
                        <View style={[styles.countdownCard, {
                            backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF',
                            borderTopWidth: 3,
                            borderTopColor: '#0a7ea4'
                        }]}>
                            <ThemedText style={[styles.countdownCardValue, { color: '#0a7ea4' }]}>
                                {String(timeUntilPlanEnds.days).padStart(2, '0')}
                            </ThemedText>
                            <ThemedText style={styles.countdownCardLabel}>Days</ThemedText>
                        </View>
                        <View style={[styles.countdownCard, {
                            backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF',
                            borderTopWidth: 3,
                            borderTopColor: '#0a7ea4'
                        }]}>
                            <ThemedText style={[styles.countdownCardValue, { color: '#0a7ea4' }]}>
                                {String(timeUntilPlanEnds.hours).padStart(2, '0')}
                            </ThemedText>
                            <ThemedText style={styles.countdownCardLabel}>Hours</ThemedText>
                        </View>
                        <View style={[styles.countdownCard, {
                            backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF',
                            borderTopWidth: 3,
                            borderTopColor: '#0a7ea4'
                        }]}>
                            <ThemedText style={[styles.countdownCardValue, { color: '#0a7ea4' }]}>
                                {String(timeUntilPlanEnds.minutes).padStart(2, '0')}
                            </ThemedText>
                            <ThemedText style={styles.countdownCardLabel}>Mins</ThemedText>
                        </View>
                        <View style={[styles.countdownCard, {
                            backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF',
                            borderTopWidth: 3,
                            borderTopColor: '#0a7ea4'
                        }]}>
                            <ThemedText style={[styles.countdownCardValue, { color: '#0a7ea4' }]}>
                                {String(timeUntilPlanEnds.seconds).padStart(2, '0')}
                            </ThemedText>
                            <ThemedText style={styles.countdownCardLabel}>Secs</ThemedText>
                        </View>
                    </View>
                    
                    {/* Progress Card */}
                    <View style={[styles.progressCard, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}>
                        <View style={styles.progressCardHeader}>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={styles.progressCardTitle}>Overall Progress</ThemedText>
                                <ThemedText style={[styles.progressCardSubtitle, { opacity: 0.5 }]}>
                                    Day {daysSinceStart} of {totalDuration}
                                </ThemedText>
                            </View>
                            <View style={[styles.percentageCircle, {
                                borderColor: themeColors.tint,
                                backgroundColor: `${themeColors.tint}15`
                            }]}>
                                <ThemedText style={[styles.percentageText, { color: themeColors.tint }]}>
                                    {planProgress.toFixed(0)}%
                                </ThemedText>
                            </View>
                        </View>
                        <View style={styles.progressBarWrapper}>
                            <View style={[styles.progressTrack, { backgroundColor: colorScheme === 'dark' ? '#2C2F30' : '#F3F4F6' }]}>
                                <View style={[styles.progressFill, { width: `${planProgress}%`, backgroundColor: themeColors.tint }]} />
                            </View>
                        </View>
                        {planProgress >= 50 && (
                            <View style={styles.milestoneIndicator}>
                                <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                                <ThemedText style={[styles.milestoneText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                                    {planProgress >= 100 ? 'Goal Achieved! 🎉' : 'Halfway There! Keep Going! 💪'}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                </View>

                {/* Streaks Section - Pills Tabs */}
                <View style={[styles.streaksSection, { backgroundColor: themeColors.background }]}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="fire" size={24} color={themeColors.tint} />
                        <ThemedText style={styles.sectionTitle}>Streaks</ThemedText>
                    </View>
                    
                    {/* Pills Tabs */}
                    <View style={[styles.pillsTabsContainer, {
                        backgroundColor: colorScheme === 'dark' ? '#1C1F2015' : '#F3F4F6'
                    }]}>
                        <Pressable
                            style={[
                                styles.pillTab,
                                streakPage === 0 && styles.pillTabActive,
                                streakPage === 0 && { backgroundColor: themeColors.tint }
                            ]}
                            onPress={() => {
                                setStreakPage(0);
                                streakScrollRef.current?.scrollTo({ x: 0, animated: true });
                            }}
                        >
                            <MaterialCommunityIcons
                                name="fire"
                                size={18}
                                color={streakPage === 0 ? '#FFFFFF' : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280')}
                            />
                            <ThemedText style={[
                                styles.pillTabText,
                                { color: streakPage === 0 ? '#FFFFFF' : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280') }
                            ]}>
                                Reduction
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            style={[
                                styles.pillTab,
                                streakPage === 1 && styles.pillTabActive,
                                streakPage === 1 && { backgroundColor: themeColors.tint }
                            ]}
                            onPress={() => {
                                setStreakPage(1);
                                streakScrollRef.current?.scrollTo({ x: screenWidth, animated: true });
                            }}
                        >
                            <MaterialCommunityIcons
                                name="smoking-off"
                                size={18}
                                color={streakPage === 1 ? '#FFFFFF' : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280')}
                            />
                            <ThemedText style={[
                                styles.pillTabText,
                                { color: streakPage === 1 ? '#FFFFFF' : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280') }
                            ]}>
                                Smoke-Free
                            </ThemedText>
                        </Pressable>
                    </View>

                    {/* Tab Description */}
                    <ThemedText style={[styles.tabDescription, {
                        color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'
                    }]}>
                        {streakPage === 0
                            ? 'Days you stayed within your nicotine limit'
                            : 'Days with zero nicotine consumption'}
                    </ThemedText>

                    {/* Swipeable Streaks Content */}
                    <ScrollView
                        ref={streakScrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        scrollEventThrottle={16}
                        onMomentumScrollEnd={(event) => {
                            const offsetX = event.nativeEvent.contentOffset.x;
                            const page = Math.round(offsetX / screenWidth);
                            setStreakPage(page);
                        }}
                        style={styles.streakScrollView}
                    >
                        {/* Reduction Streaks Page */}
                        <View style={[styles.streakPage, { width: screenWidth }]}>
                            <View style={styles.streaksGrid}>
                                <View style={[styles.streakCard, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}>
                                    <View style={[styles.streakIconContainer, { backgroundColor: '#FF6B3520' }]}>
                                        <MaterialCommunityIcons name="fire" size={32} color="#FF6B35" />
                                    </View>
                                    <ThemedText style={[styles.streakValue, { color: '#FF6B35' }]}>
                                        {currentStreak}
                                    </ThemedText>
                                    <ThemedText style={styles.streakLabel}>
                                        {currentStreak === 1 ? 'Day' : 'Days'}
                                    </ThemedText>
                                    <ThemedText style={[styles.streakSubLabel, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                                        Current
                                    </ThemedText>
                                </View>
                                <View style={[styles.streakCard, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}>
                                    <View style={[styles.streakIconContainer, { backgroundColor: '#FFD70020' }]}>
                                        <MaterialCommunityIcons name="trophy" size={32} color="#FFD700" />
                                    </View>
                                    <ThemedText style={[styles.streakValue, { color: '#FFD700' }]}>
                                        {longestStreak}
                                    </ThemedText>
                                    <ThemedText style={styles.streakLabel}>
                                        {longestStreak === 1 ? 'Day' : 'Days'}
                                    </ThemedText>
                                    <ThemedText style={[styles.streakSubLabel, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                                        Best
                                    </ThemedText>
                                </View>
                            </View>
                        </View>

                        {/* Clean Days Streaks Page */}
                        <View style={[styles.streakPage, { width: screenWidth }]}>
                            <View style={styles.streaksGrid}>
                                <View style={[styles.streakCard, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}>
                                    <View style={[styles.streakIconContainer, { backgroundColor: '#8B5CF620' }]}>
                                        <MaterialCommunityIcons name="fire" size={32} color="#8B5CF6" />
                                    </View>
                                    <ThemedText style={[styles.streakValue, { color: '#8B5CF6' }]}>
                                        {currentSmokeFreeStreak}
                                    </ThemedText>
                                    <ThemedText style={styles.streakLabel}>
                                        {currentSmokeFreeStreak === 1 ? 'Day' : 'Days'}
                                    </ThemedText>
                                    <ThemedText style={[styles.streakSubLabel, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                                        Current
                                    </ThemedText>
                                </View>
                                <View style={[styles.streakCard, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}>
                                    <View style={[styles.streakIconContainer, { backgroundColor: '#FFD70020' }]}>
                                        <MaterialCommunityIcons name="trophy" size={32} color="#FFD700" />
                                    </View>
                                    <ThemedText style={[styles.streakValue, { color: '#FFD700' }]}>
                                        {longestSmokeFreeStreak}
                                    </ThemedText>
                                    <ThemedText style={styles.streakLabel}>
                                        {longestSmokeFreeStreak === 1 ? 'Day' : 'Days'}
                                    </ThemedText>
                                    <ThemedText style={[styles.streakSubLabel, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                                        Best
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Page Indicators */}
                    <View style={styles.pageIndicators}>
                        <View style={[
                            styles.pageIndicator,
                            {
                                backgroundColor: streakPage === 0 ? themeColors.tint : (colorScheme === 'dark' ? '#374151' : '#E5E7EB'),
                                width: streakPage === 0 ? 24 : 8,
                            }
                        ]} />
                        <View style={[
                            styles.pageIndicator,
                            {
                                backgroundColor: streakPage === 1 ? themeColors.tint : (colorScheme === 'dark' ? '#374151' : '#E5E7EB'),
                                width: streakPage === 1 ? 24 : 8,
                            }
                        ]} />
                    </View>
                </View>

                {/* Main Content */}
                <View style={[styles.contentContainer, { backgroundColor: themeColors.background }]}>
                    {/* Achievements Section */}
                    <View style={styles.achievementsContainer}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons
                                name="trophy-outline"
                                size={24}
                                color={themeColors.tint}
                            />
                            <ThemedText style={styles.sectionTitle}>Achievements</ThemedText>
                        </View>
                        <View style={styles.gridContainer}>
                            <AchievementCard
                                {...achievements[0]}
                            />
                            <AchievementCard
                                {...achievements[1]}
                            />
                        </View>

                        {/* Progress Summary Cards */}
                        <View style={styles.progressSummarySection}>
                            <Animated.View style={[
                                styles.card,
                                {
                                    backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF',
                                    borderRadius: 20,
                                    transform: [{ scale: scaleAnim }],
                                }
                            ]}>
                                <View style={[styles.iconContainer, { backgroundColor: '#06b6d420' }]}>
                                    <MaterialCommunityIcons name="check-circle" size={28} color="#06b6d4" />
                                </View>
                                <ThemedText style={[styles.cardValue, { color: '#06b6d4' }]}>
                                    {daysWithinLimits}
                                </ThemedText>
                                <ThemedText style={[styles.cardLabel, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                                    Days Within Plan
                                </ThemedText>
                            </Animated.View>

                            <Animated.View style={[
                                styles.card,
                                {
                                    backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF',
                                    borderRadius: 20,
                                    transform: [{ scale: scaleAnim }],
                                }
                            ]}>
                                <View style={[styles.iconContainer, { backgroundColor: '#d81b6020' }]}>
                                    <MaterialCommunityIcons name="smoking-off" size={28} color="#d81b60" />
                                </View>
                                <ThemedText style={[styles.cardValue, { color: '#d81b60' }]}>
                                    {smokeFreeDays}
                                </ThemedText>
                                <ThemedText style={[styles.cardLabel, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                                    Smoke-Free Days
                                </ThemedText>
                            </Animated.View>
                        </View>

                        {/* Quick Navigation Cards */}
                        <View style={styles.quickNavSection}>
                            <Pressable
                                style={[styles.quickNavCard, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}
                                onPress={() => setHealthModalVisible(true)}
                            >
                                <View style={[styles.quickNavIcon, { backgroundColor: '#3b82f620' }]}>
                                    <MaterialCommunityIcons name="hospital-box" size={28} color="#3b82f6" />
                                </View>
                                <View style={styles.quickNavContent}>
                                    <ThemedText style={styles.quickNavLabel}>Health Improvements</ThemedText>
                                    <ThemedText style={[styles.quickNavValue, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                                        {healthImprovementsCompleted} of 22 achieved
                                    </ThemedText>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                            </Pressable>

                            <Pressable
                                style={[styles.quickNavCard, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}
                                onPress={() => setBadgesModalVisible(true)}
                            >
                                <View style={[styles.quickNavIcon, { backgroundColor: '#FFD70020' }]}>
                                    <MaterialCommunityIcons name="trophy" size={28} color="#FFD700" />
                                </View>
                                <View style={styles.quickNavContent}>
                                    <ThemedText style={styles.quickNavLabel}>Trophies</ThemedText>
                                    <ThemedText style={[styles.quickNavValue, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                                        {unlockedBadgesCount} of {TOTAL_BADGES} badges earned
                                    </ThemedText>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                            </Pressable>
                        </View>
                    </View>

                    {/* Weekly/Monthly Progress Bars */}
                    <View style={styles.chartSection}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons
                                name="chart-timeline-variant"
                                size={24}
                                color={themeColors.tint}
                            />
                            <ThemedText style={styles.sectionTitle}>Consumption Overview</ThemedText>
                        </View>
                        <View style={[
                            styles.chartCard,
                            { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }
                        ]}>
                            {/* Toggle Pills */}
                            <View style={[styles.pillsTabsContainer, {
                                backgroundColor: colorScheme === 'dark' ? '#1C1F2015' : '#F3F4F6',
                                marginBottom: 16
                            }]}>
                                <Pressable
                                    style={[
                                        styles.pillTab,
                                        chartView === 'week' && styles.pillTabActive,
                                        chartView === 'week' && { backgroundColor: themeColors.tint }
                                    ]}
                                    onPress={() => setChartView('week')}
                                >
                                    <MaterialCommunityIcons
                                        name="calendar-week"
                                        size={18}
                                        color={chartView === 'week' ? '#FFFFFF' : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280')}
                                    />
                                    <ThemedText style={[
                                        styles.pillTabText,
                                        { color: chartView === 'week' ? '#FFFFFF' : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280') }
                                    ]}>
                                        Weekly
                                    </ThemedText>
                                </Pressable>
                                <Pressable
                                    style={[
                                        styles.pillTab,
                                        chartView === 'month' && styles.pillTabActive,
                                        chartView === 'month' && { backgroundColor: themeColors.tint }
                                    ]}
                                    onPress={() => setChartView('month')}
                                >
                                    <MaterialCommunityIcons
                                        name="calendar-month"
                                        size={18}
                                        color={chartView === 'month' ? '#FFFFFF' : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280')}
                                    />
                                    <ThemedText style={[
                                        styles.pillTabText,
                                        { color: chartView === 'month' ? '#FFFFFF' : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280') }
                                    ]}>
                                        Monthly
                                    </ThemedText>
                                </Pressable>
                            </View>
                            
                            {/* Chart Display */}
                            {chartView === 'week' ? (
                                <WeeklyBars data={weeklyData} colorScheme={colorScheme} />
                            ) : (
                                <MonthlyBars data={monthlyData} colorScheme={colorScheme} />
                            )}
                        </View>
                    </View>

                    {/* Phase Progress */}
                    {appState.taperingSchedule && appState.taperingSchedule.length > 0 && (
                        <View style={styles.chartSection}>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons
                                    name="routes"
                                    size={24}
                                    color={themeColors.tint}
                                />
                                <ThemedText style={styles.sectionTitle}>Tapering Journey</ThemedText>
                            </View>
                            <View style={[
                                styles.chartCard,
                                { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }
                            ]}>
                                <PhaseProgress
                                    phases={appState.taperingSchedule}
                                    currentDay={daysSinceStart}
                                    colorScheme={colorScheme}
                                />
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Modals */}
            <HealthImprovements
                visible={healthModalVisible}
                onClose={() => setHealthModalVisible(false)}
                daysSinceStart={daysSinceStart}
            />
            <AchievementBadges
                visible={badgesModalVisible}
                onClose={() => setBadgesModalVisible(false)}
                stats={badgeStats}
            />
        </ThemedView>
    );
}
// Weekly Bars Component - Daily nicotine consumption
const WeeklyBars = ({ data, colorScheme }: { data: any[], colorScheme: 'light' | 'dark' }) => {
    if (data.length === 0) return <ThemedText style={{ textAlign: 'center', padding: 20 }}>No data yet</ThemedText>;
    
    const maxValue = Math.max(...data.map(d => d.nicotine), 5);
    const padding = 30;
    const availableWidth = chartWidth - (padding * 2);
    const barSpacing = 10;
    const totalSpacing = barSpacing * (data.length - 1);
    const barWidth = (availableWidth - totalSpacing) / data.length;
    const graphHeight = 200;
    
    return (
        <View style={{ alignItems: 'center' }}>
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 12 }}>
                    Daily Nicotine Intake (mg)
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#10b981' }} />
                        <ThemedText style={{ fontSize: 11, opacity: 0.7 }}>Within Limits</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#ef4444' }} />
                        <ThemedText style={{ fontSize: 11, opacity: 0.7 }}>Over Limits</ThemedText>
                    </View>
                </View>
            </View>
            <View style={{ alignItems: 'center' }}>
                <Svg width={chartWidth} height={270}>
                    {data.map((day, index) => {
                        const height = Math.max((day.nicotine / maxValue) * graphHeight, 8);
                        const x = padding + index * (barWidth + barSpacing);
                        const y = graphHeight - height + 20;
                        const barColor = day.isWithinLimits ? '#10b981' : '#ef4444';
                        
                        return (
                            <G key={index}>
                                {/* Consumption bar */}
                                <Rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={height}
                                    rx="6"
                                    fill={barColor}
                                    opacity="0.85"
                                />
                                {/* Nicotine value */}
                                <SvgText
                                    x={x + barWidth / 2}
                                    y={y - 10}
                                    fontSize="11"
                                    fill={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                                    textAnchor="middle"
                                    fontWeight="bold"
                                >
                                    {day.nicotine}
                                </SvgText>
                                {/* Day name */}
                                <SvgText
                                    x={x + barWidth / 2}
                                    y={graphHeight + 40}
                                    fontSize="11"
                                    fill={colorScheme === 'dark' ? '#E5E7EB' : '#1F2937'}
                                    textAnchor="middle"
                                    fontWeight="600"
                                >
                                    {day.day}
                                </SvgText>
                                {/* Date */}
                                <SvgText
                                    x={x + barWidth / 2}
                                    y={graphHeight + 50}
                                    fontSize="10"
                                    fill={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                                    textAnchor="middle"
                                >
                                    {day.date}
                                </SvgText>
                            </G>
                        );
                    })}
                </Svg>
            </View>
        </View>
    );
};

// Monthly Bars Component - Daily nicotine consumption for current month
const MonthlyBars = ({ data, colorScheme }: { data: any[], colorScheme: 'light' | 'dark' }) => {
    const scrollRef = useRef<ScrollView>(null);
    
    if (data.length === 0) return <ThemedText style={{ textAlign: 'center', padding: 20 }}>No data yet</ThemedText>;
    
    const maxValue = Math.max(...data.map(d => d.nicotine), 5);
    const padding = 20;
    const barSpacing = 4;
    const barWidth = Math.max(8, Math.min(20, (chartWidth - padding * 2) / data.length));
    const graphHeight = 200;
    
    // Find today's index and auto-scroll to it
    const todayDate = format(new Date(), 'd');
    const todayIndex = data.findIndex(d => d.date === todayDate);
    
    useEffect(() => {
        if (scrollRef.current && todayIndex !== -1) {
            // Calculate scroll position to center today's bar
            const scrollX = Math.max(0, (todayIndex * (barWidth + barSpacing)) - (chartWidth / 3));
            setTimeout(() => {
                scrollRef.current?.scrollTo({ x: scrollX, animated: true });
            }, 300);
        }
    }, [todayIndex, barWidth, barSpacing]);
    
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
                    Daily Nicotine Intake - {format(new Date(), 'MMMM yyyy')}
                </ThemedText>
                <ThemedText style={{ fontSize: 11, opacity: 0.6, marginBottom: 12, fontWeight: '500' }}>
                    {todayIndex !== -1 ? `Today: Day ${todayDate} • ` : ''}Swipe to see all {data.length} days
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#10b981' }} />
                        <ThemedText style={{ fontSize: 11, opacity: 0.7 }}>Within Limits</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#ef4444' }} />
                        <ThemedText style={{ fontSize: 11, opacity: 0.7 }}>Over Limits</ThemedText>
                    </View>
                </View>
            </View>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={{ paddingHorizontal: padding }}
            >
                <Svg width={data.length * (barWidth + barSpacing) + padding * 2} height={270}>
                    {data.map((day, index) => {
                        const height = Math.max((day.nicotine / maxValue) * graphHeight, 8);
                        const x = index * (barWidth + barSpacing) + padding;
                        const y = graphHeight - height + 20;
                        const barColor = day.isWithinLimits ? '#10b981' : '#ef4444';
                        const isToday = format(new Date(), 'd') === day.date;
                        
                        return (
                            <G key={index}>
                                {/* Consumption bar */}
                                <Rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={height}
                                    rx="4"
                                    fill={barColor}
                                    opacity={isToday ? '1' : '0.9'}
                                    stroke={isToday ? barColor : 'none'}
                                    strokeWidth={isToday ? '2' : '0'}
                                />
                                {/* Nicotine value - only show for today or if bar is tall enough */}
                                {(isToday || height > 30) && barWidth > 12 && (
                                    <SvgText
                                        x={x + barWidth / 2}
                                        y={y - 6}
                                        fontSize="9"
                                        fill={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                                        textAnchor="middle"
                                        fontWeight="bold"
                                    >
                                        {day.nicotine}
                                    </SvgText>
                                )}
                                {/* Date - show every 3rd day or today */}
                                {(index % 3 === 0 || isToday) && (
                                    <SvgText
                                        x={x + barWidth / 2}
                                        y={graphHeight + 40}
                                        fontSize="10"
                                        fill={isToday ? (colorScheme === 'dark' ? '#FFFFFF' : '#000000') : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280')}
                                        textAnchor="middle"
                                        fontWeight={isToday ? 'bold' : 'normal'}
                                    >
                                        {day.date}
                                    </SvgText>
                                )}
                            </G>
                        );
                    })}
                </Svg>
            </ScrollView>
        </View>
    );
};

// Phase Progress Component
const PhaseProgress = ({ phases, currentDay, colorScheme }: {
    phases: any[],
    currentDay: number,
    colorScheme: 'light' | 'dark'
}) => {
    let cumulativeDays = 0;
    let currentPhaseIndex = 0;
    
    phases.forEach((phase, index) => {
        if (currentDay >= cumulativeDays && currentDay < cumulativeDays + phase.durationDays) {
            currentPhaseIndex = index;
        }
        cumulativeDays += phase.durationDays;
    });
    
    return (
        <View style={{ paddingVertical: 20 }}>
            {phases.map((phase, index) => {
                let tempCumulativeDays = 0;
                for (let i = 0; i < index; i++) {
                    tempCumulativeDays += phases[i].durationDays;
                }
                
                const isCompleted = currentDay >= tempCumulativeDays + phase.durationDays;
                const isCurrent = index === currentPhaseIndex;
                const progressInPhase = isCurrent ? ((currentDay - tempCumulativeDays) / phase.durationDays) * 100 : 0;
                
                return (
                    <View key={index} style={[
                        styles.phaseCard,
                        {
                            backgroundColor: isCurrent
                                ? colorScheme === 'dark' ? '#1C1F20' : '#F0F9FF'
                                : 'transparent',
                            borderLeftWidth: isCurrent ? 4 : 0,
                            borderLeftColor: isCurrent ? Colors[colorScheme].tint : 'transparent'
                        }
                    ]}>
                        <View style={styles.phaseRow}>
                            <View style={styles.phaseIndicator}>
                                <View style={[
                                    styles.phaseCircle,
                                    {
                                        backgroundColor: isCompleted
                                            ? '#10b981'
                                            : isCurrent
                                                ? Colors[colorScheme].tint
                                                : colorScheme === 'dark' ? '#374151' : '#E5E7EB',
                                        borderWidth: isCurrent ? 3 : 0,
                                        borderColor: isCurrent ? `${Colors[colorScheme].tint}40` : 'transparent'
                                    }
                                ]}>
                                    {isCompleted && (
                                        <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                                    )}
                                    {isCurrent && (
                                        <MaterialCommunityIcons name="lightning-bolt" size={18} color="#FFFFFF" />
                                    )}
                                </View>
                                {index < phases.length - 1 && (
                                    <View style={[
                                        styles.phaseLine,
                                        {
                                            backgroundColor: index < currentPhaseIndex
                                                ? '#10b981'
                                                : colorScheme === 'dark' ? '#374151' : '#E5E7EB'
                                        }
                                    ]} />
                                )}
                            </View>
                            <View style={styles.phaseInfo}>
                                <View style={styles.phaseHeader}>
                                    <ThemedText style={[
                                        styles.phaseName,
                                        {
                                            fontWeight: isCurrent ? 'bold' : '600',
                                            fontSize: isCurrent ? 16 : 15
                                        }
                                    ]}>
                                        Phase {phase.phase}: {phase.phaseName}
                                    </ThemedText>
                                    {isCompleted && (
                                        <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                                    )}
                                </View>
                                <ThemedText style={[
                                    styles.phaseDetail,
                                    { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                                ]}>
                                    {phase.durationDays} days • Target: {phase.nicotineGoalMg}mg nicotine
                                </ThemedText>
                                {isCurrent && (
                                    <View style={styles.phaseProgressContainer}>
                                        <View style={styles.phaseProgressInfo}>
                                            <ThemedText style={[styles.progressLabel, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                                                Progress
                                            </ThemedText>
                                            <ThemedText style={[styles.progressPercent, { color: Colors[colorScheme].tint }]}>
                                                {Math.round(progressInPhase)}%
                                            </ThemedText>
                                        </View>
                                        <View style={styles.phaseProgressBar}>
                                            <View style={[
                                                styles.phaseProgressFill,
                                                {
                                                    width: `${progressInPhase}%`,
                                                    backgroundColor: Colors[colorScheme].tint
                                                }
                                            ]} />
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    heroSection: {
        padding: 24,
        paddingTop: 32,
        paddingBottom: 12,
    },
    countdownGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    countdownCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        minHeight: 90,
    },
    countdownCardValue: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    countdownCardLabel: {
        fontSize: 11,
        opacity: 0.7,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressCard: {
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    progressCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    progressCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    progressCardSubtitle: {
        fontSize: 13,
    },
    percentageCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentageText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    progressBarWrapper: {
        width: '100%',
    },
    progressTrack: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    milestoneIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    milestoneText: {
        fontSize: 13,
        fontWeight: '600',
    },
    contentContainer: {
        padding: 24,
        paddingTop: 12,
    },
    achievementsContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 12,
    },
    sectionSubtitle: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    card: {
        padding: 16,
        borderRadius: 20,
        marginBottom: 6,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        width: '48%',
        height: 155,
        justifyContent: 'center',
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 0.3,
        textAlign: 'center',
        width: '100%',
    },
    cardLabel: {
        fontSize: 11,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 14,
        width: '100%',
        paddingHorizontal: 4,
    },
    chartSection: {
        marginBottom: 24,
    },
    chartCard: {
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    chartSubtitle: {
        fontSize: 12,
        opacity: 0.7,
        marginBottom: 5,
        textAlign: 'center',
    },
    heatmapLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        gap: 8,
        flexWrap: 'wrap',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendText: {
        fontSize: 10,
        opacity: 0.7,
    },
    legendBoxes: {
        flexDirection: 'row',
        gap: 4,
    },
    legendBox: {
        width: 14,
        height: 14,
        borderRadius: 3,
    },
    phaseCard: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
        borderRadius: 12,
    },
    phaseRow: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    phaseIndicator: {
        width: 40,
        alignItems: 'center',
        marginRight: 16,
    },
    phaseCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    phaseLine: {
        width: 2,
        flex: 1,
        marginTop: 4,
    },
    phaseInfo: {
        flex: 1,
        paddingBottom: 0,
    },
    phaseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    phaseName: {
        fontSize: 15,
        marginBottom: 0,
        flex: 1,
    },
    phaseDetail: {
        fontSize: 12,
        marginBottom: 12,
    },
    phaseProgressContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    phaseProgressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 11,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    phaseProgressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 0,
    },
    phaseProgressFill: {
        height: '100%',
        borderRadius: 4,
    },
    quickNavSection: {
        gap: 12,
        marginTop: 8,
    },
    quickNavCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    quickNavIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    quickNavContent: {
        flex: 1,
    },
    quickNavLabel: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    quickNavValue: {
        fontSize: 12,
        fontWeight: '500',
    },
    streaksSection: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 12,
    },
    streaksGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    streakCard: {
        flex: 1,
        padding: 20,
        paddingBottom: 24,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    streakIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    streakValue: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    streakLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    streakSubLabel: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    totalDaysCard: {
        // Styles are inline in JSX for better control
    },
    totalDaysIconContainer: {
        // Styles are inline in JSX for better control
    },
    totalDaysValue: {
        // Styles are inline in JSX for better control
    },
    totalDaysLabel: {
        // Styles are inline in JSX for better control
    },
    pillsTabsContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
    },
    pillTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        gap: 6,
    },
    pillTabActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    pillTabText: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    tabDescription: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '500',
        opacity: 0.8,
    },
    progressSummarySection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 8,
    },
    streakScrollView: {
        marginHorizontal: -24,
    },
    streakPage: {
        paddingHorizontal: 24,
        paddingBottom: 8,
    },
    pageIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    pageIndicator: {
        height: 8,
        borderRadius: 4,
    },
    cardTapHint: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
