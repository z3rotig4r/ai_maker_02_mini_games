// src/components/MiniGames/CatchingGame/difficulty.ts

/**
 * 요시의 과일 받아먹기 게임 난이도 설정
 * 초등학생 기준으로 튜닝된 기본값들
 */
export const DIFFICULTY_CONFIG = {
  // 속도 관련 설정 (빠른 체감 업)
  BASE_SPEED: 160,          // 초기 낙하 속도 (픽셀/초) - 120 → 160
  SPEED_PER_SEC: 12,        // 초당 가속도 (픽셀/초²) - 8 → 12
  MAX_SPEED: 640,           // 최대 낙하 속도 (픽셀/초) - 360 → 640

  // 스폰 간격 관련 설정 (지수 감쇠)
  BASE_SPAWN: 0.95,         // 시작 스폰 간격 (초) - 1.2 → 0.95
  MIN_SPAWN: 0.28,          // 최소 스폰 간격 (초) - 0.45 → 0.28
  HALFLIFE: 14,             // 반감기 (초) - 22 → 14 (감쇠 속도 증가)

  // 폭탄 확률 관련 설정
  BOMB_PROB_START: 0.20,    // 시작 시 폭탄 확률 (20%) - 10% → 20%
  BOMB_PROB_END: 0.75,      // 최종 폭탄 확률 (75%) - 70% → 75%
  BOMB_RAMP_SEC: 60,        // 폭탄 확률 증가 기간 (초) - 80 → 60 (더 빠르게 증가)
  MAX_ACTIVE_BOMBS: 6,      // 동시 최대 폭탄 수 - 4 → 6

  // 성능 및 게임 제한
  MAX_ENTITIES_ON_SCREEN: 12, // 화면 내 최대 오브젝트 수 - 10 → 12
  GAME_DURATION_SEC: 0,     // 게임 전체 길이 (초) - 0이면 무제한 (무한 모드)

  // 디버그 설정
  ENABLE_DEBUG_LOGS: true,  // 개발용 콘솔 로그 활성화
  LOG_INTERVAL_SEC: 5,      // 로그 출력 간격 (초)
} as const;

/**
 * 60초 이후 확장 램프 설정 (소프트 램프)
 */
export const EXT = {
  HARD_RAMP_SEC: 60,             // 여기까지는 기존 공식
  SOFT_SPEED_PER_SEC: 6,         // 이후로는 느리게 추가 가속
  MAX_SPEED_HARD: 900,           // 최종 상한
  MIN_SPAWN_HARD: 0.18,          // 최종 하한
  EXTRA_BOMB_PER_SEC: 0.005,     // 60초 이후 추가로 더 빠르게 증가 - 0.003 → 0.005
  MAX_BOMB_PROB: 0.90,           // 최대 폭탄 확률 - 0.85 → 0.90
} as const;

/**
 * 유틸리티 함수들
 */
export const DifficultyUtils = {
  /**
   * 값을 최소값과 최대값 사이로 제한
   */
  clamp: (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  },

  /**
   * 선형 보간 (lerp)
   */
  lerp: (start: number, end: number, t: number): number => {
    return start + (end - start) * t;
  },

  /**
   * 지수 감쇠 함수
   */
  exponentialDecay: (base: number, min: number, halfLife: number, time: number): number => {
    const decayFactor = Math.exp(-time / halfLife);
    return min + (base - min) * decayFactor;
  },

  /**
   * 현재 낙하 속도 계산 (픽셀/초) - 2단계 램프
   */
  calculateSpeed: (elapsedSec: number): number => {
    const { BASE_SPEED, SPEED_PER_SEC, MAX_SPEED } = DIFFICULTY_CONFIG;
    
    // 1단계: 기본 램프
    const speedLinear = BASE_SPEED + SPEED_PER_SEC * elapsedSec;
    let speed = Math.min(speedLinear, MAX_SPEED);
    
    // 2단계: 60초 이후 소프트 램프
    if (elapsedSec > EXT.HARD_RAMP_SEC) {
      speed = Math.min(
        MAX_SPEED + EXT.SOFT_SPEED_PER_SEC * (elapsedSec - EXT.HARD_RAMP_SEC),
        EXT.MAX_SPEED_HARD
      );
    }
    
    return speed;
  },

  /**
   * 현재 스폰 간격 계산 (초) - 2단계 램프
   */
  calculateSpawnInterval: (elapsedSec: number): number => {
    const { BASE_SPAWN, MIN_SPAWN, HALFLIFE } = DIFFICULTY_CONFIG;
    
    // 1단계: 기본 지수 감쇠
    let spawnInterval = DifficultyUtils.exponentialDecay(BASE_SPAWN, MIN_SPAWN, HALFLIFE, elapsedSec);
    
    // 2단계: 60초 이후 추가 감쇠
    if (elapsedSec > EXT.HARD_RAMP_SEC) {
      // 60초 이후엔 1틱마다 0.985배씩 더 줄어드는 느낌
      const extra = Math.pow(0.985, elapsedSec - EXT.HARD_RAMP_SEC);
      spawnInterval = Math.max(spawnInterval * extra, EXT.MIN_SPAWN_HARD);
    }
    
    return spawnInterval;
  },

  /**
   * 현재 폭탄 확률 계산 (0~1) - 2단계 램프
   */
  calculateBombProbability: (elapsedSec: number): number => {
    const { BOMB_PROB_START, BOMB_PROB_END, BOMB_RAMP_SEC } = DIFFICULTY_CONFIG;
    
    // 1단계: 기본 선형 증가
    let pBomb = BOMB_PROB_START + 
      (BOMB_PROB_END - BOMB_PROB_START) * Math.min(1, elapsedSec / BOMB_RAMP_SEC);
    
    // 2단계: 60초 이후 추가 증가
    if (elapsedSec > EXT.HARD_RAMP_SEC) {
      pBomb += EXT.EXTRA_BOMB_PER_SEC * (elapsedSec - EXT.HARD_RAMP_SEC);
    }
    
    return Math.min(pBomb, EXT.MAX_BOMB_PROB);
  },

  /**
   * 난이도 게이지 계산 (0~100%) - 표시용
   * 내부적으로는 100% 이후에도 계속 증가하지만 화면에는 100%로 캡
   */
  calculateDifficultyGauge: (elapsedSec: number): number => {
    const raw = (elapsedSec / EXT.HARD_RAMP_SEC) * 100;
    return Math.min(100, Math.round(raw));
  },

  /**
   * 게이지 색상 계산 - 100%에서 경고색 유지
   */
  getGaugeColor: (percentage: number): string => {
    if (percentage <= 33) return '#28a745'; // 초록
    if (percentage <= 66) return '#fd7e14'; // 주황
    if (percentage <= 100) return '#dc3545'; // 빨강
    return '#8e44ad'; // 보라 (100% 초과 시 위험 표시)
  }
};

export type DifficultyConfig = typeof DIFFICULTY_CONFIG;
