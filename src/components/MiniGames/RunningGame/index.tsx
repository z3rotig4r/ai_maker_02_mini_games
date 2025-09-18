import React, { useEffect, useState, useCallback } from 'react';
import './RunningGame.css';

interface RunningGameProps {
  difficulty: number;
  onComplete: (hint: string) => void;
}

const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const GAME_SPEED = 5; // 속도 감소
const OBSTACLE_SPAWN_RATE = 0.02;
const COIN_SPAWN_RATE = 0.03;
const GROUND_HEIGHT = 90; // 기본 지면 높이
const JUMP_HEIGHT = 150;  // 점프 최대 높이

const RunningGame: React.FC<RunningGameProps> = ({ difficulty, onComplete }) => {
  const [playerY, setPlayerY] = useState(0);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<number[]>([]);
  const [coins, setCoins] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const jump = useCallback(() => {
    if (!isJumping) {
      setIsJumping(true);
      setVelocityY(JUMP_FORCE);
    }
  }, [isJumping]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // 스페이스바 스크롤 방지
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump]);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      // 플레이어 물리 업데이트
      setPlayerY(y => {
        // 최대 점프 높이 제한
        const maxJumpHeight = -JUMP_HEIGHT;
        const newY = Math.max(maxJumpHeight, Math.min(0, y + velocityY));
        
        if (newY === 0) {
          setIsJumping(false);
          setVelocityY(0);
        } else {
          setVelocityY(v => v + GRAVITY);
        }
        return newY;
      });

      // 장애물과 코인 움직임 로직
      setObstacles(prev => prev.map(x => x - GAME_SPEED * difficulty));
      setCoins(prev => prev.map(x => x - GAME_SPEED * difficulty));

      // 충돌 검사 (플레이어는 항상 x=50 위치에 있음)
      if (!gameOver && obstacles.some(x => x >= 30 && x <= 70 && playerY > -40)) {
        setGameOver(true);
      }

      // 코인 획득 (플레이어 x 위치 = 50)
      if (!gameOver) {
        setCoins(prev => {
          const newCoins = prev.filter(x => !(x >= 30 && x <= 70));
          if (prev.length !== newCoins.length) {
            const newScore = score + 1;
            setScore(newScore);
            // 30개 코인 획득 시 자동으로 게임 종료
            if (newScore >= 30) {
              setGameOver(true);
            }
          }
          return newCoins;
        });
      }

      // 새로운 장애물과 코인 생성
      if (Math.random() < OBSTACLE_SPAWN_RATE * difficulty) {
        setObstacles(prev => [...prev, 800]);
      }
      if (Math.random() < COIN_SPAWN_RATE) {
        setCoins(prev => [...prev, 800]);
      }

      // 화면 밖으로 나간 요소들 제거
      setObstacles(prev => prev.filter(x => x > -50));
      setCoins(prev => prev.filter(x => x > -50));
    }, 16); // 약 60fps

    if (gameOver) {
      clearInterval(gameLoop);
    }

    return () => clearInterval(gameLoop);
  }, [isJumping, obstacles, coins, difficulty, gameOver, score, onComplete, playerY]);

  return (
    <div className="running-game">
      <div className="score">점수: {score}</div>
      <div className="game-area">
        <div 
          className={`player ${isJumping ? 'jumping' : ''}`} 
          style={{ left: 50, bottom: `${-playerY}px` }}
        />
        {obstacles.map((x, i) => (
          <div key={`obstacle-${i}`} className="obstacle" style={{ left: x }} />
        ))}
        {coins.map((x, i) => (
          <div key={`coin-${i}`} className="coin" style={{ left: x }} />
        ))}
      </div>
      {gameOver && (
        <div className="game-over">
          <h2>{score >= 30 ? '미션 성공! 🎉' : '게임 오버! 😢'}</h2>
          <p className="score-text">획득한 코인: {score}</p>
          {score >= 30 ? (
            <>
              <div className="hint-box">
                <p className="success-text">축하합니다! 힌트를 획득했어요!</p>
                <p className="hint-text">&ldquo;첫 번째 무기엔... 뽀꾸미가 필요해!&rdquo;</p>
              </div>
              <button className="continue-btn" onClick={() => onComplete('첫 번째 무기엔... 뽀꾸미가 필요해!')}>
                계속하기
              </button>
            </>
          ) : (
            <>
              <p className="guide-text">30개의 코인을 모아보세요!</p>
              <button className="retry-btn" onClick={() => window.location.reload()}>
                다시 시작
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RunningGame;
