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
    console.log('Starting mini game:', gameId);
    
    setGameState(prev => {
      // 이미 게임이 진행 중이면 아무것도 하지 않음
      if (prev.currentMiniGame) {
        console.log('Game already in progress');
        return prev;
      }

      const game = prev.miniGames.find(g => g.id === gameId);
      if (!game) {
        console.log('Game not found');
        return prev;
      }

      console.log('Starting new game:', game.id);
      return {
        ...prev,
        currentMiniGame: gameId
      };
    });
  }, []);

  const completeMiniGame = useCallback((gameId: string, hint: string) => {
    setGameState(prev => {
      const game = prev.miniGames.find(g => g.id === gameId);
      
      // 게임이 존재하지 않거나 현재 진행 중인 게임이 아니면 무시
      if (!game || prev.currentMiniGame !== gameId) {
        console.log('Invalid game completion attempt');
        return prev;
      }

      console.log('Completing game:', gameId);
      
      const updatedMiniGames = prev.miniGames.map(g => 
        g.id === gameId
          ? { 
              ...g, 
              completed: true, 
              hint,
              difficulty: g.completed ? g.difficulty + 1 : g.difficulty 
            }
          : g
      );

      return {
        ...prev,
        miniGames: updatedMiniGames,
        hints: game.completed ? prev.hints : [...prev.hints, hint],
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