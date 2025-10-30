import React, { useEffect, useState, useCallback } from 'react';
import './RunningGame.css';

interface RunningGameProps {
  difficulty: number;
  onComplete: (hint: string) => void;
}

const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const GAME_SPEED = 4; // 속도 감소
const OBSTACLE_SPAWN_RATE = 0.015; // 굴바 생성 빈도를 크게 줄임 (0.02 -> 0.015)
const COIN_SPAWN_RATE = 0.03;
const JUMP_HEIGHT = 100;  // 점프 최대 높이
const GROUND_Y = 45; // 지면 높이 (CSS의 bottom 값과 일치)

const RunningGame: React.FC<RunningGameProps> = ({ difficulty, onComplete }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerY, setPlayerY] = useState(0);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<number[]>([]);
  const [coins, setCoins] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lastObstacleSpawn, setLastObstacleSpawn] = useState(0); // 마지막 굼바 생성 시점

  // 게임 시작 함수
  const startGame = useCallback(() => {
    setGameStarted(true);
  }, []);

  // 게임 재시작 함수
  const restartGame = useCallback(() => {
    setGameStarted(false);
    setPlayerY(0);
    setVelocityY(0);
    setIsJumping(false);
    setObstacles([]);
    setCoins([]);
    setScore(0);
    setGameOver(false);
    setLastObstacleSpawn(0);
  }, []);

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
    if (!gameStarted) return;
    
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
      // playerY가 0에 가까울 때 (지면에 있을 때)만 충돌 검사
      if (!gameOver && obstacles.some(x => x >= 30 && x <= 70 && playerY > -20)) {
        setGameOver(true);
      }

      // 코인 획득 (플레이어 x 위치 = 50, 코인은 지면에서 55px 위에 있음)
      if (!gameOver) {
        setCoins(prev => {
          // 코인 수집 조건: X축 범위 + Y축 높이 체크
          // 코인은 bottom: 100px (지면에서 55px 위)
          // 플레이어가 최소 40px 이상 점프해야 코인에 닿을 수 있음
          const coinHeightFromGround = 55; // 100px - 45px (GROUND_Y)
          const requiredJumpHeight = coinHeightFromGround - 15; // 여유분 15px
          
          const newCoins = prev.filter(x => !(
            x >= 30 && x <= 70 && // X축 충돌 범위
            Math.abs(playerY) >= requiredJumpHeight // Y축 높이 체크 (playerY는 음수)
          ));
          
          if (prev.length !== newCoins.length) {
            const newScore = score + 1;
            setScore(newScore);
            // 15개 코인 획득 시 자동으로 게임 종료
            if (newScore >= 15) {
              setGameOver(true);
            }
          }
          return newCoins;
        });
      }

      // 새로운 장애물과 코인 생성 (뛰엄뛰엄 생성하도록 개선)
      const currentTime = Date.now();
      const minObstacleInterval = 2000 / difficulty; // 난이도에 따른 최소 간격 (2초 기본)
      
      if (Math.random() < OBSTACLE_SPAWN_RATE * difficulty && 
          currentTime - lastObstacleSpawn > minObstacleInterval) {
        setObstacles(prev => [...prev, 800]);
        setLastObstacleSpawn(currentTime);
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
  }, [gameStarted, isJumping, obstacles, coins, difficulty, gameOver, score, onComplete, playerY, lastObstacleSpawn]);

  return (
    <div className="running-game">
      {!gameStarted ? (
        <div className="start-screen">
          <h2>버섯 왕국 달리기</h2>
          <p>굼바랑 부딪히지 않고 점프(<strong>스페이스바</strong> 또는 <strong>화면 터치</strong>)로 코인 15개를 모아라!</p>
          <button onClick={startGame}>게임 시작</button>
        </div>
      ) : (
        <>
          <div className="score">점수: {score}</div>
          <div 
            className="game-area"
            onTouchStart={(e) => { e.preventDefault(); jump(); }}
            onMouseDown={(e) => { if (e.buttons === 1) jump(); }}
          >
            <div 
              className={`player ${isJumping ? 'jumping' : ''}`} 
              style={{ left: 50, bottom: `${GROUND_Y - playerY}px` }}
            />
            {obstacles.map((x, i) => (
              <div key={`obstacle-${i}`} className="obstacle" style={{ left: x, bottom: `${GROUND_Y}px` }} />
            ))}
            {coins.map((x, i) => (
              <div key={`coin-${i}`} className="coin" style={{ left: x }} />
            ))}
          </div>
          {gameOver && (
            <div className="game-over">
              <h2>{score >= 15 ? '미션 성공! 🎉' : '게임 오버! 😢'}</h2>
              <p className="score-text">획득한 코인: {score}</p>
              {score >= 15 ? (
                <>
                  <button className="continue-btn" onClick={() => onComplete('첫 번째 무기엔... 뽀꾸미가 필요해!')}>
                    계속하기
                  </button>
                </>
              ) : (
                <>
                  <p className="guide-text">15개의 코인을 모아보세요!</p>
                  <button className="retry-btn" onClick={restartGame}>
                    다시 시작
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RunningGame;
