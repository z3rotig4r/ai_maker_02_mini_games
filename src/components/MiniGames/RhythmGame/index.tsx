import React, { useState, useEffect, useCallback, useRef } from 'react';
import './RhythmGame.css';
import { startBgm, stopBgm, ensureAudioUnlocked, syncMute, cleanupRhythmAudio } from './audio';

interface RhythmGameProps {
  difficulty: number;
  onComplete: (hint: string) => void;
}

interface Note {
  id: number;
  time: number;
  type: 'kkong' | 'danger';
  position: number;
  isHit?: boolean; // 노트가 눌렸는지 여부
}

interface GameStats {
  perfect: number;
  good: number;
  bad: number;
  miss: number;
  maxCombo: number;
  score: number;
}

const RhythmGame: React.FC<RhythmGameProps> = ({ difficulty, onComplete }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showGhostMessage, setShowGhostMessage] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({
    perfect: 0,
    good: 0,
    bad: 0,
    miss: 0,
    maxCombo: 0,
    score: 0
  });
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [showAccuracy, setShowAccuracy] = useState<string | null>(null);
  const [showCombo, setShowCombo] = useState<number | null>(null);
  const [hitParticles, setHitParticles] = useState<Array<{id: number, x: number, y: number, type: string}>>([]);
  const [screenEffects, setScreenEffects] = useState<Array<{id: number, type: string}>>([]);
  const [backgroundEffect, setBackgroundEffect] = useState<string>('normal');

  // RhythmGame 오디오 초기화 및 정리
  useEffect(() => {
    // 마운트 시 오디오 언락 대기
    ensureAudioUnlocked();
    
    // 컴포넌트 언마운트 시 오디오 정리
    return () => {
      cleanupRhythmAudio();
    };
  }, []);

  const generateNotes = useCallback(() => {
    // 마리오 노래의 BPM을 120으로 가정 (실제로는 분석이 필요)
    const bpm = 120;
    const beatInterval = 60000 / bpm; // 1박자당 ms
    const noteInterval = beatInterval; // 4분음표 간격 (더 천천히)
    
    const speedMultiplier = Math.max(0.7, 1 - (difficulty - 1) * 0.05);
    const noteCount = 20 + (difficulty - 1) * 5; // 노트 개수 줄임
    
    const newNotes: Note[] = [];
    const now = Date.now();
    
    for (let i = 0; i < noteCount; i++) {
      const position = Math.floor(Math.random() * 4); // 랜덤 위치
      
      newNotes.push({
        id: i,
        time: now + (i * noteInterval * speedMultiplier) + 2000, // 2초 후부터 시작
        type: 'kkong', // 모든 노트를 쿵쿵으로
        position: position
      });
    }
    return newNotes;
  }, [difficulty]);

  const startGame = () => {
    // 모든 상태 초기화
    setScore(0);
    setCombo(0);
    setGameStarted(false);
    setIsGameOver(false);
    setShowResults(false);
    setShowGhostMessage(false);
    setGameStartTime(0);
    setGameStats({
      perfect: 0,
      good: 0,
      bad: 0,
      miss: 0,
      maxCombo: 0,
      score: 0
    });
    
    // 약간의 지연 후 게임 시작
    setTimeout(() => {
      const newNotes = generateNotes();
      console.log('Generated notes:', newNotes.length); // 디버깅용
      setNotes(newNotes);
      setGameStarted(true);
      setGameStartTime(Date.now());
      
      // BGM 시작
      startBgm();
    }, 100);
  };

  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = setInterval(() => {
      setNotes(prev => {
        const now = Date.now();
        const updatedNotes = prev.filter(note => {
          const elapsed = now - note.time;
          if (elapsed > 1000) { // 히트라인을 지나서 1초 후에 사라짐
            // 노트를 놓친 경우 - 점수 감소
            setCombo(0);
            setScore(s => Math.max(0, s - 20)); // 20점 감소
            setGameStats(prevStats => ({
              ...prevStats,
              miss: prevStats.miss + 1
            }));
            return false;
          }
          return true;
        });

        // 게임 시간 체크 (무한 게임)
        const gameDuration = Date.now() - gameStartTime;
        
        // 60초 후 게임 종료 (8000점 상관없이)
        if (gameDuration > 60000) {
          setIsGameOver(true);
          setShowResults(true);
          
          // BGM 정지
          stopBgm();
          
          // 8000점 미만이면 히든 조건 완료 메시지와 함께 힌트 제공
          setTimeout(() => {
            setShowGhostMessage(true);
          }, 1000);
          
          setTimeout(() => {
            setShowGhostMessage(false);
            onComplete('히든 조건완료! 끝까지 게임을 플레이 하셨기에 힌트가 제공됩니다');
          }, 3000);
        } else {
          // 게임이 계속 진행 중이면 새로운 노트 생성
          if (updatedNotes.length < 5) { // 화면에 노트가 5개 미만이면 새로 생성
            const bpm = 120;
            const beatInterval = 60000 / bpm;
            const noteInterval = beatInterval;
            const speedMultiplier = Math.max(0.7, 1 - (difficulty - 1) * 0.05);
            
            const position = Math.floor(Math.random() * 4);
            const newNote: Note = {
              id: Date.now() + Math.random(),
              time: now + 2000, // 2초 후에 히트라인에 도달하도록
              type: 'kkong', // 모든 노트를 쿵쿵으로
              position: position
            };
            
            updatedNotes.push(newNote);
          }
        }

        return updatedNotes;
      });
    }, 100);

    return () => clearInterval(gameLoop);
  }, [gameStarted, score, onComplete]);

  const handleKeyPress = useCallback((key: number) => {
    if (!gameStarted || isGameOver) return;

    // 키 활성화 상태 업데이트
    setActiveKeys(prev => new Set(prev).add(key));
    setTimeout(() => {
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }, 100);

    const now = Date.now();
    setNotes(prev => {
      const noteIndex = prev.findIndex(note => {
        const elapsed = now - note.time;
        // 노트가 히트라인에 도달했을 때 ±300ms 범위에서 판정 (더 넓게)
        return note.position === key && elapsed >= -300 && elapsed <= 300;
      });

      if (noteIndex === -1) {
        // 잘못된 키를 누르면 점수 감소 (miss는 카운트하지 않음)
        setCombo(0);
        setScore(s => Math.max(0, s - 30)); // 30점 감소
        return prev;
      }

      const note = prev[noteIndex];
      const elapsed = now - note.time;
      let accuracy: 'perfect' | 'good' | 'bad' = 'bad';
      let points = 0;

      // 정확도 판정 (더 관대하게)
      if (Math.abs(elapsed) <= 100) {
        accuracy = 'perfect';
        points = 100;
      } else if (Math.abs(elapsed) <= 200) {
        accuracy = 'good';
        points = 50;
      } else {
        accuracy = 'bad';
        points = 20; // bad도 점수 증가
      }

      // 노트를 눌렸다고 표시
      const updatedNote = { ...note, isHit: true };

      // 시각적 효과 표시
      setShowAccuracy(accuracy);
      setTimeout(() => setShowAccuracy(null), 800);

      if (note.type === 'danger') {
        setCombo(0);
        setScore(s => Math.max(0, s - 50));
        setGameStats(prevStats => ({
          ...prevStats,
          bad: prevStats.bad + 1
        }));
      } else {
        const newCombo = combo + 1;
        setCombo(newCombo);
        const comboBonus = Math.floor(newCombo / 10) * 10;
        const finalPoints = points + comboBonus;
        setScore(s => s + finalPoints);
        
        setGameStats(prevStats => ({
          ...prevStats,
          [accuracy]: prevStats[accuracy] + 1,
          maxCombo: Math.max(prevStats.maxCombo, newCombo),
          score: prevStats.score + finalPoints
        }));

        // 콤보 효과
        if (newCombo > 0 && newCombo % 5 === 0) {
          setShowCombo(newCombo);
          setTimeout(() => setShowCombo(null), 500);
        }

        // 특별 콤보 효과
        if (newCombo === 10) {
          // 10콤보: 화면 반짝임 효과
          const sparkleEffect = {
            id: Date.now(),
            type: 'sparkle'
          };
          setScreenEffects(prev => [...prev, sparkleEffect]);
          setTimeout(() => {
            setScreenEffects(prev => prev.filter(e => e.id !== sparkleEffect.id));
          }, 1000);
        } else if (newCombo === 20) {
          // 20콤보: 쿵쿵이 춤 효과
          const danceEffect = {
            id: Date.now(),
            type: 'dance'
          };
          setScreenEffects(prev => [...prev, danceEffect]);
          setTimeout(() => {
            setScreenEffects(prev => prev.filter(e => e.id !== danceEffect.id));
          }, 2000);
        } else if (newCombo === 30) {
          // 30콤보: 무지개 배경
          setBackgroundEffect('rainbow');
          setTimeout(() => setBackgroundEffect('normal'), 3000);
        }

        // 파티클 효과 (정확도별로 다르게)
        const particleCount = accuracy === 'perfect' ? 12 : accuracy === 'good' ? 8 : 4;
        const particles = Array.from({length: particleCount}, (_, i) => ({
          id: Date.now() + i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          type: accuracy
        }));
        setHitParticles(particles);
        setTimeout(() => setHitParticles([]), 800);
      }

      // 노트를 눌린 상태로 업데이트하고 잠깐 보이게 한 후 제거
      const newNotes = [...prev];
      newNotes[noteIndex] = updatedNote;
      
      // 0.잠시 후에 노트 제거
      setTimeout(() => {
        setNotes(currentNotes => currentNotes.filter(n => n.id !== updatedNote.id));
      }, 500);
      
      return newNotes;
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
    <div className={`rhythm-game ${backgroundEffect}`}>
      
      {!gameStarted ? (
        <div className="start-screen">
          <h2>쿵쿵이 잡기</h2>
          <p>무지개 다리를 건넌 쿵쿵이가 더 지나오지 못하게 해주세요!</p>
          <p>D, F, J, K를 이용해 무지개 다리를 쿵쿵이가 넘은 시점을 노리세요!</p>
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
                    .filter(note => note.position === lane && Date.now() >= note.time - 2000)
                    .map(note => {
                      const elapsed = Date.now() - note.time;
                      // 노트가 2초 동안 떨어져서 히트라인에 도달
                      // progress가 100%일 때 히트라인에 도달하도록 계산
                      const progress = Math.max(0, Math.min(100, ((elapsed + 2000) / 2000) * 100));
                      return (
                        <div
                          key={note.id}
                          className={`note ${note.type} ${note.isHit ? 'hit' : ''}`}
                          style={{
                            top: `${progress}%`
                          }}
                        >
                          <img 
                            src={note.isHit ? require("./assets/cry_kkong.png") : require("./assets/kkong.png")} 
                            alt="쿵쿵" 
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>

            {/* 파티클 효과 */}
            {hitParticles.length > 0 && (
              <div className="note-hit-effect">
                {hitParticles.map(particle => (
                  <div
                    key={particle.id}
                    className={`hit-particles ${particle.type}`}
                    style={{
                      left: `${particle.x}%`,
                      top: `${particle.y}%`
                    }}
                  />
                ))}
              </div>
            )}

            {/* 화면 효과 */}
            {screenEffects.map(effect => (
              <div key={effect.id} className={`screen-effect ${effect.type}`} />
            ))}

            {/* 정확도 판정 효과 */}
            {showAccuracy && (
              <div className={`accuracy-effect ${showAccuracy}`}>
                {showAccuracy.toUpperCase()}
              </div>
            )}

            {/* 콤보 효과 */}
            {showCombo && (
              <div className="combo-effect">
                {showCombo} COMBO!
              </div>
            )}
          </div>

          <div className="key-container">
            {[
              { key: 'D', position: 0, color: 'blue' },
              { key: 'F', position: 1, color: 'red' },
              { key: 'J', position: 2, color: 'blue' },
              { key: 'K', position: 3, color: 'red' }
            ].map(({ key, position, color }) => (
              <div
                key={key}
                className={`key key--${color}`}
                onClick={() => handleKeyPress(position)}
              >
                <div className={`keypress keypress--${color} ${activeKeys.has(position) ? 'active' : ''}`} />
                <span>{key}</span>
              </div>
            ))}
          </div>


          {showGhostMessage && (
            <div className="ghost-message">
              <h2>으아악..</h2>
              <p>훌륭하군 다음으로 넘어가라</p>
            </div>
          )}

          {showResults && (
            <div className="results-screen">
              <h2>게임 결과</h2>
              <div className="result-stats">
                <div className="result-stat perfect">
                  <span>Perfect</span>
                  <span>{gameStats.perfect}</span>
                </div>
                <div className="result-stat good">
                  <span>Good</span>
                  <span>{gameStats.good}</span>
                </div>
                <div className="result-stat bad">
                  <span>Bad</span>
                  <span>{gameStats.bad}</span>
                </div>
                <div className="result-stat miss">
                  <span>Miss</span>
                  <span>{gameStats.miss}</span>
                </div>
                <div className="result-stat combo">
                  <span>Max Combo</span>
                  <span>{gameStats.maxCombo}</span>
                </div>
                <div className="result-stat score">
                  <span>Score</span>
                  <span>{gameStats.score}</span>
                </div>
              </div>
              {gameStats.score >= 8000 ? (
                <div className="clear-message">
                  <p>🎉 클리어했습니다!!!</p>
                  <p>잠시 후 자동으로 미니게임 선택화면으로 이동됩니다!</p>
                </div>
              ) : (
                <div className="retry-message">
                  <p>히든 미션 클리어! 끝까지 쿵쿵이와 싸워주셔서 힌트를 얻게 되었습니다!</p>
                  <p>잠시 후 자동으로 미니게임 선택화면으로 이동됩니다!</p>
                </div>
              )}
            </div>
          )}

          {isGameOver && !showResults && (
            <div className="game-over">
              <h2>게임 종료!</h2>
              <p>최종 점수: {score}</p>
              {score >= 8000 ? (
                <p>클리어했습니다!!!</p>
              ) : (
                <p>히든 미션 클리어! 끝까지 쿵쿵이와 싸워주셔서 힌트를 얻게 되었습니다!</p>
              )}
              <p>잠시 후 자동으로 미니게임 선택화면으로 이동됩니다!</p>
              {(() => {
                // 잠시 후 자동으로 미니게임 선택화면으로 이동
                setTimeout(() => {
                  if (score >= 8000) {
                    onComplete('으아악.. 훌륭하군 다음으로 넘어가라');
                  } else {
                    onComplete('히든 조건완료! 끝까지 게임을 플레이 하셨기에 힌트가 제공됩니다');
                  }
                }, 5000);
                return null;
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RhythmGame;
