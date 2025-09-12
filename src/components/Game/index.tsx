// filepath: /react-game/react-game/src/components/Game/index.tsx
import React from 'react';
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

  const renderMiniGame = () => {
    if (!gameState.currentMiniGame) return null;

    const game = gameState.miniGames.find(g => g.id === gameState.currentMiniGame);
    if (!game) return null;

    switch (game.type) {
      case 'running':
        return <RunningGame difficulty={game.difficulty} onComplete={(hint) => completeMiniGame(game.id, hint)} />;
      case 'memory':
        return <MemoryGame difficulty={game.difficulty} onComplete={(hint) => completeMiniGame(game.id, hint)} />;
      case 'rhythm':
        return <RhythmGame difficulty={game.difficulty} onComplete={(hint) => completeMiniGame(game.id, hint)} />;
      case 'catching':
        return <CatchingGame difficulty={game.difficulty} onComplete={(hint) => completeMiniGame(game.id, hint)} />;
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
            onClick={() => !game.completed && startMiniGame(game.id)}
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

  return (
    <div className="game">
      {gameState.currentMiniGame ? (
        renderMiniGame()
      ) : (
        gameState.currentPhase === 'A' ? renderPhaseA() : renderPhaseB()
      )}
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