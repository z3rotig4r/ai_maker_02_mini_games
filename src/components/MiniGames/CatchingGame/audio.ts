// 오디오 파일 import
import BGM_FLOWER from './assets/audio/bgm_flower_garden.mp3';
import SFX_FRUIT from './assets/audio/sfx_fruit_collect.mp3';
import SFX_BOMB from './assets/audio/sfx_bomb_hit.mp3';
import SFX_VICT from './assets/audio/sfx_victory_goal.mp3';

// 오디오 요소들
let bgmAudio: HTMLAudioElement | null = null;
const sfxPool: HTMLAudioElement[] = [];
const SFX_POOL_SIZE = 3;

// 음소거 상태 관리
const STORAGE_KEY = 'audio.muted';

// 오디오 파일 경로 매핑
const audioFiles = {
  bgm: {
    flower_garden: BGM_FLOWER
  },
  sfx: {
    fruit: SFX_FRUIT,
    bomb: SFX_BOMB,
    victory: SFX_VICT
  }
};

/**
 * 오디오 사전 로드
 */
export async function preloadAudio(): Promise<void> {
  try {
    console.log('🎵 오디오 로드 시작...');
    
    // BGM 로드
    bgmAudio = new Audio();
    bgmAudio.src = audioFiles.bgm.flower_garden;
    bgmAudio.preload = 'auto';
    bgmAudio.volume = 0.55;
    
    console.log('🎵 BGM 파일 경로:', audioFiles.bgm.flower_garden);
    
    await new Promise((resolve, reject) => {
      bgmAudio!.oncanplaythrough = () => {
        console.log('✅ BGM 로드 완료');
        resolve(true);
      };
      bgmAudio!.onerror = (error) => {
        console.error('❌ BGM 로드 실패:', error);
        reject(error);
      };
    });

    // SFX 풀 생성
    for (let i = 0; i < SFX_POOL_SIZE; i++) {
      const sfx = new Audio();
      sfx.preload = 'auto';
      sfxPool.push(sfx);
    }

    console.log('🎵 오디오 사전 로드 완료');
  } catch (error) {
    console.error('⚠️ 오디오 로드 실패:', error);
  }
}

/**
 * BGM 재생
 */
export function playBgm(name: 'flower_garden', opts?: { volume?: number; loop?: boolean }): void {
  console.log('🎵 BGM 재생 시도:', { name, bgmAudio: !!bgmAudio, muted: isMuted() });
  
  if (!bgmAudio) {
    console.warn('⚠️ BGM 오디오 요소가 없습니다');
    return;
  }
  
  if (isMuted()) {
    console.log('🔇 음소거 상태입니다');
    return;
  }

  const { volume = 0.55, loop = true } = opts || {};
  
  bgmAudio.volume = volume;
  bgmAudio.loop = loop;
  
  console.log('🎵 BGM 설정:', { volume, loop, src: bgmAudio.src });
  
  bgmAudio.currentTime = 0;
  bgmAudio.play().then(() => {
    console.log('✅ BGM 재생 성공!');
  }).catch(error => {
    console.error('❌ BGM 재생 실패:', error);
    console.log('💡 브라우저 자동재생 정책으로 인한 차단일 수 있습니다. 사용자 상호작용 후 다시 시도해보세요.');
  });
}

/**
 * BGM 정지
 */
export function stopBgm(): void {
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
  }
}

/**
 * SFX 재생
 */
export function playSfx(key: 'fruit' | 'bomb' | 'victory', opts?: { volume?: number; rate?: number }): void {
  if (isMuted()) return;

  const { volume = 0.8, rate } = opts || {};
  
  // 사용 가능한 SFX 요소 찾기
  const sfx = sfxPool.find(audio => audio.paused || audio.ended);
  if (!sfx) return;

  // 음원 설정
  sfx.src = audioFiles.sfx[key];
  sfx.volume = volume;
  
  // 재생 속도 설정 (±3% 랜덤)
  if (rate !== undefined) {
    sfx.playbackRate = rate;
  } else {
    sfx.playbackRate = 0.97 + Math.random() * 0.06; // 0.97 ~ 1.03
  }

  sfx.currentTime = 0;
  sfx.play().catch(error => {
    console.warn(`SFX ${key} 재생 실패:`, error);
  });
}

/**
 * 음소거 설정
 */
export function setMuted(muted: boolean): void {
  console.log('🔇 음소거 설정:', muted);
  localStorage.setItem(STORAGE_KEY, muted.toString());
  
  if (bgmAudio) {
    bgmAudio.muted = muted;
    console.log('🎵 BGM 음소거:', muted);
  }
  
  sfxPool.forEach(sfx => {
    sfx.muted = muted;
  });
}

/**
 * 음소거 상태 확인
 */
export function isMuted(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

/**
 * 초기화 시 음소거 상태 적용
 */
export function initAudio(): void {
  const muted = isMuted();
  setMuted(muted);
}
