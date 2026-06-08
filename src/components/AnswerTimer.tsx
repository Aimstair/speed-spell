import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { ms, scaleY } from '../utils/scale';

interface AnswerTimerProps {
  duration: number; // in seconds
  isRunning: boolean;
  onExpire: () => void;
}

export const AnswerTimer: React.FC<AnswerTimerProps> = ({ duration, isRunning, onExpire }) => {
  const progressAnim = useRef(new Animated.Value(1)).current;
  const secondsLeft = useRef(duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [displaySeconds, setDisplaySeconds] = React.useState(duration);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    // Reset on mount or when duration changes
    progressAnim.setValue(1);
    secondsLeft.current = duration;
    setDisplaySeconds(duration);
    hasExpiredRef.current = false;
  }, [duration]);

  useEffect(() => {
    if (isRunning) {
      hasExpiredRef.current = false;

      // Animate the progress bar
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: secondsLeft.current * 1000,
        useNativeDriver: false,
      }).start();

      // Tick down seconds for the text display
      intervalRef.current = setInterval(() => {
        secondsLeft.current -= 1;
        setDisplaySeconds(Math.max(0, secondsLeft.current));

        if (secondsLeft.current <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            onExpire();
          }
        }
      }, 1000);
    } else {
      // Stop animation and interval
      progressAnim.stopAnimation();
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const barColor = progressAnim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: ['#EF5350', '#FFA726', '#FFEE58', '#66BB6A'],
  });

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isLow = displaySeconds <= 5;

  return (
    <View style={styles.container}>
      <View style={styles.barBackground}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: barWidth,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
      <Text style={[styles.timerText, isLow && styles.timerTextLow]}>
        {displaySeconds}s
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(20),
    gap: ms(10),
  },
  barBackground: {
    flex: 1,
    height: scaleY(6),
    backgroundColor: '#E0E0E0',
    borderRadius: ms(3),
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: ms(3),
  },
  timerText: {
    fontWeight: '700',
    letterSpacing: 2,
    fontSize: ms(14),
    color: COLORS.black,
    minWidth: ms(30),
    textAlign: 'right',
  },
  timerTextLow: {
    color: '#EF5350',
  },
});
