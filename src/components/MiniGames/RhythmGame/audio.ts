// RhythmGame 오디오 파일 import (정적 import로 404 방지)
import BGM_URL from './sound/title_theme.mp3';

// 싱글턴 audio 요소
let bgm: HTMLAudioElement | null = null;
let unlocked = false;

/**
 * 유저 입력으로 오디오 언락 (1회)
 */
export function ensureAudioUnlocked(): void {
  if (unlocked) return;
  
  console.debug('🎵 오디오 언락 대기 중...');
  
  const handler = async () => {
    try {
      // AudioContext.resume() 시도 (있는 경우)
      if (typeof AudioContext !== 'undefined') {
        const audioContext = new AudioContext();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
      }
      
      // bgm 없으면 생성
      if (!bgm) {
        bgm = new Audio(BGM_URL);
        bgm.loop = false;
        bgm.preload = 'auto';
        bgm.volume = 0.6;
        console.debug('🎵 BGM 요소 생성:', BGM_URL);
      }
      
      bgm.muted = false;
      await bgm.play();
      unlocked = true;
      
      window.removeEventListener('pointerdown', handler, true);
      window.removeEventListener('keydown', handler, true);
      console.debug('🔓 unlocked');
    } catch (e) {
      console.warn('Audio unlock failed', e);
    }
  };
  
  window.addEventListener('pointerdown', handler, true);
  window.addEventListener('keydown', handler, true);
}

/**
 * BGM 시작
 */
export async function startBgm(): Promise<void> {
  console.debug('🎵 BGM url:', BGM_URL);
  
  // bgm 없으면 생성
  if (!bgm) {
    bgm = new Audio(BGM_URL);
    bgm.loop = false;
    bgm.preload = 'auto';
    bgm.volume = 0.6;
    console.debug('🎵 BGM 요소 생성:', BGM_URL);
  }
  
  bgm.currentTime = 0;
  bgm.muted = false;
  bgm.volume = 0.6;
  
  console.debug('🎵 before play', {
    muted: bgm.muted,
    volume: bgm.volume,
    paused: bgm.paused,
    readyState: bgm.readyState,
    networkState: bgm.networkState
  });
  
  try {
    await bgm.play();
    console.debug('✅ play success', {
      paused: bgm.paused,
      currentTime: bgm.currentTime,
      duration: bgm.duration
    });
  } catch (error) {
    console.debug('❌ play failed', error);
    console.debug('💡 자동재생 차단 - 사용자 입력 대기 중...');
    ensureAudioUnlocked(); // ★ 자동재생 차단 시 대기
  }
}

/**
 * BGM 정지
 */
export function stopBgm(): void {
  console.debug('🔇 BGM 정지');
  if (bgm) {
    bgm.pause();
    bgm.currentTime = 0;
  }
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
  if (bgm) {
    bgm.muted = isMuted;
    console.debug('🔇 BGM 음소거 동기화:', isMuted);
  }
}

/**
 * 오디오 정리
 */
export function cleanupRhythmAudio(): void {
  if (bgm) {
    bgm.pause();
    bgm = null;
  }
  unlocked = false;
  console.debug('🧹 Rhythm 오디오 정리 완료');
}
