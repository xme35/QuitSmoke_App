import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Modal, ScrollView, Pressable, useColorScheme } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    iconFamily: 'MaterialCommunityIcons' | 'FontAwesome5';
    color: string;
    requirement: string;
    category: string;
    checkUnlocked: (stats: BadgeStats) => boolean;
}

interface BadgeStats {
    daysSinceStart: number;
    daysWithinLimits: number;
    moneySaved: number;
    healthMilestonesUnlocked: number;
    perfectDays: number;
    longestStreak: number;
}

const CATEGORIES = [
    { id: 'all', name: 'All', icon: 'view-grid', color: '#6366f1' },
    { id: 'time', name: 'Time', icon: 'calendar-clock', color: '#3b82f6' },
    { id: 'health', name: 'Health', icon: 'heart-pulse', color: '#ef4444' },
    { id: 'money', name: 'Money', icon: 'cash', color: '#10b981' },
];

const BADGES: Badge[] = [
    // Dias (Days)
    {
        id: 'day_1',
        name: '1 Dia Sem Fumar',
        description: 'Completou o primeiro dia sem fumar',
        icon: 'numeric-1-circle',
        iconFamily: 'MaterialCommunityIcons',
        color: '#3b82f6',
        requirement: '1 dia',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 1,
    },
    {
        id: 'day_2',
        name: '2 Dias Sem Fumar',
        description: 'Dois dias de liberdade',
        icon: 'numeric-2-circle',
        iconFamily: 'MaterialCommunityIcons',
        color: '#3b82f6',
        requirement: '2 dias',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 2,
    },
    {
        id: 'day_3',
        name: '3 Dias Sem Fumar',
        description: 'Três dias de força e determinação',
        icon: 'numeric-3-circle',
        iconFamily: 'MaterialCommunityIcons',
        color: '#3b82f6',
        requirement: '3 dias',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 3,
    },
    {
        id: 'day_4',
        name: '4 Dias Sem Fumar',
        description: 'Quatro dias de progresso',
        icon: 'numeric-4-circle',
        iconFamily: 'MaterialCommunityIcons',
        color: '#3b82f6',
        requirement: '4 dias',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 4,
    },
    {
        id: 'day_5',
        name: '5 Dias Sem Fumar',
        description: 'Cinco dias de conquistas',
        icon: 'numeric-5-circle',
        iconFamily: 'MaterialCommunityIcons',
        color: '#3b82f6',
        requirement: '5 dias',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 5,
    },
    {
        id: 'day_6',
        name: '6 Dias Sem Fumar',
        description: 'Seis dias de vitória',
        icon: 'numeric-6-circle',
        iconFamily: 'MaterialCommunityIcons',
        color: '#3b82f6',
        requirement: '6 dias',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 6,
    },
    {
        id: 'day_50',
        name: '50 Dias Sem Fumar',
        description: 'Meio caminho para os 100 dias',
        icon: 'star-circle',
        iconFamily: 'MaterialCommunityIcons',
        color: '#8b5cf6',
        requirement: '50 dias',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 50,
    },
    {
        id: 'day_100',
        name: '100 Dias Sem Fumar',
        description: 'Cem dias de liberdade total',
        icon: 'trophy',
        iconFamily: 'MaterialCommunityIcons',
        color: '#f59e0b',
        requirement: '100 dias',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 100,
    },
    {
        id: 'day_150',
        name: '150 Dias Sem Fumar',
        description: 'Cinco meses de sucesso',
        icon: 'medal',
        iconFamily: 'MaterialCommunityIcons',
        color: '#f59e0b',
        requirement: '150 dias',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 150,
    },
    {
        id: 'day_200',
        name: '200 Dias Sem Fumar',
        description: 'Duzentos dias de transformação',
        icon: 'crown',
        iconFamily: 'MaterialCommunityIcons',
        color: '#eab308',
        requirement: '200 dias',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 200,
    },

    // Semanas (Weeks)
    {
        id: 'week_1',
        name: '1 Semana Sem Fumar',
        description: 'Primeira semana completa!',
        icon: 'calendar-week',
        iconFamily: 'MaterialCommunityIcons',
        color: '#10b981',
        requirement: '1 semana',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 7,
    },
    {
        id: 'week_2',
        name: '2 Semanas Sem Fumar',
        description: 'Duas semanas de força',
        icon: 'calendar-multiple',
        iconFamily: 'MaterialCommunityIcons',
        color: '#10b981',
        requirement: '2 semanas',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 14,
    },
    {
        id: 'week_3',
        name: '3 Semanas Sem Fumar',
        description: 'Três semanas de vitória',
        icon: 'calendar-check',
        iconFamily: 'MaterialCommunityIcons',
        color: '#10b981',
        requirement: '3 semanas',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 21,
    },
    {
        id: 'week_4',
        name: '4 Semanas Sem Fumar',
        description: 'Quatro semanas de sucesso',
        icon: 'calendar-star',
        iconFamily: 'MaterialCommunityIcons',
        color: '#10b981',
        requirement: '4 semanas',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 28,
    },

    // Meses (Months)
    {
        id: 'month_1',
        name: '1 Mês Sem Fumar',
        description: 'Primeiro mês completo!',
        icon: 'calendar-month',
        iconFamily: 'MaterialCommunityIcons',
        color: '#ef4444',
        requirement: '1 mês',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 30,
    },
    {
        id: 'month_2',
        name: '2 Meses Sem Fumar',
        description: 'Dois meses de transformação',
        icon: 'calendar-range',
        iconFamily: 'MaterialCommunityIcons',
        color: '#ef4444',
        requirement: '2 meses',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 60,
    },
    {
        id: 'month_3',
        name: '3 Meses Sem Fumar',
        description: 'Três meses de nova vida',
        icon: 'trophy-variant',
        iconFamily: 'MaterialCommunityIcons',
        color: '#ef4444',
        requirement: '3 meses',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 90,
    },
    {
        id: 'month_4',
        name: '4 Meses Sem Fumar',
        description: 'Quatro meses de liberdade',
        icon: 'star-four-points',
        iconFamily: 'MaterialCommunityIcons',
        color: '#ef4444',
        requirement: '4 meses',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 120,
    },
    {
        id: 'month_5',
        name: '5 Meses Sem Fumar',
        description: 'Cinco meses sem olhar para trás',
        icon: 'fire',
        iconFamily: 'MaterialCommunityIcons',
        color: '#ef4444',
        requirement: '5 meses',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 150,
    },
    {
        id: 'month_6',
        name: '6 Meses Sem Fumar',
        description: 'Meio ano de conquistas',
        icon: 'trophy-award',
        iconFamily: 'MaterialCommunityIcons',
        color: '#dc2626',
        requirement: '6 meses',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 180,
    },
    {
        id: 'month_7',
        name: '7 Meses Sem Fumar',
        description: 'Sete meses de superação',
        icon: 'shield-star',
        iconFamily: 'MaterialCommunityIcons',
        color: '#dc2626',
        requirement: '7 meses',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 210,
    },
    {
        id: 'month_8',
        name: '8 Meses Sem Fumar',
        description: 'Oito meses de força',
        icon: 'medal',
        iconFamily: 'MaterialCommunityIcons',
        color: '#dc2626',
        requirement: '8 meses',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 240,
    },
    {
        id: 'month_9',
        name: '9 Meses Sem Fumar',
        description: 'Nove meses de renovação',
        icon: 'crown',
        iconFamily: 'MaterialCommunityIcons',
        color: '#dc2626',
        requirement: '9 meses',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 270,
    },
    {
        id: 'month_10',
        name: '10 Meses Sem Fumar',
        description: 'Dez meses de vitória',
        icon: 'star-circle',
        iconFamily: 'MaterialCommunityIcons',
        color: '#dc2626',
        requirement: '10 meses',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 300,
    },
    {
        id: 'month_11',
        name: '11 Meses Sem Fumar',
        description: 'Quase um ano completo!',
        icon: 'rocket-launch',
        iconFamily: 'MaterialCommunityIcons',
        color: '#dc2626',
        requirement: '11 meses',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 330,
    },

    // Anos (Years)
    {
        id: 'year_1',
        name: '1 Ano Sem Fumar',
        description: 'Um ano completo de liberdade!',
        icon: 'trophy',
        iconFamily: 'MaterialCommunityIcons',
        color: '#a855f7',
        requirement: '1 ano',
        category: 'time',
        checkUnlocked: (stats) => stats.daysSinceStart >= 365,
    },
    // Health Improvement Badges - One for each health milestone
    {
        id: 'health_pulse_rate',
        name: 'Pulse Rate Normalized',
        description: 'Heart rate returns to normal levels',
        icon: 'heart-pulse',
        iconFamily: 'MaterialCommunityIcons',
        color: '#ef4444',
        requirement: '20 minutes',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 0.014,
    },
    {
        id: 'health_oxygen_levels',
        name: 'Oxygen Levels Improved',
        description: 'Blood oxygen normalizes as CO is cleared',
        icon: 'air-filter',
        iconFamily: 'MaterialCommunityIcons',
        color: '#3b82f6',
        requirement: '12 hours',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 0.5,
    },
    {
        id: 'health_carbon_monoxide',
        name: 'Carbon Monoxide Cleared',
        description: 'CO levels drop to normal',
        icon: 'molecule-co',
        iconFamily: 'MaterialCommunityIcons',
        color: '#3b82f6',
        requirement: '12 hours',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 0.5,
    },
    {
        id: 'health_heart_attack_risk',
        name: 'Heart Attack Risk Reduced',
        description: 'Heart attack risk begins decreasing',
        icon: 'heart-flash',
        iconFamily: 'MaterialCommunityIcons',
        color: '#ef4444',
        requirement: '24 hours',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 1,
    },
    {
        id: 'health_taste_smell',
        name: 'Taste & Smell Enhanced',
        description: 'Nerve endings regenerate',
        icon: 'food-apple',
        iconFamily: 'MaterialCommunityIcons',
        color: '#10b981',
        requirement: '2 days',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 2,
    },
    {
        id: 'health_bad_breath',
        name: 'Fresh Breath Restored',
        description: 'Smoker\'s breath disappears',
        icon: 'account-voice',
        iconFamily: 'MaterialCommunityIcons',
        color: '#10b981',
        requirement: '3 days',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 3,
    },
    {
        id: 'health_sleep_quality',
        name: 'Sleep Quality Improved',
        description: 'Sleep patterns normalize',
        icon: 'sleep',
        iconFamily: 'MaterialCommunityIcons',
        color: '#8b5cf6',
        requirement: '1 week',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 7,
    },
    {
        id: 'health_tooth_staining',
        name: 'No New Tooth Stains',
        description: 'Existing stains become removable',
        icon: 'tooth',
        iconFamily: 'MaterialCommunityIcons',
        color: '#10b981',
        requirement: '1 week',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 7,
    },
    {
        id: 'health_circulation',
        name: 'Circulation Improved',
        description: 'Blood flow enhances oxygen delivery',
        icon: 'water-sync',
        iconFamily: 'MaterialCommunityIcons',
        color: '#ef4444',
        requirement: '2 weeks',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 14,
    },
    {
        id: 'health_gum_texture',
        name: 'Healthy Gum Texture',
        description: 'Gum tissue heals and returns to pink',
        icon: 'heart-plus',
        iconFamily: 'MaterialCommunityIcons',
        color: '#10b981',
        requirement: '2 weeks',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 14,
    },
    {
        id: 'health_energy_levels',
        name: 'Energy Levels Boosted',
        description: 'Energy increases with better circulation',
        icon: 'lightning-bolt',
        iconFamily: 'MaterialCommunityIcons',
        color: '#f59e0b',
        requirement: '2 weeks',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 14,
    },
    {
        id: 'health_concentration',
        name: 'Mental Clarity Enhanced',
        description: 'Concentration improves with oxygen',
        icon: 'brain',
        iconFamily: 'MaterialCommunityIcons',
        color: '#8b5cf6',
        requirement: '2 weeks',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 14,
    },
    {
        id: 'health_gums_teeth',
        name: 'Gums & Teeth Healthier',
        description: 'Gum health improves significantly',
        icon: 'tooth-outline',
        iconFamily: 'MaterialCommunityIcons',
        color: '#10b981',
        requirement: '1 month',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 30,
    },
    {
        id: 'health_immunity',
        name: 'Immunity Strengthened',
        description: 'Immune system fights infections better',
        icon: 'shield-check',
        iconFamily: 'MaterialCommunityIcons',
        color: '#f59e0b',
        requirement: '1 month',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 30,
    },
    {
        id: 'health_mood_wellbeing',
        name: 'Mood & Mental Health',
        description: 'Brain chemistry rebalances',
        icon: 'emoticon-happy',
        iconFamily: 'MaterialCommunityIcons',
        color: '#8b5cf6',
        requirement: '1 month',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 30,
    },
    {
        id: 'health_breathing',
        name: 'Breathing Capacity Increased',
        description: 'Lung capacity increases up to 30%',
        icon: 'lungs',
        iconFamily: 'MaterialCommunityIcons',
        color: '#3b82f6',
        requirement: '3 months',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 90,
    },
    {
        id: 'health_lung_function',
        name: 'Lung Function Restored',
        description: 'Cilia regrow and lungs heal',
        icon: 'shield-plus',
        iconFamily: 'MaterialCommunityIcons',
        color: '#3b82f6',
        requirement: '3 months',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 90,
    },
    {
        id: 'health_physical_fitness',
        name: 'Physical Fitness Improved',
        description: 'Exercise becomes much easier',
        icon: 'run',
        iconFamily: 'MaterialCommunityIcons',
        color: '#f59e0b',
        requirement: '3 months',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 90,
    },
    {
        id: 'health_skin_health',
        name: 'Skin Health Improved',
        description: 'Skin tone improves with circulation',
        icon: 'face-woman-shimmer',
        iconFamily: 'MaterialCommunityIcons',
        color: '#ec4899',
        requirement: '3 months',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 90,
    },
    {
        id: 'health_fertility_sexual',
        name: 'Fertility & Sexual Health',
        description: 'Blood flow enhances function',
        icon: 'gender-male-female',
        iconFamily: 'MaterialCommunityIcons',
        color: '#ec4899',
        requirement: '3 months',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 90,
    },
    {
        id: 'health_heart_disease_risk',
        name: 'Heart Disease Risk Halved',
        description: 'Risk drops to half of a smoker',
        icon: 'shield-heart',
        iconFamily: 'MaterialCommunityIcons',
        color: '#ef4444',
        requirement: '1 year',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 365,
    },
    {
        id: 'health_lung_cancer_risk',
        name: 'Lung Cancer Risk Reduced',
        description: 'Risk drops by 50% after 10 years',
        icon: 'shield-star',
        iconFamily: 'MaterialCommunityIcons',
        color: '#3b82f6',
        requirement: '10 years',
        category: 'health',
        checkUnlocked: (stats) => stats.daysSinceStart >= 3650,
    },

    // Badges de Dinheiro Poupado (Money Saved Badges)
    {
        id: 'money_50',
        name: '€50 Poupados',
        description: 'Poupou os primeiros €50!',
        icon: 'cash',
        iconFamily: 'MaterialCommunityIcons',
        color: '#10b981',
        requirement: '€50',
        category: 'money',
        checkUnlocked: (stats) => stats.moneySaved >= 50,
    },
    {
        id: 'money_100',
        name: '€100 Poupados',
        description: 'Poupou €100 ao deixar de fumar',
        icon: 'cash-multiple',
        iconFamily: 'MaterialCommunityIcons',
        color: '#10b981',
        requirement: '€100',
        category: 'money',
        checkUnlocked: (stats) => stats.moneySaved >= 100,
    },
    {
        id: 'money_250',
        name: '€250 Poupados',
        description: 'Poupou €250! Liberdade financeira',
        icon: 'wallet',
        iconFamily: 'FontAwesome5',
        color: '#059669',
        requirement: '€250',
        category: 'money',
        checkUnlocked: (stats) => stats.moneySaved >= 250,
    },
    {
        id: 'money_1000',
        name: '€1000 Poupados',
        description: 'Mil euros poupados! Incrível!',
        icon: 'piggy-bank',
        iconFamily: 'MaterialCommunityIcons',
        color: '#059669',
        requirement: '€1000',
        category: 'money',
        checkUnlocked: (stats) => stats.moneySaved >= 1000,
    },
    {
        id: 'money_10000',
        name: '€10000 Poupados',
        description: 'Dez mil euros poupados! Lendário!',
        icon: 'sack-percent',
        iconFamily: 'MaterialCommunityIcons',
        color: '#047857',
        requirement: '€10000',
        category: 'money',
        checkUnlocked: (stats) => stats.moneySaved >= 10000,
    },
];

export const TOTAL_BADGES = BADGES.length;

interface AchievementBadgesProps {
    visible: boolean;
    onClose: () => void;
    stats: BadgeStats;
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({ visible, onClose, stats }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredBadges = useMemo(() => {
        if (selectedCategory === 'all') return BADGES;
        return BADGES.filter(b => b.category === selectedCategory);
    }, [selectedCategory]);

    const unlockedBadges = filteredBadges.filter(badge => badge.checkUnlocked(stats));
    const lockedBadges = filteredBadges.filter(badge => !badge.checkUnlocked(stats));

    const totalUnlocked = BADGES.filter(badge => badge.checkUnlocked(stats)).length;

    const renderBadge = (badge: Badge, isUnlocked: boolean) => {
        const IconComponent = badge.iconFamily === 'MaterialCommunityIcons' ? MaterialCommunityIcons : FontAwesome5;

        return (
            <View
                key={badge.id}
                style={[
                    styles.badgeCard,
                    {
                        backgroundColor: isDark ? '#1C1F20' : '#FFFFFF',
                        opacity: isUnlocked ? 1 : 0.5,
                    },
                ]}
            >
                <View
                    style={[
                        styles.badgeIcon,
                        {
                            backgroundColor: isUnlocked ? `${badge.color}20` : isDark ? '#374151' : '#E5E7EB',
                        },
                    ]}
                >
                    <IconComponent
                        name={badge.icon as any}
                        size={40}
                        color={isUnlocked ? badge.color : isDark ? '#6B7280' : '#9CA3AF'}
                    />
                    {!isUnlocked && (
                        <View style={styles.lockOverlay}>
                            <MaterialCommunityIcons name="lock" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
                        </View>
                    )}
                </View>
                <View style={styles.badgeContent}>
                    <ThemedText style={styles.badgeName}>{badge.name}</ThemedText>
                    <ThemedText style={[styles.badgeDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        {badge.description}
                    </ThemedText>
                    <View style={styles.badgeRequirement}>
                        <MaterialCommunityIcons
                            name={isUnlocked ? 'check-circle' : 'target'}
                            size={14}
                            color={isUnlocked ? '#10b981' : isDark ? '#6B7280' : '#9CA3AF'}
                        />
                        <ThemedText
                            style={[
                                styles.requirementText,
                                {
                                    color: isUnlocked ? '#10b981' : isDark ? '#6B7280' : '#9CA3AF',
                                },
                            ]}
                        >
                            {badge.requirement}
                        </ThemedText>
                    </View>
                </View>
                {isUnlocked && (
                    <View style={styles.unlockedBadge}>
                        <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
                    </View>
                )}
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
                                <MaterialCommunityIcons name="trophy" size={28} color="#FFD700" />
                            </View>
                            <View>
                                <ThemedText style={styles.headerTitle}>Trophies</ThemedText>
                                <ThemedText style={[styles.headerSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    {totalUnlocked} of {BADGES.length} unlocked
                                </ThemedText>
                            </View>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color={themeColors.text} />
                        </Pressable>
                    </View>

                    {/* Category Filters */}
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

                {/* Badges Grid */}
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.badgesContainer}>
                        {/* Unlocked Badges */}
                        {unlockedBadges.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <MaterialCommunityIcons name="trophy-award" size={20} color="#FFD700" />
                                    <ThemedText style={styles.sectionTitle}>Unlocked</ThemedText>
                                </View>
                                <View style={styles.badgeGrid}>
                                    {unlockedBadges.map(badge => renderBadge(badge, true))}
                                </View>
                            </View>
                        )}

                        {/* Locked Badges */}
                        {lockedBadges.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <MaterialCommunityIcons
                                        name="lock"
                                        size={20}
                                        color={isDark ? '#6B7280' : '#9CA3AF'}
                                    />
                                    <ThemedText style={styles.sectionTitle}>Locked</ThemedText>
                                </View>
                                <View style={styles.badgeGrid}>
                                    {lockedBadges.map(badge => renderBadge(badge, false))}
                                </View>
                            </View>
                        )}
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
    badgesContainer: {
        padding: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    badgeGrid: {
        gap: 16,
    },
    badgeCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center',
    },
    badgeIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        position: 'relative',
    },
    lockOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 36,
    },
    badgeContent: {
        flex: 1,
    },
    badgeName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    badgeDescription: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 8,
    },
    badgeRequirement: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    requirementText: {
        fontSize: 12,
        fontWeight: '500',
    },
    unlockedBadge: {
        marginLeft: 8,
    },
});