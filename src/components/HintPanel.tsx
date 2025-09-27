import React, { useState } from 'react';
import { GameState } from '../types';
import './HintPanel.css';

interface HintPanelProps {
  gameState: GameState;
}

const HintPanel: React.FC<HintPanelProps> = ({ gameState }) => {
  const { hints } = gameState;
  const [selectedWeapon, setSelectedWeapon] = useState<'boo_shell_mace' | 'goomba_ice_hammer' | 'cheep_water_cannon'>('boo_shell_mace');

  const weaponNames = {
    boo_shell_mace: '부끄부끄 쉘 메이스',
    goomba_ice_hammer: '굼바 아이스 해머',
    cheep_water_cannon: '뽀꾸미 워터 캐논'
  };

  const weaponHints = {
    boo_shell_mace: [
      '부끄부끄의 힘이 필요해!',
      '얼음의 보석과 함께...',
      '망치의 형태로...',
      '고스트의 영혼이 깃들어...'
    ],
    goomba_ice_hammer: [
      '굼바의 등껍질이 필요해!',
      '번개의 힘이 깃든...',
      '해머의 형태로...',
      '얼음의 기운이 감돌아...'
    ],
    cheep_water_cannon: [
      '뽀꾸미의 힘이 필요해!',
      '물의 보석과 함께...',
      '캐논의 형태로...',
      '바다의 기운이 깃들어...'
    ]
  };

  const currentHints = weaponHints[selectedWeapon];
  const unlockedCount = Math.min(hints.length, 4);
  const isComplete = unlockedCount >= 4;

  return (
    <div className="hint-panel">
      <div className="hint-panel-header">
        <h3>무기 제작 힌트</h3>
        <select 
          value={selectedWeapon} 
          onChange={(e) => setSelectedWeapon(e.target.value as any)}
          className="weapon-selector"
        >
          {Object.entries(weaponNames).map(([key, name]) => (
            <option key={key} value={key}>{name}</option>
          ))}
        </select>
      </div>

      <div className="hints-grid">
        {currentHints.map((hint, index) => {
          const isUnlocked = index < unlockedCount;
          return (
            <div 
              key={index}
              className={`hint-slot ${isUnlocked ? 'unlocked' : 'locked'}`}
              aria-label={`힌트 ${index + 1}: ${isUnlocked ? hint : '잠금됨'}`}
            >
              <div className="hint-number">
                {index + 1}
              </div>
              <div className="hint-content">
                {isUnlocked ? hint : '???'}
              </div>
              {isUnlocked && (
                <div className="unlock-indicator">✓</div>
              )}
            </div>
          );
        })}
      </div>

      {isComplete && (
        <div className="completion-badge">
          <span className="badge-icon">🎉</span>
          <span className="badge-text">이제 거의 다 왔어요!</span>
        </div>
      )}

      <div className="hint-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(unlockedCount / 4) * 100}%` }}
          />
        </div>
        <span className="progress-text">
          {unlockedCount}/4 힌트 해금
        </span>
      </div>
    </div>
  );
};

export default HintPanel;
