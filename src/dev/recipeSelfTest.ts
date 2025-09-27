// src/dev/recipeSelfTest.ts
import { matchRecipe } from '../data/recipes';

const cases = [
  ['boo', 'shell', 'chill', 'boo_shell_mace'],
  ['goomba', 'icicle', 'thunder', 'goomba_ice_hammer'],
  ['pokku', 'water_cannon', 'splash', 'cheep_water_cannon'],
  ['boo', 'icicle', 'splash', null],
];

export function recipeSelfTest() {
  const res = cases.map(([a, b, c, exp]) => ({ exp, got: matchRecipe(a, b, c) }));
  const ok = res.every((r, i) => r.got === cases[i][3]);
  console[ok ? 'log' : 'error']('[recipeSelfTest]', res);
}
