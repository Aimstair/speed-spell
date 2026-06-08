import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { ms } from '../utils/scale';

const BAR_COUNT = 7;

export const VoiceWave: React.FC = () => {
  const anims = useRef(Array.from({ length: BAR_COUNT }).map(() => new Animated.Value(0.2))).current;

  useEffect(() => {
    const runAnimation = (anim: Animated.Value, delay: number, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
            delay: delay
          }),
          Animated.timing(anim, {
            toValue: 0.2,
            duration: duration,
            useNativeDriver: true,
          })
        ])
      ).start();
    };

    // Oscillating organic look
    runAnimation(anims[0], 0, 300);
    runAnimation(anims[1], 100, 250);
    runAnimation(anims[2], 50, 400);
    runAnimation(anims[3], 200, 300);
    runAnimation(anims[4], 150, 350);
    runAnimation(anims[5], 50, 250);
    runAnimation(anims[6], 100, 300);
    
    return () => {
      anims.forEach(a => a.stopAnimation());
    };
  }, []);

  return (
    <View style={styles.container}>
      {anims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            { transform: [{ scaleY: anim }] }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ms(80),
  },
  bar: {
    width: ms(8),
    height: ms(60),
    backgroundColor: COLORS.black,
    marginHorizontal: ms(4),
    borderRadius: ms(4),
  }
});
