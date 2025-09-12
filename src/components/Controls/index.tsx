import React from 'react';
import './Controls.css';

interface ControlsProps {
  onStart: () => void;
  onReset: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onStart, onReset }) => {
  return (
    <div className="controls">
      <button className="control-btn start" onClick={onStart}>
        게임 시작
      </button>
      <button className="control-btn reset" onClick={onReset}>
        다시 시작
      </button>
    </div>
  );
};

export default Controls;