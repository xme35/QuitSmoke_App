import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Modal, ScrollView, Pressable, useColorScheme } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

interface HealthMetric {
    id: string;
    name: string;
    description: string;
    icon: string;
    daysToComplete: number;
    category: string;
}

const HEALTH_METRICS: HealthMetric[] = [
    // Cardiovascular & Circulatory (4 metrics)
    {
        id: 'pulse_rate',
        name: 'Pulse Rate',
        description: 'Heart rate returns to normal levels within 20 minutes of quitting.',
        icon: 'heart-pulse',
        daysToComplete: 0.014,
        category: 'cardiovascular',
    },
    {
        id: 'circulation',
        name: 'Circulation',
        description: 'Blood flow improves throughout your body, enhancing oxygen delivery.',
        icon: 'water-sync',
        daysToComplete: 14,
        category: 'cardiovascular',
    },
    {
        id: 'heart_disease_risk',
        name: 'Heart Disease Risk',
        description: 'Risk of coronary heart disease drops to half that of a smoker.',
        icon: 'shield-heart',
        daysToComplete: 365,
        category: 'cardiovascular',
    },
    {
        id: 'heart_attack_risk',
        name: 'Heart Attack Risk',
        description: 'Heart attack risk begins decreasing within 24 hours.',
        icon: 'heart-flash',
        daysToComplete: 1,
        category: 'cardiovascular',
    },

    // Lung & Respiratory (5 metrics)
    {
        id: 'oxygen_levels',
        name: 'Oxygen Levels',
        description: 'Blood oxygen normalizes as carbon monoxide is cleared.',
        icon: 'air-filter',
        daysToComplete: 0.5,
        category: 'respiratory',
    },
    {
        id: 'carbon_monoxide',
        name: 'Carbon Monoxide',
        description: 'CO levels drop to normal within 12 hours.',
        icon: 'molecule-co',
        daysToComplete: 0.5,
        category: 'respiratory',
    },
    {
        id: 'breathing',
        name: 'Breathing',
        description: 'Lung capacity increases up to 30% as airways heal.',
        icon: 'lungs',
        daysToComplete: 90,
        category: 'respiratory',
    },
    {
        id: 'lung_function',
        name: 'Lung Function',
        description: 'Cilia regrow and lung function improves significantly.',
        icon: 'shield-plus',
        daysToComplete: 90,
        category: 'respiratory',
    },
    {
        id: 'lung_cancer_risk',
        name: 'Lung Cancer Risk',
        description: 'Lung cancer risk drops by 50% after 10 years.',
        icon: 'shield-star',
        daysToComplete: 3650,
        category: 'respiratory',
    },

    // Oral & Olfactory (5 metrics)
    {
        id: 'bad_breath',
        name: 'Bad Breath',
        description: 'Smoker\'s breath disappears as oral bacteria normalize.',
        icon: 'account-voice',
        daysToComplete: 3,
        category: 'oral',
    },
    {
        id: 'tooth_staining',
        name: 'Tooth Staining',
        description: 'No new staining occurs; existing stains become removable.',
        icon: 'tooth',
        daysToComplete: 7,
        category: 'oral',
    },
    {
        id: 'gums_teeth',
        name: 'Gums & Teeth',
        description: 'Gum health improves, reducing periodontal disease risk.',
        icon: 'tooth-outline',
        daysToComplete: 30,
        category: 'oral',
    },
    {
        id: 'gum_texture',
        name: 'Gum Texture',
        description: 'Gum tissue heals and returns to healthy pink color.',
        icon: 'heart-plus',
        daysToComplete: 14,
        category: 'oral',
    },
    {
        id: 'taste_smell',
        name: 'Taste & Smell',
        description: 'Nerve endings regenerate, enhancing taste and smell.',
        icon: 'food-apple',
        daysToComplete: 2,
        category: 'oral',
    },

    // Energy, Immunity & Fitness (3 metrics)
    {
        id: 'energy_levels',
        name: 'Energy Levels',
        description: 'Energy increases as circulation and oxygen delivery improve.',
        icon: 'lightning-bolt',
        daysToComplete: 14,
        category: 'energy',
    },
    {
        id: 'immunity',
        name: 'Immunity',
        description: 'Immune system strengthens against infections.',
        icon: 'shield-check',
        daysToComplete: 30,
        category: 'energy',
    },
    {
        id: 'physical_fitness',
        name: 'Physical Fitness',
        description: 'Cardiovascular fitness improves; exercise becomes easier.',
        icon: 'run',
        daysToComplete: 90,
        category: 'energy',
    },

    // Mental & Cognitive (3 metrics)
    {
        id: 'mood_wellbeing',
        name: 'Mood & Mental Health',
        description: 'Brain chemistry rebalances, reducing anxiety.',
        icon: 'emoticon-happy',
        daysToComplete: 30,
        category: 'mental',
    },
    {
        id: 'concentration',
        name: 'Concentration',
        description: 'Mental clarity improves with better oxygen supply.',
        icon: 'brain',
        daysToComplete: 14,
        category: 'mental',
    },
    {
        id: 'sleep_quality',
        name: 'Sleep Quality',
        description: 'Sleep patterns normalize for deeper, restorative rest.',
        icon: 'sleep',
        daysToComplete: 7,
        category: 'mental',
    },

    // Appearance & Long-term (2 metrics)
    {
        id: 'skin_health',
        name: 'Skin Health',
        description: 'Skin tone improves as circulation increases.',
        icon: 'face-woman-shimmer',
        daysToComplete: 90,
        category: 'appearance',
    },
    {
        id: 'fertility_sexual',
        name: 'Fertility & Sexual Health',
        description: 'Blood flow improves, enhancing fertility and function.',
        icon: 'gender-male-female',
        daysToComplete: 90,
        category: 'appearance',
    },
];

const CATEGORIES = [
    { id: 'all', name: 'All', icon: 'view-grid', color: '#6366f1' },
    { id: 'cardiovascular', name: 'Heart', icon: 'heart-pulse', color: '#ef4444' },
    { id: 'respiratory', name: 'Lungs', icon: 'lungs', color: '#3b82f6' },
    { id: 'oral', name: 'Oral', icon: 'tooth', color: '#10b981' },
    { id: 'energy', name: 'Energy', icon: 'lightning-bolt', color: '#f59e0b' },
    { id: 'mental', name: 'Mental', icon: 'brain', color: '#8b5cf6' },
    { id: 'appearance', name: 'Vitality', icon: 'flash', color: '#d946ef' },
];

interface HealthImprovementsProps {
    visible: boolean;
    onClose: () => void;
    daysSinceStart: number;
}

export const HealthImprovements: React.FC<HealthImprovementsProps> = ({ visible, onClose, daysSinceStart }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const calculateProgress = (metric: HealthMetric): number => {
        if (daysSinceStart <= 0) return 0;
        if (daysSinceStart >= metric.daysToComplete) return 100;
        return Math.min((daysSinceStart / metric.daysToComplete) * 100, 100);
    };

    const getProgressColor = (progress: number): string => {
        if (progress === 100) return '#3b82f6';
        if (progress >= 75) return '#10b981';
        if (progress >= 50) return '#22c55e';
        if (progress >= 25) return '#f59e0b';
        return '#ef4444';
    };

    const filteredMetrics = useMemo(() => {
        if (selectedCategory === 'all') return HEALTH_METRICS;
        return HEALTH_METRICS.filter(m => m.category === selectedCategory);
    }, [selectedCategory]);

    const overallProgress = useMemo(() => {
        const total = HEALTH_METRICS.reduce((sum, m) => sum + calculateProgress(m), 0);
        return Math.round(total / HEALTH_METRICS.length);
    }, [daysSinceStart]);

    const completedCount = HEALTH_METRICS.filter(m => calculateProgress(m) === 100).length;

    const CircularProgress = ({ progress, size = 110 }: { progress: number; size?: number }) => {
        const strokeWidth = 8;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const progressOffset = circumference - (progress / 100) * circumference;
        const color = getProgressColor(progress);
        const fontSize = progress === 100 ? size * 0.24 : size * 0.26;
        const progressValue = Math.round(progress);

        return (
            <View style={{ width: size, height: size }}>
                <Svg width={size} height={size}>
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={isDark ? '#2C2F30' : '#F3F4F6'}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={progressOffset}
                        strokeLinecap="round"
                        rotation="-90"
                        origin={`${size / 2}, ${size / 2}`}
                    />
                    <SvgText
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        fontSize={fontSize}
                        fontWeight="bold"
                        fill={isDark ? '#FFFFFF' : '#1F2937'}
                        dy={fontSize * 0.35}
                    >
                        {progressValue}
                    </SvgText>
                    <SvgText
                        x="50%"
                        y="50%"
                        textAnchor="start"
                        fontSize={fontSize * 0.6}
                        fontWeight="bold"
                        fill={isDark ? '#FFFFFF' : '#1F2937'}
                        dy={fontSize * 0.35}
                        dx={progressValue >= 100 ? fontSize * 0.85 : progressValue >= 10 ? fontSize * 0.55 : fontSize * 0.35}
                    >
                        %
                    </SvgText>
                </Svg>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <ThemedView style={styles.modalContainer}>
                {/* Compact Header */}
                <View style={[styles.header, { backgroundColor: isDark ? '#0F1419' : '#F8FAFC' }]}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.iconBadge, { backgroundColor: isDark ? '#1C1F20' : '#FFFFFF' }]}>
                                <MaterialCommunityIcons name="hospital-box" size={28} color="#3b82f6" />
                            </View>
                            <View>
                                <ThemedText style={styles.headerTitle}>Health Improvements</ThemedText>
                                <ThemedText style={[styles.headerSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    {completedCount} of {HEALTH_METRICS.length} achieved
                                </ThemedText>
                            </View>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color={themeColors.text} />
                        </Pressable>
                    </View>

                    {/* Category Filter Tabs - Grid Layout */}
                    <View style={styles.categoriesGrid}>
                        {CATEGORIES.map(category => {
                            const isSelected = selectedCategory === category.id;
                            return (
                                <Pressable
                                    key={category.id}
                                    onPress={() => setSelectedCategory(category.id)}
                                    style={[
                                        styles.categoryTab,
                                        {
                                            backgroundColor: isSelected
                                                ? category.color
                                                : isDark ? '#1C1F20' : '#FFFFFF',
                                        }
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={category.icon as any}
                                        size={16}
                                        color={isSelected ? '#FFFFFF' : category.color}
                                    />
                                    <ThemedText style={[
                                        styles.categoryTabText,
                                        { color: isSelected ? '#FFFFFF' : isDark ? '#E5E7EB' : '#1F2937' }
                                    ]}>
                                        {category.name}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Metrics List */}
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.metricsContainer}>
                        {filteredMetrics.map(metric => {
                            const progress = calculateProgress(metric);
                            const progressColor = getProgressColor(progress);
                            const category = CATEGORIES.find(c => c.id === metric.category);
                            const daysRemaining = Math.ceil(Math.max(0, metric.daysToComplete - daysSinceStart));

                            return (
                                <View
                                    key={metric.id}
                                    style={[styles.metricCard, { backgroundColor: isDark ? '#1C1F20' : '#FFFFFF' }]}
                                >
                                    <View style={styles.metricRow}>
                                        <CircularProgress progress={progress} size={110} />
                                        
                                        <View style={styles.metricInfo}>
                                            <View style={styles.metricHeader}>
                                                {category && category.id !== 'all' && (
                                                    <View style={[styles.categoryBadge, { backgroundColor: `${category.color}15` }]}>
                                                        <MaterialCommunityIcons 
                                                            name={category.icon as any} 
                                                            size={12} 
                                                            color={category.color} 
                                                        />
                                                        <ThemedText style={[styles.categoryText, { color: category.color }]}>
                                                            {category.name.toUpperCase()}
                                                        </ThemedText>
                                                    </View>
                                                )}
                                                {progress === 100 && (
                                                    <MaterialCommunityIcons name="check-circle" size={22} color="#10b981" />
                                                )}
                                            </View>
                                            
                                            <ThemedText style={styles.metricName}>{metric.name}</ThemedText>
                                            <ThemedText style={[styles.metricDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                                {metric.description}
                                            </ThemedText>
                                            
                                            <View style={styles.metricFooter}>
                                                <MaterialCommunityIcons 
                                                    name={progress === 100 ? 'check-circle' : 'clock-outline'} 
                                                    size={16} 
                                                    color={progressColor} 
                                                />
                                                <ThemedText style={[styles.footerText, { color: progressColor }]}>
                                                    {progress === 100 
                                                        ? 'Complete!' 
                                                        : daysRemaining === 0 
                                                            ? 'Less than 1 day remaining' 
                                                            : `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining`
                                                    }
                                                </ThemedText>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </ThemedView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    closeButton: {
        padding: 8,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 8,
        marginBottom: 8,
    },
    categoryTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 12,
        gap: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    categoryTabText: {
        fontSize: 13,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    metricsContainer: {
        padding: 20,
    },
    metricCard: {
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    metricRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    metricInfo: {
        flex: 1,
    },
    metricHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    categoryText: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    metricName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        lineHeight: 24,
    },
    metricDescription: {
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 12,
    },
    metricFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 13,
        fontWeight: '600',
    },
});