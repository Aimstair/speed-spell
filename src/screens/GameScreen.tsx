import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, BackHandler, ScrollView, Alert } from 'react-native';
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
import { BlitzOvertimeModal } from '../components/BlitzOvertimeModal';
import { AdNotReadyModal } from '../components/AdNotReadyModal';
import { VoiceWave } from '../components/VoiceWave';
import { LifelineType } from '../components/LifelineBar';
import { AnswerTimer } from '../components/AnswerTimer';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { playClick, playSoundEffect } from '../utils/audio';
import { ms, scaleY } from '../utils/scale';
import { CustomAlertModal } from '../components/CustomAlertModal';
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
  const { mode, difficulty, themeName, dailyWords, customListId } = route.params;
  const { settings, recordRound, updateHighestStreak, recordWeakWord, recordReviewSuccess, weakWords, recordTypo, updateElo } = useStore();

  const [dailyIndex, setDailyIndex] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [blitzTime, setBlitzTime] = useState(60);

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

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerKey, setTimerKey] = useState(0); // force remount on new round
  const timeLimit = TIME_LIMITS[difficulty] || 25;

  // Ad / modal state
  const [secondChanceVisible, setSecondChanceVisible] = useState(false);
  const [quitModalVisible, setQuitModalVisible] = useState(false);
  const [hasRetried, setHasRetried] = useState(false);
  const [blitzOvertimeVisible, setBlitzOvertimeVisible] = useState(false);
  const [skipWordVisible, setSkipWordVisible] = useState(false);
  
  const [adLoaded, setAdLoaded] = useState(false);
  const [adNotReadyVisible, setAdNotReadyVisible] = useState(false);
  const [adError, setAdError] = useState<string | undefined>();

  // Use refs to track ad mode so the callback closure always reads the latest value
  const lifelineAdModeRef = useRef(false);
  const blitzOvertimeAdModeRef = useRef(false);
  const skipWordAdModeRef = useRef(false);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolutionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rewardedRef = useRef<ReturnType<typeof RewardedAd.createForAdRequest> | null>(null);
  const adUnsubscribersRef = useRef<(() => void)[]>([]);

  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const correctOverlayAnim = useRef(new Animated.Value(0)).current;
  const wrongOverlayAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const finishTrainGame = (isLoss: boolean) => {
    let earned = 0;
    let penalty = 0;
    switch (difficulty) {
      case 'Beginner': earned = Math.floor(consecutiveCorrect / 3) * 1; penalty = 5; break;
      case 'Intermediate': earned = consecutiveCorrect * 1; penalty = 5; break;
      case 'Expert': earned = consecutiveCorrect * 2; penalty = 10; break;
      case 'Olympiad': earned = consecutiveCorrect * 3; penalty = 15; break;
    }
    const delta = earned - (isLoss ? penalty : 0);
    updateElo(delta);
    return delta;
  };

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
          lifelineAdModeRef.current = false;
          // Resume timer after ad
          setTimerRunning(true);
        } else if (blitzOvertimeAdModeRef.current) {
          setBlitzTime(15);
          setBlitzOvertimeVisible(false);
          blitzOvertimeAdModeRef.current = false;
          setTimerRunning(true);
        } else if (skipWordAdModeRef.current) {
          setSkipWordVisible(false);
          skipWordAdModeRef.current = false;
          
          if (mode === 'review') {
            const store = useStore.getState();
            store.recordReviewSuccess(targetWord.toLowerCase());
            store.recordReviewSuccess(targetWord.toLowerCase());
            store.recordReviewSuccess(targetWord.toLowerCase());
          }
          startRound();
        } else {
          // Second chance (existing behavior)
          setSecondChanceVisible(false);
          setHasRetried(true);
          startRound();
        }
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        setAdLoaded(false);
        // Resume timer if it was an active mode ad
        if (lifelineAdModeRef.current || blitzOvertimeAdModeRef.current || skipWordAdModeRef.current) {
          lifelineAdModeRef.current = false;
          blitzOvertimeAdModeRef.current = false;
          skipWordAdModeRef.current = false;
          if (phase === 'INPUT' && !blitzOvertimeVisible && !skipWordVisible) {
             setTimerRunning(true);
          }
        }
        loadNewAd();
      }),
      ad.addAdEventListener(AdEventType.ERROR, (error) => {
        setAdError(error?.message || 'Unknown Ad Error');
        // Resume timer on error
        if (lifelineAdModeRef.current || blitzOvertimeAdModeRef.current || skipWordAdModeRef.current) {
          lifelineAdModeRef.current = false;
          blitzOvertimeAdModeRef.current = false;
          skipWordAdModeRef.current = false;
          if (phase === 'INPUT' && !blitzOvertimeVisible && !skipWordVisible) {
             setTimerRunning(true);
          }
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
    let interval: ReturnType<typeof setInterval>;
    if (mode === 'blitz' && phase === 'INPUT' && blitzTime > 0 && timerRunning) {
      interval = setInterval(() => {
        setBlitzTime(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimerRunning(false);
            Speech.stop();
            setBlitzOvertimeVisible(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [mode, phase, blitzTime, timerRunning, consecutiveCorrect, difficulty, roundTotalTime, roundBestTime]);

  useEffect(() => {
    if (mode === 'blitz' && blitzTime <= 10 && blitzTime > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [mode, blitzTime, pulseAnim]);

  useEffect(() => {
    if (phase === 'COUNTDOWN' && countdown > 0) {
      playSound('tick');
    }
  }, [phase, countdown]);

  // Lifecycle
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
    correctOverlayAnim.setValue(0);
    wrongOverlayAnim.setValue(0);

    // Reset per-word lifeline state (but NOT the global pool)
    setUsedThisWord(new Set());
    setActiveHint(null);

    let randomItem: any = null;

    if (mode === 'daily' && dailyWords) {
      if (dailyIndex >= dailyWords.length) {
        navigation.replace('GameOver', { themeName, dailyWords, customListId,
          consecutiveCorrect,
          mode,
          difficulty,
          roundTotalTime,
          roundBestTime,
          isWin: true
        });
        return;
      }
      randomItem = dailyWords[dailyIndex];
      setDailyIndex(prev => prev + 1);
    } else if (mode === 'review') {
      const currentWeakWords = useStore.getState().weakWords;
      if (currentWeakWords.length === 0) {
        navigation.replace('GameOver', { themeName, dailyWords, customListId,
          consecutiveCorrect,
          mode,
          difficulty,
          roundTotalTime,
          roundBestTime,
          isWin: true
        });
        return;
      }
      const weakObj = currentWeakWords[Math.floor(Math.random() * currentWeakWords.length)];
      let found = null;
      for (const key of Object.keys(WORDS_DB)) {
        found = (WORDS_DB as any)[key].find((w: any) => w.word.toLowerCase() === weakObj.word.toLowerCase());
        if (found) break;
      }
      randomItem = found || { word: weakObj.word, definition: "Definition unavailable", origin: "Unknown", sentence: "No sentence available" };
    } else if (mode === 'custom' && customListId) {
      const { customLists } = useStore.getState();
      const list = customLists.find(l => l.id === customListId);
      if (!list || list.words.length === 0) {
        navigation.goBack();
        return;
      }
      const randomWord = list.words[Math.floor(Math.random() * list.words.length)];
      let found = null;
      for (const key of Object.keys(WORDS_DB)) {
        found = (WORDS_DB as any)[key].find((w: any) => w.word.toLowerCase() === randomWord.toLowerCase());
        if (found) break;
      }
      randomItem = found || { word: randomWord, definition: "Custom Word", origin: "Unknown", sentence: "No sentence available." };
    } else if (mode === 'theme' && themeName) {
      const wordsArray = (WORDS_DB as any)[themeName] || (WORDS_DB as any)['Beginner'];
      randomItem = wordsArray[Math.floor(Math.random() * wordsArray.length)];
    } else {
      let diffKey = difficulty;
      if (difficulty === 'Any') {
        const diffs = ['Beginner', 'Intermediate', 'Expert', 'Olympiad'];
        diffKey = diffs[Math.floor(Math.random() * diffs.length)];
      }
      const wordsArray = (WORDS_DB as any)[diffKey] || (WORDS_DB as any)['Intermediate'];
      randomItem = wordsArray[Math.floor(Math.random() * wordsArray.length)];
    }

    setTargetWord(randomItem.word.toUpperCase());
    setTargetDefinition(randomItem.definition);
    setTargetOrigin(randomItem.origin || 'Unknown');
    setTargetSentence(randomItem.sentence || 'No example sentence available.');

    let currentCount = 3;
    countdownIntervalRef.current = setInterval(() => {
      currentCount--;
      if (currentCount > 0) {
        setCountdown(currentCount);
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
    Speech.stop();
    const timeTaken = ((Date.now() - startTime) / 1000) + penaltySeconds;
    const isCorrect = submittedValue.toUpperCase() === targetWord.toUpperCase();

    // Slide keyboard away — native driver for smooth performance
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').height,
      useNativeDriver: true,
      duration: 200,
    }).start();

    setPhase('RESOLUTION');

    if (isCorrect) {
      // Flash green overlay using native driver
      Animated.sequence([
        Animated.timing(correctOverlayAnim, { toValue: 0.35, duration: 200, useNativeDriver: true }),
        Animated.timing(correctOverlayAnim, { toValue: 0.15, duration: 400, useNativeDriver: true }),
      ]).start();

      playSound('correct');
      if (settings.sfx) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.sequence([
        Animated.spring(popAnim, { toValue: 1.3, useNativeDriver: true, speed: 20, bounciness: 12 }),
        Animated.spring(popAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 })
      ]).start();

      if (mode === 'compete') {
        resolutionTimeoutRef.current = setTimeout(() => {
          const delta = recordRound(true, timeTaken, difficulty, mode, targetWord.toLowerCase());
          setConsecutiveCorrect(prev => prev + 1);
          updateHighestStreak(consecutiveCorrect + 1);
          setRoundTotalTime(prev => prev + timeTaken);
          setRoundBestTime(prev => prev === null ? timeTaken : Math.min(prev, timeTaken));
          navigation.replace('GameOver', { themeName, dailyWords, customListId,
            consecutiveCorrect: consecutiveCorrect + 1,
            mode,
            difficulty,
            roundTotalTime: roundTotalTime + timeTaken,
            roundBestTime: roundBestTime ? Math.min(roundBestTime, timeTaken) : timeTaken,
            isWin: true,
            eloDelta: delta
          });
        }, 1500);
      } else if (mode === 'blitz') {
        resolutionTimeoutRef.current = setTimeout(() => {
          recordRound(true, timeTaken, difficulty, mode, targetWord.toLowerCase());
          setConsecutiveCorrect(prev => prev + 1);
          updateHighestStreak(consecutiveCorrect + 1);
          setRoundTotalTime(prev => prev + timeTaken);
          setRoundBestTime(prev => prev === null ? timeTaken : Math.min(prev, timeTaken));
          startRound();
        }, 1200);
      } else if (mode === 'multiplayer') {
        resolutionTimeoutRef.current = setTimeout(() => {
          setCurrentPlayer(prev => prev === 1 ? 2 : 1);
          recordRound(true, timeTaken, difficulty, mode, targetWord.toLowerCase());
          setConsecutiveCorrect(prev => prev + 1);
          updateHighestStreak(consecutiveCorrect + 1);
          setRoundTotalTime(prev => prev + timeTaken);
          setRoundBestTime(prev => prev === null ? timeTaken : Math.min(prev, timeTaken));
          startRound();
        }, 1000);
      } else {
        resolutionTimeoutRef.current = setTimeout(() => {
          let isReviewComplete = false;
          if (mode === 'review') {
            recordReviewSuccess(targetWord.toLowerCase());
            const currentWeakWords = useStore.getState().weakWords;
            if (currentWeakWords.length === 0) {
              isReviewComplete = true;
            }
          }
          recordRound(true, timeTaken, difficulty, mode, targetWord.toLowerCase());
          setConsecutiveCorrect(prev => prev + 1);
          updateHighestStreak(consecutiveCorrect + 1);
          setRoundTotalTime(prev => prev + timeTaken);
          setRoundBestTime(prev => prev === null ? timeTaken : Math.min(prev, timeTaken));
          
          if (isReviewComplete) {
            navigation.replace('GameOver', { themeName, dailyWords, customListId,
              consecutiveCorrect: consecutiveCorrect + 1,
              mode,
              difficulty,
              roundTotalTime: roundTotalTime + timeTaken,
              roundBestTime: roundBestTime ? Math.min(roundBestTime, timeTaken) : timeTaken,
              isWin: true
            });
          } else {
            startRound();
          }
        }, 1000);
      }
    } else {
      // Flash red overlay using native driver
      Animated.sequence([
        Animated.timing(wrongOverlayAnim, { toValue: 0.35, duration: 200, useNativeDriver: true }),
        Animated.timing(wrongOverlayAnim, { toValue: 0.15, duration: 400, useNativeDriver: true }),
      ]).start();

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
        resolutionTimeoutRef.current = setTimeout(() => {
          const delta = recordRound(false, null, difficulty, mode, targetWord);
          recordWeakWord(targetWord.toLowerCase());
          recordTypo(targetWord.toLowerCase(), submittedValue.toLowerCase());
          navigation.replace('GameOver', { themeName, dailyWords, customListId,
            consecutiveCorrect,
            mode,
            difficulty,
            roundTotalTime,
            roundBestTime,
            isWin: false,
            eloDelta: delta
          });
        }, 1500);
      } else if (mode === 'blitz') {
        resolutionTimeoutRef.current = setTimeout(() => {
          recordRound(false, null, difficulty, mode, targetWord.toLowerCase());
          recordWeakWord(targetWord.toLowerCase());
          recordTypo(targetWord.toLowerCase(), submittedValue.toLowerCase());
          startRound();
        }, 1200);
      } else if (mode === 'multiplayer') {
        resolutionTimeoutRef.current = setTimeout(() => {
          recordRound(false, null, difficulty, mode, targetWord.toLowerCase());
          recordWeakWord(targetWord.toLowerCase());
          recordTypo(targetWord.toLowerCase(), submittedValue.toLowerCase());
          navigation.replace('GameOver', { themeName, dailyWords, customListId,
            consecutiveCorrect,
            mode,
            difficulty,
            roundTotalTime,
            roundBestTime,
            isWin: false,
            winner: `Player ${currentPlayer === 1 ? 2 : 1}`
          });
        }, 1500);
      } else {
        resolutionTimeoutRef.current = setTimeout(() => {
          recordWeakWord(targetWord.toLowerCase());
          recordTypo(targetWord.toLowerCase(), submittedValue.toLowerCase());
          if (!hasRetried) {
            setSecondChanceVisible(true);
          } else {
            let delta;
            if (mode === 'train') { delta = finishTrainGame(true); }
            navigation.replace('GameOver', { themeName, dailyWords, customListId,
              consecutiveCorrect,
              mode,
              difficulty,
              roundTotalTime,
              roundBestTime,
              isWin: false,
              ...(delta !== undefined ? { eloDelta: delta } : {})
            });
          }
        }, 1500);
      }
    }
  };

  const handleLifelineUse = (type: LifelineType) => {
    if (usedThisWord.has(type as any) || lifelinesRemaining <= 0 || phase !== 'INPUT') return;

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

  // skipWordVisible will simply toggle the CustomAlertModal. We no longer use useEffect for Alert.alert.

  const handleWatchSkipAd = () => {
    if (adLoaded && rewardedRef.current) {
      setTimerRunning(false);
      skipWordAdModeRef.current = true;
      rewardedRef.current.show();
    } else {
      setAdNotReadyVisible(true);
    }
  };

  const handleWatchBlitzOvertimeAd = () => {
    if (adLoaded && rewardedRef.current) {
      blitzOvertimeAdModeRef.current = true;
      rewardedRef.current.show();
    } else {
      setAdNotReadyVisible(true);
    }
  };

  const handleDeclineBlitzOvertime = () => {
    setBlitzOvertimeVisible(false);
    setPhase('RESOLUTION');
    navigation.replace('GameOver', { themeName, dailyWords, customListId,
      consecutiveCorrect,
      mode,
      difficulty,
      roundTotalTime,
      roundBestTime,
      isWin: true,
      blitzScore: consecutiveCorrect
    });
  };

  const handleDeclineSkip = () => {
    setSkipWordVisible(false);
    if (phase === 'INPUT' && !blitzOvertimeVisible) setTimerRunning(true);
  };

  const handleDeclineAd = () => {
    setSecondChanceVisible(false);
    let delta;
    if (mode === 'train') { delta = finishTrainGame(true); }
    navigation.replace('GameOver', { themeName, dailyWords, customListId,
      consecutiveCorrect,
      mode,
      difficulty,
      roundTotalTime,
      roundBestTime,
      isWin: false,
      ...(delta !== undefined ? { eloDelta: delta } : {})
    });
  };

  const handleBack = () => {
    playClick(settings.sfx);
    setQuitModalVisible(true);
  };



  const keyboardMode = difficulty === 'Beginner' ? 'anagram' : 'qwerty';
  const showAdPrompt = lifelinesRemaining <= 0 && mode !== 'custom';

  const tensionOpacity = useMemo(() => Math.min(consecutiveCorrect * 0.02, 0.35), [consecutiveCorrect]);

  return (
    <View style={[styles.container, { backgroundColor: settings.backgroundHex }]}>
      {/* Color flash overlays — native driver for smooth performance */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.green, opacity: correctOverlayAnim }]} pointerEvents="none" />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.red, opacity: wrongOverlayAnim }]} pointerEvents="none" />
      {/* Tension Overlay */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: tensionOpacity }]} pointerEvents="none" />

      <Animated.View style={{ flex: 1, transform: [{ translateX: shakeAnim }] }}>
        <SafeAreaView style={styles.safeArea}>
          {/* ── Multiplayer Turn Banner ── */}
          {mode === 'multiplayer' && phase !== 'COUNTDOWN' && (
            <View style={[styles.playerBanner, { backgroundColor: currentPlayer === 1 ? COLORS.train : COLORS.compete }]}>
              <Text style={styles.playerBannerText}>PLAYER {currentPlayer}'S TURN</Text>
            </View>
          )}

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={handleBack} style={{ paddingRight: ms(15) }}>
                <Text style={styles.backButton}>{BACK_ARROW}</Text>
              </TouchableOpacity>
              <Text style={styles.headerText}>
                {mode === 'train' ? `TRAIN · ${difficulty}` : mode.toUpperCase()}
              </Text>
            </View>
            
            {mode === 'blitz' ? (
              <View style={styles.blitzTimer}>
                <Animated.Text style={[styles.blitzTimerText, { color: blitzTime <= 10 ? COLORS.red : COLORS.white, transform: [{ scale: pulseAnim }] }]}>
                  {blitzTime}s
                </Animated.Text>
              </View>
            ) : (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>{consecutiveCorrect}</Text>
              </View>
            )}
          </View>

          {/* ── Timer bar (INPUT phase only) ── */}
          {phase === 'INPUT' && mode !== 'blitz' && (
            <AnswerTimer
              key={timerKey}
              duration={timeLimit}
              isRunning={timerRunning}
              onExpire={handleTimerExpire}
            />
          )}

          {/* ── Toolbar: lifelines (INPUT phase only, not blitz) ── */}
          {phase === 'INPUT' && mode !== 'blitz' && (
            <View style={styles.toolbar}>
              <View style={styles.lifelineRow}>
                {mode !== 'custom' && LIFELINE_CONFIG.map(({ type, icon, label }) => {
                  const used = usedThisWord.has(type as any);
                  const empty = lifelinesRemaining <= 0;
                  const isDisabled = used || empty;

                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.lifelineBtn, isDisabled && styles.lifelineBtnDisabled]}
                      onPress={() => handleLifelineUse(type as any)}
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

                {mode !== 'custom' && (
                  <View style={styles.counterBadge}>
                    <Text style={styles.counterNum}>{lifelinesRemaining}</Text>
                  </View>
                )}
              </View>

              <View style={styles.toolbarSecondRow}>
                <TouchableOpacity 
                  style={styles.skipBtn} 
                  onPress={() => {
                    Speech.stop();
                    setTimerRunning(false);
                    setSkipWordVisible(true);
                  }} 
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipBtnIcon}>{mode === 'review' ? '🪦' : '⏭️'}</Text>
                  <Text style={styles.skipBtnLabel}>{mode === 'review' ? 'Bury' : 'Skip'}</Text>
                </TouchableOpacity>

                {showAdPrompt && (
                  <TouchableOpacity style={styles.adPrompt} onPress={handleLifelineAdRefill} activeOpacity={0.8}>
                    <Text style={styles.adPromptText}>▶ +1 lifeline</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ── Revealed hint ── */}
          {phase === 'INPUT' && activeHint && (
            <View style={styles.hintBar}>
              <Text style={styles.hintIcon}>{activeHint.icon}</Text>
              <Text style={styles.hintText} numberOfLines={2}>{activeHint.text}</Text>
            </View>
          )}

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
          <Animated.View style={{ alignItems: 'center', width: '100%', paddingHorizontal: ms(20), transform: [{ scale: inputValue === targetWord ? popAnim : 1 }] }}>
            <Text style={[styles.inputText, { letterSpacing: 5, textDecorationLine: inputValue !== targetWord ? 'line-through' : 'none', color: inputValue !== targetWord ? COLORS.textSecondary : COLORS.black }]} adjustsFontSizeToFit numberOfLines={1}>
              {inputValue || '_'}
            </Text>
            {inputValue !== targetWord && (
              <Text style={{ ...TYPOGRAPHY.h2, color: COLORS.darkRed, marginTop: ms(10), letterSpacing: 5 }} adjustsFontSizeToFit numberOfLines={1}>{targetWord}</Text>
            )}
          </Animated.View>
        )}
      </View>

      <Animated.View style={[styles.numpadContainer, { paddingBottom: Math.max(insets.bottom, 10), transform: [{ translateY: slideAnim }] }]}>
        <Keyboard onPress={handleInput} onClear={handleClear} onSubmit={handleSubmit} mode={keyboardMode} targetWord={targetWord} />
      </Animated.View>

      <SecondChanceModal
        visible={secondChanceVisible}
        onWatchAd={handleWatchAd}
        onDecline={handleDeclineAd}
      />
      <BlitzOvertimeModal
        visible={blitzOvertimeVisible}
        onWatchAd={handleWatchBlitzOvertimeAd}
        onDecline={handleDeclineBlitzOvertime}
      />
      <CustomAlertModal
        visible={skipWordVisible}
        title={mode === 'review' ? "Bury Word?" : "Skip Word?"}
        message={mode === 'review' ? "Watch a short ad to instantly remove this word from your Graveyard!" : "Watch a short ad to skip this word without losing your streak or ELO!"}
        buttons={[
          { text: "Cancel", onPress: handleDeclineSkip, style: "cancel" },
          { text: "Watch Ad", onPress: handleWatchSkipAd }
        ]}
        onDismiss={handleDeclineSkip}
      />
      <QuitGameModal
        visible={quitModalVisible}
        onCancel={() => setQuitModalVisible(false)}
        onQuit={() => {
          setQuitModalVisible(false);
          if (mode === 'train' && phase !== 'RESOLUTION') {
            finishTrainGame(false);
          }
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  bgFill: {
    ...(StyleSheet.absoluteFill as any),
  },
  // ── Player Banner ──
  playerBanner: {
    paddingVertical: scaleY(6),
    alignItems: 'center',
  },
  playerBannerText: {
    ...TYPOGRAPHY.button,
    fontSize: ms(13),
    color: COLORS.black,
    letterSpacing: 3,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: ms(20),
    paddingTop: scaleY(8),
    paddingBottom: scaleY(8),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: ms(24),
    color: COLORS.black,
  },
  blitzTimer: {
    backgroundColor: COLORS.black,
    paddingHorizontal: ms(14),
    paddingVertical: scaleY(4),
    borderRadius: 0,
  },
  blitzTimerText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
  },
  streakBadge: {
    backgroundColor: COLORS.black,
    paddingHorizontal: ms(12),
    paddingVertical: scaleY(4),
    alignItems: 'center',
  },
  streakText: {
    ...TYPOGRAPHY.button,
    fontSize: ms(14),
    color: COLORS.white,
  },
  counterBadge: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(13),
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
    backgroundColor: COLORS.train,
    paddingHorizontal: ms(12),
    paddingVertical: scaleY(5),
    borderRadius: 0,
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
    paddingVertical: scaleY(6),
    gap: ms(8),
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  hintIcon: {
    fontSize: ms(14),
    marginTop: scaleY(1),
  },
  hintText: {
    ...TYPOGRAPHY.body,
    fontSize: ms(13),
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
  headerText: {
    ...TYPOGRAPHY.subtitle,
  },
  toolbar: {
    paddingHorizontal: ms(15),
    paddingVertical: scaleY(6),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lifelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(6),
  },
  toolbarSecondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(10),
    marginTop: scaleY(6),
  },
  lifelineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: ms(8),
    paddingVertical: scaleY(5),
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 0,
    gap: ms(3),
  },
  lifelineBtnDisabled: {
    opacity: 0.4,
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
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 0,
    paddingHorizontal: ms(10),
    paddingVertical: scaleY(4),
    gap: ms(4),
  },
  skipBtnIcon: {
    fontSize: ms(12),
  },
  skipBtnLabel: {
    ...TYPOGRAPHY.button,
    fontSize: ms(10),
    color: COLORS.darkRed,
  },
  repeatBtn: {
    backgroundColor: COLORS.train,
    paddingHorizontal: ms(10),
    paddingVertical: scaleY(5),
    borderRadius: 0,
  },
  repeatBtnText: {
    fontSize: ms(14),
  },
  timerContainer: {
    paddingHorizontal: ms(20),
    paddingBottom: scaleY(10),
  },
});
