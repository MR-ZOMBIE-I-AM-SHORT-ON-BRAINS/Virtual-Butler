import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { StorageService, Analytics, UserProfile, CallInteraction } from '../lib/storage';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

const InsightsScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [callInteractions, setCallInteractions] = useState<CallInteraction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'lifetime'>('week');

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      const [analyticsData, profile, calls] = await Promise.all([
        StorageService.getAnalytics(),
        StorageService.getUserProfile(),
        StorageService.getCallInteractions(),
      ]);
      
      setAnalytics(analyticsData);
      setUserProfile(profile);
      setCallInteractions(calls);
    } catch (error) {
      console.error('Error loading insights data:', error);
    }
  };

  const calculateStats = () => {
    if (!callInteractions.length) {
      return {
        totalCalls: 0,
        avgCallDuration: 0,
        mostContactedPerson: 'No data',
        totalForgottenItems: 0,
        wakeUpConsistency: 0,
        routineScore: 0,
      };
    }

    const contactCounts: { [key: string]: number } = {};
    let totalDuration = 0;

    callInteractions.forEach(call => {
      contactCounts[call.contactName] = (contactCounts[call.contactName] || 0) + 1;
      totalDuration += call.duration;
    });

    const mostContactedPerson = Object.entries(contactCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'No data';

    return {
      totalCalls: callInteractions.length,
      avgCallDuration: Math.round(totalDuration / callInteractions.length),
      mostContactedPerson,
      totalForgottenItems: analytics?.forgottenItemsCount || 0,
      wakeUpConsistency: analytics?.wakeUpConsistency || 85,
      routineScore: analytics?.routineScore || 75,
    };
  };

  const stats = calculateStats();

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const StatCard = ({ icon, title, value, subtitle, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color={colors.background} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
    </View>
  );

  const PeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['week', 'month', 'year', 'lifetime'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            {
              backgroundColor: selectedPeriod === period
                ? colors.primary
                : colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text
            style={[
              styles.periodText,
              {
                color: selectedPeriod === period
                  ? colors.background
                  : colors.text,
              },
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Insights</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your personal behavior analytics
        </Text>
      </View>

      {/* Period Selector */}
      <PeriodSelector />

      {/* Key Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="call-outline"
          title="Total Calls"
          value={stats.totalCalls}
          color={colors.primary}
        />
        <StatCard
          icon="time-outline"
          title="Avg Call Duration"
          value={formatDuration(stats.avgCallDuration)}
          color={colors.success}
        />
        <StatCard
          icon="person-outline"
          title="Most Contacted"
          value={stats.mostContactedPerson}
          subtitle={`${contactCounts[stats.mostContactedPerson] || 0} calls`}
          color={colors.butlerPrimary}
        />
        <StatCard
          icon="cube-outline"
          title="Forgotten Items"
          value={stats.totalForgottenItems}
          color={colors.warning}
        />
      </View>

      {/* Routine Performance */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Routine Performance</Text>
        
        <View style={styles.performanceItem}>
          <View style={styles.performanceHeader}>
            <Text style={[styles.performanceLabel, { color: colors.text }]}>
              Wake-up Consistency
            </Text>
            <Text
              style={[
                styles.performanceScore,
                { color: getScoreColor(stats.wakeUpConsistency) },
              ]}
            >
              {stats.wakeUpConsistency}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${stats.wakeUpConsistency}%`,
                  backgroundColor: getScoreColor(stats.wakeUpConsistency),
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.performanceItem}>
          <View style={styles.performanceHeader}>
            <Text style={[styles.performanceLabel, { color: colors.text }]}>
              Overall Routine Score
            </Text>
            <Text
              style={[
                styles.performanceScore,
                { color: getScoreColor(stats.routineScore) },
              ]}
            >
              {stats.routineScore}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${stats.routineScore}%`,
                  backgroundColor: getScoreColor(stats.routineScore),
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        
        {userProfile && (
          <View style={styles.activityItem}>
            <Ionicons name="sunny-outline" size={20} color={colors.primary} />
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: colors.text }]}>
                Daily Routine
              </Text>
              <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                Wake up at {userProfile.wakeUpTime}, leave home at {userProfile.leaveHomeTime}
              </Text>
            </View>
          </View>
        )}

        {userProfile?.forgottenItems && userProfile.forgottenItems.length > 0 && (
          <View style={styles.activityItem}>
            <Ionicons name="cube-outline" size={20} color={colors.warning} />
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: colors.text }]}>
                Tracked Items
              </Text>
              <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                {userProfile.forgottenItems.length} items being tracked
              </Text>
            </View>
          </View>
        )}

        {callInteractions.length > 0 && (
          <View style={styles.activityItem}>
            <Ionicons name="call-outline" size={20} color={colors.success} />
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: colors.text }]}>
                Communication
              </Text>
              <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                {stats.totalCalls} calls recorded
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Butler Insights */}
      <View style={[styles.section, { backgroundColor: colors.butlerPrimary }]}>
        <View style={styles.butlerInsightHeader}>
          <Ionicons name="bulb-outline" size={24} color={colors.background} />
          <Text style={[styles.butlerInsightTitle, { color: colors.background }]}>
            Butler's Insights
          </Text>
        </View>
        <Text style={[styles.butlerInsightText, { color: colors.background }]}>
          {stats.wakeUpConsistency >= 80 &&
            "Great job maintaining your morning routine! Consistency is key to productivity."}
          {stats.wakeUpConsistency < 80 && stats.wakeUpConsistency >= 60 &&
            "You're doing well with your routine, but there's room for improvement."}
          {stats.wakeUpConsistency < 60 &&
            "Let's work on improving your routine consistency. Try setting gentle reminders."}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 10,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
    gap: 15,
  },
  statCard: {
    width: (width - 55) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    textAlign: 'center',
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  performanceItem: {
    marginBottom: 20,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  performanceScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  activityContent: {
    marginLeft: 15,
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
  },
  butlerInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  butlerInsightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  butlerInsightText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default InsightsScreen;
