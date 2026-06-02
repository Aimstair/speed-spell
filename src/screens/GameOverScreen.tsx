import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { useStore } from '../store/useStore';

type Props = NativeStackScreenProps<RootStackParamList, 'GameOver'>;

export const GameOverScreen: React.FC<Props> = ({ route, navigation }) => {
  const { consecutiveCorrect, mode, difficulty, roundTotalTime, roundBestTime } = route.params;

  const avgTime = consecutiveCorrect > 0 ? roundTotalTime / consecutiveCorrect : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>GAME</Text>
        <Text style={styles.title}>OVER.</Text>
        <Text style={styles.subtitle}>{mode.charAt(0).toUpperCase() + mode.slice(1)} · {difficulty}</Text>

        <View style={styles.separator} />

        <Text style={styles.label}>ROUNDS COMPLETED</Text>
        <Text style={styles.score}>{consecutiveCorrect}</Text>
        <Text style={styles.subtext}>consecutive correct answers</Text>

        <View style={styles.separator} />

        <View style={styles.statsRow}>
          <View style={styles.statBoxLeft}>
            <Text style={styles.statLabel}>AVG TIME</Text>
            {avgTime ? (
              <Text style={styles.statValue}>{avgTime.toFixed(2)}s</Text>
            ) : (
              <View style={styles.dash} />
            )}
          </View>
          <View style={styles.statBoxRight}>
            <Text style={styles.statLabel}>BEST TIME</Text>
            {roundBestTime ? (
              <Text style={styles.statValue}>{roundBestTime.toFixed(2)}s</Text>
            ) : (
              <View style={styles.dash} />
            )}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.train }]}
          onPress={() => navigation.replace('MainMenu')}
        >
          <Text style={styles.buttonTitle}>MAIN MENU</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.background, borderTopWidth: 1, borderColor: COLORS.border }]}
          onPress={() => navigation.replace('Game', { mode, difficulty })}
        >
          <Text style={styles.buttonTitle}>PLAY AGAIN</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.black,
    lineHeight: 70,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 10,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 30,
  },
  label: {
    ...TYPOGRAPHY.subtitle,
    marginBottom: 10,
  },
  score: {
    ...TYPOGRAPHY.h1,
    fontSize: 96,
    lineHeight: 96,
  },
  subtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statBoxLeft: {
    flex: 1,
    paddingRight: 20,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  statBoxRight: {
    flex: 1,
    paddingRight: 20,
    paddingLeft: 20,
  },
  statLabel: {
    ...TYPOGRAPHY.subtitle,
    marginBottom: 5,
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.black,
  },
  dash: {
    width: 30,
    height: 4,
    backgroundColor: COLORS.black,
    marginTop: 15,
  },
  footer: {
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 10,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
  },
  buttonTitle: {
    ...TYPOGRAPHY.button,
    color: COLORS.black,
  },
  arrow: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
  }
});
