import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { useStore } from '../store/useStore';
import { playClick } from '../utils/audio';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { AdNotReadyModal } from '../components/AdNotReadyModal';
import { ms, scaleY, isSmallDevice } from '../utils/scale';

type Props = NativeStackScreenProps<RootStackParamList, 'GameOver'>;

const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-8621446085621887/9691660948';

const ARROW = '\u2192';

export const GameOverScreen: React.FC<Props> = ({ route, navigation }) => {
  const { consecutiveCorrect, mode, difficulty, roundTotalTime, roundBestTime, isWin, eloDelta } = route.params;
  const { settings, elo, competeTries, consumeCompeteTry, addCompeteTry } = useStore();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adNotReadyVisible, setAdNotReadyVisible] = useState(false);
  const [adError, setAdError] = useState<string | undefined>();
  const rewardedRef = useRef<ReturnType<typeof RewardedAd.createForAdRequest> | null>(null);
  const unsubscribersRef = useRef<(() => void)[]>([]);

  const loadNewAd = useCallback(() => {
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

  const avgTime = consecutiveCorrect > 0 ? roundTotalTime / consecutiveCorrect : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.content}>
          {mode === 'compete' ? (
            <>
              <Text style={styles.title}>YOU</Text>
              <Text style={styles.title}>{isWin ? 'WON!' : 'LOST.'}</Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>GAME</Text>
              <Text style={styles.title}>OVER.</Text>
            </>
          )}
          <Text style={styles.subtitle}>{mode.charAt(0).toUpperCase() + mode.slice(1)} · {difficulty}</Text>

          <View style={styles.separator} />

          {mode === 'compete' ? (
            <>
              <Text style={styles.label}>TIME TAKEN</Text>
              <Text style={styles.scoreCompete}>{roundTotalTime ? roundTotalTime.toFixed(2) + 's' : '\u2014'}</Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>ROUNDS COMPLETED</Text>
              <Text style={styles.score}>{consecutiveCorrect}</Text>
              <Text style={styles.subtext}>words spelled correctly</Text>
            </>
          )}

          <View style={styles.separator} />

          {mode === 'compete' ? (
            <View style={styles.statsRow}>
              <View style={styles.statBoxLeft}>
                <Text style={styles.statLabel}>ELO CHANGE</Text>
                <Text style={styles.statValue}>
                  {eloDelta !== undefined && eloDelta > 0 ? `+${eloDelta}` : eloDelta}
                </Text>
              </View>
              <View style={styles.statBoxRight}>
                <Text style={styles.statLabel}>NEW ELO</Text>
                <Text style={styles.statValue}>{elo}</Text>
              </View>
            </View>
          ) : (
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
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.train }]}
          onPress={() => { playClick(settings.sfx); navigation.replace('MainMenu'); }}
        >
          <Text style={styles.buttonTitle}>MAIN MENU</Text>
          <Text style={styles.arrow}>{ARROW}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.background, borderTopWidth: 1, borderColor: COLORS.border }]}
          onPress={() => {
            playClick(settings.sfx);
            if (mode === 'compete' && competeTries === 0) {
              if (adLoaded && rewardedRef.current) {
                rewardedRef.current.show();
              } else {
                setAdNotReadyVisible(true);
              }
              return;
            }
            if (mode === 'compete') {
              const success = consumeCompeteTry();
              if (!success) return;
            }
            navigation.replace('Game', { mode, difficulty });
          }}
        >
          <Text style={styles.buttonTitle}>
            {mode === 'compete' && competeTries === 0 ? 'WATCH AD FOR 1 TRY' : 'PLAY AGAIN'}
          </Text>
          <Text style={styles.arrow}>{ARROW}</Text>
        </TouchableOpacity>
      </View>

      <AdNotReadyModal
        visible={adNotReadyVisible}
        onClose={() => setAdNotReadyVisible(false)}
        errorMsg={adError}
      />
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
  content: {
    flex: 1,
    padding: ms(20),
    paddingTop: isSmallDevice ? scaleY(30) : scaleY(60),
    paddingBottom: scaleY(20),
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.black,
    lineHeight: ms(70, 0.3),
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: scaleY(10),
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: isSmallDevice ? scaleY(20) : scaleY(30),
  },
  label: {
    ...TYPOGRAPHY.subtitle,
    marginBottom: scaleY(10),
  },
  score: {
    ...TYPOGRAPHY.h1,
    fontSize: ms(96, 0.3),
    lineHeight: ms(96, 0.3),
  },
  scoreCompete: {
    ...TYPOGRAPHY.h1,
    fontSize: ms(72, 0.3),
    lineHeight: ms(80, 0.3),
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
    paddingRight: ms(20),
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  statBoxRight: {
    flex: 1,
    paddingRight: ms(20),
    paddingLeft: ms(20),
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
    padding: ms(20),
    paddingBottom: scaleY(10),
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ms(22),
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
