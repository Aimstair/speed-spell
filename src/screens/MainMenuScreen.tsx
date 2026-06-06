import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStore } from '../store/useStore';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SettingsModal } from '../components/SettingsModal';
import { playClick } from '../utils/audio';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { AdNotReadyModal } from '../components/AdNotReadyModal';
import { TutorialModal } from '../components/TutorialModal';
import { ms, scaleY, isSmallDevice } from '../utils/scale';

type Props = NativeStackScreenProps<RootStackParamList, 'MainMenu'>;

const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-8621446085621887/4277287397';

const ARROW = '\u2192'; // Unicode right arrow

export const MainMenuScreen: React.FC<Props> = ({ navigation }) => {
  const { elo, accuracy, roundsPlayed, settings, competeTries, syncDailyTries, addCompeteTry, hasSeenTutorial } = useStore();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adNotReadyVisible, setAdNotReadyVisible] = useState(false);
  const [adError, setAdError] = useState<string | undefined>();
  const rewardedRef = useRef<ReturnType<typeof RewardedAd.createForAdRequest> | null>(null);
  const unsubscribersRef = useRef<(() => void)[]>([]);

  const loadNewAd = useCallback(() => {
    // Clean up previous listeners
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    const ad = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    rewardedRef.current = ad;
    setAdLoaded(false);

    const unsubs = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setAdLoaded(true);
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        addCompeteTry();
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        setAdLoaded(false);
        // Create a fresh instance for the next ad
        loadNewAd();
      }),
      ad.addAdEventListener(AdEventType.ERROR, (error) => {
        setAdError(error?.message || 'Unknown Ad Error');
      }),
    ];
    unsubscribersRef.current = unsubs;

    ad.load();
  }, [addCompeteTry]);

  useEffect(() => {
    loadNewAd();
    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
    };
  }, [loadNewAd]);

  useFocusEffect(
    useCallback(() => {
      syncDailyTries();
    }, [syncDailyTries])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
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
              <Text style={styles.arrow}>{ARROW}</Text>
            </View>
            <Text style={styles.modeSub}>No score impact</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, { backgroundColor: COLORS.compete, opacity: competeTries === 0 ? 0.8 : 1 }]}
            onPress={() => {
              playClick(settings.sfx);
              if (competeTries === 0) {
                if (adLoaded && rewardedRef.current) {
                  rewardedRef.current.show();
                } else {
                  setAdNotReadyVisible(true);
                }
              } else {
                navigation.navigate('Difficulty', { mode: 'compete' });
              }
            }}
          >
            <Text style={styles.modeLabel}>02 — RANKED</Text>
            <View style={styles.modeTitleRow}>
              <Text style={styles.modeTitle}>COMPETE</Text>
              <Text style={styles.arrow}>{ARROW}</Text>
            </View>
            <Text style={styles.modeSub}>{competeTries > 0 ? `${competeTries} TRIES LEFT` : 'WATCH AD FOR 1 TRY'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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

      <AdNotReadyModal
        visible={adNotReadyVisible}
        onClose={() => setAdNotReadyVisible(false)}
        errorMsg={adError}
      />

      <TutorialModal visible={!hasSeenTutorial} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: ms(20),
    paddingTop: scaleY(15),
    paddingBottom: scaleY(15),
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
    paddingHorizontal: ms(20),
    paddingVertical: isSmallDevice ? scaleY(20) : scaleY(40),
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.black,
    lineHeight: ms(70, 0.3),
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleY(20),
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
    paddingVertical: scaleY(15),
  },
  statBox: {
    flex: 1,
    paddingHorizontal: ms(20),
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
    padding: ms(20),
    gap: isSmallDevice ? scaleY(10) : scaleY(15),
    justifyContent: 'center',
  },
  modeButton: {
    padding: ms(18),
    borderRadius: 0,
  },
  modeLabel: {
    ...TYPOGRAPHY.subtitle,
    marginBottom: scaleY(8),
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
    paddingVertical: scaleY(20),
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
