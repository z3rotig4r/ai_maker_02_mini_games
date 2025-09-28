// src/components/MiniGames/CatchingGame/config.ts

/**
 * 모바일 기기 감지 함수
 */
const isMobile = (): boolean => {
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * 요시(플레이어) 설정
 */
export const PLAYER = {
  SCALE: 1.35,       // 데스크톱 크기 배율
  MOBILE_SCALE: 1.25, // 모바일 크기 배율
  BASE_SIZE: 70,     // 기본 크기 (픽셀)
  
  /**
   * 현재 기기에 맞는 크기 계산
   */
  get size(): number {
    return Math.round(this.BASE_SIZE * (isMobile() ? this.MOBILE_SCALE : this.SCALE));
  }
} as const;

/**
 * 플레이어 히트박스 설정
 */
export const PLAYER_HITBOX = {
  radiusFactor: 0.38,      // 요시 시각 크기의 38% (필요시 0.36~0.40에서 미세조정)
  centerYOffset: 0.15,     // +면 '위로' 이동(시각 크기 대비 15%)
} as const;

/**
 * 게임 영역 설정
 */
export const GAME_AREA = {
  WIDTH: 800,
  HEIGHT: 600,
  GROUND_Y: 520, // 요시가 서있는 바닥 위치
  COLLISION_Y_MIN: 500, // 충돌 체크 최소 Y
  COLLISION_Y_MAX: 540  // 충돌 체크 최대 Y
} as const;

/**
 * 유틸리티 함수들
 */
export const GameUtils = {
  /**
   * 값을 최소값과 최대값 사이로 제한
   */
  clamp: (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  },
  
  /**
   * 플레이어 충돌 반경 계산
   */
  getPlayerHitboxRadius: (): number => {
    return Math.round(PLAYER.size * PLAYER_HITBOX.radiusFactor);
  },
  
  /**
   * 플레이어 충돌 중심 위치 계산
   */
  getPlayerHitboxCenter: (playerX: number, playerY: number) => {
    const pSize = PLAYER.size;
    const pRadius = GameUtils.getPlayerHitboxRadius();
    
    return {
      x: playerX,
      y: playerY - pSize * (0.5 + PLAYER_HITBOX.centerYOffset),
      radius: pRadius
    };
  },
  
  /**
   * 플레이어 위치를 게임 영역 내로 제한 (히트박스 반경 기준)
   */
  clampPlayerPosition: (x: number): number => {
    const radius = GameUtils.getPlayerHitboxRadius();
    return GameUtils.clamp(x, radius, GAME_AREA.WIDTH - radius);
  },
  
  /**
   * 원-원 충돌 검사
   */
  checkCircleCollision: (
    center1: { x: number; y: number; radius: number },
    center2: { x: number; y: number; radius: number }
  ): boolean => {
    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= (center1.radius + center2.radius);
  }
};
