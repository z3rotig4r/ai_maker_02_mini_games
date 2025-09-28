// 파워업 타입 정의
export type PowerupType = 'magnet' | 'slow' | 'shield';

export interface PowerupState {
  type: PowerupType;
  remainingTime: number; // 남은 시간 (밀리초)
  isActive: boolean;
}

export interface PowerupConfig {
  type: PowerupType;
  duration: number; // 지속 시간 (밀리초)
  description: string;
  icon: string;
}

// 파워업 설정
export const POWERUP_CONFIGS: Record<PowerupType, PowerupConfig> = {
  magnet: {
    type: 'magnet',
    duration: 3000, // 3초
    description: '자석',
    icon: '🧲'
  },
  slow: {
    type: 'slow',
    duration: 2000, // 2초
    description: '슬로우',
    icon: '🐌'
  },
  shield: {
    type: 'shield',
    duration: 0, // 1회 사용
    description: '실드',
    icon: '🛡️'
  }
};

export class PowerupManager {
  private activePowerups: Map<PowerupType, PowerupState> = new Map();
  private gameStartTime = 0;

  constructor() {
    this.gameStartTime = Date.now();
  }

  /**
   * 파워업 드롭 확률 계산 (0.5% → 90초에 2%까지 선형 증가)
   */
  getPowerupDropProbability(elapsedSec: number): number {
    const startProb = 0.005; // 0.5%
    const endProb = 0.02; // 2%
    const rampDuration = 90; // 90초

    if (elapsedSec >= rampDuration) {
      return endProb;
    }

    const progress = elapsedSec / rampDuration;
    return startProb + (endProb - startProb) * progress;
  }

  /**
   * 랜덤 파워업 타입 선택
   */
  getRandomPowerupType(): PowerupType {
    const types: PowerupType[] = ['magnet', 'slow', 'shield'];
    const weights = [0.4, 0.4, 0.2]; // 자석 40%, 슬로우 40%, 실드 20%
    
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return types[i];
      }
    }
    
    return 'magnet'; // 기본값
  }

  /**
   * 파워업 활성화
   */
  activatePowerup(type: PowerupType): void {
    const config = POWERUP_CONFIGS[type];
    
    this.activePowerups.set(type, {
      type,
      remainingTime: config.duration,
      isActive: true
    });

    console.log(`✨ 파워업 활성화: ${config.description}`);
  }

  /**
   * 파워업 비활성화
   */
  deactivatePowerup(type: PowerupType): void {
    this.activePowerups.delete(type);
    console.log(`❌ 파워업 비활성화: ${POWERUP_CONFIGS[type].description}`);
  }

  /**
   * 파워업 업데이트 (매 프레임 호출)
   */
  update(deltaTime: number): void {
    const powerupsToRemove: PowerupType[] = [];

    this.activePowerups.forEach((powerup, type) => {
      if (type === 'shield') {
        // 실드는 1회 사용이므로 시간 업데이트 안함
        return;
      }

      powerup.remainingTime -= deltaTime;
      
      if (powerup.remainingTime <= 0) {
        powerupsToRemove.push(type);
      }
    });

    // 만료된 파워업 제거
    powerupsToRemove.forEach(type => {
      this.deactivatePowerup(type);
    });
  }

  /**
   * 특정 파워업이 활성화되어 있는지 확인
   */
  isPowerupActive(type: PowerupType): boolean {
    return this.activePowerups.has(type);
  }

  /**
   * 파워업 남은 시간 반환 (밀리초)
   */
  getPowerupRemainingTime(type: PowerupType): number {
    const powerup = this.activePowerups.get(type);
    return powerup ? powerup.remainingTime : 0;
  }

  /**
   * 모든 활성 파워업 반환
   */
  getActivePowerups(): PowerupState[] {
    return Array.from(this.activePowerups.values());
  }

  /**
   * 실드 사용 (1회 소모)
   */
  useShield(): boolean {
    if (this.isPowerupActive('shield')) {
      this.deactivatePowerup('shield');
      return true; // 실드로 보호됨
    }
    return false; // 실드 없음
  }

  /**
   * 자석 효과: 과일을 요시 방향으로 끌어당김
   */
  applyMagnetEffect(fruitX: number, fruitY: number, yoshiX: number, yoshiY: number): { x: number; y: number } {
    if (!this.isPowerupActive('magnet')) {
      return { x: fruitX, y: fruitY };
    }

    const dx = yoshiX - fruitX;
    const dy = yoshiY - fruitY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 120px 이내에 있을 때만 자석 효과 적용
    if (distance <= 120) {
      const lerpFactor = 0.12; // 보간 계수
      return {
        x: fruitX + dx * lerpFactor,
        y: fruitY + dy * lerpFactor
      };
    }

    return { x: fruitX, y: fruitY };
  }

  /**
   * 슬로우 효과: 엔티티 속도 배율 반환
   */
  getSlowMultiplier(): number {
    return this.isPowerupActive('slow') ? 0.55 : 1.0;
  }

  /**
   * 모든 파워업 초기화
   */
  reset(): void {
    this.activePowerups.clear();
    this.gameStartTime = Date.now();
  }
}
