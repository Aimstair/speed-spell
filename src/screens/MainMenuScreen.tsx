import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStore } from '../store/useStore';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { SettingsModal } from '../components/SettingsModal';
import { playClick } from '../utils/audio';
import { CustomAlertModal, CustomAlertButton } from '../components/CustomAlertModal';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { AdNotReadyModal } from '../components/AdNotReadyModal';
import { TutorialModal } from '../components/TutorialModal';
import { getTierForElo, getTierProgress } from '../utils/tiers';
import { ms, scaleY, isSmallDevice } from '../utils/scale';
import { checkAppVersion } from '../utils/versionCheck';
import { scheduleRetentionNotifications, scheduleStreakReminder, scheduleGraveyardReminder } from '../utils/notifications';
import { getLocalTodayString } from '../utils/daily';
import WORDS_DB from '../utils/words.json';

type Props = NativeStackScreenProps<RootStackParamList, 'MainMenu'>;

const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-8621446085621887/9691660948';

const ARROW = '\u2192'; // Unicode right arrow

let hasShownRatePopup = false;

const getDailyWords = () => {
  const dateStr = getLocalTodayString();
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) seed += dateStr.charCodeAt(i);
  const db = (WORDS_DB as any)['Intermediate'];
  return [0, 1, 2, 3, 4].map(i => db[(seed + i * 31) % db.length]);
};

export const MainMenuScreen: React.FC<Props> = ({ navigation }) => {
  const { elo, accuracy, roundsPlayed, settings, competeTries, syncDailyTries, addCompeteTry, hasSeenTutorial, dailyChallenge, weakWords } = useStore();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adNotReadyVisible, setAdNotReadyVisible] = useState(false);
  const [adError, setAdError] = useState<string | undefined>();
  const rewardedRef = useRef<ReturnType<typeof RewardedAd.createForAdRequest> | null>(null);
  const unsubscribersRef = useRef<(() => void)[]>([]);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<CustomAlertButton[]>([]);

  const showAlert = (title: string, message: string, buttons?: CustomAlertButton[]) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(buttons || [{ text: "OK", onPress: () => setAlertVisible(false) }]);
    setAlertVisible(true);
  };

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
    (async () => {
      const isUpdateAvailable = await checkAppVersion();
      if (isUpdateAvailable) {
        showAlert(
          "Update Available",
          "A new version of Speed Spell is available. Please update to continue enjoying the best experience.",
          [
            { text: "Later", style: "cancel", onPress: () => setAlertVisible(false) },
            {
              text: "Update", onPress: () => {
                Linking.openURL('market://details?id=com.aimteralabs.speedspell').catch(() => {
                  Linking.openURL('https://play.google.com/store/apps/details?id=com.aimteralabs.speedspell');
                });
                setAlertVisible(false);
              }
            }
          ]
        );
      }
    })();
  }, []);

  useEffect(() => {
    loadNewAd();
    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
    };
  }, [loadNewAd]);

  useFocusEffect(
    useCallback(() => {
      syncDailyTries();

      // Schedule retention notifications
      scheduleRetentionNotifications();
      scheduleGraveyardReminder(weakWords.length);

      const hasPlayedToday = dailyChallenge.lastDate === getLocalTodayString();
      scheduleStreakReminder(dailyChallenge.streak, hasPlayedToday);

    }, [syncDailyTries, weakWords.length, dailyChallenge])
  );

  useEffect(() => {
    if (!hasShownRatePopup && hasSeenTutorial) {
      hasShownRatePopup = true;
      showAlert(
        "Enjoying Speed Spell?",
        "Please take a moment to rate us on the Play Store!",
        [
          { text: "Cancel", style: "cancel", onPress: () => setAlertVisible(false) },
          {
            text: "Rate App",
            onPress: () => {
              setAlertVisible(false);
              Linking.openURL('market://details?id=com.aimteralabs.speedspell').catch(() => {
                Linking.openURL('https://play.google.com/store/apps/details?id=com.aimteralabs.speedspell');
              });
            }
          }
        ]
      );
    }
  }, [hasSeenTutorial]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.header}>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>SPEED</Text>
          <Text style={styles.title}>SPELL.</Text>
          <View style={styles.subtitleRow}>
            <View style={styles.line} />
            <Text style={styles.subtitle}>SPELLING BEE TRAINING</Text>
          </View>
        </View>

        {/* <View style={[styles.tierCard, { borderColor: getTierForElo(elo).color }]}>
          <View style={styles.tierHeaderRow}>
            <Text style={styles.tierIcon}>{getTierForElo(elo).icon}</Text>
            <View style={{ flex: 1, marginLeft: ms(12) }}>
              <Text style={styles.tierName}>{getTierForElo(elo).name.toUpperCase()}</Text>
              <Text style={styles.tierElo}>{elo} ELO</Text>
            </View>
          </View>
          <View style={styles.tierProgressTrack}>
            <View style={[styles.tierProgressFill, { width: `${getTierProgress(elo) * 100}%`, backgroundColor: getTierForElo(elo).color }]} />
          </View>
        </View> */}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border }}>
          <View style={[styles.statsContainer, { borderTopWidth: 0, borderBottomWidth: 0 }]}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>STREAK</Text>
              <Text style={styles.statValue}>{dailyChallenge.streak}</Text>
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
        </ScrollView>

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
            <Text style={styles.modeSub}>Earn ELO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, { backgroundColor: COLORS.compete }]}
            onPress={() => { playClick(settings.sfx); navigation.navigate('GameModes'); }}
          >
            <Text style={styles.modeLabel}>02 — CUSTOM</Text>
            <View style={styles.modeTitleRow}>
              <Text style={styles.modeTitle}>GAME MODES</Text>
              <Text style={styles.arrow}>{ARROW}</Text>
            </View>
            <Text style={styles.modeSub}>Daily Challenge, Graveyard, and Custom</Text>
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
  tierCard: {
    marginHorizontal: ms(20),
    marginBottom: scaleY(15),
    padding: ms(15),
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: ms(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  tierHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleY(10),
  },
  tierIcon: {
    fontSize: ms(32),
  },
  tierName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.black,
  },
  tierElo: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  tierProgressTrack: {
    height: ms(8),
    backgroundColor: COLORS.border,
    borderRadius: ms(4),
    overflow: 'hidden',
  },
  tierProgressFill: {
    height: '100%',
    borderRadius: ms(4),
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: scaleY(15),
  },
  statBox: {
    width: ms(130),
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
    opacity: 0.8,
  },
  themeButton: {
    paddingVertical: scaleY(15),
    paddingHorizontal: ms(20),
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 8,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  themeTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: ms(16),
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
