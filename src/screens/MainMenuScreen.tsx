import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStore } from '../store/useStore';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SettingsModal } from '../components/SettingsModal';
import { playClick } from '../utils/audio';

type Props = NativeStackScreenProps<RootStackParamList, 'MainMenu'>;

export const MainMenuScreen: React.FC<Props> = ({ navigation }) => {
  const { elo, accuracy, roundsPlayed, settings } = useStore();
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* <Text style={styles.headerText}>SPEED MATH</Text>
        <Text style={styles.eloText}><Text style={styles.eloBold}>{elo}</Text> ELO</Text> */}
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>SPEED</Text>
        <Text style={styles.title}>MATH.</Text>
        <View style={styles.subtitleRow}>
          <View style={styles.line} />
          <Text style={styles.subtitle}>MENTAL ARITHMETIC TRAINING</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>ELO</Text>
          <Text style={styles.statValue}>{elo}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>ACCURACY</Text>
          <Text style={styles.statValue}>{accuracy}%</Text>
        </View>
        <View style={[styles.statBox, { borderRightWidth: 0 }]}>
          <Text style={styles.statLabel}>ROUNDS</Text>
          <Text style={styles.statValue}>{roundsPlayed}</Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.modeButton, { backgroundColor: COLORS.train }]}
          onPress={() => { playClick(settings.sfx); navigation.navigate('Difficulty', { mode: 'train' }); }}
        >
          <Text style={styles.modeLabel}>01 — PRACTICE</Text>
          <View style={styles.modeTitleRow}>
            <Text style={styles.modeTitle}>TRAIN</Text>
            <Text style={styles.arrow}>→</Text>
          </View>
          <Text style={styles.modeSub}>No score impact</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, { backgroundColor: COLORS.compete }]}
          onPress={() => { playClick(settings.sfx); navigation.navigate('Difficulty', { mode: 'compete' }); }}
        >
          <Text style={styles.modeLabel}>02 — RANKED</Text>
          <View style={styles.modeTitleRow}>
            <Text style={styles.modeTitle}>COMPETE</Text>
            <Text style={styles.arrow}>→</Text>
          </View>
          <Text style={styles.modeSub}>ELO changes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={() => { playClick(settings.sfx); navigation.navigate('Analytics'); }}>
          <Text style={styles.footerText}>ANALYTICS</Text>
        </TouchableOpacity>
        <View style={styles.footerDivider} />
        <TouchableOpacity style={styles.footerButton} onPress={() => { playClick(settings.sfx); setSettingsVisible(true); }}>
          <Text style={styles.footerText}>SETTINGS</Text>
        </TouchableOpacity>
      </View>

      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerText: {
    ...TYPOGRAPHY.subtitle,
  },
  eloText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textSecondary,
  },
  eloBold: {
    color: COLORS.black,
    fontWeight: '800',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.black,
    lineHeight: 70,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  line: {
    width: 30,
    height: 1,
    backgroundColor: COLORS.black,
  },
  subtitle: {
    ...TYPOGRAPHY.subtitle,
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 15,
  },
  statBox: {
    flex: 1,
    paddingHorizontal: 20,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  statLabel: {
    ...TYPOGRAPHY.subtitle,
    marginBottom: 5,
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
  },
  buttonsContainer: {
    flex: 1,
    padding: 20,
    gap: 15,
  },
  modeButton: {
    padding: 20,
    borderRadius: 0,
  },
  modeLabel: {
    ...TYPOGRAPHY.subtitle,
    marginBottom: 10,
    color: COLORS.textSecondary,
  },
  modeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
  },
  arrow: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
  },
  modeSub: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  footerText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textSecondary,
  }
});
