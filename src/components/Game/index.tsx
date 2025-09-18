import React, { useCallback, useMemo } from 'react';
import useGame from '../../hooks/useGame';
import RunningGame from '../MiniGames/RunningGame';
import MemoryGame from '../MiniGames/MemoryGame';
import RhythmGame from '../MiniGames/RhythmGame';
import CatchingGame from '../MiniGames/CatchingGame';
import Workshop from '../Workshop';
import './Game.css';

const Game: React.FC = () => {
  const { 
    gameState,
    startMiniGame,
    completeMiniGame,
    switchPhase,
    craftWeapon
  } = useGame();

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
        {gameState.miniGames.map(game => (
          <div 
            key={game.id}
            className={`mini-game-card ${game.completed ? 'completed' : ''}`}
            onClick={() => startMiniGame(game.id)}
          >
            <h3>{game.name}</h3>
            <p>난이도: {'⭐'.repeat(game.difficulty)}</p>
            {game.completed && <p className="hint">힌트: {game.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPhaseB = () => (
    <div className="phase-b">
      <Workshop 
        gameState={gameState}
        onCraftWeapon={craftWeapon}
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
          disabled={!!gameState.currentMiniGame}
        >
          미니게임
        </button>
        <button 
          className={`phase-button ${gameState.currentPhase === 'B' ? 'active' : ''}`}
          onClick={() => switchPhase('B')}
          disabled={!!gameState.currentMiniGame}
        >
          작업실
        </button>
      </div>
    </div>
  );
};

export default Game;