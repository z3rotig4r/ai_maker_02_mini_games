import { useState, useCallback } from 'react';
import { GameState, GamePhase, Ingredient, SlotIndex, SlotKind, WeaponId } from '../types';
import { MATERIALS_MAP } from '../data/materials';
import { matchRecipe } from '../data/recipes';
import { playSfx } from '../utils/sfx';

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
  inventory: [
    // 테스트용 재료 추가
    { id: 'boo', name: '고스트', type: 'creature', image: '/assets/icons/creature_boo.jpg' },
    { id: 'goomba', name: '굼바', type: 'creature', image: '/assets/icons/creature_goomba.jpg' },
    { id: 'pokku', name: '뽀꾸미', type: 'creature', image: '/assets/icons/creature_pokku.jpg' },
    { id: 'shell', name: '등껍질', type: 'object', image: '/assets/icons/object_shell.jpg' },
    { id: 'icicle', name: '고드름', type: 'object', image: '/assets/icons/object_icicle.png' },
    { id: 'water_cannon', name: '물대포', type: 'object', image: '/assets/icons/object_water_cannon.png' },
    { id: 'thunder', name: '우르르쾅쾅', type: 'effect', image: '/assets/icons/effect_thunder.png' },
    { id: 'chill', name: '으슬으슬', type: 'effect', image: '/assets/icons/effect_chill.png' },
    { id: 'splash', name: '펑펑', type: 'effect', image: '/assets/icons/effect_splash.png' },
  ],
  weapons: [],
  hints: [],
  currentMiniGame: null,
  // 워크샵 상태 추가
  selectedMaterial: null,
  craftingSlots: [null, null, null],
  lastRejectedSlot: null,
  showToast: false,
  toastMessage: '',
  isShaking: false,
  crafted: [],
  successTick: 0
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
      currentPhase: phase,
      currentMiniGame: null // 미니게임 중이면 종료하고 전환
    }));
  }, []);

  const addIngredient = useCallback((ingredient: Ingredient) => {
    setGameState(prev => ({
      ...prev,
      inventory: [...prev.inventory, ingredient]
    }));
  }, []);


  // 워크샵 관련 함수들
  const selectMaterial = useCallback((materialId: string) => {
    console.log('[selectMaterial] materialId:', materialId);
    setGameState(prev => {
      const mat = MATERIALS_MAP[materialId as keyof typeof MATERIALS_MAP];
      if (!mat) {
        console.log('[selectMaterial] Material not found in MATERIALS_MAP:', materialId);
        return { ...prev, selectedMaterial: materialId };
      }

      // 자동 배치: 해당 카테고리 슬롯의 빈칸에 바로 배치
      const targetSlot: SlotIndex = mat.kind === 'creature' ? 0 : mat.kind === 'object' ? 1 : 2;
      
      if (prev.craftingSlots[targetSlot] === null) {
        console.log('[selectMaterial] Auto-placing in slot:', targetSlot);
        const next = [...prev.craftingSlots];
        next[targetSlot] = materialId;
        return {
          ...prev,
          selectedMaterial: null,
          craftingSlots: next
        };
      }

      return { ...prev, selectedMaterial: materialId };
    });
  }, []);

  const placeOnSlot = useCallback((slot: SlotIndex) => {
    setGameState(prev => {
      console.log('[placeOnSlot] slot:', slot, 'selectedMaterial:', prev.selectedMaterial);
      console.log('[slots before]', prev.craftingSlots);
      
      if (!prev.selectedMaterial) {
        console.log('[placeOnSlot] No selected material');
        return prev;
      }
      
      const want: SlotKind = slot === 0 ? 'creature' : slot === 1 ? 'object' : 'effect';
      const mat = MATERIALS_MAP[prev.selectedMaterial as keyof typeof MATERIALS_MAP];
      
      console.log('[meta]', mat?.kind, 'want=', want);
      
      if (!mat || mat.kind !== want) {
        // 카테고리 불일치 - 거부 피드백
        console.log('[placeOnSlot] Category mismatch - rejecting');
        return {
          ...prev,
          lastRejectedSlot: slot,
          showToast: true,
          toastMessage: '잘못된 카테고리입니다!',
          isShaking: true
        };
      }
      
      const next = [...prev.craftingSlots];
      next[slot] = prev.selectedMaterial;
      
      console.log('[placeOnSlot] Success - placing material:', prev.selectedMaterial, 'in slot:', slot);
      
      return {
        ...prev,
        craftingSlots: next,
        selectedMaterial: null,
        lastRejectedSlot: null
      };
    });
  }, []);

  const clearSlots = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      craftingSlots: [null, null, null],
      selectedMaterial: null
    }));
  }, []);

  const handleCraft = useCallback(() => {
    setGameState(prev => {
      const startTime = Date.now();
      const result = matchRecipe(prev.craftingSlots[0], prev.craftingSlots[1], prev.craftingSlots[2]);
      const success = !!result;
      
      // 개발 모드 계측 로깅
      if (process.env.NODE_ENV === 'development') {
        const logEntry = {
          time: new Date().toISOString(),
          success,
          slots: [...prev.craftingSlots],
          attemptIntervalMs: Date.now() - startTime
        };
        
        console.log('[Workshop] 제작 시도:', logEntry);
        
        // window 객체에 로그 배열 추가
        if (typeof window !== 'undefined') {
          if (!window.__workshopLog) {
            window.__workshopLog = [];
          }
          window.__workshopLog.push(logEntry);
        }
      }
      
      if (result) {
        // 성공: 결과 카드 표출 + 슬롯 초기화 (재료 미차감)
        playSfx('success');
        
        return {
          ...prev,
          weapons: [...prev.weapons, { id: result, name: result.replace(/_/g, ' '), requiredIngredients: prev.craftingSlots.filter(Boolean) as string[], image: `/assets/weapons/${result}.png` }],
          crafted: [...prev.crafted, result as WeaponId],
          craftingSlots: [null, null, null],
          selectedMaterial: null,
          showToast: true,
          toastMessage: '제작 성공!',
          isShaking: false,
          successTick: prev.successTick + 1
        };
      } else {
        // 실패: 슬롯 유지 + 토스트/흔들림
        playSfx('fail');
        
        return {
          ...prev,
          showToast: true,
          toastMessage: '실패! 다시 조합해 보자',
          isShaking: true
        };
      }
    });
  }, []);

  const clearToast = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      showToast: false,
      toastMessage: '',
      isShaking: false,
      lastRejectedSlot: null
    }));
  }, []);

  return {
    gameState,
    startMiniGame,
    completeMiniGame,
    switchPhase,
    addIngredient,
    // 워크샵 함수들
    selectMaterial,
    placeOnSlot,
    clearSlots,
    handleCraft,
    clearToast
  };
};

export default useGame;