import React, { useState, useEffect, useCallback, useRef } from 'react';
import './CatchingGame.css';
import yoshiFace from './assets/yoshi_face.jpg';
import fruitImage from './assets/fruit.png';
import bombImage from './assets/bomb.png';
import { DIFFICULTY_CONFIG, EXT, DifficultyUtils } from './difficulty';
import { getScoreTier, ScoreTier } from './endings';
import { PLAYER, PLAYER_HITBOX, GAME_AREA, GameUtils } from './config';
import { useChromaSprite } from '../../../hooks/useChromaSprite';
import { preloadAudio, playBgm, stopBgm, playSfx, setMuted, isMuted, initAudio } from './audio';
import { PowerupManager, PowerupType, POWERUP_CONFIGS } from './state/powerups';
import HintBubble from './HintBubble';

interface CatchingGameProps {
  difficulty: number;
  onComplete: (hint: string) => void;
}

interface Item {
  id: number;
  type: 'fruit' | 'bomb' | 'powerup';
  x: number;
  y: number;
  powerupType?: PowerupType; // 파워업인 경우 타입
}

interface GameStats {
  elapsedSec: number;
  speed: number;
  spawnInterval: number;
  bombProbability: number;
  activeBombs: number;
  totalEntities: number;
}

const CatchingGame: React.FC<CatchingGameProps> = ({ difficulty, onComplete }) => {
  const [yoshiPosition, setYoshiPosition] = useState(400);
  const [items, setItems] = useState<Item[]>([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [lives, setLives] = useState(3);
  const [lastCollisionTime, setLastCollisionTime] = useState(0);
  const [gameStats, setGameStats] = useState<GameStats>({
    elapsedSec: 0,
    speed: DIFFICULTY_CONFIG.BASE_SPEED,
    spawnInterval: DIFFICULTY_CONFIG.BASE_SPAWN,
    bombProbability: DIFFICULTY_CONFIG.BOMB_PROB_START,
    activeBombs: 0,
    totalEntities: 0
  });

  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [showHitbox, setShowHitbox] = useState<boolean>(false);
  const [showHint, setShowHint] = useState(true);
  
  // 크로마키 처리된 스프라이트 이미지
  const cleanFruitImage = useChromaSprite(fruitImage);
  const cleanBombImage = useChromaSprite(bombImage);
  
  // 파워업 매니저
  const powerupManagerRef = useRef<PowerupManager | null>(null);
  
  // 고정 배경 레이어 ref
  const bgRef = useRef<HTMLDivElement>(null);
  
  // 게임 루프를 위한 ref들
  const gameStartTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const lastLogTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number>(0);
  const itemIdCounterRef = useRef<number>(0);

  // 초기화 함수
  const initializeGame = useCallback(async () => {
    // 오디오 초기화
    initAudio();
    await preloadAudio();
    
    // 파워업 매니저 초기화
    powerupManagerRef.current = new PowerupManager();
    
    // 게임 상태 초기화
    setYoshiPosition(400);
    setItems([]);
    setScore(0);
    setIsGameOver(false);
    setLives(3);
    setLastCollisionTime(0);
    gameStartTimeRef.current = Date.now();
    lastFrameTimeRef.current = Date.now();
    lastSpawnTimeRef.current = Date.now();
    spawnTimerRef.current = DIFFICULTY_CONFIG.BASE_SPAWN * 1000;
    itemIdCounterRef.current = 0;
    
    setGameStats({
      elapsedSec: 0,
      speed: DIFFICULTY_CONFIG.BASE_SPEED,
      spawnInterval: DIFFICULTY_CONFIG.BASE_SPAWN,
      bombProbability: DIFFICULTY_CONFIG.BOMB_PROB_START,
      activeBombs: 0,
      totalEntities: 0
    });
  }, []);


  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameStarted || isGameOver) return;

    // 화살표 키의 기본 스크롤 동작 방지
    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
    }
    
    setPressedKeys(prev => new Set(prev).add(e.key));
  }, [gameStarted, isGameOver]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.delete(e.key);
      return next;
    });
  }, []);

  // 요시 움직임을 위한 별도의 애니메이션 프레임
  useEffect(() => {
    if (!gameStarted || isGameOver) return;

    let lastTime = performance.now();
    let animationFrameId: number;

    const updateYoshiPosition = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      const moveDistance = 0.5 * deltaTime; // 초당 500픽셀 속도

      pressedKeys.forEach(key => {
        switch (key) {
          case 'ArrowLeft':
            setYoshiPosition(prev => GameUtils.clampPlayerPosition(prev - moveDistance));
            break;
          case 'ArrowRight':
            setYoshiPosition(prev => GameUtils.clampPlayerPosition(prev + moveDistance));
            break;
        }
      });

      lastTime = currentTime;
      animationFrameId = requestAnimationFrame(updateYoshiPosition);
    };

    animationFrameId = requestAnimationFrame(updateYoshiPosition);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameStarted, isGameOver, pressedKeys]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const startGame = async () => {
    const now = performance.now();
    
    // 게임 초기화
    await initializeGame();
    setGameStarted(true);
    
    // BGM 시작
    playBgm('flower_garden', { loop: true, volume: 0.55 });
    
    // 개발용 히트박스 토글 설정
    if (process.env.NODE_ENV === 'development') {
      setShowHitbox((window as any).__hitbox === true);
    }
    
    // 게임 시작 시간과 타이머들 초기화
    gameStartTimeRef.current = now;
    lastFrameTimeRef.current = now;
    lastSpawnTimeRef.current = now;
    lastLogTimeRef.current = now;
    spawnTimerRef.current = DIFFICULTY_CONFIG.BASE_SPAWN * 1000; // 밀리초로 변환
    
    setGameStats({
      elapsedSec: 0,
      speed: DIFFICULTY_CONFIG.BASE_SPEED,
      spawnInterval: DIFFICULTY_CONFIG.BASE_SPAWN,
      bombProbability: DIFFICULTY_CONFIG.BOMB_PROB_START,
      activeBombs: 0,
      totalEntities: 0
    });
  };

  useEffect(() => {
    if (!gameStarted || isGameOver) return;

    const COLLISION_COOLDOWN = 500; // 500ms
    
    const updateGame = (currentTime: number) => {
      const deltaTimeMs = currentTime - lastFrameTimeRef.current;
      const deltaTimeSec = deltaTimeMs / 1000;
      const elapsedSec = (currentTime - gameStartTimeRef.current) / 1000;

      // 프레임 건너뛰기 방지 (과도한 가속 방지)
      if (deltaTimeMs > 50) {  // 20fps 이하로 떨어질 경우
        lastFrameTimeRef.current = currentTime;
        animationFrameIdRef.current = requestAnimationFrame(updateGame);
        return;
      }

      // 무한 모드: 시간 제한 없음, 목숨이 0이 될 때까지 진행

      // 현재 난이도 값들 계산
      const currentSpeed = DifficultyUtils.calculateSpeed(elapsedSec);
      const currentSpawnInterval = DifficultyUtils.calculateSpawnInterval(elapsedSec);
      const currentBombProbability = DifficultyUtils.calculateBombProbability(elapsedSec);

      // 스폰 타이머 업데이트
      spawnTimerRef.current -= deltaTimeMs;
      
      // 아이템 생성
      if (spawnTimerRef.current <= 0) {
        const activeBombs = items.filter(item => item.type === 'bomb').length;
        const totalEntities = items.length;
        
        // 최대 엔티티 수 제한
        if (totalEntities < DIFFICULTY_CONFIG.MAX_ENTITIES_ON_SCREEN) {
          // 파워업 드롭 확률 계산
          const powerupDropProb = powerupManagerRef.current?.getPowerupDropProbability(elapsedSec) || 0;
          const shouldSpawnPowerup = Math.random() < powerupDropProb;
          
          let itemType: 'fruit' | 'bomb' | 'powerup';
          let powerupType: PowerupType | undefined;
          
          if (shouldSpawnPowerup) {
            itemType = 'powerup';
            powerupType = powerupManagerRef.current?.getRandomPowerupType() || 'magnet';
          } else {
            // 동시 폭탄 수 제한
            const canSpawnBomb = activeBombs < DIFFICULTY_CONFIG.MAX_ACTIVE_BOMBS;
            const shouldSpawnBomb = Math.random() < currentBombProbability;
            itemType = (canSpawnBomb && shouldSpawnBomb) ? 'bomb' : 'fruit';
          }
          
          const newItem: Item = {
            id: itemIdCounterRef.current++,
            type: itemType,
            x: Math.random() * 760,
            y: 0,
            powerupType
          };
          
          setItems(prev => [...prev, newItem]);
        }
        
        // 다음 스폰 시간 설정
        spawnTimerRef.current = currentSpawnInterval * 1000;
      }

      // 아이템 업데이트와 충돌 처리
      setItems(prev => {
        const now = Date.now();
        let bombHit = false;

        // 슬로우 효과 적용
        const slowMultiplier = powerupManagerRef.current?.getSlowMultiplier() || 1.0;
        const effectiveSpeed = currentSpeed * slowMultiplier;
        
        // 프레임 독립적인 속도 계산 (픽셀/초 → 픽셀/프레임)
        const speedPerFrame = effectiveSpeed * deltaTimeSec;

        // 새로운 아이템 위치 계산과 충돌 체크
        const remainingItems = prev.reduce((acc, item) => {
          let newX = item.x;
          let newY = item.y + speedPerFrame;
          
          // 자석 효과 적용 (과일만)
          if (item.type === 'fruit' && powerupManagerRef.current?.isPowerupActive('magnet')) {
            const magnetEffect = powerupManagerRef.current.applyMagnetEffect(
              item.x, newY, yoshiPosition, GAME_AREA.GROUND_Y
            );
            newX = magnetEffect.x;
            newY = magnetEffect.y;
          }
          
          // 화면 밖으로 나간 아이템 제거
          if (newY >= 600) return acc;

          // 충돌 체크 (원-원 거리 충돌)
          const playerHitbox = GameUtils.getPlayerHitboxCenter(yoshiPosition, GAME_AREA.GROUND_Y);
          const itemRadius = 22.5; // 아이템 반경 (45px / 2)
          const itemCenter = { x: newX, y: newY, radius: itemRadius };
          
          const isColliding = GameUtils.checkCircleCollision(playerHitbox, itemCenter);

          if (isColliding) {
            if (item.type === 'bomb') {
              // 실드 체크
              const hasShield = powerupManagerRef.current?.useShield() || false;
              if (hasShield) {
                // 실드로 보호됨 - 파워업 소모, 목숨 감소 없음
                playSfx('fruit', { volume: 0.9 }); // 실드 발동 사운드
              } else {
                // 실드 없음 - 일반 폭탄 처리
                if (now - lastCollisionTime >= COLLISION_COOLDOWN) {
                  bombHit = true;
                  setLastCollisionTime(now);
                  playSfx('bomb', { volume: 0.9 });
                  const newLives = lives - 1;
                  setLives(newLives);
                  if (newLives <= 0) {
                    // 게임 오버 - BGM 정지, 승리 사운드 재생
                    stopBgm();
                    playSfx('victory', { volume: 0.9 });
                    setIsGameOver(true);
                  }
                }
              }
            } else if (item.type === 'fruit') {
              // 과일 수집
              setScore(s => s + 10);
              playSfx('fruit', { volume: 0.9 });
            } else if (item.type === 'powerup' && item.powerupType) {
              // 파워업 수집
              powerupManagerRef.current?.activatePowerup(item.powerupType);
              playSfx('fruit', { volume: 0.9 }); // 파워업 획득 사운드
            }
            return acc;
          }

          acc.push({
            ...item,
            x: newX,
            y: newY
          });
          return acc;
        }, [] as Item[]);

        return remainingItems;
      });

      // 파워업 업데이트
      powerupManagerRef.current?.update(deltaTimeMs);

      // 게임 통계 업데이트
      const activeBombs = items.filter(item => item.type === 'bomb').length;
      const totalEntities = items.length;
      
      setGameStats({
        elapsedSec,
        speed: currentSpeed,
        spawnInterval: currentSpawnInterval,
        bombProbability: currentBombProbability,
        activeBombs,
        totalEntities
      });

      // 디버그 로그 (5초마다)
      if (DIFFICULTY_CONFIG.ENABLE_DEBUG_LOGS && 
          currentTime - lastLogTimeRef.current >= DIFFICULTY_CONFIG.LOG_INTERVAL_SEC * 1000) {
        console.table({
          t: elapsedSec.toFixed(1) + 's',
          speed: Math.round(currentSpeed) + 'px/s',
          spawnInterval: currentSpawnInterval.toFixed(2) + 's',
          pBomb: (currentBombProbability * 100).toFixed(1) + '%',
          activeBombs: activeBombs,
          totalEntities: totalEntities
        });
        lastLogTimeRef.current = currentTime;
      }

      lastFrameTimeRef.current = currentTime;
      animationFrameIdRef.current = requestAnimationFrame(updateGame);
    };

    animationFrameIdRef.current = requestAnimationFrame(updateGame);
    
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [gameStarted, isGameOver, yoshiPosition, lives, lastCollisionTime, items]);

  // 무한 모드: 점수 기반 자동 클리어 제거, 목숨이 0이 될 때만 게임 오버

  // 게임 종료 시 통계 요약 출력
  useEffect(() => {
    if (isGameOver && DIFFICULTY_CONFIG.ENABLE_DEBUG_LOGS) {
      const avgSpawnInterval = gameStats.elapsedSec > 0 ? 
        (gameStats.elapsedSec / Math.max(1, score / 10)) : 0;
      const avgBombRatio = gameStats.elapsedSec > 0 ? 
        (gameStats.bombProbability * 100) : 0;
      
      console.log('=== 게임 종료 통계 요약 ===');
      console.table({
        '총 플레이 시간': gameStats.elapsedSec.toFixed(1) + '초',
        '최종 점수': score + '점',
        '평균 스폰 간격': avgSpawnInterval.toFixed(2) + '초',
        '최종 폭탄 비율': avgBombRatio.toFixed(1) + '%',
        '최대 동시 폭탄': gameStats.activeBombs,
        '최대 화면 오브젝트': gameStats.totalEntities
      });
    }
  }, [isGameOver, gameStats, score]);

  // 메인으로 돌아가기 클릭 시에만 onComplete 실행
  const handleReturnToMain = useCallback(() => {
    // 힌트 저장 및 게임 완료 처리
    onComplete('마지막 무기의 재료는... 물의 보석과 뽀꾸뽀꾸를 조합하면 돼!');
    // currentMiniGame을 null로 설정하여 메인 화면으로 돌아가기
    setGameStarted(false);
  }, [onComplete]);

  // 입력으로 인한 창 스크롤 방지
  useEffect(() => {
    const preventScrollKeys = [
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
      'Space', ' ', 'Tab', 'Enter'
    ];

    const handleKeyDown = (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      if (preventScrollKeys.includes(keyEvent.key)) {
        keyEvent.preventDefault();
      }
    };

    // 캡처 단계에서 이벤트 차단
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // 게임 시작 시 힌트 버블 5초 표시
  useEffect(() => {
    if (gameStarted) {
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 5000); // 5초 후 힌트 숨김

      return () => clearTimeout(timer);
    }
  }, [gameStarted]);

  return (
    <div className="catching-game">
      {/* 단일 배경 레이어 */}
      <div className="bg-pan" ref={bgRef} aria-hidden="true" />
      {!gameStarted ? (
        <div className="start-screen">
          <h2>요시의 과일 받아먹기</h2>
          <p>← → 키로 요시를 움직여 과일을 받아먹으세요!</p>
          <p>폭탄은 피하세요!</p>
          <button onClick={startGame}>게임 시작</button>
        </div>
      ) : (
        <>
          {/* 힌트 버블 */}
          <HintBubble show={showHint} />
          
          <div className="game-info">
            <div className="score">점수: {score}</div>
            <div className="lives">
              {Array.from({ length: 3 }).map((_, index) => (
                <img
                  key={index}
                  src={yoshiFace}
                  alt="life"
                  style={{ 
                    opacity: index < lives ? 1 : 0.5,
                    transition: 'opacity 0.3s ease'
                  }}
                  className="life-icon"
                />
              ))}
            </div>
          </div>
          
          
          {/* 난이도 게이지 및 시간 표시 */}
          <div className="difficulty-hud">
            <div className="difficulty-gauge-container">
              <div className="gauge-label">난이도</div>
              <div className="gauge-background">
                <div 
                  className="gauge-fill"
                  style={{
                    width: `${DifficultyUtils.calculateDifficultyGauge(gameStats.elapsedSec)}%`,
                    backgroundColor: DifficultyUtils.getGaugeColor(
                      Math.min(100, Math.round((gameStats.elapsedSec / EXT.HARD_RAMP_SEC) * 100))
                    )
                  }}
                />
              </div>
              <div className="gauge-text">
                {DifficultyUtils.calculateDifficultyGauge(gameStats.elapsedSec)}%
              </div>
            </div>
            
            {/* 무한 모드: 남은 시간 표시 제거 */}
            
            {/* 폭탄 상한 도달 시 시각적 피드백 */}
            {gameStats.activeBombs >= DIFFICULTY_CONFIG.MAX_ACTIVE_BOMBS && (
              <div className="bomb-limit-warning">
                ⚠️ 폭탄 한계 도달!
              </div>
            )}
          </div>
          
          {/* 파워업 HUD */}
          <div className="powerup-hud">
            {powerupManagerRef.current?.getActivePowerups().map(powerup => {
              const config = POWERUP_CONFIGS[powerup.type];
              const remainingSec = Math.ceil(powerup.remainingTime / 1000);
              return (
                <div key={powerup.type} className="powerup-chip">
                  <span className="powerup-icon">{config.icon}</span>
                  <span className="powerup-name">{config.description}</span>
                  {powerup.type !== 'shield' && (
                    <span className="powerup-timer">{remainingSec}s</span>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="game-area">
            {items.map(item => (
              <div
                key={item.id}
                className={`entity ${item.type}`}
                style={{ left: item.x, top: item.y }}
              >
                {item.type === 'powerup' ? (
                  <div className="powerup-item">
                    <span className="powerup-icon-large">
                      {item.powerupType ? POWERUP_CONFIGS[item.powerupType].icon : '❓'}
                    </span>
                  </div>
                ) : (
                  <img 
                    className="sprite" 
                    src={item.type === 'fruit' ? cleanFruitImage : cleanBombImage} 
                    alt="" 
                  />
                )}
              </div>
            ))}
            <div
              className="yoshi"
              style={{ 
                left: yoshiPosition,
                width: PLAYER.size,
                height: PLAYER.size
              }}
            />
            
            {/* 개발용 히트박스 시각화 */}
            {process.env.NODE_ENV === 'development' && showHitbox && (
              (() => {
                const playerHitbox = GameUtils.getPlayerHitboxCenter(yoshiPosition, GAME_AREA.GROUND_Y);
                return (
                  <div
                    className="hitbox-debug"
                    style={{
                      position: 'absolute',
                      left: playerHitbox.x - playerHitbox.radius,
                      top: playerHitbox.y - playerHitbox.radius,
                      width: playerHitbox.radius * 2,
                      height: playerHitbox.radius * 2,
                      border: '2px solid #22c55e',
                      background: 'transparent',
                      borderRadius: '999px',
                      pointerEvents: 'none',
                      zIndex: 1000
                    }}
                  />
                );
              })()
            )}
          </div>
          {isGameOver && (
            <div className="game-over-overlay">
              <div className="game-over-modal">
                <div className="success-message">
                  <h2>미션 완료!</h2>
                  <p>축하합니다! 힌트를 획득했습니다.</p>
                  
                  {(() => {
                    const tier = getScoreTier(score);
                    return (
                      <>
                        <div className="score-display">
                          <p>최종 점수</p>
                          <p className="final-score">{score}</p>
                        </div>
                        <div className="tier-display">
                          <h3 className="tier-title">{tier.title}</h3>
                          <p className="tier-message">{tier.msg}</p>
                        </div>
                        <div className="hint-box">
                          <p className="hint-title">힌트</p>
                          <p className="hint-text">마지막 무기의 재료는... 물의 보석과 뽀꾸뽀꾸를 조합하면 돼!</p>
                        </div>
                        <button className="success-button" onClick={handleReturnToMain}>
                          {tier.cta}
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CatchingGame;
