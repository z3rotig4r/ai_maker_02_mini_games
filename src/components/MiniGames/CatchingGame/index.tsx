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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameStarted || isGameOver) return;

    // 화살표 키의 기본 스크롤 동작 방지
    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
    }

    const moveDistance = 20;
    if (e.key === 'ArrowLeft') {
      setYoshiPosition(prev => Math.max(0, prev - moveDistance));
    } else if (e.key === 'ArrowRight') {
      setYoshiPosition(prev => Math.min(760, prev + moveDistance));
    }
  }, [gameStarted, isGameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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

    const spawnInterval = setInterval(() => {
      const newItem: Item = {
        id: Date.now(),
        type: Math.random() > 0.3 ? 'fruit' : 'bomb',
        x: Math.random() * 760,
        y: 0
      };
      setItems(prev => [...prev, newItem]);
    }, 1000 / difficulty);

    const COLLISION_COOLDOWN = 500; // Collision cooldown time in milliseconds

    const gameLoop = setInterval(() => {
      setItems(prev => {
        const newItems = prev.map(item => ({
          ...item,
          y: item.y + (3 * difficulty)
        }));

        // Check collision between Yoshi and items
        const currentTime = Date.now();
        const collectedItems = newItems.filter(item => {
          const isColliding = 
            item.y >= 500 &&
            item.y <= 540 &&
            Math.abs(item.x - yoshiPosition) < 35;
          
          if (isColliding) {
            if (item.type === 'bomb') {
              // Check if cooldown time has passed
              if (currentTime - lastCollisionTime >= COLLISION_COOLDOWN) {
                setLastCollisionTime(currentTime);
                // Reduce life only once per collision
                setLives(prev => {
                  if (prev <= 0) return prev;
                  const newLives = prev - 1;
                  if (newLives <= 0) {
                    setIsGameOver(true);
                  }
                  return newLives;
                });
              }
            } else {
              setScore(s => s + 10);
            }
          }
          
          return !isColliding && item.y < 600;
        });

        return collectedItems;
      });
    }, 16);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(gameLoop);
    };
  }, [gameStarted, isGameOver, difficulty, yoshiPosition]);

  useEffect(() => {
    if (score >= 200) {
      onComplete('마지막 무기의 재료는... 불의 보석과 뽀꾸미를 조합하면 돼!');
    }
  }, [score, onComplete]);

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
              {[...Array(3)].map((_, index) => (
                <img
                  key={index}
                  src={yoshiFace}
                  alt="life"
                  className={`life-icon ${index >= lives ? 'lost' : ''}`}
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
            <div className="game-over">
              <h2>게임 오버!</h2>
              <p>최종 점수: {score}</p>
              {score >= 200 ? (
                <p>대단해요! 힌트를 획득했습니다!</p>
              ) : (
                <p>200점 이상을 획득해보세요!</p>
              )}
              <button onClick={startGame}>다시 시작</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CatchingGame;
