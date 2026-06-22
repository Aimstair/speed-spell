import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStore } from '../store/useStore';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { playClick } from '../utils/audio';
import { ms, scaleY, isSmallDevice } from '../utils/scale';

const BACK_ARROW = '\u2190';

type Props = NativeStackScreenProps<RootStackParamList, 'Analytics'>;

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Expert', 'Olympiad'];

export const AnalyticsScreen: React.FC<Props> = ({ navigation }) => {
  const { elo, highestDifficultyCleared, statsByDifficulty, recentRounds, resetStatistics, settings, highestStreak, lifelinesUsed, wordsMastered, eloHistory, achievements, typoHistory } = useStore();
  const [resetModalVisible, setResetModalVisible] = useState(false);

  const getTypoInsights = () => {
    if (!typoHistory || typoHistory.length < 3) return "Keep playing! We need more data to analyze your spelling patterns.";

    let ieEiCount = 0;
    let doubleConsonantCount = 0;
    let silentECount = 0;

    typoHistory.forEach(t => {
      const { expected, actual } = t;

      if ((expected.includes('ie') && actual.includes('ei')) || (expected.includes('ei') && actual.includes('ie'))) {
        ieEiCount++;
      }

      const doubleConsonantMatch = expected.match(/([a-z])\1/i);
      if (doubleConsonantMatch) {
        const single = doubleConsonantMatch[1];
        if (actual.includes(single) && !actual.includes(doubleConsonantMatch[0])) {
          doubleConsonantCount++;
        }
      }

      if (expected.endsWith('e') && !expected.endsWith('ee') && !actual.endsWith('e')) {
        silentECount++;
      }
    });

    const maxPitfall = Math.max(ieEiCount, doubleConsonantCount, silentECount);
    if (maxPitfall < 2) return "Keep playing! We need more data to find your weak patterns.";

    if (maxPitfall === ieEiCount) return "Insight: You frequently mix up 'ie' and 'ei'. Remember: 'i' before 'e', except after 'c'!";
    if (maxPitfall === doubleConsonantCount) return "Insight: You often miss Double Consonants. Pay close attention to words with double letters!";
    if (maxPitfall === silentECount) return "Insight: You sometimes forget the Silent 'E' at the end of words.";

    return "No major weak patterns detected yet.";
  };

  const getFavoriteLifeline = () => {
    const { define, origin, sentence } = lifelinesUsed;
    if (define === 0 && origin === 0 && sentence === 0) return 'None Yet';
    if (define >= origin && define >= sentence) return '📖 Definition';
    if (origin >= define && origin >= sentence) return '🌍 Origin';
    return '💬 Sentence';
  };

  const ACHIEVEMENTS_DATA: Record<string, { title: string, desc: string, icon: string }> = {
    'olympiad_scholar': { title: 'Olympiad Scholar', desc: 'Cleared the Olympiad difficulty', icon: '🏆' },
    'vocabulary_master': { title: 'Vocabulary Master', desc: 'Mastered 100+ words', icon: '🧠' }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { playClick(settings.sfx); navigation.goBack(); }}>
          <Text style={styles.backButton}>{BACK_ARROW}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ANALYTICS</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <View style={styles.scoreSection}>
          <Text style={styles.sectionLabel}>LINGUISTIC ELO</Text>
          <Text style={styles.scoreValue}>{elo}</Text>
          <View style={styles.rankRow}>
            <View style={styles.line} />
            <Text style={styles.rankText}>{highestDifficultyCleared?.toUpperCase() || 'UNRANKED'}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionLabel}>LIFETIME STATS</Text>
          <View style={styles.lifetimeRow}>
            <View style={styles.lifetimeBox}>
              <Text style={styles.lifetimeValue}>{highestStreak}</Text>
              <Text style={styles.lifetimeLabel}>HIGHEST STREAK</Text>
            </View>
            <View style={styles.lifetimeBox}>
              <Text style={styles.lifetimeValue}>{wordsMastered.length}</Text>
              <Text style={styles.lifetimeLabel}>WORDS MASTERED</Text>
            </View>
          </View>

          <View style={styles.favoriteLifelineBox}>
            <Text style={styles.lifetimeLabel}>FAVORITE LIFELINE</Text>
            <Text style={styles.favoriteLifelineText}>{getFavoriteLifeline()}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionLabel}>PERFORMANCE BY DIFFICULTY</Text>
          {DIFFICULTIES.map((diff) => {
            const stats = statsByDifficulty[diff];
            const wordsSpelled = stats?.correctCount || 0;
            const avgTime = stats && stats.correctCount > 0 ? (stats.totalTime / stats.correctCount).toFixed(2) : '—';

            return (
              <View key={diff} style={styles.diffRow}>
                <Text style={styles.diffLabel}>{diff}</Text>
                <View style={styles.diffStats}>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxLabel}>WORDS</Text>
                    <Text style={styles.statBoxValue}>{wordsSpelled}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxLabel}>AVG TIME</Text>
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
            <Text style={styles.recentCount}>{recentRounds.length} / 50</Text>
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

        <View style={styles.statsContainer}>
          <Text style={styles.sectionLabel}>PROGRESS GRAPH (30 DAYS)</Text>
          {eloHistory && eloHistory.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, alignItems: 'flex-end', height: 100, marginTop: 10 }}>
              {eloHistory.map((h, i) => {
                const maxElo = Math.max(...eloHistory.map(eh => eh.elo), 1200);
                const barHeight = Math.max((h.elo / maxElo) * 100, 10);
                return (
                  <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>{h.elo}</Text>
                    <View style={{ width: 24, height: barHeight, backgroundColor: COLORS.black, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>No progress data yet</Text>
          )}
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
          {achievements && achievements.length > 0 ? (
            <View style={{ gap: 10, marginTop: 10 }}>
              {achievements.map(a => {
                const data = ACHIEVEMENTS_DATA[a];
                if (!data) return null;
                return (
                  <View key={a} style={{ flexDirection: 'row', alignItems: 'center', gap: 15, padding: 15, backgroundColor: COLORS.white, borderWidth: 2, borderRadius: 8 }}>
                    <Text style={{ fontSize: 32 }}>{data.icon}</Text>
                    <View>
                      <Text style={{ ...TYPOGRAPHY.h3, fontSize: 16 }}>{data.title}</Text>
                      <Text style={{ ...TYPOGRAPHY.body, color: COLORS.textSecondary, fontSize: 12 }}>{data.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noDataText}>No achievements unlocked yet</Text>
          )}
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionLabel}>DEEP LEARNING INSIGHTS</Text>
          <View style={{ backgroundColor: '#F3F4F6', padding: 15, borderRadius: 8, marginTop: 10 }}>
            <Text style={{ ...TYPOGRAPHY.body, color: COLORS.black, fontStyle: 'italic' }}>
              {getTypoInsights()}
            </Text>
          </View>
        </View>


        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            playClick(settings.sfx);
            setResetModalVisible(true);
          }}
        >
          <Text style={styles.resetText}>RESET ALL STATISTICS</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={resetModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setResetModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>RESET STATISTICS?</Text>
                <Text style={styles.modalBody}>
                  This action cannot be undone. All your progress, ELO, and words mastered will be lost.
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => { playClick(settings.sfx); setResetModalVisible(false); }}
                  >
                    <Text style={styles.modalButtonTextCancel}>CANCEL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={() => {
                      playClick(settings.sfx);
                      setResetModalVisible(false);
                      resetStatistics();
                      navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
                    }}
                  >
                    <Text style={styles.modalButtonTextConfirm}>RESET</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    paddingHorizontal: ms(20),
    paddingTop: scaleY(10),
    paddingBottom: scaleY(5),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    paddingRight: ms(20),
  },
  backButton: {
    fontSize: ms(24),
    color: COLORS.black,
    paddingBottom: scaleY(10),
  },
  headerTitle: {
    ...TYPOGRAPHY.subtitle,
    flex: 1,
  },
  scoreSection: {
    padding: ms(20),
    paddingTop: isSmallDevice ? scaleY(25) : scaleY(40),
  },
  sectionLabel: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textSecondary,
    marginBottom: scaleY(10),
  },
  scoreValue: {
    ...TYPOGRAPHY.h1,
    fontSize: ms(96, 0.3),
    lineHeight: ms(96, 0.3),
    color: COLORS.black,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleY(10),
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
    padding: ms(20),
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  lifetimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleY(15),
  },
  lifetimeBox: {
    flex: 1,
    alignItems: 'flex-start',
  },
  lifetimeValue: {
    ...TYPOGRAPHY.h2,
    fontSize: ms(32, 0.3),
    color: COLORS.black,
  },
  lifetimeLabel: {
    ...TYPOGRAPHY.body,
    fontSize: ms(10, 0.3),
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  favoriteLifelineBox: {
    paddingTop: scaleY(10),
    borderTopWidth: 1,
    borderTopColor: COLORS.border + '55',
  },
  favoriteLifelineText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.black,
    marginTop: 4,
  },
  diffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scaleY(15),
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
    gap: ms(20),
  },
  statBox: {
    alignItems: 'flex-end',
    width: ms(70),
  },
  statBoxLabel: {
    ...TYPOGRAPHY.body,
    fontSize: ms(10, 0.3),
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statBoxValue: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.black,
  },
  recentSection: {
    padding: ms(20),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleY(15),
  },
  recentCount: {
    ...TYPOGRAPHY.subtitle,
  },
  recentBlocks: {
    flexDirection: 'row',
    gap: ms(4),
    flexWrap: 'wrap',
  },
  block: {
    width: ms(12),
    height: ms(12),
    marginBottom: ms(4),
  },
  noDataText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  resetButton: {
    padding: ms(20),
    marginTop: 5,
  },
  resetText: {
    ...TYPOGRAPHY.button,
    color: COLORS.darkRed,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: ms(20),
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: ms(24),
    width: '100%',
    maxWidth: ms(400),
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
    marginBottom: scaleY(10),
  },
  modalBody: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: scaleY(24),
    lineHeight: ms(20, 0.3),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: ms(12),
  },
  modalButton: {
    flex: 1,
    paddingVertical: scaleY(14),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.darkRed,
  },
  modalButtonTextCancel: {
    ...TYPOGRAPHY.button,
    color: COLORS.black,
  },
  modalButtonTextConfirm: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  }
});
