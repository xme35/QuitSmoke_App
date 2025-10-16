
import React, { useMemo, useState, useEffect } from 'react';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, useColorScheme, View, Dimensions, ScrollView } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { Colors } from '../../constants/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { differenceInDays, add, format, eachDayOfInterval, startOfDay, subDays } from 'date-fns';
import Svg, { Line, G, Circle, Text as SvgText, Rect } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

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

    const { planStartDate, totalDuration, taperingSchedule, estimatedSavings, consumptionLog, preferences } = appState;

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

    const weeklyIntakeData = useMemo(() => {
        const today = startOfDay(new Date());
        const weekStart = subDays(today, 6);
        const interval = eachDayOfInterval({ start: weekStart, end: today });

        return interval.map(date => {
            const logsForDay = (consumptionLog || []).filter(log => startOfDay(new Date(log.timestamp)).getTime() === date.getTime());
            
            let totalNicotine = 0;
            logsForDay.forEach(log => {
                switch (log.product) {
                    case 'Cigarette':
                        totalNicotine += preferences?.nicotineStrengthMgPerCigarette || 0;
                        break;
                    case 'Vape (Puff)':
                        const nicotinePerMl = preferences?.nicotineStrengthMgPerMl || 0;
                        const puffsPerPod = preferences?.vapePuffsPerPod || 1;
                        const vapeNicotinePerPuff = (nicotinePerMl * 2) / puffsPerPod;
                        totalNicotine += vapeNicotinePerPuff || 0;
                        break;
                    case 'Heated Tobacco':
                        totalNicotine += preferences?.nicotineStrengthMgPerHeatedTobacco || 0;
                        break;
                    case 'Nicotine Pouch':
                        totalNicotine += preferences?.nicotineStrengthMgPerPatch || 0;
                        break;
                }
            });

            return {
                date,
                value: totalNicotine,
            };
        });

    }, [consumptionLog, preferences]);

    const achievements = [
        { label: 'Money Saved', value: moneySaved, iconName: 'wallet' },
        { label: 'Life Time Gained', value: '2d 5h', iconName: 'heartbeat' },
        { label: 'Smoke-Free Days', value: String(daysSinceStart), iconName: 'calendar-check' },
        { label: 'Days Within Limits', value: '5', iconName: 'check-circle' },
    ];

    const AchievementCard = ({ label, value, iconName }: { label: string; value: string; iconName: string }) => {
        return (
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF'}]}>
                <FontAwesome5 name={iconName} size={24} color={Colors[colorScheme].tint} />
                <ThemedText style={styles.cardValue}>{value}</ThemedText>
                <ThemedText style={styles.cardLabel}>{label}</ThemedText>
            </View>
        );
    };

    const CountdownUnit = ({ value, unit }: { value: number; unit: string }) => (
        <View style={styles.countdownUnit}>
            <ThemedText style={styles.countdownValue}>{String(value).padStart(2, '0')}</ThemedText>
            <ThemedText style={styles.countdownLabel}>{unit}</ThemedText>
        </View>
    );
    
    const chartHeight = 200;
    const chartWidth = screenWidth - 80;
    const yMaxWeekly = Math.max(...weeklyIntakeData.map(d => d.value), 1);
    const xPointWeekly = (index: number) => (weeklyIntakeData.length > 1 ? (chartWidth / (weeklyIntakeData.length -1)) * index : chartWidth / 2);
    const yPointWeekly = (value: number) => chartHeight - ((value / yMaxWeekly) * chartHeight) + 10;

    const TaperingPlanChart = () => {
        if (!taperingSchedule || taperingSchedule.length === 0) return <ThemedText>No plan created yet.</ThemedText>;

        const barWidth = 40;
        const chartWidth = taperingSchedule.length * (barWidth + 10) - 10;
        const yMaxTaper = Math.max(...taperingSchedule.map(p => p.nicotineGoalMg), 1);
        const yPointTaper = (value: number) => chartHeight - ((value / yMaxTaper) * chartHeight);

        return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20}}>
                <Svg height={chartHeight + 40} width={chartWidth + 40}>
                    <G y={-10}>
                        {taperingSchedule.map((phase, index) => (
                            <G key={index} x={index * (barWidth + 10)}>
                                <Rect
                                    y={yPointTaper(phase.nicotineGoalMg)}
                                    width={barWidth}
                                    height={chartHeight - yPointTaper(phase.nicotineGoalMg)}
                                    fill={themeColors.tint}
                                    rx={8}
                                />
                                <SvgText
                                    x={barWidth / 2}
                                    y={chartHeight + 20}
                                    fill={themeColors.secondaryText}
                                    fontSize="12"
                                    textAnchor="middle"
                                >
                                    {`Phase ${index + 1}`}
                                </SvgText>
                                <SvgText
                                    x={barWidth / 2}
                                    y={yPointTaper(phase.nicotineGoalMg) - 5}
                                    fill={themeColors.text}
                                    fontSize="12"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                >
                                    {`${phase.nicotineGoalMg}mg`}
                                </SvgText>
                            </G>
                        ))}
                    </G>
                </Svg>
            </ScrollView>
        )
    }

    return (
        <ThemedView style={{flex: 1}}>
        <ScrollView style={styles.container}>
            <ThemedView style={[styles.timerContainer, { backgroundColor: themeColors.tint }]}>
                <ThemedText style={styles.timerTitle}>Time Until Plan Ends</ThemedText>
                <View style={styles.countdownContainer}>
                    <CountdownUnit value={timeUntilPlanEnds.days} unit="Days" />
                    <CountdownUnit value={timeUntilPlanEnds.hours} unit="Hours" />
                    <CountdownUnit value={timeUntilPlanEnds.minutes} unit="Mins" />
                    <CountdownUnit value={timeUntilPlanEnds.seconds} unit="Secs" />
                </View>
            </ThemedView>

            <View style={styles.contentContainer}>
                <View style={styles.achievementsContainer}>
                    <ThemedText style={styles.sectionTitle}>Your Achievements</ThemedText>
                    <View style={styles.gridContainer}>
                        {achievements.map((item, index) => <AchievementCard key={index} {...item} />)}
                    </View>
                </View>

                <ThemedText style={[styles.sectionTitle, { marginTop: 24 }]}>This Week's Nicotine Intake (mg)</ThemedText>
                <View style={[styles.chartCard, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF'}]}>
                    {weeklyIntakeData.length > 1 ? (
                        <Svg height={chartHeight + 40} width={chartWidth}> 
                            <G y={-10}> 
                                {weeklyIntakeData.map((d, i) => {
                                    if (i === weeklyIntakeData.length - 1) return null;
                                    return (
                                        <Line
                                            key={`line-${i}`}
                                            x1={xPointWeekly(i)}
                                            y1={yPointWeekly(d.value)}
                                            x2={xPointWeekly(i + 1)}
                                            y2={yPointWeekly(weeklyIntakeData[i + 1].value)}
                                            stroke={themeColors.tint}
                                            strokeWidth={3}
                                            strokeLinecap='round'
                                        />
                                    );
                                })}
                                {weeklyIntakeData.map((d, i) => (
                                    <Circle
                                        key={`circle-${i}`}
                                        cx={xPointWeekly(i)}
                                        cy={yPointWeekly(d.value)}
                                        r={5}
                                        fill={'white'}
                                        stroke={themeColors.tint}
                                        strokeWidth={2}
                                    />
                                ))}
                                {weeklyIntakeData.map((d, i) => (
                                    <SvgText
                                        key={`label-${i}`}
                                        x={xPointWeekly(i)}
                                        y={chartHeight + 20}
                                        fill={themeColors.secondaryText}
                                        fontSize="12"
                                        textAnchor="middle"
                                    >
                                        {format(d.date, 'EEE')}
                                    </SvgText>
                                ))}
                            </G>
                        </Svg>
                    ) : (
                        <ThemedText style={{textAlign: 'center', paddingVertical: 40, opacity: 0.7}}>Not enough data to display chart.</ThemedText>
                    )}
                </View>

                <ThemedText style={[styles.sectionTitle, { marginTop: 24 }]}>Your Tapering Plan</ThemedText>
                <View style={[styles.chartCard, { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF'}]}>
                    <TaperingPlanChart />
                </View>
            </View>
        </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    timerContainer: {
        padding: 24,
        paddingBottom: 30,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        alignItems: 'center',
    },
    timerTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#FFFFFF',
        opacity: 0.9,
        marginBottom: 16,
    },
    countdownContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    countdownUnit: {
        alignItems: 'center',
    },
    countdownValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    countdownLabel: {
        fontSize: 12,
        color: '#FFFFFF',
        opacity: 0.9,
        marginTop: 4,
    },
    contentContainer: {
        padding: 24,
        marginTop: -20,
    },
    achievementsContainer: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    card: {
        padding: 15,
        borderRadius: 16,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        width: '48%',
    },
    cardValue: {
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 8,
    },
    cardLabel: {
        fontSize: 14,
        textAlign: 'center',
    },
    chartCard: {
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
});
