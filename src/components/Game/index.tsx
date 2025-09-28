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
    
    // 작업실(Phase B)으로 전환할 때는 Game BGM 강제 정지
    if (gameState.currentPhase === 'B') {
      if (audio) {
        console.log('🔧 작업실로 전환 - Game BGM 강제 정지');
        audio.pause();
        audio.currentTime = 0; // 재생 위치 초기화
        setIsPlaying(false);
      }
      return;
    }
    
    // 미니게임 선택화면에서만 BGM 재생
    if (gameState.currentPhase === 'A' && !gameState.currentMiniGame) {
      if (audio) {
        console.log('🎵 미니게임 선택 화면 - Game BGM 재생');
        audio.muted = false; // 음소거 해제
        if (audio.paused) {
          audio.play().catch(console.error);
        }
      }
    }
    // 특정 미니게임에서만 BGM 재생 (버섯왕국달리기, 부끄부끄 기억력 테스트)
    else if (gameState.currentMiniGame) {
      const currentGame = gameState.miniGames.find(g => g.id === gameState.currentMiniGame);
      const shouldPlayBgm = currentGame && (currentGame.type === 'running' || currentGame.type === 'memory');
      
      if (shouldPlayBgm) {
        if (audio) {
          console.log(`🎵 ${currentGame.name} - Game BGM 재생`);
          audio.muted = false; // 음소거 해제
          if (audio.paused) {
            audio.play().catch(console.error);
          }
        }
      } else {
        // 쿵쿵이 잡기, 요시 게임에서는 메인 BGM 완전 정지
        if (audio) {
          console.log(`🎮 ${currentGame?.name || '게임'} - Game BGM 완전 정지`);
          audio.pause();
          audio.currentTime = 0; // 재생 위치 초기화
          audio.muted = true; // 음소거 설정
          setIsPlaying(false);
        }
      }
    }
  }, [gameState.currentPhase, gameState.currentMiniGame, gameState.miniGames]);

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