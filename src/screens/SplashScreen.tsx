import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { useStore } from '../store/useStore';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const store = useStore(); // Ensure store hydrates

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const symbol1Anim = useRef(new Animated.Value(0)).current;
  const symbol2Anim = useRef(new Animated.Value(0)).current;
  const symbol3Anim = useRef(new Animated.Value(0)).current;
  const symbol4Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(symbol1Anim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(symbol2Anim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(symbol3Anim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(symbol4Anim, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      })
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('MainMenu');
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim, slideAnim]);

  const getSymbolStyle = (anim: Animated.Value, baseRotate: string) => ({
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.15], // Subtle opacity
    }),
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
      { rotate: baseRotate }
    ]
  });

  return (
    <View style={styles.container}>
      {/* Floating Letters */}
      <Animated.Text style={[styles.symbol, { top: height * 0.15, left: width * 0.15 }, getSymbolStyle(symbol1Anim, '-15deg')]}>A</Animated.Text>
      <Animated.Text style={[styles.symbol, { top: height * 0.2, right: width * 0.15 }, getSymbolStyle(symbol2Anim, '20deg')]}>B</Animated.Text>
      <Animated.Text style={[styles.symbol, { bottom: height * 0.2, left: width * 0.2 }, getSymbolStyle(symbol3Anim, '10deg')]}>C</Animated.Text>
      <Animated.Text style={[styles.symbol, { bottom: height * 0.15, right: width * 0.2 }, getSymbolStyle(symbol4Anim, '-25deg')]}>Z</Animated.Text>

      <Animated.View 
        style={[
          styles.content, 
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ]
          }
        ]}
      >
        <Text style={styles.titleSpeed}>SPEED</Text>
        <Text style={styles.titleSpell}>SPELL</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.tagline}>EXPAND YOUR VOCABULARY</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  titleSpeed: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    lineHeight: 70,
  },
  titleSpell: {
    ...TYPOGRAPHY.h1,
    color: COLORS.train, // Pastel blue
    lineHeight: 70,
    marginTop: -10,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.compete, // Pastel red
    borderRadius: 2,
    marginVertical: 20,
  },
  tagline: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textSecondary,
    letterSpacing: 4,
  },
  symbol: {
    position: 'absolute',
    fontSize: 100,
    fontWeight: '900',
    color: COLORS.text,
    zIndex: 1,
  }
});
