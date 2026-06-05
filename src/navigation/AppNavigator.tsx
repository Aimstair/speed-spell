import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SplashScreen } from '../screens/SplashScreen';
import { MainMenuScreen } from '../screens/MainMenuScreen';
import { DifficultyScreen } from '../screens/DifficultyScreen';
import { GameScreen } from '../screens/GameScreen';
import { GameOverScreen } from '../screens/GameOverScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';

export type RootStackParamList = {
  Splash: undefined;
  MainMenu: undefined;
  Difficulty: { mode: 'train' | 'compete' };
  Game: { difficulty: string; mode: 'train' | 'compete' };
  GameOver: { consecutiveCorrect: number; mode: 'train' | 'compete'; difficulty: string; roundTotalTime: number; roundBestTime: number | null; isWin?: boolean; eloDelta?: number };
  Analytics: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="MainMenu" component={MainMenuScreen} />
        <Stack.Screen name="Difficulty" component={DifficultyScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="GameOver" component={GameOverScreen} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
