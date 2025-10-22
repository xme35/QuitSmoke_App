
import React, { useMemo, useState, useEffect } from 'react';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { StyleSheet, useColorScheme, View, Dimensions, ScrollView } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { Colors } from '../../constants/theme';
import { FontAwesome5 } from '@expo/vector-icons';
import { differenceInDays, add, format, eachDayOfInterval, startOfDay, subDays } from 'date-fns';
import Svg, { Line, G, Circle, Text as SvgText, Rect, Path } from 'react-native-svg';

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

    const { planStartDate, totalDuration, estimatedSavings, consumptionLog, preferences } = appState;

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
