import React, { useMemo } from 'react';
import { Modal, View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ThemedText } from './themed-text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  calculateProjections,
  ProjectionMilestone,
} from '../helpers/calculate-projections';

interface ProjectionsModalProps {
  visible: boolean;
  onClose: () => void;
  estimatedSavings: number | null | undefined;
  totalDuration: number | null | undefined;
  daysSinceStart: number;
  age: number | null | undefined;
  smokingHistory: number;
  initialIntake: number | null | undefined;
  currencySymbol?: string;
  colorScheme: 'light' | 'dark';
  focusType: 'money' | 'lifetime';
}

export const ProjectionsModal: React.FC<ProjectionsModalProps> = ({
  visible,
  onClose,
  estimatedSavings,
  totalDuration,
  daysSinceStart,
  age,
  smokingHistory,
  initialIntake,
  currencySymbol = '€',
  colorScheme,
  focusType,
}) => {
  const projections = useMemo(() => {
    return calculateProjections(
      estimatedSavings,
      totalDuration,
      daysSinceStart,
      age,
      smokingHistory,
      initialIntake,
      currencySymbol
    );
  }, [estimatedSavings, totalDuration, daysSinceStart, age, smokingHistory, initialIntake, currencySymbol]);

  // Separate plan end from future projections
  const planEndMilestone = useMemo<ProjectionMilestone | null>(() => {
    return projections.find(p => p.relativePosition === 'plan-end') || null;
  }, [projections]);

  const beforePlanMilestones = useMemo<ProjectionMilestone[]>(() => {
    return projections.filter(p => p.relativePosition === 'before-plan');
  }, [projections]);

  const afterPlanMilestones = useMemo<ProjectionMilestone[]>(() => {
    return projections.filter(p => p.relativePosition === 'after-plan');
  }, [projections]);

  const milestoneSections = useMemo(
    () =>
      [
        {
          title: 'Before Goal',
          accent: '#0ea5e9',
          description: 'Milestones leading up to your target quit date',
          data: beforePlanMilestones,
        },
        {
          title: 'Plan Goal',
          accent: '#f59e0b',
          description: 'Your primary target for this plan',
          data: planEndMilestone ? [planEndMilestone] : [],
        },
        {
          title: 'Beyond Goal',
          accent: '#9333ea',
          description: 'Stretch goals to keep your momentum going',
          data: afterPlanMilestones,
        },
      ].filter(section => section.data.length > 0),
    [afterPlanMilestones, beforePlanMilestones, planEndMilestone]
  );

  const isMoney = focusType === 'money';
  const primaryColor = isMoney ? '#10b981' : '#ef4444';
  const iconName = isMoney ? 'wallet' : 'heart-pulse';
  const title = isMoney ? 'Money Saved Projections' : 'Life Time Gained Projections';
  const subtitle = isMoney 
    ? 'See how much you\'ll save in the future'
    : 'See how much life you\'ll gain back';

  if (projections.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' }
        ]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.modalTitle}>{title}</ThemedText>
              <ThemedText style={[styles.modalSubtitle, {
                color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'
              }]}>
                {subtitle}
              </ThemedText>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons 
                name="close" 
                size={24} 
                color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} 
              />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            alwaysBounceVertical={false}
          >
            {planEndMilestone && (
              <View style={[
                styles.planEndCard,
                {
                  backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#f8fafc',
                  borderWidth: 2,
                  borderColor: primaryColor,
                }
              ]}>
                <View style={styles.planEndHeader}>
                  <View style={[styles.planEndIcon, { backgroundColor: `${primaryColor}20` }]}>
                    <MaterialCommunityIcons name="flag-checkered" size={24} color={primaryColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.planEndLabel, { color: primaryColor }]}>
                      🎯 YOUR GOAL
                    </ThemedText>
                    <ThemedText style={styles.planEndName}>
                      {planEndMilestone.label}
                    </ThemedText>
                    <ThemedText style={[styles.planEndDays, {
                      color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'
                    }]}>
                      {planEndMilestone.days} days
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.planEndValueContainer}>
                  <MaterialCommunityIcons
                    name={iconName}
                    size={24}
                    color={primaryColor}
                  />
                  <ThemedText style={[styles.planEndMainValue, { color: primaryColor }]}>
                    {isMoney ? planEndMilestone.moneySaved : planEndMilestone.lifeTimeGained}
                  </ThemedText>
                </View>
              </View>
            )}

            {milestoneSections.map(section => (
              <View key={section.title} style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.sectionAccent,
                      {
                        backgroundColor: `${section.accent}33`,
                        borderColor: `${section.accent}44`,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        section.title === 'Plan Goal'
                          ? 'flag-checkered'
                          : section.title === 'Beyond Goal'
                          ? 'rocket-launch'
                          : 'chart-timeline-variant'
                      }
                      size={16}
                      color={section.accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText
                      style={[
                        styles.sectionTitle,
                        {
                          color: colorScheme === 'dark' ? '#E5E7EB' : '#1F2937',
                        },
                      ]}
                    >
                      {section.title}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.sectionSubtitle,
                        {
                          color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
                        },
                      ]}
                    >
                      {section.description}
                    </ThemedText>
                  </View>
                </View>

                {section.data.map(milestone => (
                  <View
                    key={milestone.days}
                    style={[
                      styles.milestoneRow,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#1e293b' : '#ffffff',
                        borderWidth: 1,
                        borderColor: colorScheme === 'dark' ? '#334155' : '#e2e8f0',
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.milestoneRowTitle}>
                        {milestone.label}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.milestoneRowDays,
                          {
                            color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
                          },
                        ]}
                      >
                        {milestone.days} days
                      </ThemedText>
                    </View>
                    <View style={styles.milestoneValueContainer}>
                      <MaterialCommunityIcons
                        name={iconName}
                        size={18}
                        color={primaryColor}
                      />
                      <ThemedText
                        style={[
                          styles.milestoneRowValue,
                          { color: primaryColor },
                        ]}
                      >
                        {isMoney ? milestone.moneySaved : milestone.lifeTimeGained}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ))}
            {milestoneSections.length === 0 && (
              <View style={styles.emptyState}>
                <ThemedText
                  style={[
                    styles.emptyStateText,
                    {
                      color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
                    },
                  ]}
                >
                  No projections available. Start your plan to see progress milestones.
                </ThemedText>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.8,
  },
  planEndCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planEndHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  planEndIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planEndLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  planEndName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  planEndDays: {
    fontSize: 12,
    fontWeight: '500',
  },
  planEndValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    gap: 8,
  },
  planEndMainValue: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  milestoneRowTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  milestoneRowDays: {
    fontSize: 13,
    fontWeight: '500',
  },
  milestoneValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  milestoneRowValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginBottom: 24,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionAccent: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});