import React, { useEffect, useRef, useState } from 'react';
import useGame from '../../hooks/useGame';
import RunningGame from '../MiniGames/RunningGame';
import MemoryGame from '../MiniGames/MemoryGame';
import RhythmGame from '../MiniGames/RhythmGame';
import CatchingGame from '../MiniGames/CatchingGame';
import Workshop from '../Workshop';
import './Game.css';
import bgmFile from './assets/mini_game_title_song.mp3';

const Game: React.FC = () => {
  const { 
    gameState,
    startMiniGame,
    completeMiniGame,
    switchPhase,
    selectMaterial,
    placeOnSlot,
    handleCraft,
    clearToast
  } = useGame();

  // 배경음악 관련 상태
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 페이지별 배경음악 관리 useEffect
  useEffect(() => {
    const audio = audioRef.current;
    
    // 작업실(Phase B)으로 전환할 때는 Game BGM 정지
    if (gameState.currentPhase === 'B') {
      if (audio && !audio.paused) {
        console.log('🔧 작업실로 전환 - Game BGM 정지');
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }
    
    // 미니게임 Phase A이고 현재 미니게임이 없을 때만 Game BGM 재생
    if (gameState.currentPhase === 'A' && !gameState.currentMiniGame) {
      if (audio && audio.paused) {
        console.log('🎵 미니게임 선택 화면으로 복귀 - Game BGM 재개');
        audio.play().catch(console.error);
      }
    }
    // 미니게임 플레이 중일 때는 Game BGM 정지
    else if (gameState.currentMiniGame) {
      if (audio && !audio.paused) {
        console.log('🎮 미니게임 시작 - Game BGM 정지');
        audio.pause();
        setIsPlaying(false);
      }
    }
  }, [gameState.currentPhase, gameState.currentMiniGame]);

  useEffect(() => {
    // 오디오 객체 생성
    const audio = new Audio(bgmFile);
    audio.loop = true;
    audio.volume = 0.3;
    audio.preload = 'auto';
    audioRef.current = audio;

    console.log('🎵 Game BGM 파일 경로:', bgmFile);
    console.log('🎵 오디오 객체 생성됨');

    // 오디오 이벤트 리스너
    const handleCanPlay = () => {
      console.log('✅ Game BGM 로드 완료');
    };

    const handleError = (e: Event) => {
      console.error('❌ Game BGM 로드 에러:', e);
      console.error('❌ 오디오 에러 상세:', audio.error);
    };

    const handlePlay = () => {
      console.log('▶️ Game BGM 재생 시작');
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log('⏸️ Game BGM 일시정지');
      setIsPlaying(false);
    };

    // 이벤트 리스너 등록
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // 초기 자동 재생 시도 (Phase A이고 미니게임이 없을 때만)
    const tryAutoPlay = async () => {
      if (gameState.currentPhase === 'A' && !gameState.currentMiniGame) {
        try {
          console.log('🎵 Game BGM 초기 자동 재생 시도...');
          await audio.play();
          console.log('✅ Game BGM 자동 재생 성공!');
          return true; // 성공시 true 반환
        } catch (error) {
          console.log('⚠️ Game BGM 자동 재생 차단됨, 사용자 상호작용 대기 중...', error);
          return false; // 실패시 false 반환
        }
      }
      return false;
    };

    // 사용자 상호작용 시 재생 함수
    const handleUserInteraction = async (event: Event) => {
      if (gameState.currentPhase === 'A' && !gameState.currentMiniGame && audio.paused) {
        try {
          await audio.play();
          console.log('✅ Game BGM 사용자 상호작용 후 재생 성공!', event.type);
          // 성공하면 이벤트 리스너 제거
          removeInteractionListeners();
        } catch (e) {
          console.error('❌ Game BGM 사용자 상호작용 후에도 재생 실패:', e);
        }
      }
    };

    // 이벤트 리스너 제거 함수
    const removeInteractionListeners = () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('mousemove', handleUserInteraction);
      document.removeEventListener('scroll', handleUserInteraction);
      window.removeEventListener('focus', handleUserInteraction);
    };

    // 다양한 상호작용 이벤트 등록
    const setupInteractionListeners = () => {
      document.addEventListener('click', handleUserInteraction, { once: false });
      document.addEventListener('keydown', handleUserInteraction, { once: false });
      document.addEventListener('touchstart', handleUserInteraction, { once: false });
      document.addEventListener('mousemove', handleUserInteraction, { once: false });
      document.addEventListener('scroll', handleUserInteraction, { once: false });
      window.addEventListener('focus', handleUserInteraction, { once: false });
    };

    // 즉시 자동 재생 시도
    tryAutoPlay().then(success => {
      if (!success) {
        // 자동 재생 실패시 상호작용 이벤트 등록
        setupInteractionListeners();
      }
    });

    // 주기적으로 자동 재생 재시도 (최대 5초간)
    let retryCount = 0;
    const maxRetries = 10;
    const retryInterval = setInterval(async () => {
      retryCount++;
      if (retryCount > maxRetries) {
        clearInterval(retryInterval);
        return;
      }
      
      if (audio.paused && gameState.currentPhase === 'A' && !gameState.currentMiniGame) {
        const success = await tryAutoPlay();
        if (success) {
          clearInterval(retryInterval);
          removeInteractionListeners();
        }
      }
    }, 500);

    // 컴포넌트 언마운트 시 정리
    return () => {
      // 재시도 인터벌 정리
      if (retryInterval) {
        clearInterval(retryInterval);
      }
      
      // 상호작용 이벤트 리스너 제거
      removeInteractionListeners();
      
      // 오디오 이벤트 리스너 제거
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);  
      audio.removeEventListener('pause', handlePause);
      
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      console.log('🧹 Game 오디오 정리 완료');
    };
  }, []);

  // 수동 음악 제어 함수
  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    // 작업실에서는 Game BGM 제어 불가 (Workshop BGM이 관리)
    if (gameState.currentPhase === 'B') {
      console.log('🔧 작업실에서는 Game BGM 제어가 비활성화됩니다');
      return;
    }

    // 미니게임 중에는 Game BGM 제어 불가
    if (gameState.currentMiniGame) {
      console.log('🎮 미니게임 중에는 Game BGM 제어가 비활성화됩니다');
      return;
    }

    try {
      if (audio.paused) {
        await audio.play();
        console.log('▶️ Game BGM 수동 재생 시작');
      } else {
        audio.pause();
        console.log('⏸️ Game BGM 수동 일시정지');
      }
    } catch (error) {
      console.error('❌ Game BGM 수동 재생/정지 실패:', error);
    }
  };

  // 현재 게임 참조를 메모이제이션
  const currentGame = React.useMemo(() => {
    if (!gameState.currentMiniGame) return null;
    return gameState.miniGames.find(g => g.id === gameState.currentMiniGame);
  }, [gameState.currentMiniGame, gameState.miniGames]);

  const renderMiniGame = () => {
    console.log('currentMiniGame:', gameState.currentMiniGame);
    console.log('currentGame:', currentGame);
    
    if (!currentGame) {
      console.log('No current game');
      return null;
    }
    
    console.log('Rendering game:', currentGame.type);

    switch (currentGame.type) {
      case 'running':
        return <RunningGame difficulty={currentGame.difficulty} onComplete={(hint) => completeMiniGame(currentGame.id, hint)} />;
      case 'memory':
        return <MemoryGame difficulty={currentGame.difficulty} onComplete={(hint) => completeMiniGame(currentGame.id, hint)} />;
      case 'rhythm':
        return <RhythmGame difficulty={currentGame.difficulty} onComplete={(hint) => completeMiniGame(currentGame.id, hint)} />;
      case 'catching':
        return <CatchingGame difficulty={currentGame.difficulty} onComplete={(hint) => completeMiniGame(currentGame.id, hint)} />;
      default:
        return null;
    }
  };

  const renderPhaseA = () => (
    <div className="phase-a">
      <h2>미니게임 선택</h2>
      <div className="mini-games-grid">
        {gameState.miniGames.map(game => {
          return (
            <div 
              key={game.id}
              className={`mini-game-card ${game.completed ? 'completed' : ''}`}
              onClick={() => startMiniGame(game.id)}
            >
              <h3>{game.name}</h3>
              <p>난이도: {'⭐'.repeat(game.difficulty)}</p>
              {game.completed && (
                <p className="completed-text">✅ 완료!</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPhaseB = () => (
    <div className="phase-b">
      <Workshop 
        gameState={gameState}
        selectMaterial={selectMaterial}
        placeOnSlot={placeOnSlot}
        handleCraft={handleCraft}
        clearToast={clearToast}
      />
    </div>
  );

  const content = gameState.currentMiniGame ? renderMiniGame() : (
    gameState.currentPhase === 'A' ? renderPhaseA() : renderPhaseB()
  );

  console.log('Rendering content:', gameState.currentMiniGame ? 'mini game' : 'phase');

  return (
    <div className="game">
      {/* 음악 제어 버튼 - 미니게임 선택 화면(Phase A, 미니게임 없음)에서만 표시 */}
      {gameState.currentPhase === 'A' && !gameState.currentMiniGame && (
        <>
          <button 
            onClick={toggleMusic}
            style={{
              position: 'fixed',
              top: '10px',
              right: '10px',
              padding: '8px 12px',
              backgroundColor: isPlaying ? '#ff4444' : '#44ff44',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              zIndex: 1000
            }}
          >
            {isPlaying ? '🔇 음악 끄기' : '🎵 음악 켜기'}
          </button>
          
          {/* 재생 상태 표시 */}
          {isPlaying && (
            <div style={{ 
              position: 'fixed', 
              top: '10px', 
              left: '10px', 
              background: 'green', 
              color: 'white', 
              padding: '5px', 
              fontSize: '12px',
              borderRadius: '5px',
              zIndex: 1000
            }}>
              🎵 메인 BGM 재생 중
            </div>
          )}
        </>
      )}

      {content}
      <div className="phase-switch">
        <button 
          className={`phase-button ${gameState.currentPhase === 'A' ? 'active' : ''}`}
          onClick={() => switchPhase('A')}
        >
          미니게임
        </button>
        <button 
          className={`phase-button ${gameState.currentPhase === 'B' ? 'active' : ''}`}
          onClick={() => switchPhase('B')}
        >
          작업실
        </button>
      </div>
    </div>
  );
};

export default Game;