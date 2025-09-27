// src/utils/sfx.ts
const sfx = {
  success: new Audio('/assets/sfx/success.mp3'),
  fail: new Audio('/assets/sfx/fail.mp3'),
};

export function playSfx(name: keyof typeof sfx, volume = 0.8) {
  const a = sfx[name];
  if (!a) return;
  a.volume = volume;
  a.currentTime = 0;
  a.play().catch(() => {
    // SFX 재생 실패 시 무시 (파일이 없거나 브라우저 정책으로 인한 차단)
  });
}
