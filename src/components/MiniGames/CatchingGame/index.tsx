import React, { useState, useEffect, useCallback } from 'react';
import './CatchingGame.css';
import yoshiFace from './assets/yoshi_face.jpg';

interface CatchingGameProps {
  difficulty: number;
  onComplete: (hint: string) => void;
}

interface Item {
  id: number;
  type: 'fruit' | 'bomb';
  x: number;
  y: number;
}

const CatchingGame: React.FC<CatchingGameProps> = ({ difficulty, onComplete }) => {
  const [yoshiPosition, setYoshiPosition] = useState(400);
  const [items, setItems] = useState<Item[]>([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [lives, setLives] = useState(3);
  const [lastCollisionTime, setLastCollisionTime] = useState(0);

  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

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
            setYoshiPosition(prev => Math.max(0, prev - moveDistance));
            break;
          case 'ArrowRight':
            setYoshiPosition(prev => Math.min(760, prev + moveDistance));
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

  const startGame = () => {
    setYoshiPosition(400);
    setItems([]);
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    if (!gameStarted || isGameOver) return;

    let lastFrameTime = performance.now();
    let lastSpawnTime = lastFrameTime;
    let animationFrameId: number;
    
    const SPAWN_INTERVAL = 1000 / difficulty;
    const COLLISION_COOLDOWN = 500;
    const BASE_SPEED = 5;  // 기본 떨어지는 속도

    const updateGame = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTime;
      const spawnDelta = currentTime - lastSpawnTime;

      // 프레임 건너뛰기 방지
      if (deltaTime > 50) {  // 20fps 이하로 떨어질 경우
        lastFrameTime = currentTime;
        animationFrameId = requestAnimationFrame(updateGame);
        return;
      }

      // 아이템 생성
      if (spawnDelta >= SPAWN_INTERVAL) {
        const newItem: Item = {
          id: Date.now(),
          type: Math.random() > 0.3 ? 'fruit' : 'bomb',
          x: Math.random() * 760,
          y: 0
        };
        setItems(prev => [...prev, newItem]);
        lastSpawnTime = currentTime;
      }

      // 아이템 업데이트와 충돌 처리
      setItems(prev => {
        const now = Date.now();

        // 속도 계산
        const speed = BASE_SPEED * difficulty * (deltaTime / 16.667);  // 60fps 기준 정규화

        // 새로운 아이템 위치 계산과 충돌 체크
        const remainingItems = prev.reduce((acc, item) => {
          const newY = item.y + speed;
          
          // 화면 밖으로 나간 아이템 제거
          if (newY >= 600) return acc;

          // 충돌 체크
          const isColliding = 
            newY >= 500 &&
            newY <= 540 &&
            Math.abs(item.x - yoshiPosition) < 35;

          if (isColliding) {
            if (item.type === 'bomb') {
              if (now - lastCollisionTime >= COLLISION_COOLDOWN) {
                setLastCollisionTime(now);
                const newLives = lives - 1;
                setLives(newLives);
                if (newLives <= 0) {
                  setIsGameOver(true);
                }
              }
            } else {
              setScore(s => s + 10);
            }
            return acc;
          }

          acc.push({
            ...item,
            y: newY
          });
          return acc;
        }, [] as Item[]);

        return remainingItems;
      });

      lastFrameTime = currentTime;
      animationFrameId = requestAnimationFrame(updateGame);
    };

    animationFrameId = requestAnimationFrame(updateGame);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, isGameOver, difficulty, yoshiPosition, lives, lastCollisionTime]);

  // 점수가 200점 이상이면 자동으로 힌트 저장 및 게임 클리어 처리
  // 게임 오버 처리
  useEffect(() => {
    if (score >= 200 && !isGameOver) {
      setIsGameOver(true);
    }
  }, [score, isGameOver]);

  // 메인으로 돌아가기 클릭 시에만 onComplete 실행
  const handleReturnToMain = useCallback(() => {
    // 힌트 저장 및 게임 완료 처리
    onComplete('마지막 무기의 재료는... 불의 보석과 뽀꾸미를 조합하면 돼!');
    // currentMiniGame을 null로 설정하여 메인 화면으로 돌아가기
    setGameStarted(false);
  }, [onComplete]);

  return (
    <div className="catching-game">
      {!gameStarted ? (
        <div className="start-screen">
          <h2>요시의 과일 받아먹기</h2>
          <p>← → 키로 요시를 움직여 과일을 받아먹으세요!</p>
          <p>폭탄은 피하세요!</p>
          <button onClick={startGame}>게임 시작</button>
        </div>
      ) : (
        <>
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
          <div className="game-area">
            {items.map(item => (
              <div
                key={item.id}
                className={`item ${item.type}`}
                style={{ left: item.x, top: item.y }}
              />
            ))}
            <div
              className="yoshi"
              style={{ left: yoshiPosition }}
            />
          </div>
          {isGameOver && (
            <div className="game-over-overlay">
              <div className="game-over-modal">
                {score >= 200 ? (
                  <>
                    <div className="success-message">
                      <h2>🎉 게임 클리어! 🎉</h2>
                      <p>축하합니다! 마지막 힌트를 획득했습니다!</p>
                      <div className="score-display">
                        <p>최종 점수</p>
                        <p className="final-score">{score}</p>
                      </div>
                      <div className="hint-box">
                        <p className="hint-title">🔑 힌트</p>
                        <p className="hint-text">마지막 무기의 재료는... 불의 보석과 뽀꾸미를 조합하면 돼!</p>
                      </div>
                      <button className="success-button" onClick={handleReturnToMain}>
                        메인으로 돌아가기
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="fail-message">
                      <h2>게임 오버!</h2>
                      <div className="score-display">
                        <p>획득한 점수</p>
                        <p className="final-score">{score}</p>
                      </div>
                      <p className="goal-message">200점 이상 획득하면 힌트가 공개됩니다!</p>
                      <button className="retry-button" onClick={startGame}>다시 도전하기</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CatchingGame;
