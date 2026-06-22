import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/colors';

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

export interface WeakWord {
  word: string;
  fails: number;
}

export interface EloHistory {
  date: string;
  elo: number;
}

export interface DailyChallenge {
  lastDate: string;
  streak: number;
}

export interface CustomList {
  id: string;
  name: string;
  words: string[];
}

export interface TypoRecord {
  expected: string;
  actual: string;
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
  lifelinesUsed: { define: number; origin: number; sentence: number; phonetic: number };
  wordsMastered: string[];

  // Offline Retention
  dailyChallenge: DailyChallenge;
  weakWords: WeakWord[];
  eloHistory: EloHistory[];
  achievements: string[];
  customLists: CustomList[];
  typoHistory: TypoRecord[];

  // Actions
  updateElo: (amount: number) => void;
  recordRound: (isCorrect: boolean, timeInSeconds: number | null, difficultyCleared?: string, mode?: 'train' | 'compete' | 'daily' | 'review' | 'theme' | 'custom' | 'multiplayer' | 'blitz', word?: string) => number;
  updateSettings: (settings: Partial<GameSettings>) => void;
  resetStatistics: () => void;
  syncDailyTries: () => void;
  consumeCompeteTry: () => boolean;
  addCompeteTry: () => void;
  completeTutorial: () => void;
  recordLifelineUsage: (type: 'define' | 'origin' | 'sentence' | 'phonetic') => void;
  updateHighestStreak: (streak: number) => void;

  // Offline Retention Actions
  recordWeakWord: (word: string) => void;
  recordReviewSuccess: (word: string) => void;
  updateDailyChallenge: (date: string, success: boolean) => void;
  unlockAchievement: (id: string) => void;
  saveCustomList: (list: CustomList) => void;
  deleteCustomList: (id: string) => void;
  recordTypo: (expected: string, actual: string) => void;
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
      lifelinesUsed: { define: 0, origin: 0, sentence: 0, phonetic: 0 },
      wordsMastered: [],
      dailyChallenge: { lastDate: '', streak: 0 },
      weakWords: [],
      eloHistory: [],
      achievements: [],
      customLists: [],
      typoHistory: [],

      updateElo: (amount) => set((state) => {
        const newElo = Math.max(0, state.elo + amount);
        const today = getLocalTodayString();
        let newEloHistory = [...state.eloHistory];
        const todayIndex = newEloHistory.findIndex(h => h.date === today);
        if (todayIndex >= 0) {
          newEloHistory[todayIndex].elo = Math.max(newEloHistory[todayIndex].elo, newElo);
        } else {
          newEloHistory.push({ date: today, elo: newElo });
          if (newEloHistory.length > 30) newEloHistory.shift();
        }
        return { elo: newElo, eloHistory: newEloHistory };
      }),

      recordRound: (isCorrect, timeInSeconds, difficultyCleared, mode, word) => {
        if (mode !== 'compete' && mode !== 'train') return 0;
        
        let finalEloDelta = 0;
        set((state) => {
          let newRoundsPlayed = state.roundsPlayed;
          let newCorrectAnswers = state.correctAnswers;
          let newAccuracy = state.accuracy;
          let newRecentRounds = state.recentRounds;
          let newStatsByDifficulty = state.statsByDifficulty;
          let newWordsMastered = state.wordsMastered;

          if (mode === 'train') {
            newRoundsPlayed = state.roundsPlayed + 1;
            newCorrectAnswers = state.correctAnswers + (isCorrect ? 1 : 0);
            newAccuracy = Math.round((newCorrectAnswers / newRoundsPlayed) * 100);
            newRecentRounds = [...state.recentRounds, isCorrect].slice(-50);

            newStatsByDifficulty = { ...state.statsByDifficulty };
            newWordsMastered = [...state.wordsMastered];

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

          // Update elo history
          let newEloHistory = [...state.eloHistory];
          if (mode === 'compete' || newElo !== state.elo) {
            const today = getLocalTodayString();
            const todayIndex = newEloHistory.findIndex(h => h.date === today);
            if (todayIndex >= 0) {
              newEloHistory[todayIndex].elo = Math.max(newEloHistory[todayIndex].elo, newElo);
            } else {
              newEloHistory.push({ date: today, elo: newElo });
              if (newEloHistory.length > 30) newEloHistory.shift();
            }
          }

          // Achievements check
          const newAchievements = [...state.achievements];
          if (difficultyCleared === 'Olympiad' && !newAchievements.includes('olympiad_scholar')) {
            newAchievements.push('olympiad_scholar');
          }
          if (newWordsMastered.length >= 100 && !newAchievements.includes('vocabulary_master')) {
            newAchievements.push('vocabulary_master');
          }

          return {
            elo: newElo,
            roundsPlayed: newRoundsPlayed,
            correctAnswers: newCorrectAnswers,
            accuracy: newAccuracy,
            recentRounds: newRecentRounds,
            statsByDifficulty: newStatsByDifficulty,
            highestDifficultyCleared: (isCorrect && difficultyCleared) ? difficultyCleared : state.highestDifficultyCleared,
            wordsMastered: newWordsMastered,
            eloHistory: newEloHistory,
            achievements: newAchievements,
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
        lifelinesUsed: { define: 0, origin: 0, sentence: 0, phonetic: 0 },
        wordsMastered: [],
        dailyChallenge: { lastDate: '', streak: 0 },
        weakWords: [],
        eloHistory: [],
        achievements: [],
        customLists: [],
        typoHistory: [],
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
            return { competeTries: currentTries - 1, lastCompeteDate: newDate };
          }
          return { competeTries: 0, lastCompeteDate: newDate };
        });
        return success;
      },

      addCompeteTry: () => set((state) => ({ competeTries: state.competeTries + 1 })),
      completeTutorial: () => set({ hasSeenTutorial: true }),
      recordLifelineUsage: (type) => set((state) => ({
        lifelinesUsed: {
          ...state.lifelinesUsed,
          [type]: (state.lifelinesUsed[type] || 0) + 1
        }
      })),
      updateHighestStreak: (streak) => set((state) => ({
        highestStreak: Math.max(state.highestStreak, streak)
      })),

      recordWeakWord: (word) => set((state) => {
        const weakWords = [...state.weakWords];
        const existing = weakWords.find(w => w.word === word);
        if (existing) {
          existing.fails += 1;
        } else {
          weakWords.push({ word, fails: 1 });
        }
        return { weakWords };
      }),

      recordReviewSuccess: (word) => set((state) => {
        const weakWords = state.weakWords.map(w => {
          if (w.word === word) {
            return { ...w, fails: w.fails - 1 };
          }
          return w;
        }).filter(w => w.fails > 0);
        return { weakWords };
      }),

      updateDailyChallenge: (date, success) => set((state) => {
        let newStreak = state.dailyChallenge.streak;
        if (success) {
          const yesterday = new Date(new Date(date).getTime() - 86400000);
          const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
          
          if (state.dailyChallenge.lastDate === yesterdayStr) {
            newStreak += 1;
          } else if (state.dailyChallenge.lastDate !== date) {
            newStreak = 1;
          }
        } else if (state.dailyChallenge.lastDate !== date) {
          newStreak = 0; // Broken streak
        }

        return {
          dailyChallenge: { lastDate: date, streak: newStreak }
        };
      }),

      unlockAchievement: (id) => set((state) => {
        if (!state.achievements.includes(id)) {
          return { achievements: [...state.achievements, id] };
        }
        return {};
      }),

      saveCustomList: (list) => set((state) => {
        const existingIndex = state.customLists.findIndex(l => l.id === list.id);
        if (existingIndex >= 0) {
          const newLists = [...state.customLists];
          newLists[existingIndex] = list;
          return { customLists: newLists };
        }
        return { customLists: [...state.customLists, list] };
      }),

      deleteCustomList: (id) => set((state) => ({
        customLists: state.customLists.filter(l => l.id !== id)
      })),

      recordTypo: (expected, actual) => set((state) => {
        const newHistory = [...state.typoHistory, { expected, actual }];
        if (newHistory.length > 500) newHistory.shift(); // keep last 500
        return { typoHistory: newHistory };
      }),
    }),
    {
      name: 'speed-spell-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
