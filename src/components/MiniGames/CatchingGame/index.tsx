import React, { useState, useEffect, useCallback } from 'react';
import './CatchingGame.css';

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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameStarted || isGameOver) return;

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

    const gameLoop = setInterval(() => {
      setItems(prev => {
        const newItems = prev.map(item => ({
          ...item,
          y: item.y + (3 * difficulty)
        }));

        // 요시와 아이템 충돌 체크
        const collectedItems = newItems.filter(item => {
          const isColliding = 
            item.y >= 500 &&
            item.y <= 540 &&
            Math.abs(item.x - yoshiPosition) < 40;
          
          if (isColliding) {
            if (item.type === 'bomb') {
              setIsGameOver(true);
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
            <span>점수: {score}</span>
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
