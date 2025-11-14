import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from './themed-text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  calculateProjections,
  getNextMilestone,
  getProgressToNextMilestone,
  ProjectionMilestone,
} from '../helpers/calculate-projections';

interface ProjectionsTimelineProps {
  estimatedSavings: number | null | undefined;
  totalDuration: number | null | undefined;
  daysSinceStart: number;
  age: number | null | undefined;
  smokingHistory: number;
  initialIntake: number | null | undefined;
  currencySymbol?: string;
  colorScheme: 'light' | 'dark';
}

export const ProjectionsTimeline: React.FC<ProjectionsTimelineProps> = ({
  estimatedSavings,
  totalDuration,
  daysSinceStart,
  age,
  smokingHistory,
  initialIntake,
  currencySymbol = '€',
  colorScheme,
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

  const nextMilestone = useMemo(() => {
    return getNextMilestone(projections, daysSinceStart);
  }, [projections, daysSinceStart]);

  const previousMilestone = useMemo(() => {
    const completed = projections.filter(p => p.isCompleted);
    return completed.length > 0 ? completed[completed.length - 1] : null;
  }, [projections, daysSinceStart]);

  const progressToNext = useMemo(() => {
    return getProgressToNextMilestone(daysSinceStart, nextMilestone, previousMilestone);
  }, [daysSinceStart, nextMilestone, previousMilestone]);

  const planEndMilestone = useMemo<ProjectionMilestone | null>(() => {
    return projections.find(p => p.relativePosition === 'plan-end') || null;
  }, [projections]);

  const beforePlanMilestones = useMemo<ProjectionMilestone[]>(() => {
    return projections.filter(p => p.relativePosition === 'before-plan');
  }, [projections]);

  const afterPlanMilestones = useMemo<ProjectionMilestone[]>(() => {
    return projections.filter(p => p.relativePosition === 'after-plan');
  }, [projections]);

  const milestoneSummaryParts: string[] = [];
  if (beforePlanMilestones.length) {
    milestoneSummaryParts.push(
      `${beforePlanMilestones.length} milestone${beforePlanMilestones.length === 1 ? '' : 's'} before goal`
    );
  }
  if (afterPlanMilestones.length) {
    milestoneSummaryParts.push(
      `${afterPlanMilestones.length} milestone${afterPlanMilestones.length === 1 ? '' : 's'} beyond goal`
    );
  }

  if (projections.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Next Milestone Card */}
      {nextMilestone && (
        <View style={[
          styles.nextMilestoneCard,
          { backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF' }
        ]}>
          <View style={styles.nextMilestoneHeader}>
            <View style={[styles.nextMilestoneIcon, { backgroundColor: '#0a7ea420' }]}>
              <MaterialCommunityIcons name="flag-checkered" size={24} color="#0a7ea4" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.nextMilestoneLabel}>Next Milestone</ThemedText>
              <ThemedText style={[styles.nextMilestoneName, { color: '#0a7ea4' }]}>
                {nextMilestone.label}
              </ThemedText>
            </View>
            <View style={[styles.progressCircle, {
              borderColor: '#0a7ea4',
              backgroundColor: '#0a7ea415'
            }]}>
              <ThemedText style={[styles.progressCircleText, { color: '#0a7ea4' }]}>
                {Math.round(progressToNext)}%
              </ThemedText>
            </View>
          </View>

          <View style={styles.nextMilestoneProgress}>
            <View style={[styles.nextMilestoneProgressTrack, {
              backgroundColor: colorScheme === 'dark' ? '#2C2F30' : '#F3F4F6'
            }]}>
              <View style={[
                styles.nextMilestoneProgressFill,
                { width: `${progressToNext}%`, backgroundColor: '#0a7ea4' }
              ]} />
            </View>
          </View>

          <View style={styles.nextMilestoneValues}>
            <View style={styles.nextMilestoneValueItem}>
              <MaterialCommunityIcons 
                name="wallet" 
                size={16} 
                color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} 
              />
              <ThemedText style={styles.nextMilestoneValueLabel}>
                Money Saved
              </ThemedText>
              <ThemedText style={[styles.nextMilestoneValue, { color: '#10b981' }]}>
                {nextMilestone.moneySaved}
              </ThemedText>
            </View>
            <View style={[styles.nextMilestoneDivider, {
              backgroundColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB'
            }]} />
            <View style={styles.nextMilestoneValueItem}>
              <MaterialCommunityIcons
                name="heart-pulse"
                size={16}
                color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
              />
              <ThemedText style={styles.nextMilestoneValueLabel}>
                Life Gained
              </ThemedText>
              <ThemedText style={[styles.nextMilestoneValue, { color: '#ef4444' }]}>
                {nextMilestone.lifeTimeGained}
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* All Milestones Timeline */}
      <View style={styles.timelineSection}>
        <ThemedText style={styles.timelineTitle}>Future Projections</ThemedText>
        <ThemedText
          style={[
            styles.timelineSubtitle,
            {
              color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
            },
          ]}
        >
          See what you'll achieve at different milestones
        </ThemedText>
        {milestoneSummaryParts.length > 0 && (
          <ThemedText
            style={[
              styles.timelineMeta,
              { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' },
            ]}
          >
            {milestoneSummaryParts.join(' • ')}
          </ThemedText>
        )}
        {planEndMilestone && (
          <ThemedText
            style={[
              styles.timelineGoalLabel,
              { color: colorScheme === 'dark' ? '#E5E7EB' : '#1F2937' },
            ]}
          >
            Plan goal at {planEndMilestone.days} days
          </ThemedText>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timelineScroll}
      >
        {projections.map((milestone: ProjectionMilestone) => {
          const isCurrent = milestone.isCurrent;
          const isAfterPlan = milestone.relativePosition === 'after-plan';
          const isPlanEnd = milestone.relativePosition === 'plan-end';
          const badgeLabel = isPlanEnd ? 'Plan Goal' : isAfterPlan ? 'Beyond Goal' : 'Before Goal';
          const badgeColor = isPlanEnd ? '#f59e0b' : isAfterPlan ? '#9333ea' : '#0a7ea4';
          const iconName = isPlanEnd
            ? 'flag-checkered'
            : milestone.isCompleted
            ? 'check-circle'
            : isCurrent
            ? 'clock-fast'
            : 'clock-outline';
          const iconColor = isPlanEnd
            ? '#f59e0b'
            : milestone.isCompleted
            ? '#10b981'
            : isCurrent
            ? '#0a7ea4'
            : '#6B7280';
          const iconBackground = isPlanEnd
            ? '#f59e0b20'
            : milestone.isCompleted
            ? '#10b98120'
            : isCurrent
            ? '#0a7ea420'
            : '#6B728020';
          const cardBorderColor = isPlanEnd
            ? '#f59e0b60'
            : isCurrent
            ? '#0a7ea460'
            : milestone.isCompleted
            ? '#10b98130'
            : 'transparent';

          return (
            <View
              key={milestone.days}
              style={[
                styles.milestoneCard,
                {
                  backgroundColor: colorScheme === 'dark' ? '#1C1F20' : '#FFFFFF',
                  opacity: milestone.isCompleted ? 0.6 : 1,
                  borderColor: cardBorderColor,
                  shadowOpacity: isPlanEnd ? 0.12 : 0.08,
                },
              ]}
            >
              {/* Milestone Icon */}
              <View
                style={[
                  styles.milestoneIconContainer,
                  {
                    backgroundColor: iconBackground,
                  },
                ]}
              >
                <MaterialCommunityIcons name={iconName} size={28} color={iconColor} />
              </View>

              <View
                style={[
                  styles.milestoneBadge,
                  {
                    backgroundColor: `${badgeColor}20`,
                    borderColor: `${badgeColor}40`,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.milestoneBadgeText,
                    { color: badgeColor },
                  ]}
                >
                  {badgeLabel}
                </ThemedText>
              </View>

              {/* Milestone Label */}
              <ThemedText style={styles.milestoneCardLabel}>
                {milestone.label}
              </ThemedText>
              
              {milestone.isCompleted && (
                <View style={styles.completedBadge}>
                  <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                  <ThemedText style={styles.completedBadgeText}>Done</ThemedText>
                </View>
              )}

              {isCurrent && (
                <View
                  style={[
                    styles.currentBadge,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#0a7ea433' : '#0a7ea415',
                      borderColor: colorScheme === 'dark' ? '#0a7ea455' : '#0a7ea433',
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="lightning-bolt" size={12} color="#0a7ea4" />
                  <ThemedText style={styles.currentBadgeText}>Up Next</ThemedText>
                </View>
              )}

              {/* Values */}
              <View style={styles.milestoneCardValues}>
                <View style={styles.milestoneCardValueRow}>
                  <MaterialCommunityIcons name="wallet" size={14} color="#10b981" />
                  <ThemedText style={[styles.milestoneCardValue, { color: '#10b981' }]}>
                    {milestone.moneySaved}
                  </ThemedText>
                </View>
                <View style={styles.milestoneCardValueRow}>
                  <MaterialCommunityIcons name="heart-pulse" size={14} color="#ef4444" />
                  <ThemedText style={[styles.milestoneCardValue, { color: '#ef4444' }]}>
                    {milestone.lifeTimeGained}
                  </ThemedText>
                </View>
              </View>

              {/* Days info */}
              <ThemedText
                style={[
                  styles.milestoneDays,
                  {
                    color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
                  },
                ]}
              >
                {milestone.days} days
              </ThemedText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  nextMilestoneCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  nextMilestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  nextMilestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextMilestoneLabel: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextMilestoneName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  progressCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  nextMilestoneProgress: {
    marginBottom: 16,
  },
  nextMilestoneProgressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  nextMilestoneProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextMilestoneValues: {
    flexDirection: 'row',
    gap: 16,
  },
  nextMilestoneValueItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  nextMilestoneDivider: {
    width: 1,
    height: '100%',
  },
  nextMilestoneValueLabel: {
    fontSize: 11,
    opacity: 0.7,
    fontWeight: '500',
  },
  nextMilestoneValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  timelineSection: {
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timelineSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  timelineScroll: {
    gap: 12,
    paddingRight: 24,
  },
  timelineMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  timelineGoalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  milestoneCard: {
    width: 160,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  milestoneIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  milestoneBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: 8,
  },
  milestoneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  milestoneCardLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    alignSelf: 'center',
    marginBottom: 8,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  milestoneCardValues: {
    gap: 8,
    marginBottom: 12,
  },
  milestoneCardValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  milestoneCardValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  milestoneDays: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
});