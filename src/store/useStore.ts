import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/colors';

export interface GameSettings {
  music: boolean;
  sfx: boolean;
  screenShake: boolean;
  backgroundHex: string;
}

export interface DifficultyStats {
  bestTime: number | null;
  totalTime: number;
  correctCount: number;
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

  // Actions
  updateElo: (amount: number) => void;
  recordRound: (isCorrect: boolean, timeInSeconds: number | null, difficultyCleared?: string) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  resetStatistics: () => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  music: true,
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

      updateElo: (amount) => set((state) => ({ elo: Math.max(0, state.elo + amount) })),

      recordRound: (isCorrect, timeInSeconds, difficultyCleared) => set((state) => {
        const newRoundsPlayed = state.roundsPlayed + 1;
        const newCorrectAnswers = state.correctAnswers + (isCorrect ? 1 : 0);
        const newAccuracy = Math.round((newCorrectAnswers / newRoundsPlayed) * 100);

        const newRecentRounds = [...state.recentRounds, isCorrect].slice(-20); // Keep last 20

        const newStatsByDifficulty = { ...state.statsByDifficulty };

        if (isCorrect && difficultyCleared && timeInSeconds !== null) {
          const currentStats = newStatsByDifficulty[difficultyCleared] || {
            bestTime: null,
            totalTime: 0,
            correctCount: 0
          };

          let newBest = currentStats.bestTime;
          if (newBest === null || timeInSeconds < newBest) {
            newBest = timeInSeconds;
          }

          newStatsByDifficulty[difficultyCleared] = {
            bestTime: newBest,
            totalTime: currentStats.totalTime + timeInSeconds,
            correctCount: currentStats.correctCount + 1
          };
        }

        let eloDelta = 0;
        if (difficultyCleared) {
          switch (difficultyCleared) {
            case 'Beginner': eloDelta = isCorrect ? 1 : 0; break;
            case 'Intermediate': eloDelta = isCorrect ? 2 : -1; break;
            case 'Expert': eloDelta = isCorrect ? 3 : -2; break;
            case 'Olympiad': eloDelta = isCorrect ? 5 : -3; break;
          }
        }
        const newElo = Math.max(0, state.elo + eloDelta);

        return {
          elo: newElo,
          roundsPlayed: newRoundsPlayed,
          correctAnswers: newCorrectAnswers,
          accuracy: newAccuracy,
          recentRounds: newRecentRounds,
          statsByDifficulty: newStatsByDifficulty,
          highestDifficultyCleared: (isCorrect && difficultyCleared) ? difficultyCleared : state.highestDifficultyCleared,
        };
      }),

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
      }),
    }),
    {
      name: 'speed-math-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
