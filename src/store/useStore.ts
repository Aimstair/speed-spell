import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/colors';
import { scheduleCompeteReplenishNotification } from '../utils/notifications';

const getLocalTodayString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export interface GameSettings {
  sfx: boolean;
  screenShake: boolean;
  backgroundHex: string;
}

export interface DifficultyStats {
  bestTime: number | null;
  totalTime: number;
  correctCount: number;
  totalAttempts: number;
}

export interface AppState {
  elo: number;
  accuracy: number;
  roundsPlayed: number;
  correctAnswers: number;
  highestDifficultyCleared: string | null;
  recentRounds: boolean[]; // true for correct, false for incorrect
  settings: GameSettings;
  statsByDifficulty: Record<string, DifficultyStats>;

  competeTries: number;
  lastCompeteDate: string;
  hasSeenTutorial: boolean;

  highestStreak: number;
  lifelinesUsed: { define: number; origin: number; sentence: number };
  wordsMastered: string[];

  // Actions
  updateElo: (amount: number) => void;
  recordRound: (isCorrect: boolean, timeInSeconds: number | null, difficultyCleared?: string, mode?: 'train' | 'compete', word?: string) => number;
  updateSettings: (settings: Partial<GameSettings>) => void;
  resetStatistics: () => void;
  syncDailyTries: () => void;
  consumeCompeteTry: () => boolean;
  addCompeteTry: () => void;
  completeTutorial: () => void;
  recordLifelineUsage: (type: 'define' | 'origin' | 'sentence') => void;
  updateHighestStreak: (streak: number) => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  sfx: true,
  screenShake: true,
  backgroundHex: COLORS.swatches[0],
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      elo: 1000,
      accuracy: 0,
      roundsPlayed: 0,
      correctAnswers: 0,
      highestDifficultyCleared: null,
      recentRounds: [],
      settings: DEFAULT_SETTINGS,
      statsByDifficulty: {},
      competeTries: 5,
      lastCompeteDate: getLocalTodayString(),
      hasSeenTutorial: false,
      highestStreak: 0,
      lifelinesUsed: { define: 0, origin: 0, sentence: 0 },
      wordsMastered: [],

      updateElo: (amount) => set((state) => ({ elo: Math.max(0, state.elo + amount) })),

      recordRound: (isCorrect, timeInSeconds, difficultyCleared, mode, word) => {
        if (mode !== 'compete') return 0;
        
        let finalEloDelta = 0;
        set((state) => {
          const newRoundsPlayed = state.roundsPlayed + 1;
          const newCorrectAnswers = state.correctAnswers + (isCorrect ? 1 : 0);
          const newAccuracy = Math.round((newCorrectAnswers / newRoundsPlayed) * 100);

          const newRecentRounds = [...state.recentRounds, isCorrect].slice(-50); // Keep last 50

          const newStatsByDifficulty = { ...state.statsByDifficulty };
          const newWordsMastered = [...state.wordsMastered];

          if (isCorrect && word && !newWordsMastered.includes(word)) {
            newWordsMastered.push(word);
          }

          if (difficultyCleared) {
            const currentStats = newStatsByDifficulty[difficultyCleared] || {
              bestTime: null,
              totalTime: 0,
              correctCount: 0,
              totalAttempts: 0
            };

            let newBest = currentStats.bestTime;
            if (isCorrect && timeInSeconds !== null) {
              if (newBest === null || timeInSeconds < newBest) {
                newBest = timeInSeconds;
              }
            }

            newStatsByDifficulty[difficultyCleared] = {
              bestTime: newBest,
              totalTime: currentStats.totalTime + (isCorrect && timeInSeconds ? timeInSeconds : 0),
              correctCount: currentStats.correctCount + (isCorrect ? 1 : 0),
              totalAttempts: currentStats.totalAttempts + 1
            };
          }

          let eloDelta = 0;
          if (difficultyCleared && mode === 'compete') {
            switch (difficultyCleared) {
              case 'Beginner': eloDelta = isCorrect ? 1 : -1; break;
              case 'Intermediate': eloDelta = isCorrect ? 2 : -1; break;
              case 'Expert': eloDelta = isCorrect ? 3 : -2; break;
              case 'Olympiad': eloDelta = isCorrect ? 5 : -3; break;
            }
          }
          finalEloDelta = eloDelta;
          const newElo = Math.max(0, state.elo + eloDelta);

          return {
            elo: newElo,
            roundsPlayed: newRoundsPlayed,
            correctAnswers: newCorrectAnswers,
            accuracy: newAccuracy,
            recentRounds: newRecentRounds,
            statsByDifficulty: newStatsByDifficulty,
            highestDifficultyCleared: (isCorrect && difficultyCleared) ? difficultyCleared : state.highestDifficultyCleared,
            wordsMastered: newWordsMastered,
          };
        });
        return finalEloDelta;
      },

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      resetStatistics: () => set({
        elo: 1000,
        accuracy: 0,
        roundsPlayed: 0,
        correctAnswers: 0,
        highestDifficultyCleared: null,
        recentRounds: [],
        statsByDifficulty: {},
        hasSeenTutorial: false,
        highestStreak: 0,
        lifelinesUsed: { define: 0, origin: 0, sentence: 0 },
        wordsMastered: [],
      }),

      syncDailyTries: () => set((state) => {
        const today = getLocalTodayString();
        if (state.lastCompeteDate !== today) {
          return { competeTries: 5, lastCompeteDate: today };
        }
        return {};
      }),

      consumeCompeteTry: () => {
        let success = false;
        let finalTries = -1;
        set((state) => {
          const today = getLocalTodayString();
          let currentTries = state.competeTries;
          let newDate = state.lastCompeteDate;
          if (newDate !== today) {
            currentTries = 5;
            newDate = today;
          }
          if (currentTries > 0) {
            success = true;
            finalTries = currentTries - 1;
            return { competeTries: finalTries, lastCompeteDate: newDate };
          }
          finalTries = 0;
          return { competeTries: 0, lastCompeteDate: newDate };
        });

        if (success && finalTries === 0) {
          scheduleCompeteReplenishNotification();
        }

        return success;
      },

      addCompeteTry: () => set((state) => ({ competeTries: state.competeTries + 1 })),
      completeTutorial: () => set({ hasSeenTutorial: true }),
      recordLifelineUsage: (type) => set((state) => ({
        lifelinesUsed: { ...state.lifelinesUsed, [type]: state.lifelinesUsed[type] + 1 }
      })),
      updateHighestStreak: (streak) => set((state) => ({
        highestStreak: Math.max(state.highestStreak, streak)
      })),
    }),
    {
      name: 'speed-spell-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
