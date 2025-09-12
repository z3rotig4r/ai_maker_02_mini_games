import React from 'react';
import './Board.css';

interface BoardProps {
  currentGameType: string | null;
}

const Board: React.FC<BoardProps> = ({ currentGameType }) => {
  return (
    <div className="board">
      {currentGameType === null ? (
        <div className="welcome-message">
          <h2>게임을 선택해주세요!</h2>
          <p>각 미니게임을 클리어하여 무기 제작에 필요한 힌트를 얻으세요.</p>
        </div>
      ) : (
        <div className="game-board">
          {/* 미니게임 컴포넌트들이 여기에 렌더링됩니다 */}
        </div>
      )}
    </div>
  );
};

export default Board;