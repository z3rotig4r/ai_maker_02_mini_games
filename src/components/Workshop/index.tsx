import React, { useEffect, useState } from 'react';
import './Workshop.css';
import '../../styles/theme.css';
import { GameState, SlotIndex, WeaponId } from '../../types';
import { MATERIALS_MAP } from '../../data/materials';
import CraftingAltar from '../CraftingAltar';
import HintPanel from '../HintPanel';
import MarioBackdrop from '../MarioBackdrop';

interface WorkshopProps {
  gameState: GameState;
  selectMaterial: (materialId: string) => void;
  placeOnSlot: (slot: SlotIndex) => void;
  handleCraft: () => void;
  clearToast: () => void;
}

const Workshop: React.FC<WorkshopProps> = ({ 
  gameState, 
  selectMaterial, 
  placeOnSlot, 
  handleCraft, 
  clearToast 
}) => {
  const { inventory, weapons, selectedMaterial, craftingSlots, showToast, toastMessage, isShaking, lastRejectedSlot, crafted, successTick } = gameState;
  const [failFlash, setFailFlash] = useState(false);
  const [result, setResult] = useState<WeaponId | null>(null);

  // 보유한 재료들을 종류별로 분류
  const categorizedIngredients = {
    creature: inventory.filter(item => item.type === 'creature'),
    object: inventory.filter(item => item.type === 'object'),
    effect: inventory.filter(item => item.type === 'effect'),
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

  // 실패 플래시 효과
  useEffect(() => {
    if (isShaking) {
      setFailFlash(true);
      const timer = setTimeout(() => setFailFlash(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isShaking]);

  // 성공 시 결과 카드 표시
  useEffect(() => {
    if (successTick > 0 && crafted.length > 0) {
      const latestWeapon = crafted[crafted.length - 1];
      setResult(latestWeapon);
      const timer = setTimeout(() => setResult(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successTick, crafted]);

  // 모든 무기 제작 완료 여부
  const allCrafted = new Set(crafted).size >= 3;

  return (
    <div className="workshop">
      <MarioBackdrop variant="sky" />
      {failFlash && <div className="flash-red" />}
      
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
                    onClick={() => selectMaterial(ingredient.id)}
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
                    onClick={() => selectMaterial(ingredient.id)}
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
                    onClick={() => selectMaterial(ingredient.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${ingredient.name} 선택`}
                  >
                    <img src={ingredient.image} alt={ingredient.name} width="48" height="48" />
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
          </div>
          
          {/* 3D 럭키박스 조합대 */}
          <div className="crafting-altar">
            <CraftingAltar
              craftingSlots={craftingSlots}
              selectedMaterial={selectedMaterial}
              onSlotClick={(slot) => placeOnSlot(slot as SlotIndex)}
              isShaking={isShaking}
              lastRejectedSlot={lastRejectedSlot}
              successTick={successTick}
            />
          </div>


          <div className="crafting-controls">
            <button className="btn-mario" onClick={handleCraft}>
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

      {/* 보스 모달 */}
      {allCrafted && (
        <div className="boss-modal">
          <div className="panel">
            <h2>모든 전설의 무기 완성! 🏆</h2>
            <p>이제 쿠파를 물리치러 갑시다!</p>
            <button onClick={() => alert('보스전 씬으로 전환 (TODO)')}>
              보스전 시작
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workshop;