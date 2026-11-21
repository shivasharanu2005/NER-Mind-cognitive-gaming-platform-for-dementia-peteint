import { OfflineStorageService } from '../storage/localStorage.js';

export const TOTAL_GAME_LEVELS = 30;

export interface TierInfo {
  tier: number;
  name: string;
  badge: string;
  color: string;
  accentBg: string;
  borderColor: string;
  description: string;
}

export function getTierInfo(level: number): TierInfo {
  if (level <= 6) {
    return {
      tier: 1,
      name: 'Foundations',
      badge: '🟢 Tier 1 • Gentle Start',
      color: '#15803D',
      accentBg: '#DCFCE7',
      borderColor: '#86EFAC',
      description: 'Simple, high-contrast, calm pace with full visual guidance.',
    };
  }
  if (level <= 12) {
    return {
      tier: 2,
      name: 'Developing',
      badge: '🔵 Tier 2 • Steady Focus',
      color: '#1D4ED8',
      accentBg: '#DBEAFE',
      borderColor: '#93C5FD',
      description: 'Moderate detail and balanced choices to sharpen attention.',
    };
  }
  if (level <= 18) {
    return {
      tier: 3,
      name: 'Mind Sharpener',
      badge: '🟣 Tier 3 • Skill Builder',
      color: '#6D28D9',
      accentBg: '#EDE9FE',
      borderColor: '#C4B5FD',
      description: 'Expanding vocabulary, richer visual density, and pattern logic.',
    };
  }
  if (level <= 24) {
    return {
      tier: 4,
      name: 'Brain Athlete',
      badge: '🟠 Tier 4 • Advanced Challenge',
      color: '#C2410C',
      accentBg: '#FFEDD5',
      borderColor: '#FDBA74',
      description: 'Subtle visual distinctions, complex sequences, and memory recall.',
    };
  }
  return {
    tier: 5,
    name: 'Grand Champion',
    badge: '🏆 Tier 5 • Master Cognition',
    color: '#B45309',
    accentBg: '#FEF3C7',
    borderColor: '#FCD34D',
    description: 'Highest difficulty: multi-item recall, dense grids, and fine motor precision.',
  };
}

export class GameLevelManager {
  private static getKey(gameId: string, patientId?: string): string {
    const pId = patientId || OfflineStorageService.getActivePatientId();
    return `ner_mind_game_level_${gameId}_${pId}`;
  }

  private static getMaxKey(gameId: string, patientId?: string): string {
    const pId = patientId || OfflineStorageService.getActivePatientId();
    return `ner_mind_game_max_unlocked_${gameId}_${pId}`;
  }

  public static getGameLevel(gameId: string, patientId?: string): number {
    if (typeof localStorage === 'undefined') return 1;
    try {
      const stored = localStorage.getItem(this.getKey(gameId, patientId));
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val >= 1 && val <= TOTAL_GAME_LEVELS) return val;
      }
    } catch {}
    return 1;
  }

  public static saveGameLevel(gameId: string, level: number, patientId?: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const bounded = Math.max(1, Math.min(TOTAL_GAME_LEVELS, level));
      localStorage.setItem(this.getKey(gameId, patientId), bounded.toString());

      // Update max unlocked level
      const currentMax = this.getMaxUnlockedLevel(gameId, patientId);
      if (bounded > currentMax) {
        localStorage.setItem(this.getMaxKey(gameId, patientId), bounded.toString());
      }
    } catch {}
  }

  public static getMaxUnlockedLevel(gameId: string, patientId?: string): number {
    if (typeof localStorage === 'undefined') return 1;
    try {
      const stored = localStorage.getItem(this.getMaxKey(gameId, patientId));
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val >= 1 && val <= TOTAL_GAME_LEVELS) return val;
      }
    } catch {}
    return 1;
  }

  public static completeLevel(
    gameId: string,
    completedLevel: number,
    score: number = 100,
    patientId?: string
  ): { nextLevel: number; unlockedNew: boolean; isFinalLevel: boolean } {
    const nextLevel = Math.min(TOTAL_GAME_LEVELS, completedLevel + 1);
    const prevMax = this.getMaxUnlockedLevel(gameId, patientId);
    const isNew = nextLevel > prevMax;

    this.saveGameLevel(gameId, nextLevel, patientId);

    // Save completion record for caregiver progress monitoring
    if (typeof localStorage !== 'undefined') {
      try {
        const historyKey = `ner_mind_game_history_${gameId}_${patientId || OfflineStorageService.getActivePatientId()}`;
        const prevHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
        prevHistory.push({
          level: completedLevel,
          score,
          completedAt: new Date().toISOString(),
        });
        localStorage.setItem(historyKey, JSON.stringify(prevHistory.slice(-100)));
      } catch {}
    }

    return {
      nextLevel,
      unlockedNew: isNew,
      isFinalLevel: completedLevel >= TOTAL_GAME_LEVELS,
    };
  }

  public static getAllLevelsList(gameId: string, patientId?: string) {
    const current = this.getGameLevel(gameId, patientId);
    const maxUnlocked = this.getMaxUnlockedLevel(gameId, patientId);

    return Array.from({ length: TOTAL_GAME_LEVELS }, (_, i) => {
      const lvl = i + 1;
      return {
        level: lvl,
        isCurrent: lvl === current,
        isUnlocked: lvl <= maxUnlocked,
        tier: getTierInfo(lvl),
      };
    });
  }
}

