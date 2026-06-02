import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStore } from '../store/useStore';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { Numpad } from '../components/Numpad';
import { SecondChanceModal } from '../components/SecondChanceModal';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import { playClick } from '../utils/audio';

const beepSource = require('../../assets/Sounds/Beep.mp3');
const correctSource = require('../../assets/Sounds/Correct.mp3');
const wrongSource = require('../../assets/Sounds/Wrong.mp3');
const tickSource = require('../../assets/Sounds/Tick.m4a');

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-8621446085621887/4277287397';
const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

export const GameScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { mode, difficulty } = route.params;
  const { settings, recordRound } = useStore();

  const [phase, setPhase] = useState<'COUNTDOWN' | 'FLASHING' | 'INPUT' | 'RESOLUTION'>('COUNTDOWN');
  const [countdown, setCountdown] = useState(3);
  const [flashNumber, setFlashNumber] = useState<number | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [targetSum, setTargetSum] = useState(0);

  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [roundTotalTime, setRoundTotalTime] = useState(0);
  const [roundBestTime, setRoundBestTime] = useState<number | null>(null);

  const [secondChanceVisible, setSecondChanceVisible] = useState(false);
  const [hasRetried, setHasRetried] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const bgColorAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const beepPlayer = useAudioPlayer(beepSource);
  const correctPlayer = useAudioPlayer(correctSource);
  const wrongPlayer = useAudioPlayer(wrongSource);
  const tickPlayer = useAudioPlayer(tickSource);

  const playSound = (type: 'beep' | 'correct' | 'wrong' | 'tick') => {
    if (!settings.sfx) return;
    try {
      let player;
      if (type === 'beep') player = beepPlayer;
      else if (type === 'correct') player = correctPlayer;
      else if (type === 'wrong') player = wrongPlayer;
      else if (type === 'tick') player = tickPlayer;

      if (player) {
        player.seekTo(0);
        player.play();
      }
    } catch (e) {
      console.log('Error playing sound', e);
    }
  };

  useEffect(() => {
    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setAdLoaded(true);
    });
    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        setSecondChanceVisible(false);
        setHasRetried(true);
        rewarded.load(); // Load next ad
        startRound();
      },
    );

    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
    };
  }, []);

  useEffect(() => {
    startRound();
  }, []);

  const getDifficultySettings = () => {
    switch (difficulty) {
      case 'Beginner': return { count: 5, minDig: 1, maxDig: 1, duration: 1000 };
      case 'Intermediate': return { count: 8, minDig: 2, maxDig: 3, duration: 800 };
      case 'Expert': return { count: 10, minDig: 3, maxDig: 4, duration: 600 };
      case 'Olympiad': return { count: 10, minDig: 4, maxDig: 5, duration: 400 };
      default: return { count: 4, minDig: 1, maxDig: 2, duration: 1000 };
    }
  };

  const startRound = () => {
    setPhase('COUNTDOWN');
    setCountdown(3);
    setInputValue('');
    bgColorAnim.setValue(0);
    playSound('tick');

    let currentCount = 3;
    const interval = setInterval(() => {
      currentCount--;
      if (currentCount > 0) {
        setCountdown(currentCount);
        playSound('tick');
      } else {
        clearInterval(interval);
        startFlashing();
      }
    }, 800);
  };

  const startFlashing = () => {
    setPhase('FLASHING');
    const { count, minDig, maxDig, duration } = getDifficultySettings();

    let sum = 0;
    let flashes = 0;

    const flashInterval = setInterval(() => {
      if (flashes >= count) {
        clearInterval(flashInterval);
        setFlashNumber(null);
        setTargetSum(sum);
        startInput();
        return;
      }

      const min = Math.pow(10, minDig - 1);
      const max = Math.pow(10, maxDig) - 1;
      const num = Math.floor(Math.random() * (max - min + 1)) + min;

      sum += num;
      setFlashNumber(num);
      playSound('beep');
      flashes++;

      // Blank out briefly before next number
      setTimeout(() => setFlashNumber(null), duration * 0.8);

    }, duration);
  };

  const startInput = () => {
    setPhase('INPUT');
    setStartTime(Date.now());
    slideAnim.setValue(0);
  };

  const handleInput = (val: string) => {
    if (inputValue.length < 10) {
      setInputValue(prev => prev + val);
      if (settings.sfx) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleClear = () => {
    setInputValue('');
    if (settings.sfx) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmit = () => {
    if (inputValue === '') return;

    const timeTaken = (Date.now() - startTime) / 1000;
    const isCorrect = parseInt(inputValue) === targetSum;

    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').height,
      useNativeDriver: true,
      duration: 200,
    }).start();

    setPhase('RESOLUTION');

    Animated.timing(bgColorAnim, {
      toValue: isCorrect ? 1 : -1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (isCorrect) {
      playSound('correct');
      if (settings.sfx) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setConsecutiveCorrect(prev => prev + 1);
      setRoundTotalTime(prev => prev + timeTaken);
      setRoundBestTime(prev => prev === null ? timeTaken : Math.min(prev, timeTaken));
      if (mode === 'compete') {
        recordRound(true, timeTaken, difficulty);
      }

      setTimeout(() => {
        startRound();
      }, 1000);
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
        recordRound(false, null, difficulty);
      }

      setTimeout(() => {
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
  };

  const handleWatchAd = () => {
    if (adLoaded) {
      rewarded.show();
    } else {
      // Fallback if ad failed to load, don't block the user
      setSecondChanceVisible(false);
      setHasRetried(true);
      startRound();
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
    Alert.alert(
      "Quit Game?",
      "Are you sure you want to quit? Your current streak will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Quit", style: "destructive", onPress: () => navigation.goBack() }
      ]
    );
  };

  const backgroundColor = bgColorAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [COLORS.red, settings.backgroundHex, COLORS.green]
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: shakeAnim }] }}>
        <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={{ fontSize: 24, color: COLORS.textSecondary }}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerText}>{mode.toUpperCase()} · {difficulty}</Text>
          </View>
          <Text style={styles.streakText}>STREAK: {consecutiveCorrect}</Text>
        </View>



          <View style={styles.centerContainer}>
            {phase === 'COUNTDOWN' && (
              <Text style={styles.countdownText}>{countdown}</Text>
            )}
            {phase === 'FLASHING' && flashNumber !== null && (
              <Text style={styles.flashText}>{flashNumber}</Text>
            )}
            {phase === 'INPUT' && (
              <Text style={styles.inputText}>{inputValue || '?'}</Text>
            )}
            {phase === 'RESOLUTION' && (
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.inputText, { textDecorationLine: parseInt(inputValue || '0') !== targetSum ? 'line-through' : 'none', color: parseInt(inputValue || '0') !== targetSum ? COLORS.textSecondary : COLORS.black }]}>
                  {inputValue}
                </Text>
                {parseInt(inputValue || '0') !== targetSum && (
                  <Text style={{ ...TYPOGRAPHY.h1, color: COLORS.darkRed, fontSize: 80, marginTop: -10 }}>{targetSum}</Text>
                )}
              </View>
            )}
          </View>

          <Animated.View style={[styles.numpadContainer, { paddingBottom: Math.max(insets.bottom, 10), transform: [{ translateY: slideAnim }] }]}>
            <Numpad onPress={handleInput} onClear={handleClear} onSubmit={handleSubmit} />
          </Animated.View>

          <SecondChanceModal
            visible={secondChanceVisible}
            onWatchAd={handleWatchAd}
            onDecline={handleDeclineAd}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
    // flexDirection: 'row',
    // alignItems: 'center',
    // justifyContent: 'space-between',
    // paddingHorizontal: 20,
    // paddingTop: 40,
    // paddingBottom: 5,
    // borderBottomWidth: 1,
    // borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: 24,
    color: COLORS.black,
    paddingBottom: 10,
    paddingRight: 20,
  },
  headerText: {
    ...TYPOGRAPHY.subtitle,
  },
  streakText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.black,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 250,
  },
  countdownText: {
    ...TYPOGRAPHY.h1,
    fontSize: 120,
  },
  flashText: {
    ...TYPOGRAPHY.h1,
    fontSize: 120,
  },
  inputText: {
    ...TYPOGRAPHY.h1,
    fontSize: 80,
  },
  numpadContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  }
});
