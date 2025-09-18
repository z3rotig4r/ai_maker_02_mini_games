// filepath: /react-game/react-game/src/utils/gameLogic.ts

import { MiniGame, Ingredient, Weapon } from '../types';

export const RECIPE_HINTS = {
  weapon1: ['뽀꾸미가 필요해!', '불의 힘이 깃든...', '검의 형태로...'],
  weapon2: ['부끄부끄의 힘!', '얼음의 보석과 함께...', '망치의 형태로...'],
  weapon3: ['굼바의 등껍질!', '번개의 힘이...', '활의 모양으로...']
};

export const checkRecipeMatch = (ingredients: Ingredient[], weaponId: string): boolean => {
  // 무기별 올바른 재료 조합 확인 로직
  const recipes = {
    weapon1: ['pokumi', 'fire_gem', 'steel'],
    weapon2: ['shyguy', 'ice_gem', 'hammer_core'],
    weapon3: ['goomba_shell', 'thunder_gem', 'bow_string']
  };

  const ingredientIds = ingredients.map(i => i.id).sort();
  return JSON.stringify(ingredientIds) === JSON.stringify(recipes[weaponId as keyof typeof recipes].sort());
};

export const getRandomHint = (weaponId: string): string => {
  const hints = RECIPE_HINTS[weaponId as keyof typeof RECIPE_HINTS];
  return hints[Math.floor(Math.random() * hints.length)];
};

export const increaseDifficulty = (game: MiniGame): MiniGame => {
  const difficultyModifiers = {
    running: { speed: 1.2, obstacles: 2 },
    memory: { cards: 4, time: 0.9 },
    rhythm: { speed: 1.15, notes: 3 },
    catching: { speed: 1.25, items: 2 }
  };

  return {
    ...game,
    difficulty: game.difficulty + 1
  };
};