import { useState, useCallback } from 'react';
import { GameState, GamePhase, MiniGame, Ingredient } from '../types';

const initialState: GameState = {
  currentPhase: 'A',
  miniGames: [
    {
      id: 'running',
      name: '버섯 왕국 달리기',
      type: 'running',
      difficulty: 1,
      completed: false,
      hint: ''
    },
    {
      id: 'memory',
      name: '부끄부끄 기억력 테스트',
      type: 'memory',
      difficulty: 1,
      completed: false,
      hint: ''
    },
    {
      id: 'rhythm',
      name: '쿵쿵의 리듬 블록',
      type: 'rhythm',
      difficulty: 1,
      completed: false,
      hint: ''
    },
    {
      id: 'catching',
      name: '요시의 과일 받아먹기',
      type: 'catching',
      difficulty: 1,
      completed: false,
      hint: ''
    }
  ],
  inventory: [],
  weapons: [],
  hints: [],
  currentMiniGame: null
};

const useGame = () => {
  const [gameState, setGameState] = useState<GameState>(initialState);

  const startMiniGame = useCallback((gameId: string) => {
    setGameState(prev => {
      const game = prev.miniGames.find(g => g.id === gameId);
      if (!game) return prev;
      
      // 이미 완료된 게임이면 난이도만 증가
      if (game.completed) {
        const updatedMiniGames = prev.miniGames.map(g =>
          g.id === gameId ? { ...g, difficulty: g.difficulty + 1 } : g
        );
        return {
          ...prev,
          miniGames: updatedMiniGames
        };
      }

      // 새로운 게임 시작
      return {
        ...prev,
        currentMiniGame: gameId
      };
    });
  }, []);

  const completeMiniGame = useCallback((gameId: string, hint: string) => {
    setGameState(prev => {
      // 이미 완료된 게임은 처리하지 않음
      const game = prev.miniGames.find(g => g.id === gameId);
      if (!game || game.completed) return prev;

      const updatedMiniGames = prev.miniGames.map(game => 
        game.id === gameId 
          ? { ...game, completed: true, hint }
          : game
      );

      return {
        ...prev,
        miniGames: updatedMiniGames,
        hints: [...prev.hints, hint],
        currentMiniGame: null
      };
    });
  }, []);

  const switchPhase = useCallback((phase: GamePhase) => {
    setGameState(prev => ({
      ...prev,
      currentPhase: phase
    }));
  }, []);

  const addIngredient = useCallback((ingredient: Ingredient) => {
    setGameState(prev => ({
      ...prev,
      inventory: [...prev.inventory, ingredient]
    }));
  }, []);

  const craftWeapon = useCallback((ingredients: Ingredient[]) => {
    // 무기 제작 로직 구현
    // TODO: 올바른 재료 조합인지 확인하고 결과 반환
  }, []);

  return {
    gameState,
    startMiniGame,
    completeMiniGame,
    switchPhase,
    addIngredient,
    craftWeapon
  };
};

export default useGame;