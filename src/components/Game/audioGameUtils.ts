// Board 배경음악 오디오 유틸리티
import BGM_URL from './assets/mini_game_title_song.mp3';

// 오디오 요소
let bgmEl: HTMLAudioElement | null = null;
let unlocked = false;

// BGM 설정
const BGM_LEVEL = 0.3; // 볼륨 30%

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
        bgmEl.volume = BGM_LEVEL;
      }
      bgmEl.muted = false;
      await bgmEl.play(); // 사용자 제스처 컨텍스트
      unlocked = true;
      window.removeEventListener('pointerdown', handler, true);
      window.removeEventListener('keydown', handler, true);
      window.removeEventListener('touchstart', handler, true);
      console.debug('🔓 Board Audio unlocked');
    } catch (e) {
      console.warn('Board Audio unlock failed', e);
    }
  };
  
  window.addEventListener('pointerdown', handler, true);
  window.addEventListener('keydown', handler, true);
  window.addEventListener('touchstart', handler, true);
}

/**
 * Board 배경음악 초기화
 */
export async function initBoardAudio(): Promise<void> {
  try {
    console.log('🔧 Board 오디오 초기화 시작...');
    
    // BGM 로드
    bgmEl = new Audio(BGM_URL);
    bgmEl.loop = true;
    bgmEl.preload = 'auto';
    bgmEl.volume = BGM_LEVEL;
    
    console.log('🎵 Board BGM 파일 경로:', BGM_URL);
    console.log('🎵 Board BGM 설정:', { loop: bgmEl.loop, volume: bgmEl.volume });
    
    await new Promise<void>((resolve, reject) => {
      bgmEl!.oncanplaythrough = () => {
        console.log('✅ Board BGM 로드 완료');
        console.log('🎵 BGM 상태:', { 
          duration: bgmEl!.duration, 
          readyState: bgmEl!.readyState,
          networkState: bgmEl!.networkState 
        });
        resolve();
      };
      bgmEl!.onerror = (error) => {
        console.error('❌ Board BGM 로드 실패:', error);
        console.error('❌ BGM 오류 상세:', {
          error: bgmEl!.error,
          src: bgmEl!.src,
          networkState: bgmEl!.networkState
        });
        reject(error);
      };
    });

    console.log('🔧 Board 오디오 초기화 완료');
  } catch (error) {
    console.error('⚠️ Board 오디오 초기화 실패:', error);
  }
}

/**
 * Board BGM 시작
 */
export async function startBoardBgm(): Promise<void> {
  console.log('🎵 Board BGM 시작 시도:', { 
    bgmEl: !!bgmEl, 
    src: bgmEl?.src 
  });
  
  if (!bgmEl) {
    bgmEl = new Audio(BGM_URL);
    bgmEl.loop = true;
    bgmEl.preload = 'auto';
    bgmEl.volume = BGM_LEVEL;
  }
  
  bgmEl.muted = false;
  bgmEl.volume = BGM_LEVEL;
  
  try { 
    await bgmEl.play();
    console.log('✅ Board BGM 재생 성공');
  } catch (error) {
    console.error('❌ Board BGM 재생 실패:', error);
    console.log('💡 자동재생 차단 - 사용자 입력 대기 중...');
    ensureAudioUnlocked(); // 자동재생 차단 시 대기
  }
}

/**
 * Board BGM 정지
 */
export function stopBoardBgm(): void {
  if (bgmEl) {
    bgmEl.pause();
    bgmEl.currentTime = 0;
    console.log('⏹️ Board BGM 정지');
  }
}

/**
 * Board BGM 일시정지/재생 토글
 */
export function toggleBoardBgm(): boolean {
  if (!bgmEl) return false;
  
  if (bgmEl.paused) {
    bgmEl.play().catch(console.error);
    console.log('▶️ Board BGM 재생');
    return true;
  } else {
    bgmEl.pause();
    console.log('⏸️ Board BGM 일시정지');
    return false;
  }
}

/**
 * BGM 재생 상태 확인
 */
export function isBoardBgmPlaying(): boolean {
  return bgmEl ? !bgmEl.paused : false;
}

/**
 * 리소스 정리
 */
export function cleanupBoardAudio(): void {
  if (bgmEl) {
    bgmEl.pause();
    bgmEl.src = '';
    bgmEl = null;
  }
  unlocked = false;
  console.log('🧹 Board 오디오 리소스 정리 완료');
}