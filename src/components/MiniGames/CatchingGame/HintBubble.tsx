import React from 'react';

interface HintBubbleProps {
  show: boolean;
}

const HintBubble: React.FC<HintBubbleProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div 
      className="hint-bubble"
      role="status"
      aria-live="polite"
      aria-label="게임 힌트"
    >
      요시가 좋아하는 사과를 먹으면 소리가 납니다!
    </div>
  );
};

export default HintBubble;
