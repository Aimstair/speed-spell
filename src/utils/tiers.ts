export interface Tier {
  name: string;
  icon: string;
  color: string;
  minElo: number;
  maxElo: number;
}

export const TIERS: Tier[] = [
  { name: 'Novice', icon: '🌱', color: '#888888', minElo: 0, maxElo: 1099 },
  { name: 'Bronze Speller', icon: '🥉', color: '#CD7F32', minElo: 1100, maxElo: 1299 },
  { name: 'Silver Wordsmith', icon: '🥈', color: '#C0C0C0', minElo: 1300, maxElo: 1599 },
  { name: 'Gold Lexicographer', icon: '🥇', color: '#FFD700', minElo: 1600, maxElo: 1999 },
  { name: 'Diamond Grandmaster', icon: '💎', color: '#1E90FF', minElo: 2000, maxElo: 99999 },
];

export const getTierForElo = (elo: number): Tier => {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (elo >= TIERS[i].minElo) {
      return TIERS[i];
    }
  }
  return TIERS[0];
};

export const getNextTier = (elo: number): Tier | null => {
  const currentTier = getTierForElo(elo);
  const index = TIERS.findIndex(t => t.name === currentTier.name);
  if (index >= 0 && index < TIERS.length - 1) {
    return TIERS[index + 1];
  }
  return null;
};

export const getTierProgress = (elo: number): number => {
  const currentTier = getTierForElo(elo);
  const nextTier = getNextTier(elo);
  if (!nextTier) return 1; // maxed out
  
  const range = currentTier.maxElo - currentTier.minElo;
  const progress = elo - currentTier.minElo;
  return Math.max(0, Math.min(1, progress / range));
};
