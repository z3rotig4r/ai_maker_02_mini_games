// filepath: /react-game/react-game/src/types/index.ts

export type GamePhase = 'A' | 'B';

export type MiniGameType = 'running' | 'memory' | 'rhythm' | 'catching';

export type CreatureId = 'boo' | 'goomba' | 'pokku';
export type ObjectId   = 'shell' | 'icicle' | 'water_cannon';
export type EffectId   = 'thunder' | 'chill' | 'splash';

export type SlotKind = 'creature' | 'object' | 'effect';
export type SlotIndex = 0 | 1 | 2;

export type WeaponId =
  | 'boo_shell_mace'
  | 'goomba_ice_hammer'
  | 'cheep_water_cannon';

export interface MiniGame {
  id: string;
  name: string;
  type: MiniGameType;
  difficulty: number;
  completed: boolean;
  hint: string;
}

export interface Ingredient {
  id: string;
  name: string;
  type: 'creature' | 'object' | 'effect';
  image: string;
}

export interface Weapon {
  id: string;
  name: string;
  requiredIngredients: string[];
  image: string;
}

export interface GameState {
  currentPhase: GamePhase;
  miniGames: MiniGame[];
  inventory: Ingredient[];
  weapons: Weapon[];
  hints: string[];
  currentMiniGame: string | null;
  // 워크샵 상태
  selectedMaterial: string | null;
  craftingSlots: (string | null)[];
  lastRejectedSlot: number | null;
  showToast: boolean;
  toastMessage: string;
  isShaking: boolean;
}