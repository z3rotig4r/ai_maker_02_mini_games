import React, { useState, useEffect, useCallback } from 'react';
import './RhythmGame.css';

interface RhythmGameProps {
  difficulty: number;
  onComplete: (hint: string) => void;
}

interface Note {
  id: number;
  time: number;
  type: 'normal' | 'danger';
  position: number;
}

const RhythmGame: React.FC<RhythmGameProps> = ({ difficulty, onComplete }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const generateNotes = useCallback(() => {
    const baseSpeed = 3000; // 기본 노트 속도 (ms)
    const speedMultiplier = Math.max(0.5, 1 - (difficulty - 1) * 0.1);
    const noteCount = 20 + (difficulty - 1) * 5;
    
    const newNotes: Note[] = [];
    for (let i = 0; i < noteCount; i++) {
      const isDanger = Math.random() < 0.2;
      newNotes.push({
        id: i,
        time: i * (baseSpeed * speedMultiplier),
        type: isDanger ? 'danger' : 'normal',
        position: Math.floor(Math.random() * 4)
      });
    }
    return newNotes;
  }, [difficulty]);

  const startGame = () => {
    setNotes(generateNotes());
    setScore(0);
    setCombo(0);
    setGameStarted(true);
    setIsGameOver(false);
  };

  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = setInterval(() => {
      setNotes(prev => {
        const now = Date.now();
        const updatedNotes = prev.filter(note => {
          const elapsed = now - note.time;
          if (elapsed > 2000) {
            // 노트를 놓친 경우
            setCombo(0);
            return false;
          }
          return true;
        });

        if (updatedNotes.length === 0 && prev.length > 0) {
          setIsGameOver(true);
          if (score >= 1000) {
            onComplete('세 번째 무기는... 망치처럼 생겼어.');
          }
        }

        return updatedNotes;
      });
    }, 100);

    return () => clearInterval(gameLoop);
  }, [gameStarted, score, onComplete]);

  const handleKeyPress = useCallback((key: number) => {
    if (!gameStarted || isGameOver) return;

    const now = Date.now();
    setNotes(prev => {
      const noteIndex = prev.findIndex(note => {
        const elapsed = now - note.time;
        return note.position === key && elapsed >= -200 && elapsed <= 200;
      });

      if (noteIndex === -1) {
        setCombo(0);
        return prev;
      }

      const note = prev[noteIndex];
      if (note.type === 'danger') {
        setCombo(0);
        setScore(s => Math.max(0, s - 50));
      } else {
        const newCombo = combo + 1;
        setCombo(newCombo);
        setScore(s => s + (10 * Math.floor(newCombo / 10) + 10));
      }

      return prev.filter((_, i) => i !== noteIndex);
    });
  }, [gameStarted, isGameOver, combo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: { [key: string]: number } = {
        'KeyD': 0,
        'KeyF': 1,
        'KeyJ': 2,
        'KeyK': 3
      };
      if (e.code in keyMap) {
        handleKeyPress(keyMap[e.code]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  return (
    <div className="rhythm-game">
      {!gameStarted ? (
        <div className="start-screen">
          <h2>쿵쿵의 리듬 블록</h2>
          <p>D, F, J, K 키를 사용하여 타이밍에 맞춰 노트를 누르세요!</p>
          <button onClick={startGame}>게임 시작</button>
        </div>
      ) : (
        <>
          <div className="game-info">
            <span>점수: {score}</span>
            <span>콤보: {combo}</span>
          </div>
          <div className="play-field">
            <div className="lanes">
              {[0, 1, 2, 3].map(lane => (
                <div key={lane} className="lane">
                  <div className="hit-line" />
                  {notes
                    .filter(note => note.position === lane)
                    .map(note => (
                      <div
                        key={note.id}
                        className={`note ${note.type}`}
                        style={{
                          top: `${((Date.now() - note.time) / 2000) * 100}%`
                        }}
                      />
                    ))}
                </div>
              ))}
            </div>
          </div>
          {isGameOver && (
            <div className="game-over">
              <h2>게임 종료!</h2>
              <p>최종 점수: {score}</p>
              {score >= 1000 ? (
                <p>훌륭해요! 힌트를 획득했습니다!</p>
              ) : (
                <p>1000점 이상을 획득해보세요!</p>
              )}
              <button onClick={startGame}>다시 시작</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RhythmGame;
