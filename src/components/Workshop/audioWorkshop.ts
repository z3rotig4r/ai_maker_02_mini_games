// Workshop 오디오 파일 import (정적 import로 404 방지)
import BGM_URL from './assets/audio/background.mp3';
import SFX_FAIL from './assets/audio/fail.mp3';
import SFX_SUCCESS from './assets/audio/success.mp3';
import SFX_SELECT_PLACE from './assets/audio/select_place.mp3';
import SFX_MAKING from './assets/audio/making.mp3';

// 오디오 요소들
let bgmEl: HTMLAudioElement | null = null;
const sfxPool: HTMLAudioElement[] = [];
const SFX_POOL_SIZE = 4;

// BGM ducking 설정
const BGM_LEVEL = 0.18;       // 기본 볼륨
const DUCK_LEVEL_PRESS = 0.045; // 제작 버튼 시 약 -12dB
const DUCK_LEVEL_RESULT = 0.063; // 성공/실패 시 약 -9dB

// BGM ducking 상태
let duckTimer: number | null = null;
let unlocked = false;

// 쿨다운 및 동시 재생 제한
const cooldowns = new Map<string, number>();
const activeSounds = new Map<string, number>();

/**
 * 유저 입력으로 오디오 언락 (1회)
 */
export function ensureAudioUnlocked(): void {
  if (unlocked) return;
  
  const handler = async () => {
    try {
      if (!bgmEl) {
        bgmEl = new Audio(BGM_URL);
        bgmEl.loop = true;
        bgmEl.preload = 'auto';
        bgmEl.volume = BGM_LEVEL; // ★ 기본 볼륨 명시
      }
      bgmEl.muted = false;
      await bgmEl.play(); // 사용자 제스처 컨텍스트
      unlocked = true;
      window.removeEventListener('pointerdown', handler, true);
      window.removeEventListener('keydown', handler, true);
      console.debug('🔓 Audio unlocked');
    } catch (e) {
      console.warn('Audio unlock failed', e);
    }
  };
  
  window.addEventListener('pointerdown', handler, true);
  window.addEventListener('keydown', handler, true);
}

// 사운드 설정
const soundConfig = {
  bgm: {
    src: BGM_URL,
    volume: 0.18,
    loop: true,
    fadeIn: 300,
    fadeOut: 250
  },
  sfx: {
    craft_fail: { src: SFX_FAIL, volume: 0.24, cooldown: 0, maxConcurrent: 1 },
    craft_success: { src: SFX_SUCCESS, volume: 0.26, cooldown: 0, maxConcurrent: 1 },
    select_place: { src: SFX_SELECT_PLACE, volume: 0.22, cooldown: 140, maxConcurrent: 3 },
    craft_press: { src: SFX_MAKING, volume: 0.22, cooldown: 0, maxConcurrent: 1 }
  }
} as const;

/**
 * Workshop 오디오 초기화
 */
export async function initWorkshopAudio(): Promise<void> {
  try {
    console.log('🔧 Workshop 오디오 초기화 시작...');
    
    // BGM 로드
    bgmEl = new Audio(BGM_URL);
    bgmEl.loop = true;
    bgmEl.preload = 'auto';
    bgmEl.volume = BGM_LEVEL; // ★ 기본 볼륨 명시
    
    console.log('🎵 BGM 파일 경로:', BGM_URL);
    console.log('🎵 BGM 설정:', { loop: bgmEl.loop, volume: bgmEl.volume });
    
    await new Promise<void>((resolve, reject) => {
      bgmEl!.oncanplaythrough = () => {
        console.log('✅ Workshop BGM 로드 완료');
        console.log('🎵 BGM 상태:', { 
          duration: bgmEl!.duration, 
          readyState: bgmEl!.readyState,
          networkState: bgmEl!.networkState 
        });
        resolve();
      };
      bgmEl!.onerror = (error) => {
        console.error('❌ Workshop BGM 로드 실패:', error);
        console.error('❌ BGM 오류 상세:', {
          error: bgmEl!.error,
          src: bgmEl!.src,
          networkState: bgmEl!.networkState
        });
        reject(error);
      };
    });

    // SFX 풀 생성
    for (let i = 0; i < SFX_POOL_SIZE; i++) {
      const sfx = new Audio();
      sfx.preload = 'auto';
      sfxPool.push(sfx);
    }

    console.log('🔧 Workshop 오디오 초기화 완료');
  } catch (error) {
    console.error('⚠️ Workshop 오디오 초기화 실패:', error);
  }
}

/**
 * Workshop BGM 시작
 */
export async function startWorkshopBgm(): Promise<void> {
  console.log('🎵 Workshop BGM 시작 시도:', { 
    bgmEl: !!bgmEl, 
    muted: isMuted(),
    src: bgmEl?.src 
  });
  
  if (!bgmEl) {
    bgmEl = new Audio(BGM_URL);
    bgmEl.loop = true;
    bgmEl.preload = 'auto';
  }
  
  bgmEl.muted = false;
  bgmEl.volume = BGM_LEVEL; // ★ 반드시 복원
  
  try { 
    await bgmEl.play();
    console.log('✅ Workshop BGM 재생 성공');
  } catch (error) {
    console.error('❌ Workshop BGM 재생 실패:', error);
    console.log('💡 자동재생 차단 - 사용자 입력 대기 중...');
    ensureAudioUnlocked(); // ★ 자동재생 차단 시 대기
  }
}

/**
 * Workshop BGM 정지
 */
export function stopWorkshopBgm(): void {
  if (!bgmEl) return;

  console.log('🔇 Workshop BGM 정지');
  bgmEl.pause();
  bgmEl.currentTime = 0;
  bgmEl.volume = BGM_LEVEL; // ★ 다음 진입 대비
}



/**
 * BGM 볼륨 램프 함수
 */
function rampBgmVolume(target: number, duration = 200): void {
  if (!bgmEl) return;
  
  const start = bgmEl.volume;
  const t0 = performance.now();
  
  function step(t: number): void {
    const p = Math.min(1, (t - t0) / duration);
    if (bgmEl) {
      // 볼륨 값을 0-1 범위로 클램핑
      const newVolume = Math.max(0, Math.min(1, start + (target - start) * p));
      bgmEl.volume = newVolume;
      if (p < 1) {
        requestAnimationFrame(step);
      }
    }
  }
  
  requestAnimationFrame(step);
}

/**
 * BGM ducking 함수 (개선된 버전)
 */
export function duckBgm({
  to,
  holdMs,
  attack = 80,
  release = 280
}: {
  to: number;
  holdMs: number;
  attack?: number;
  release?: number;
}): void {
  if (!bgmEl) return;
  
  // 기존 타이머 정리
  if (duckTimer) {
    clearTimeout(duckTimer);
  }
  
  const ramp = (target: number, duration: number) => {
    const el = bgmEl!;
    const start = el.volume;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      el.volume = Math.max(0, Math.min(1, start + (target - start) * p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // ★ BGM이 정지되어 있으면 일단 정상 시작
  if (bgmEl.paused) { 
    bgmEl.play().catch((error) => {
      console.warn('BGM 재시작 실패:', error);
    }); 
  }

  const safeTarget = Math.max(0, Math.min(1, to));
  console.log(`🎵 BGM ducking: ${safeTarget} (${holdMs}ms)`);
  
  ramp(safeTarget, attack);
  duckTimer = window.setTimeout(() => {
    ramp(BGM_LEVEL, release); // ★ 확실히 복원
    duckTimer = null;
    console.log('🎵 BGM ducking 복원 완료');
  }, holdMs);
}

/**
 * Workshop SFX 재생
 */
export function playWorkshop(
  id: 'craft_fail' | 'craft_success' | 'select_place' | 'craft_press'
): void {
  const config = soundConfig.sfx[id];
  const now = Date.now();
  
  // 쿨다운 체크
  if (config.cooldown > 0) {
    const lastPlayed = cooldowns.get(id) || 0;
    if (now - lastPlayed < config.cooldown) {
      console.log(`⏰ ${id} 쿨다운 중 (${config.cooldown - (now - lastPlayed)}ms 남음)`);
      return;
    }
  }
  
  // 동시 재생 제한 체크
  const activeCount = activeSounds.get(id) || 0;
  if (activeCount >= config.maxConcurrent) {
    console.log(`🚫 ${id} 최대 동시 재생 수 초과 (${config.maxConcurrent})`);
    return;
  }
  
  // 음소거 상태 체크
  if (isMuted()) {
    console.log(`🔇 ${id} 재생 중단 (음소거 상태)`);
    return;
  }
  
  console.log(`🔊 Workshop SFX 재생: ${id}`);
  
  // 사용 가능한 SFX 풀 찾기
  const sfx = sfxPool.find(audio => audio.paused || audio.ended);
  if (!sfx) {
    console.warn('⚠️ 사용 가능한 SFX 풀이 없음');
    return;
  }
  
  // 쿨다운 기록
  cooldowns.set(id, now);
  
  // 동시 재생 카운트 증가
  activeSounds.set(id, activeCount + 1);
  
  // SFX 설정 및 재생
  sfx.src = config.src;
  sfx.volume = config.volume;
  sfx.currentTime = 0;
  
  sfx.play().then(() => {
    console.log(`✅ Workshop SFX 재생 성공: ${id}`);
  }).catch(error => {
    console.error(`❌ Workshop SFX 재생 실패: ${id}`, error);
  });
  
  // 재생 완료 시 카운트 감소
  sfx.onended = () => {
    const currentCount = activeSounds.get(id) || 0;
    activeSounds.set(id, Math.max(currentCount - 1, 0));
  };
}

/**
 * 음소거 상태 확인 (기존 게임 시스템과 동기화)
 */
function isMuted(): boolean {
  return localStorage.getItem('audio.muted') === 'true';
}

/**
 * 전역 음소거/볼륨과의 동기화
 */
export function syncMute(isMuted: boolean): void {
  if (bgmEl) {
    bgmEl.muted = isMuted;
    console.log('🔇 BGM 음소거 동기화:', isMuted);
  }
}

/**
 * 오디오 정리
 */
export function cleanupWorkshopAudio(): void {
  if (bgmEl) {
    bgmEl.pause();
    bgmEl = null;
  }
  
  if (duckTimer) {
    clearTimeout(duckTimer);
    duckTimer = null;
  }
  
  sfxPool.forEach(sfx => {
    sfx.pause();
    sfx.src = '';
  });
  
  cooldowns.clear();
  activeSounds.clear();
  
  console.log('🧹 Workshop 오디오 정리 완료');
}
