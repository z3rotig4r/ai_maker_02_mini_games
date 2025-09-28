import React from 'react';
import './MarioBackdrop.css';

interface MarioBackdropProps {
  variant: 'sky' | 'castle';
}

const MarioBackdrop: React.FC<MarioBackdropProps> = ({ variant }) => {
  if (variant === 'sky') {
    return (
      <div className="mario-backdrop sky">
        {/* 하늘 그라디언트 */}
        <div className="sky-gradient" />
        
        {/* 구름들 */}
        <div className="cloud cloud-1" />
        <div className="cloud cloud-2" />
        <div className="cloud cloud-3" />
        <div className="cloud cloud-4" />
        
        {/* 언덕들 */}
        <div className="hill hill-1" />
        <div className="hill hill-2" />
        <div className="hill hill-3" />
      </div>
    );
  }

  return (
    <div className="mario-backdrop castle">
      {/* 성 배경 */}
      <div className="castle-bg" />
      
      {/* 바닥 체크보드 */}
      <div className="castle-floor" />
    </div>
  );
};

export default MarioBackdrop;

