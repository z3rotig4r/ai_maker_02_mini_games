import React, { useEffect } from 'react';
import './Workshop.css';
import { GameState, Ingredient, SlotIndex } from '../../types';
import { MATERIALS_MAP } from '../../data/materials';
import { getMaterialIcon } from '../../utils/iconUtils';

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
  const { inventory, weapons, hints, selectedMaterial, craftingSlots, showToast, toastMessage, isShaking, lastRejectedSlot } = gameState;

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

  return (
    <div className="workshop">
      <div className="workshop-header">
        <h2>키노피오의 발명 작업실</h2>
        <p>수집한 힌트와 재료를 이용해 전설의 무기를 제작하세요!</p>
      </div>

      <div className="workshop-content">
        <div className="hints-section">
          <h3>수집한 힌트</h3>
          <div className="hints-list">
            {hints.map((hint, index) => (
              <div key={index} className="hint-item">
                <span className="hint-number">#{index + 1}</span>
                <p>{hint}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="inventory-section">
          <h3>보유 재료</h3>
          <div className="inventory-categories">
            <div className="category">
              <h4>생물</h4>
              <div className="ingredients-grid">
                {categorizedIngredients.creature.map(ingredient => (
                  <div 
                    key={ingredient.id} 
                    className={`ingredient-item ${selectedMaterial === ingredient.id ? 'selected' : ''}`}
                    onClick={() => selectMaterial(ingredient.id)}
                  >
                    <img src={getMaterialIcon(ingredient.id as keyof typeof MATERIALS_MAP)} alt={ingredient.name} />
                    <span>{ingredient.name}</span>
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
                    className={`ingredient-item ${selectedMaterial === ingredient.id ? 'selected' : ''}`}
                    onClick={() => selectMaterial(ingredient.id)}
                  >
                    <img src={getMaterialIcon(ingredient.id as keyof typeof MATERIALS_MAP)} alt={ingredient.name} />
                    <span>{ingredient.name}</span>
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
                    className={`ingredient-item ${selectedMaterial === ingredient.id ? 'selected' : ''}`}
                    onClick={() => selectMaterial(ingredient.id)}
                  >
                    <img src={getMaterialIcon(ingredient.id as keyof typeof MATERIALS_MAP)} alt={ingredient.name} />
                    <span>{ingredient.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="crafting-section">
          <h3>무기 제작</h3>
          <div className="crafting-table">
            <div className="crafting-slots">
              {Array(3).fill(null).map((_, index) => (
                <div 
                  key={index} 
                  className={`crafting-slot ${lastRejectedSlot === index ? 'rejected' : ''} ${isShaking ? 'shaking' : ''}`}
                  onClick={() => placeOnSlot(index)}
                >
                  {craftingSlots[index] ? (
                    <img 
                      src={getMaterialIcon(craftingSlots[index] as keyof typeof MATERIALS_MAP)} 
                      alt={MATERIALS_MAP[craftingSlots[index] as keyof typeof MATERIALS_MAP]?.name || ''} 
                    />
                  ) : (
                    <span>+</span>
                  )}
                </div>
              ))}
            </div>
            <button className="craft-button" onClick={handleCraft}>
              제작하기
            </button>
          </div>
        </div>

        <div className="weapons-section">
          <h3>제작한 무기</h3>
          <div className="weapons-grid">
            {weapons.map(weapon => (
              <div key={weapon.id} className="weapon-item">
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
    </div>
  );
};

export default Workshop;