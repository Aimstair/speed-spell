import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, BackHandler, ScrollView } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStore } from '../store/useStore';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { Keyboard } from '../components/Keyboard';
import { SecondChanceModal } from '../components/SecondChanceModal';
import { QuitGameModal } from '../components/QuitGameModal';
import { AdNotReadyModal } from '../components/AdNotReadyModal';
import { VoiceWave } from '../components/VoiceWave';
import { LifelineType } from '../components/LifelineBar';
import { AnswerTimer } from '../components/AnswerTimer';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { playClick, playSoundEffect } from '../utils/audio';
import { ms, scaleY } from '../utils/scale';
import WORDS_DB from '../utils/words.json';

const BACK_ARROW = '\u2190';
const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-8621446085621887/9691660948';

const INITIAL_LIFELINES = 3;

const TIME_LIMITS: Record<string, number> = {
  Beginner: 30,
  Intermediate: 25,
  Expert: 20,
  Olympiad: 15,
};

const LIFELINE_CONFIG: { type: LifelineType; icon: string; label: string }[] = [
  { type: 'define', icon: '📖', label: 'Define' },
  { type: 'origin', icon: '🌍', label: 'Origin' },
  { type: 'sentence', icon: '💬', label: 'Sentence' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export const GameScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode, difficulty } = route.params;
  const { settings, recordRound, updateHighestStreak } = useStore();

  const [phase, setPhase] = useState<'COUNTDOWN' | 'DICTATION' | 'INPUT' | 'RESOLUTION'>('COUNTDOWN');
  const [countdown, setCountdown] = useState(3);

  const [targetWord, setTargetWord] = useState('');
  const [targetDefinition, setTargetDefinition] = useState('');
  const [targetOrigin, setTargetOrigin] = useState('');
  const [targetSentence, setTargetSentence] = useState('');

  const [inputValue, setInputValue] = useState('');
  const [penaltySeconds, setPenaltySeconds] = useState(0);

  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [roundTotalTime, setRoundTotalTime] = useState(0);
  const [roundBestTime, setRoundBestTime] = useState<number | null>(null);

  // Lifeline state — fixed pool for the entire game session
  const [lifelinesRemaining, setLifelinesRemaining] = useState(INITIAL_LIFELINES);
  const [usedThisWord, setUsedThisWord] = useState<Set<LifelineType>>(new Set());
  const [activeHint, setActiveHint] = useState<{ icon: string; text: string } | null>(null);
  const [hasUsedAdRefill, setHasUsedAdRefill] = useState(false);

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerKey, setTimerKey] = useState(0); // force remount on new round
  const timeLimit = TIME_LIMITS[difficulty] || 25;

  // Ad / modal state
  const [secondChanceVisible, setSecondChanceVisible] = useState(false);
  const [quitModalVisible, setQuitModalVisible] = useState(false);
  const [hasRetried, setHasRetried] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adNotReadyVisible, setAdNotReadyVisible] = useState(false);
  const [adError, setAdError] = useState<string | undefined>();

  // Use a ref to track ad mode so the callback closure always reads the latest value
  const lifelineAdModeRef = useRef(false);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolutionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rewardedRef = useRef<ReturnType<typeof RewardedAd.createForAdRequest> | null>(null);
  const adUnsubscribersRef = useRef<(() => void)[]>([]);

  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const bgColorAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const playSound = (type: 'beep' | 'correct' | 'wrong' | 'tick') => {
    playSoundEffect(type, settings.sfx);
  };

  const loadNewAd = useCallback(() => {
    adUnsubscribersRef.current.forEach(unsub => unsub());
    adUnsubscribersRef.current = [];

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
        // Use the ref (not state) to check ad mode — avoids stale closure
        if (lifelineAdModeRef.current) {
          setLifelinesRemaining(prev => Math.min(prev + 1, INITIAL_LIFELINES));
          setHasUsedAdRefill(true);
          lifelineAdModeRef.current = false;
          // Resume timer after ad
          setTimerRunning(true);
        } else {
          // Second chance (existing behavior)
          setSecondChanceVisible(false);
          setHasRetried(true);
          startRound();
        }
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        setAdLoaded(false);
        // If ad was closed without reward, resume timer
        if (lifelineAdModeRef.current) {
          lifelineAdModeRef.current = false;
          setTimerRunning(true);
        }
        loadNewAd();
      }),
      ad.addAdEventListener(AdEventType.ERROR, (error) => {
        setAdError(error?.message || 'Unknown Ad Error');
        // Resume timer on error
        if (lifelineAdModeRef.current) {
          lifelineAdModeRef.current = false;
          setTimerRunning(true);
        }
      }),
    ];
    adUnsubscribersRef.current = unsubs;

    ad.load();
  }, []);

  useEffect(() => {
    loadNewAd();
    return () => {
      adUnsubscribersRef.current.forEach(unsub => unsub());
    };
  }, [loadNewAd]);

  useEffect(() => {
    startRound();
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (resolutionTimeoutRef.current) clearTimeout(resolutionTimeoutRef.current);
      Speech.stop();
    };
  }, []);



  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const startRound = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (resolutionTimeoutRef.current) clearTimeout(resolutionTimeoutRef.current);

    setPhase('COUNTDOWN');
    setCountdown(3);
    setInputValue('');
    setPenaltySeconds(0);
    setTimerRunning(false);
    setTimerKey(prev => prev + 1);
    bgColorAnim.setValue(0);
    playSound('tick');

    // Reset per-word lifeline state (but NOT the global pool)
    setUsedThisWord(new Set());
    setActiveHint(null);

    const wordsArray = WORDS_DB[difficulty as keyof typeof WORDS_DB] || WORDS_DB['Intermediate'];
    const randomItem = wordsArray[Math.floor(Math.random() * wordsArray.length)];
    setTargetWord(randomItem.word.toUpperCase());
    setTargetDefinition(randomItem.definition);
    setTargetOrigin((randomItem as any).origin || 'Unknown');
    setTargetSentence((randomItem as any).sentence || 'No example sentence available.');

    let currentCount = 3;
    countdownIntervalRef.current = setInterval(() => {
      currentCount--;
      if (currentCount > 0) {
        setCountdown(currentCount);
        playSound('tick');
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        startDictation(randomItem.word);
      }
    }, 800);
  };

  const startDictation = (word: string) => {
    setPhase('DICTATION');
    Speech.stop();
    Speech.speak(word.toLowerCase(), {
      language: 'en-US',
      rate: 0.75,
      onDone: () => {
        startInput();
      },
      onError: () => {
        startInput();
      }
    });
  };

  const handleRepeat = () => {
    if (phase !== 'INPUT') return;
    const penalty = difficulty === 'Olympiad' ? 4 : 2;
    setPenaltySeconds(prev => prev + penalty);
    Speech.stop();
    Speech.speak(targetWord.toLowerCase(), { language: 'en-US', rate: 1 });
  };

  const startInput = () => {
    setPhase('INPUT');
    setStartTime(Date.now());
    setTimerRunning(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      duration: 300,
    }).start();
  };

  const handleInput = (val: string) => {
    if (phase !== 'INPUT') return;
    if (inputValue.length >= 25) return;
    setInputValue(prev => prev + val);
    if (settings.sfx) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleClear = () => {
    if (phase !== 'INPUT') return;
    setInputValue(prev => prev.slice(0, -1));
    if (settings.sfx) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTimerExpire = () => {
    if (phase !== 'INPUT') return;
    setTimerRunning(false);
    handleSubmitInternal(inputValue);
  };

  const handleSubmit = () => {
    if (phase !== 'INPUT' || inputValue === '') return;
    setTimerRunning(false);
    handleSubmitInternal(inputValue);
  };

  const handleSubmitInternal = (submittedValue: string) => {
    const timeTaken = ((Date.now() - startTime) / 1000) + penaltySeconds;
    const isCorrect = submittedValue.toUpperCase() === targetWord.toUpperCase();

    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').height,
      useNativeDriver: true,
      duration: 200,
    }).start();

    setPhase('RESOLUTION');

    setTimeout(() => {
      Animated.timing(bgColorAnim, {
        toValue: isCorrect ? 1 : -1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }, 100);

    if (isCorrect) {
      playSound('correct');
      if (settings.sfx) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setConsecutiveCorrect(prev => prev + 1);
      updateHighestStreak(consecutiveCorrect + 1);
      setRoundTotalTime(prev => prev + timeTaken);
      setRoundBestTime(prev => prev === null ? timeTaken : Math.min(prev, timeTaken));

      if (mode === 'compete') {
        const delta = recordRound(true, timeTaken, difficulty, mode, targetWord);
        resolutionTimeoutRef.current = setTimeout(() => {
          navigation.replace('GameOver', {
            consecutiveCorrect: consecutiveCorrect + 1,
            mode,
            difficulty,
            roundTotalTime: roundTotalTime + timeTaken,
            roundBestTime: roundBestTime ? Math.min(roundBestTime, timeTaken) : timeTaken,
            isWin: true,
            eloDelta: delta
          });
        }, 1500);
      } else {
        recordRound(true, timeTaken, difficulty, mode, targetWord);
        resolutionTimeoutRef.current = setTimeout(() => {
          startRound();
        }, 1000);
      }
    } else {
      playSound('wrong');
      if (settings.sfx) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (settings.screenShake) {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
      }

      if (mode === 'compete') {
        const delta = recordRound(false, null, difficulty, mode, targetWord);
        resolutionTimeoutRef.current = setTimeout(() => {
          navigation.replace('GameOver', {
            consecutiveCorrect,
            mode,
            difficulty,
            roundTotalTime,
            roundBestTime,
            isWin: false,
            eloDelta: delta
          });
        }, 1500);
      } else {
        resolutionTimeoutRef.current = setTimeout(() => {
          if (!hasRetried) {
            setSecondChanceVisible(true);
          } else {
            navigation.replace('GameOver', {
              consecutiveCorrect,
              mode,
              difficulty,
              roundTotalTime,
              roundBestTime
            });
          }
        }, 1500);
      }
    }
  };

  const handleLifelineUse = (type: LifelineType) => {
    if (usedThisWord.has(type) || lifelinesRemaining <= 0 || phase !== 'INPUT') return;

    setUsedThisWord(prev => new Set(prev).add(type));
    setLifelinesRemaining(prev => prev - 1);

    const store = useStore.getState();
    if (store.recordLifelineUsage) store.recordLifelineUsage(type);

    // Show only the tapped hint (replaces any previous one to keep UI clean)
    const config = LIFELINE_CONFIG.find(c => c.type === type);
    let spokenText = '';
    switch (type) {
      case 'define':
        setActiveHint({ icon: config!.icon, text: targetDefinition });
        spokenText = targetDefinition;
        break;
      case 'origin':
        setActiveHint({ icon: config!.icon, text: 'Origin: ' + targetOrigin });
        spokenText = 'Origin: ' + targetOrigin;
        break;
      case 'sentence':
        setActiveHint({ icon: config!.icon, text: targetSentence });
        spokenText = targetSentence;
        break;
    }

    // Read the hint aloud
    if (spokenText) {
      Speech.stop();
      const sanitizedSpeech = spokenText.replace(/___+/g, 'blank');
      Speech.speak(sanitizedSpeech, { language: 'en-US', rate: 0.85 });
    }

    if (settings.sfx) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleLifelineAdRefill = () => {
    if (hasUsedAdRefill) return;
    if (adLoaded && rewardedRef.current) {
      // Pause timer while ad plays
      setTimerRunning(false);
      lifelineAdModeRef.current = true;
      rewardedRef.current.show();
    } else {
      setAdNotReadyVisible(true);
    }
  };

  const handleWatchAd = () => {
    if (adLoaded && rewardedRef.current) {
      lifelineAdModeRef.current = false;
      rewardedRef.current.show();
    } else {
      setAdNotReadyVisible(true);
    }
  };

  const handleDeclineAd = () => {
    setSecondChanceVisible(false);
    navigation.replace('GameOver', {
      consecutiveCorrect,
      mode,
      difficulty,
      roundTotalTime,
      roundBestTime
    });
  };

  const handleBack = () => {
    playClick(settings.sfx);
    setQuitModalVisible(true);
  };

  const backgroundColor = useMemo(() => bgColorAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [COLORS.red, settings.backgroundHex, COLORS.green]
  }), [bgColorAnim, settings.backgroundHex]);

  const keyboardMode = difficulty === 'Beginner' ? 'anagram' : 'qwerty';
  const showAdPrompt = !hasUsedAdRefill && lifelinesRemaining <= 0;

  const tensionOpacity = Math.min(consecutiveCorrect * 0.02, 0.35); // max 35% dark

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      {/* Tension Overlay (Behind content) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: tensionOpacity }]} pointerEvents="none" />

      <Animated.View style={{ flex: 1, transform: [{ translateX: shakeAnim }] }}>
        <SafeAreaView style={styles.safeArea}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Text style={{ fontSize: ms(24), color: COLORS.textSecondary }}>{BACK_ARROW}</Text>
              </TouchableOpacity>
              <Text style={styles.headerText}>{mode.toUpperCase()} · {difficulty}</Text>
            </View>
            {mode !== 'compete' && (
              <Text style={styles.streakText}>STREAK: {consecutiveCorrect}</Text>
            )}
          </View>

          {/* ── Toolbar: lifelines + repeat + counter (INPUT phase only) ── */}
          {phase === 'INPUT' && (
            <View style={styles.toolbar}>
              <View style={styles.lifelineRow}>
                {LIFELINE_CONFIG.map(({ type, icon, label }) => {
                  const used = usedThisWord.has(type);
                  const empty = lifelinesRemaining <= 0;
                  const isDisabled = used || empty;

                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.lifelineBtn, isDisabled && styles.lifelineBtnDisabled]}
                      onPress={() => handleLifelineUse(type)}
                      disabled={isDisabled}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.lifelineBtnIcon}>{used ? '🔒' : icon}</Text>
                      <Text style={[styles.lifelineBtnLabel, isDisabled && { color: COLORS.textSecondary }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity style={styles.repeatBtn} onPress={handleRepeat} activeOpacity={0.7}>
                  <Text style={styles.repeatBtnText}>🔊</Text>
                </TouchableOpacity>

                <View style={styles.counterBadge}>
                  <Text style={styles.counterNum}>{lifelinesRemaining}</Text>
                </View>
              </View>

              {/* Ad refill prompt */}
              {showAdPrompt && (
                <TouchableOpacity style={styles.adPrompt} onPress={handleLifelineAdRefill} activeOpacity={0.8}>
                  <Text style={styles.adPromptText}>▶ Watch ad for +1 lifeline</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Timer bar (INPUT phase only) ── */}
          {phase === 'INPUT' && (
            <AnswerTimer
              key={timerKey}
              duration={timeLimit}
              isRunning={timerRunning}
              onExpire={handleTimerExpire}
            />
          )}

          {/* ── Revealed hint (single line, compact) ── */}
          {phase === 'INPUT' && activeHint && (
            <View style={styles.hintBar}>
              <Text style={styles.hintIcon}>{activeHint.icon}</Text>
              <Text style={styles.hintText} numberOfLines={2}>{activeHint.text}</Text>
            </View>
          )}

          {/* ── Center area ── */}
          <View style={styles.centerContainer}>
            {phase === 'COUNTDOWN' && (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.startingInText}>STARTING IN...</Text>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}
            {phase === 'DICTATION' && (
              <View style={{ alignItems: 'center' }}>
                <VoiceWave />
              </View>
            )}
            {phase === 'INPUT' && (
              <View style={{ width: '100%', paddingHorizontal: ms(20) }}>
                <Text style={[styles.inputText, { letterSpacing: 5 }]} adjustsFontSizeToFit numberOfLines={1}>{inputValue || '_'}</Text>
              </View>
            )}
            {phase === 'RESOLUTION' && (
              <View style={{ alignItems: 'center', width: '100%', paddingHorizontal: ms(20) }}>
                <Text style={[styles.inputText, { letterSpacing: 5, textDecorationLine: inputValue !== targetWord ? 'line-through' : 'none', color: inputValue !== targetWord ? COLORS.textSecondary : COLORS.black }]} adjustsFontSizeToFit numberOfLines={1}>
                  {inputValue || '_'}
                </Text>
                {inputValue !== targetWord && (
                  <Text style={{ ...TYPOGRAPHY.h2, color: COLORS.darkRed, marginTop: ms(10), letterSpacing: 5 }} adjustsFontSizeToFit numberOfLines={1}>{targetWord}</Text>
                )}
              </View>
            )}
          </View>

          {/* ── Keyboard ── */}
          <Animated.View style={[styles.numpadContainer, { paddingBottom: Math.max(insets.bottom, 10), transform: [{ translateY: slideAnim }] }]}>
            <Keyboard onPress={handleInput} onClear={handleClear} onSubmit={handleSubmit} mode={keyboardMode} targetWord={targetWord} />
          </Animated.View>

          {/* ── Modals ── */}
          <SecondChanceModal
            visible={secondChanceVisible}
            onWatchAd={handleWatchAd}
            onDecline={handleDeclineAd}
          />
          <QuitGameModal
            visible={quitModalVisible}
            onCancel={() => setQuitModalVisible(false)}
            onQuit={() => {
              setQuitModalVisible(false);
              navigation.goBack();
            }}
          />
          <AdNotReadyModal
            visible={adNotReadyVisible}
            onClose={() => setAdNotReadyVisible(false)}
            errorMsg={adError}
          />
        </SafeAreaView>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: ms(20),
    paddingTop: scaleY(10),
    paddingBottom: scaleY(6),
    alignItems: 'center',
  },
  backButton: {
    paddingBottom: scaleY(10),
    paddingRight: ms(20),
  },
  headerText: {
    ...TYPOGRAPHY.subtitle,
  },
  streakText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.black,
  },

  // ── Toolbar (lifelines + repeat) ──
  toolbar: {
    paddingHorizontal: ms(12),
    paddingBottom: scaleY(4),
  },
  lifelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(6),
  },
  lifelineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: ms(8),
    paddingVertical: scaleY(5),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: ms(3),
  },
  lifelineBtnDisabled: {
    opacity: 0.45,
    backgroundColor: '#EBEBEB',
  },
  lifelineBtnIcon: {
    fontSize: ms(12),
  },
  lifelineBtnLabel: {
    ...TYPOGRAPHY.button,
    fontSize: ms(10),
    color: COLORS.black,
  },
  repeatBtn: {
    backgroundColor: COLORS.train,
    paddingHorizontal: ms(10),
    paddingVertical: scaleY(5),
    borderRadius: ms(6),
  },
  repeatBtnText: {
    fontSize: ms(14),
  },
  counterBadge: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterNum: {
    ...TYPOGRAPHY.button,
    fontSize: ms(12),
    color: COLORS.white,
  },
  adPrompt: {
    marginTop: scaleY(4),
    alignSelf: 'center',
    backgroundColor: COLORS.train,
    paddingHorizontal: ms(12),
    paddingVertical: scaleY(4),
    borderRadius: ms(6),
  },
  adPromptText: {
    ...TYPOGRAPHY.button,
    fontSize: ms(10),
    color: COLORS.black,
  },

  // ── Hint bar ──
  hintBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: ms(20),
    paddingVertical: scaleY(4),
    gap: ms(6),
  },
  hintIcon: {
    fontSize: ms(12),
    marginTop: scaleY(1),
  },
  hintText: {
    ...TYPOGRAPHY.body,
    fontSize: ms(12),
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },

  // ── Center ──
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: scaleY(250),
  },
  countdownText: {
    ...TYPOGRAPHY.h1,
    fontSize: ms(120, 0.3),
  },
  startingInText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textSecondary,
    marginBottom: scaleY(-10),
  },
  inputText: {
    ...TYPOGRAPHY.h2,
    fontSize: ms(40, 0.3),
    textAlign: 'center',
    width: '100%',
  },

  // ── Keyboard container ──
  numpadContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
});
