// src/data/recipes.ts
export const RECIPES = [
  { creature: 'boo',    object: 'shell',        effect: 'chill',   result: 'boo_shell_mace' },
  { creature: 'goomba', object: 'icicle',       effect: 'thunder', result: 'goomba_ice_hammer' },
  { creature: 'pokku',  object: 'water_cannon', effect: 'splash',  result: 'cheep_water_cannon' },
] as const;

export function matchRecipe(s1: string | null, s2: string | null, s3: string | null) {
  return RECIPES.find(r => r.creature === s1 && r.object === s2 && r.effect === s3)?.result ?? null;
}
