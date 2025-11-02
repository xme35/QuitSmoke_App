
import React, { useMemo, useState, useEffect } from 'react';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, useColorScheme, View, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useAppContext, TaperingPhase } from '../../context/AppContext';
import { Colors } from '../../constants/theme';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { differenceInDays, add, format, eachDayOfInterval, startOfDay, subDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import Svg, { Line, G, Circle, Text as SvgText, Rect, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { calculateLifeTimeGained, formatLifeTimeGained } from '../../helpers/calculate-lifetime-gained';
import { ProgressBar } from '../../components/progressBar';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 48;
const chartHeight = 200;

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

    const moneySaved = useMemo(() => {
        if (!estimatedSavings || !totalDuration || daysSinceStart < 0) return '€0';
        const dailySavings = estimatedSavings / totalDuration;
        const savedSoFar = dailySavings * daysSinceStart;
        return `€${savedSoFar.toFixed(2)}`;
    }, [estimatedSavings, totalDuration, daysSinceStart]);

    const lifeTimeGained = useMemo(() => {
        const smokingYears = appState.smokingHistory ? parseInt(appState.smokingHistory.split(' ')[0]) : 0;
        const years = calculateLifeTimeGained(appState.age, smokingYears, appState.initialIntake);
        return formatLifeTimeGained(years);
    }, [appState.age, appState.smokingHistory, appState.initialIntake]);

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
            
            // Estimate nicotine intake for the day based on event count and calibrated baseline
            const estimatedNicotine = dayConsumption.length * nicotinePerEvent;
            
            if (estimatedNicotine <= dailyTarget) {
                withinLimitsCount++;
            }
        });
        
        return withinLimitsCount;
    }, [consumptionLog, planStartDate, appState.taperingSchedule, nicotinePerEvent]);

    const planProgress = useMemo(() => {
        if (!totalDuration || daysSinceStart < 0) return 0;
        return Math.min((daysSinceStart / totalDuration) * 100, 100);
    }, [totalDuration, daysSinceStart]);

    // Weekly consumption data
    const weeklyData = useMemo(() => {
        if (!consumptionLog || !planStartDate) return [];
        
        const weeks = [];
        const today = new Date();
        const start = new Date(planStartDate);
        
        // Get last 4 weeks
        for (let i = 3; i >= 0; i--) {
            const weekStart = startOfWeek(subDays(today, i * 7), { weekStartsOn: 1 });
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            
            const weekLogs = consumptionLog.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate >= weekStart && logDate <= weekEnd;
            });
            
            weeks.push({
                week: format(weekStart, 'MMM d'),
                count: weekLogs.length,
                weekStart,
            });
        }
        
        return weeks;
    }, [consumptionLog, planStartDate]);

    // Daily consumption trend data (last 30 days)
    const trendData = useMemo(() => {
        if (!consumptionLog || !planStartDate || !appState.taperingSchedule) return [];
        
        const days = [];
        const today = new Date();
        const daysToShow = 30;
        const eventsNicotineValue = nicotinePerEvent > 0 ? nicotinePerEvent : 1;
        
        for (let i = daysToShow - 1; i >= 0; i--) {
            const day = subDays(today, i);
            const dayStr = format(day, 'yyyy-MM-dd');
            const daysSinceStartVal = differenceInDays(day, new Date(planStartDate));
            
            // Find target for this day
            let targetMg = 0;
            let cumulativeDays = 0;
            for (const phase of appState.taperingSchedule) {
                if (daysSinceStartVal < cumulativeDays + phase.durationDays) {
                    const dayInPhase = daysSinceStartVal - cumulativeDays;
                    targetMg =
                        phase.dailyTargetsMg?.[dayInPhase] ?? phase.nicotineGoalMg ?? 0;
                    break;
                }
                cumulativeDays += phase.durationDays;
            }
            
            const dayLogs = consumptionLog.filter(log =>
                format(new Date(log.timestamp), 'yyyy-MM-dd') === dayStr
            );
            
            const rawTargetEvents = Math.round(targetMg / eventsNicotineValue);
            const targetEvents =
                rawTargetEvents <= 0 && targetMg > 0 ? 1 : Math.max(0, rawTargetEvents);
            
            days.push({
                date: day,
                actual: dayLogs.length,
                target: targetEvents,
                dateStr: format(day, 'MMM d'),
            });
        }
        
        return days;
    }, [consumptionLog, planStartDate, appState.taperingSchedule, nicotinePerEvent]);

    // Calendar heatmap data (last 28 days)
    const calendarData = useMemo(() => {
        if (!consumptionLog || !planStartDate) return [];
        
        const days = [];
        const today = new Date();
        
        for (let i = 27; i >= 0; i--) {
            const day = subDays(today, i);
            const dayStr = format(day, 'yyyy-MM-dd');
            
            const dayLogs = consumptionLog.filter(log =>
                format(new Date(log.timestamp), 'yyyy-MM-dd') === dayStr
            );
            
            // Calculate intensity (0-4)
            const count = dayLogs.length;
            let intensity = 0;
            if (count === 0) intensity = 4; // Perfect day
            else if (count <= 3) intensity = 3; // Good
            else if (count <= 5) intensity = 2; // Okay
            else if (count <= 8) intensity = 1; // Struggling
            
            days.push({
                date: day,
                intensity,
                count,
            });
        }
        
        return days;
    }, [consumptionLog, planStartDate]);

    // Health milestones
    const healthMilestones = useMemo(() => {
        const hours = daysSinceStart * 24;
        
        return [
            { time: '20 minutes', achieved: hours >= 0.33, icon: 'heartbeat', label: 'Heart rate normalizes' },
            { time: '12 hours', achieved: hours >= 12, icon: 'lungs', label: 'CO levels drop' },
            { time: '2 weeks', achieved: daysSinceStart >= 14, icon: 'running', label: 'Circulation improves' },
            { time: '1 month', achieved: daysSinceStart >= 30, icon: 'shield-alt', label: 'Immune system boost' },
            { time: '3 months', achieved: daysSinceStart >= 90, icon: 'star', label: 'Major health gains' },
        ];
    }, [daysSinceStart]);

    const achievements = [
        {
            label: 'Money Saved',
            value: moneySaved,
            iconName: 'wallet',
            gradient: ['#10b981', '#059669']
        },
        {
            label: 'Life Time Gained',
            value: lifeTimeGained,
            iconName: 'heartbeat',
            gradient: ['#ef4444', '#dc2626']
        },
        {
            label: 'Smoke-Free Days',
            value: String(daysSinceStart),
            iconName: 'calendar-check',
            gradient: ['#3b82f6', '#2563eb']
        },
        {
            label: 'Days Within Limits',
            value: String(daysWithinLimits),
            iconName: 'check-circle',
            gradient: ['#8b5cf6', '#7c3aed']
        },
    ];

    const AchievementCard = ({ label, value, iconName, gradient }: {
        label: string;
        value: string;
        iconName: any;
        gradient: string[];
    }) => {
        const isDark = colorScheme === 'dark';
        return (
            <View style={[
                styles.card,
                {
                    backgroundColor: isDark ? '#1C1F20' : '#FFFFFF',
                    borderLeftWidth: 4,
                    borderLeftColor: gradient[0]
                }
            ]}>
                <View style={[styles.iconContainer, { backgroundColor: `${gradient[0]}15` }]}>
                    <FontAwesome5 name={iconName} size={28} color={gradient[0]} />
                </View>
                <ThemedText style={styles.cardValue}>{value}</ThemedText>
                <ThemedText style={[styles.cardLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    {label}
                </ThemedText>
            </View>
        );
    };

    return (
        <ThemedView style={{flex: 1}}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section with Countdown */}
                <View style={styles.heroSection}>
                    <View style={styles.headerContainer}>
                        <MaterialCommunityIcons name="trophy-variant" size={28} color={themeColors.tint} />
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.freedomTitle}>Your Journey to Freedom</ThemedText>
                        </View>
                    </View>
                    
                    {/* Countdown Cards Grid */}
                    <View style={styles.countdownGrid}>
                        <View style={[styles.countdownCard, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}>
                            <ThemedText style={[styles.countdownCardValue, { color: themeColors.tint }]}>
                                {String(timeUntilPlanEnds.days).padStart(2, '0')}
                            </ThemedText>
                            <ThemedText style={styles.countdownCardLabel}>Days</ThemedText>
                        </View>
                        <View style={[styles.countdownCard, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}>
                            <ThemedText style={[styles.countdownCardValue, { color: themeColors.tint }]}>
                                {String(timeUntilPlanEnds.hours).padStart(2, '0')}
                            </ThemedText>
                            <ThemedText style={styles.countdownCardLabel}>Hours</ThemedText>
                        </View>
                        <View style={[styles.countdownCard, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}>
                            <ThemedText style={[styles.countdownCardValue, { color: themeColors.tint }]}>
                                {String(timeUntilPlanEnds.minutes).padStart(2, '0')}
                            </ThemedText>
                            <ThemedText style={styles.countdownCardLabel}>Mins</ThemedText>
                        </View>
                        <View style={[styles.countdownCard, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}>
                            <ThemedText style={[styles.countdownCardValue, { color: themeColors.tint }]}>
                                {String(timeUntilPlanEnds.seconds).padStart(2, '0')}
                            </ThemedText>
                            <ThemedText style={styles.countdownCardLabel}>Secs</ThemedText>
                        </View>
                    </View>
                    
                    {/* Progress Card */}
                    <View style={[styles.progressCard, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }]}>
                        <View style={styles.progressCardHeader}>
                            <View>
                                <ThemedText style={styles.progressCardTitle}>Overall Progress</ThemedText>
                                <ThemedText style={[styles.progressCardSubtitle, { opacity: 0.5 }]}>
                                    Day {daysSinceStart} of {totalDuration}
                                </ThemedText>
                            </View>
                            <View style={[styles.percentageCircle, { borderColor: themeColors.tint }]}>
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
                    </View>
                </View>

                {/* Main Content */}
                <View style={styles.contentContainer}>
                    {/* Achievements Section */}
                    <View style={styles.achievementsContainer}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons
                                name="trophy-outline"
                                size={24}
                                color={themeColors.tint}
                            />
                            <ThemedText style={styles.sectionTitle}>Your Achievements</ThemedText>
                        </View>
                        <View style={styles.gridContainer}>
                            {achievements.map((item, index) => (
                                <AchievementCard key={index} {...item} />
                            ))}
                        </View>
                    </View>

                    {/* Motivational Message */}
                    <View style={[
                        styles.motivationCard,
                        { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }
                    ]}>
                        <MaterialCommunityIcons
                            name="lightbulb-on-outline"
                            size={24}
                            color={themeColors.tint}
                            style={{ marginBottom: 8 }}
                        />
                        <ThemedText style={styles.motivationTitle}>Keep Going!</ThemedText>
                        <ThemedText style={[styles.motivationText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                            Every day you're getting stronger and healthier. You're doing amazing!
                        </ThemedText>
                    </View>

                    {/* Calendar Heatmap */}
                    <View style={styles.chartSection}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons
                                name="calendar-month"
                                size={24}
                                color={themeColors.tint}
                            />
                            <ThemedText style={styles.sectionTitle}>Daily Performance</ThemedText>
                        </View>
                        <View style={[
                            styles.chartCard,
                            { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }
                        ]}>
                            <ThemedText style={styles.chartSubtitle}>Last 4 Weeks</ThemedText>
                            <CalendarHeatmap data={calendarData} colorScheme={colorScheme} />
                            <View style={styles.heatmapLegend}>
                                <ThemedText style={styles.legendText}>Less</ThemedText>
                                <View style={styles.legendBoxes}>
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.legendBox,
                                                { backgroundColor: getHeatmapColor(i, colorScheme) }
                                            ]}
                                        />
                                    ))}
                                </View>
                                <ThemedText style={styles.legendText}>More</ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Weekly Progress Bars */}
                    <View style={styles.chartSection}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons
                                name="chart-bar"
                                size={24}
                                color={themeColors.tint}
                            />
                            <ThemedText style={styles.sectionTitle}>Weekly Overview</ThemedText>
                        </View>
                        <View style={[
                            styles.chartCard,
                            { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }
                        ]}>
                            <WeeklyBars data={weeklyData} colorScheme={colorScheme} />
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
        </ThemedView>
    );
}
// Helper function for heatmap colors
const getHeatmapColor = (intensity: number, colorScheme: 'light' | 'dark') => {
    const colors = {
        light: ['#ebedf0', '#fecaca', '#fdba74', '#86efac', '#4ade80'],
        dark: ['#1e293b', '#7f1d1d', '#7c2d12', '#166534', '#15803d'],
    };
    return colors[colorScheme][intensity] || colors[colorScheme][0];
};

// Consumption Trend Chart Component
const ConsumptionTrendChart = ({ data, colorScheme }: { data: any[], colorScheme: 'light' | 'dark' }) => {
    if (data.length === 0) return <ThemedText style={{ textAlign: 'center', padding: 20 }}>No data yet</ThemedText>;
    
    const maxValue = Math.max(...data.map(d => Math.max(d.actual, d.target)), 10);
    const padding = 40;
    const graphWidth = chartWidth - padding * 2;
    const graphHeight = chartHeight - padding * 2;
    const pointSpacing = graphWidth / (data.length - 1 || 1);
    
    const getY = (value: number) => {
        return graphHeight - (value / maxValue) * graphHeight + padding;
    };
    
    const actualPath = data.map((d, i) => {
        const x = padding + i * pointSpacing;
        const y = getY(d.actual);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    const targetPath = data.map((d, i) => {
        const x = padding + i * pointSpacing;
        const y = getY(d.target);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    return (
        <Svg width={chartWidth} height={chartHeight}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((factor, i) => (
                <G key={i}>
                    <Line
                        x1={padding}
                        y1={padding + graphHeight * factor}
                        x2={chartWidth - padding}
                        y2={padding + graphHeight * factor}
                        stroke={colorScheme === 'dark' ? '#374151' : '#E5E7EB'}
                        strokeWidth="1"
                        strokeDasharray="4,4"
                    />
                </G>
            ))}
            
            {/* Target line */}
            <Path
                d={targetPath}
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
                fill="none"
            />
            
            {/* Actual line */}
            <Path
                d={actualPath}
                stroke="#10b981"
                strokeWidth="3"
                fill="none"
            />
            
            {/* Data points */}
            {data.map((d, i) => (
                <Circle
                    key={i}
                    cx={padding + i * pointSpacing}
                    cy={getY(d.actual)}
                    r="4"
                    fill="#10b981"
                />
            ))}
            
            {/* Labels */}
            <SvgText
                x={padding}
                y={chartHeight - 10}
                fontSize="10"
                fill={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
            >
                {data[0]?.dateStr || ''}
            </SvgText>
            <SvgText
                x={chartWidth - padding - 40}
                y={chartHeight - 10}
                fontSize="10"
                fill={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
            >
                {data[data.length - 1]?.dateStr || ''}
            </SvgText>
        </Svg>
    );
};

// Calendar Heatmap Component
const CalendarHeatmap = ({ data, colorScheme }: { data: any[], colorScheme: 'light' | 'dark' }) => {
    const cellSize = (chartWidth - 60) / 7;
    const rows = 4;
    
    return (
        <View style={{ paddingVertical: 20 }}>
            <Svg width={chartWidth} height={cellSize * rows + 40}>
                {data.map((day, index) => {
                    const row = Math.floor(index / 7);
                    const col = index % 7;
                    const x = 30 + col * cellSize;
                    const y = 20 + row * cellSize;
                    
                    return (
                        <Rect
                            key={index}
                            x={x}
                            y={y}
                            width={cellSize - 4}
                            height={cellSize - 4}
                            rx="4"
                            fill={getHeatmapColor(day.intensity, colorScheme)}
                        />
                    );
                })}
                
                {/* Day labels */}
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <SvgText
                        key={i}
                        x={30 + i * cellSize + cellSize / 2}
                        y={15}
                        fontSize="10"
                        fill={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                        textAnchor="middle"
                    >
                        {day}
                    </SvgText>
                ))}
            </Svg>
        </View>
    );
};

// Weekly Bars Component
const WeeklyBars = ({ data, colorScheme }: { data: any[], colorScheme: 'light' | 'dark' }) => {
    if (data.length === 0) return <ThemedText style={{ textAlign: 'center', padding: 20 }}>No data yet</ThemedText>;
    
    const maxValue = Math.max(...data.map(d => d.count), 10);
    const padding = 40;
    const availableWidth = chartWidth - (padding * 2);
    const barSpacing = 16;
    const totalSpacing = barSpacing * (data.length - 1);
    const barWidth = (availableWidth - totalSpacing) / data.length;
    const graphHeight = 150;
    
    return (
        <View style={{ paddingVertical: 20 }}>
            <Svg width={chartWidth} height={graphHeight + 60}>
                {data.map((week, index) => {
                    const height = Math.max((week.count / maxValue) * graphHeight, 2);
                    const x = padding + index * (barWidth + barSpacing);
                    const y = graphHeight - height + 20;
                    
                    return (
                        <G key={index}>
                            <Rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={height}
                                rx="8"
                                fill={Colors[colorScheme].tint}
                                opacity="0.8"
                            />
                            <SvgText
                                x={x + barWidth / 2}
                                y={y - 8}
                                fontSize="12"
                                fill={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                                textAnchor="middle"
                                fontWeight="bold"
                            >
                                {week.count}
                            </SvgText>
                            <SvgText
                                x={x + barWidth / 2}
                                y={graphHeight + 40}
                                fontSize="10"
                                fill={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                                textAnchor="middle"
                            >
                                {week.week}
                            </SvgText>
                        </G>
                    );
                })}
            </Svg>
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
                const isUpcoming = index > currentPhaseIndex;
                
                const progressInPhase = isCurrent ? ((currentDay - tempCumulativeDays) / phase.durationDays) * 100 : 0;
                
                return (
                    <View key={index} style={styles.phaseRow}>
                        <View style={styles.phaseIndicator}>
                            <View style={[
                                styles.phaseCircle,
                                {
                                    backgroundColor: isCompleted 
                                        ? '#10b981' 
                                        : isCurrent 
                                            ? Colors[colorScheme].tint 
                                            : colorScheme === 'dark' ? '#374151' : '#E5E7EB'
                                }
                            ]}>
                                {isCompleted && (
                                    <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                                )}
                                {isCurrent && (
                                    <MaterialCommunityIcons name="clock-outline" size={16} color="#FFFFFF" />
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
                            <ThemedText style={[
                                styles.phaseName,
                                { fontWeight: isCurrent ? 'bold' : '600' }
                            ]}>
                                Phase {phase.phase}: {phase.phaseName}
                            </ThemedText>
                            <ThemedText style={[
                                styles.phaseDetail,
                                { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
                            ]}>
                                {phase.durationDays} days • Target: {phase.nicotineGoalMg}mg nicotine
                            </ThemedText>
                            {isCurrent && (
                                <View style={styles.phaseProgressBar}>
                                    <View style={[
                                        styles.phaseProgressFill,
                                        { 
                                            width: `${progressInPhase}%`,
                                            backgroundColor: Colors[colorScheme].tint
                                        }
                                    ]} />
                                </View>
                            )}
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
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    },
    freedomTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    freedomSubtitle: {
        fontSize: 14,
        marginTop: 4,
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
    contentContainer: {
        padding: 24,
        paddingTop: 12,
    },
    achievementsContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    card: {
        padding: 18,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        width: '48%',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    cardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    cardLabel: {
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '500',
    },
    motivationCard: {
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 24,
    },
    motivationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    motivationText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
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
        marginBottom: 10,
        textAlign: 'center',
    },
    heatmapLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        gap: 8,
    },
    legendText: {
        fontSize: 11,
        opacity: 0.7,
    },
    legendBoxes: {
        flexDirection: 'row',
        gap: 4,
    },
    legendBox: {
        width: 16,
        height: 16,
        borderRadius: 4,
    },
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB10',
    },
    milestoneIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    milestoneContent: {
        flex: 1,
    },
    milestoneLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    milestoneTime: {
        fontSize: 12,
    },
    phaseRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    phaseIndicator: {
        width: 40,
        alignItems: 'center',
        marginRight: 16,
    },
    phaseCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
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
        paddingBottom: 8,
    },
    phaseName: {
        fontSize: 15,
        marginBottom: 4,
    },
    phaseDetail: {
        fontSize: 12,
        marginBottom: 8,
    },
    phaseProgressBar: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: 8,
    },
    phaseProgressFill: {
        height: '100%',
        borderRadius: 3,
    },
});
