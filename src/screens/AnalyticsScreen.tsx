import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStore } from '../store/useStore';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { playClick } from '../utils/audio';

type Props = NativeStackScreenProps<RootStackParamList, 'Analytics'>;

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Expert', 'Olympiad'];

export const AnalyticsScreen: React.FC<Props> = ({ navigation }) => {
  const { elo, highestDifficultyCleared, statsByDifficulty, roundsPlayed, recentRounds, resetStatistics, settings } = useStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { playClick(settings.sfx); navigation.goBack(); }}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ANALYTICS</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <View style={styles.scoreSection}>
          <Text style={styles.sectionLabel}>COGNITIVE SCORE</Text>
          <Text style={styles.scoreValue}>{elo}</Text>
          <View style={styles.rankRow}>
            <View style={styles.line} />
            <Text style={styles.rankText}>{highestDifficultyCleared?.toUpperCase() || 'UNRANKED'}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionLabel}>PERFORMANCE BY DIFFICULTY</Text>
          {DIFFICULTIES.map((diff) => {
            const stats = statsByDifficulty[diff];
            const avgTime = stats?.correctCount ? (stats.totalTime / stats.correctCount).toFixed(2) : '—';
            const bestTime = stats?.bestTime ? stats.bestTime.toFixed(2) : '—';

            return (
              <View key={diff} style={styles.diffRow}>
                <Text style={styles.diffLabel}>{diff}</Text>
                <View style={styles.diffStats}>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxLabel}>BEST</Text>
                    <Text style={styles.statBoxValue}>{bestTime}{bestTime !== '—' && 's'}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxLabel}>AVG</Text>
                    <Text style={styles.statBoxValue}>{avgTime}{avgTime !== '—' && 's'}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionLabel}>RECENT ROUNDS</Text>
            <Text style={styles.recentCount}>{recentRounds.length} / 20</Text>
          </View>
          <View style={styles.recentBlocks}>
            {recentRounds.length === 0 ? (
              <Text style={styles.noDataText}>No recent games</Text>
            ) : (
              recentRounds.map((isCorrect, index) => (
                <View
                  key={index}
                  style={[
                    styles.block,
                    { backgroundColor: isCorrect ? COLORS.green : COLORS.red }
                  ]}
                />
              ))
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={() => { playClick(settings.sfx); resetStatistics(); }}>
          <Text style={styles.resetText}>RESET ALL STATISTICS</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    paddingRight: 20,
  },
  backButton: {
    fontSize: 24,
    color: COLORS.black,
    paddingBottom: 10,
  },
  headerTitle: {
    ...TYPOGRAPHY.subtitle,
    flex: 1,
  },
  scoreSection: {
    padding: 20,
    paddingTop: 40,
  },
  sectionLabel: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  scoreValue: {
    ...TYPOGRAPHY.h1,
    fontSize: 96,
    lineHeight: 96,
    color: COLORS.black,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  line: {
    width: 30,
    height: 1,
    backgroundColor: COLORS.black,
  },
  rankText: {
    ...TYPOGRAPHY.subtitle,
  },
  statsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  diffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '55',
  },
  diffLabel: {
    ...TYPOGRAPHY.h3,
    color: COLORS.black,
    flex: 1,
  },
  diffStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statBox: {
    alignItems: 'flex-end',
    width: 60,
  },
  statBoxLabel: {
    ...TYPOGRAPHY.body,
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statBoxValue: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.black,
  },
  recentSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recentCount: {
    ...TYPOGRAPHY.subtitle,
  },
  recentBlocks: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  block: {
    width: 15,
    height: 15,
    marginBottom: 5,
  },
  noDataText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  resetButton: {
    padding: 20,
    marginTop: 5,
  },
  resetText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textSecondary,
  }
});
