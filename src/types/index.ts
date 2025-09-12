// filepath: /react-game/react-game/src/types/index.ts

export type GamePhase = 'A' | 'B';

export type MiniGameType = 'running' | 'memory' | 'rhythm' | 'catching';

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
  type: 'creature' | 'gem' | 'item';
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
}