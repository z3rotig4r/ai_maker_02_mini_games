import React, { useEffect, useState, useRef } from 'react';
import './Workshop.css';
import '../../styles/theme.css';
import { GameState, SlotIndex, WeaponId } from '../../types';
import CraftingAltar from '../CraftingAltar';
import HintPanel from '../HintPanel';
import MarioBackdrop from '../MarioBackdrop';
import { initWorkshopAudio, startWorkshopBgm, stopWorkshopBgm, playWorkshop, duckBgm, ensureAudioUnlocked } from './audioWorkshop';

interface WorkshopProps {
  gameState: GameState;
  selectMaterial: (materialId: string) => void;
  placeOnSlot: (slot: SlotIndex) => void;
  handleCraft: () => void;
  clearToast: () => void;
  clearSlots: () => void;
}

const Workshop: React.FC<WorkshopProps> = ({ 
  gameState, 
  selectMaterial, 
  placeOnSlot, 
  handleCraft, 
  clearToast,
  clearSlots
}) => {
  const { inventory, weapons, selectedMaterial, craftingSlots, showToast, toastMessage, isShaking, lastRejectedSlot, crafted, successTick } = gameState;
  const [failFlash, setFailFlash] = useState(false);
  const [result, setResult] = useState<WeaponId | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const shownWeaponsRef = useRef<Set<WeaponId>>(new Set());
  const resultTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Workshop 오디오 초기화 및 BGM 관리
  useEffect(() => {
    let isMounted = true;
    
    // 컴포넌트 마운트 시 결과 카드 초기화
    setResult(null);
    // 이미 제작된 무기들을 shownWeaponsRef에 추가
    shownWeaponsRef.current = new Set(crafted);
    
    // 기존 타이머 정리
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    
    const initializeAudio = async () => {
      try {
        console.log('🔧 Workshop 컴포넌트 오디오 초기화 시작');
        await initWorkshopAudio();
        if (isMounted) {
          console.log('🔧 Workshop BGM 시작 호출');
          await startWorkshopBgm();
          ensureAudioUnlocked(); // ★ 최초 진입에서 바로 언락 대기
        } else {
          console.log('🔧 컴포넌트가 언마운트되어 BGM 시작 건너뜀');
        }
      } catch (error) {
        console.error('❌ Workshop 오디오 초기화 실패:', error);
      }
    };
    
    initializeAudio();
    
    // 컴포넌트 언마운트 시 BGM 정지
    return () => {
      console.log('🔧 Workshop 컴포넌트 언마운트 - BGM 정지');
      isMounted = false;
      stopWorkshopBgm();
    };
  }, []);

  // 보유한 재료들을 종류별로 분류
  const categorizedIngredients = {
    creature: inventory.filter(item => item.type === 'creature'),
    object: inventory.filter(item => item.type === 'object'),
    effect: inventory.filter(item => item.type === 'effect'),
  };

  // 재료 선택 핸들러 (SFX 포함)
  const handleSelectMaterial = (materialId: string) => {
    playWorkshop('select_place');
    selectMaterial(materialId);
  };

  // 슬롯 배치 핸들러 (SFX 포함)
  const handlePlaceOnSlot = (slot: SlotIndex) => {
    playWorkshop('select_place');
    placeOnSlot(slot);
  };

  // 제작 버튼 핸들러 (SFX + BGM ducking 포함)
  const handleCraftPress = () => {
    playWorkshop('craft_press');
    duckBgm({ to: 0.045, holdMs: 900 }); // DUCK_LEVEL_PRESS
    handleCraft();
  };

  // 토스트 자동 제거
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast, clearToast]);

  // 실패 플래시 효과 및 SFX + BGM ducking
  useEffect(() => {
    if (isShaking) {
      playWorkshop('craft_fail');
      duckBgm({ to: 0.063, holdMs: 1400 }); // DUCK_LEVEL_RESULT
      setFailFlash(true);
      const timer = setTimeout(() => setFailFlash(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isShaking]);

  // 새로운 무기 제작 시에만 축하 창 표시 (무기별로 한 번만)
  useEffect(() => {
    // crafted 배열이 실제로 증가했을 때만 실행
    if (crafted.length > 0) {
      const latestWeapon = crafted[crafted.length - 1];
      console.log('🔍 무기 제작 감지:', {
        craftedLength: crafted.length,
        latestWeapon,
        shownWeapons: Array.from(shownWeaponsRef.current)
      });
      
      // 아직 이 무기에 대한 축하 창을 보여주지 않았다면 표시
      if (!shownWeaponsRef.current.has(latestWeapon)) {
        console.log('🎉 새로운 무기 제작 성공! 축하 창 표시:', latestWeapon);
        shownWeaponsRef.current.add(latestWeapon);
        playWorkshop('craft_success');
        duckBgm({ to: 0.063, holdMs: 1400 });
        setSuccessFlash(true);
        setResult(latestWeapon);
        
        // 3초 후 결과 카드 숨기기
        resultTimerRef.current = setTimeout(() => {
          console.log('⏰ 3초 경과 - 결과 카드 숨김');
          setResult(null);
          resultTimerRef.current = null;
        }, 3000);
        
        // 1초 후 플래시 효과 숨기기
        flashTimerRef.current = setTimeout(() => {
          setSuccessFlash(false);
          flashTimerRef.current = null;
        }, 1000);
      } else {
        console.log('🚫 이미 축하 창을 보여준 무기:', latestWeapon);
      }
    }
  }, [crafted]);

  // 모든 무기 제작 완료 여부
  const allCrafted = new Set(crafted).size >= 3;

  return (
    <div className="workshop">
      <MarioBackdrop variant="sky" />
      {failFlash && <div className="flash-red" />}
      {successFlash && <div className="flash-success" />}
      
      <div className="workshop-header mario-card">
        <div className="section-header">
          <div className="coin-dot" />
          <h2 className="section-title">키노피오의 발명 작업실</h2>
          <div className="coin-dot" />
        </div>
        <p>수집한 힌트와 재료를 이용해 전설의 무기를 제작하세요!</p>
      </div>

      <div className="workshop-content">
        {/* 힌트 패널 */}
        <HintPanel gameState={gameState} />

        <div className="inventory-section mario-card">
          <div className="section-header">
            <div className="coin-dot" />
            <h3 className="section-title">보유 재료</h3>
            <div className="coin-dot" />
          </div>
          <div className="inventory-categories">
            <div className="category">
              <h4>생물</h4>
              <div className="ingredients-grid">
                {categorizedIngredients.creature.map(ingredient => (
                  <div 
                    key={ingredient.id} 
                    className={`icon-ring creature ${selectedMaterial === ingredient.id ? 'selected' : ''} focus-ring`}
                    onClick={() => handleSelectMaterial(ingredient.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${ingredient.name} 선택`}
                  >
                    <img src={ingredient.image} alt={ingredient.name} width="48" height="48" />
                  </div>
                ))}
              </div>
            </div>
            <div className="category">
              <h4>물건</h4>
              <div className="ingredients-grid">
                {categorizedIngredients.object.map(ingredient => (
                  <div 
                    key={ingredient.id} 
                    className={`icon-ring object ${selectedMaterial === ingredient.id ? 'selected' : ''} focus-ring`}
                    onClick={() => handleSelectMaterial(ingredient.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${ingredient.name} 선택`}
                  >
                    <img src={ingredient.image} alt={ingredient.name} width="48" height="48" />
                  </div>
                ))}
              </div>
            </div>
            <div className="category">
              <h4>효과</h4>
              <div className="ingredients-grid">
                {categorizedIngredients.effect.map(ingredient => (
                  <div 
                    key={ingredient.id} 
                    className={`icon-ring effect ${selectedMaterial === ingredient.id ? 'selected' : ''} focus-ring`}
                    onClick={() => handleSelectMaterial(ingredient.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${ingredient.name} 선택`}
                  >
                    <img src={ingredient.image} alt={ingredient.name} width="70" height="70" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="crafting-section mario-card">
          <div className="section-header">
            <div className="coin-dot" />
            <h3 className="section-title">무기 제작</h3>
            <div className="coin-dot" />
            <button 
              className="help-button"
              onClick={() => setShowHelpModal(true)}
              title="조합 방법 도움말"
            >
              ?
            </button>
          </div>
          
          {/* 3D 럭키박스 조합대 */}
          <div className="crafting-altar">
            <CraftingAltar
              craftingSlots={craftingSlots}
              selectedMaterial={selectedMaterial}
              onSlotClick={(slot) => handlePlaceOnSlot(slot as SlotIndex)}
              isShaking={isShaking}
              lastRejectedSlot={lastRejectedSlot}
              successTick={successTick}
            />
          </div>


          <div className="crafting-controls">
            <button className="btn-mario btn-reset" onClick={clearSlots}>
              다시하기
            </button>
            <button className="btn-mario" onClick={handleCraftPress}>
              제작하기
            </button>
          </div>
        </div>

        <div className="weapons-section mario-card">
          <div className="section-header">
            <div className="coin-dot" />
            <h3 className="section-title">제작한 무기</h3>
            <div className="coin-dot" />
          </div>
          <div className="weapons-grid">
            {weapons.map(weapon => (
              <div key={weapon.id} className="weapon-item mario-card">
                <img src={weapon.image} alt={weapon.name} />
                <span>{weapon.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 토스트 메시지 */}
      {showToast && (
        <div className={`toast ${isShaking ? 'shaking' : ''}`}>
          {toastMessage}
        </div>
      )}

      {/* 결과 카드 */}
      {result && (
        <div className="result-card">
          <img src={`/assets/weapons/${result}.png`} alt={result.replace(/_/g, ' ')} />
          <div>
            <h3>제작 성공! {result.replace(/_/g, ' ')}</h3>
            <p>전설의 무기를 획득했어요! 다른 조합도 도전해 볼까요?</p>
          </div>
        </div>
      )}

      {/* 도움말 모달 */}
      {showHelpModal && (
        <div className="help-modal">
          <div className="help-panel">
            <div className="help-header">
              <h2>무기 제작 방법</h2>
              <button 
                className="close-button"
                onClick={() => setShowHelpModal(false)}
              >
                ×
              </button>
            </div>
            <div className="help-content">
              <ul>
                <li>보유재료에서 생물, 물건, 효과 각각 1개씩을 선택하여 조합대 위에 올려놓으세요</li>
                <li><strong>다른 재료로 바꾸려면 새로운 재료를 선택한 후 원하는 슬롯을 클릭하세요</strong></li>
                <li>재료를 모두 배치한 후 &quot;제작하기&quot; 버튼을 클릭하세요</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 보스 모달 */}
      {allCrafted && (
        <div className="boss-modal">
          <div className="panel">
            <h2>모든 전설의 무기 완성! 🏆</h2>
            <p>이제 쿠파를 물리치러 갑시다!</p>
            <button onClick={() => alert('창을 닫고, 🚩쿠파성으로!!  \n쿠파를 무찌르기 위한 힌트: AI대소동, 내가 해결사!')}>
              보스전 시작
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workshop;