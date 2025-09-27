// src/data/materials.ts
export const MATERIALS_MAP = {
  // creatures
  boo:    { kind: 'creature', name: '고스트', icon: '/assets/icons/creature_boo.jpg' },
  goomba: { kind: 'creature', name: '굼바',   icon: '/assets/icons/creature_goomba.jpg' },
  pokku:  { kind: 'creature', name: '뽀꾸미', icon: '/assets/icons/creature_pokku.jpg' },

  // objects
  shell:        { kind: 'object', name: '등껍질',    icon: '/assets/icons/object_shell.jpg' },
  icicle:       { kind: 'object', name: '고드름',    icon: '/assets/icons/object_icicle.png' },
  water_cannon: { kind: 'object', name: '물대포',    icon: '/assets/icons/object_water_cannon.png' },

  // effects
  thunder: { kind: 'effect', name: '우르르쾅쾅', icon: '/assets/icons/effect_thunder.png' },
  chill:   { kind: 'effect', name: '으슬으슬',   icon: '/assets/icons/effect_chill.png' },
  splash:  { kind: 'effect', name: '펑펑',       icon: '/assets/icons/effect_splash.png' },

  // (optional) dummies — 레시피 미포함
  shyguy: { kind: 'creature', name: '부끄부끄', icon: '/assets/icons/creature_shyguy.png' },
  coin:   { kind: 'object',   name: '코인',     icon: '/assets/icons/object_coin.png' },
  smoke:  { kind: 'effect',   name: '연기',     icon: '/assets/icons/effect_smoke.png' },
} as const;
