import React, { useState, useEffect } from 'react';
import './MemoryGame.css';

interface MemoryGameProps {
  difficulty: number;
  onComplete: (hint: string) => void;
}

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_VALUES = [
  'mario', 'luigi', 'peach', 'toad',
  'yoshi', 'bowser', 'koopa', 'goomba'
];

const MemoryGame: React.FC<MemoryGameProps> = ({ difficulty, onComplete }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);

  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  const initializeGame = () => {
    const cardCount = 8 + (difficulty - 1) * 4; // 난이도에 따라 카드 수 증가
    const values = [...CARD_VALUES.slice(0, cardCount / 2)];
    const allCards = [...values, ...values]
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false
      }));
    setCards(allCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
  };

  const handleCardClick = (cardId: number) => {
    const card = cards[cardId];
    
    if (card.isMatched || card.isFlipped || flippedCards.length >= 2) {
      return;
    }

    const newCards = cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    if (flippedCards.length === 0) {
      setFlippedCards([cardId]);
    } else {
      setMoves(m => m + 1);
      const firstCard = cards[flippedCards[0]];
      
      if (firstCard.value === card.value) {
        // Match found
        setMatchedPairs(m => m + 1);
        setCards(prev => prev.map(c => 
          (c.id === cardId || c.id === flippedCards[0])
            ? { ...c, isMatched: true, isFlipped: true }
            : c
        ));
        setFlippedCards([]);
      } else {
        // No match
        setFlippedCards([...flippedCards, cardId]);
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === cardId || c.id === flippedCards[0])
              ? { ...c, isFlipped: false }
              : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (matchedPairs === cards.length / 2) {
      onComplete('두 번째 무기엔... 부끄부끄의 힘이 필요할 거야!');
    }
  }, [matchedPairs, cards.length, onComplete]);

  return (
    <div className="memory-game">
      <div className="game-info">
        <span>이동 횟수: {moves}</span>
        <span>찾은 짝: {matchedPairs}</span>
      </div>
      <div className="cards-grid" style={{
        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cards.length))}, 1fr)`
      }}>
        {cards.map(card => (
          <div
            key={card.id}
            className={`card ${card.isFlipped ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            <div className="card-inner">
              <div className="card-front" />
              <div className="card-back">
                <img src={`./assets/${card.value}.png`} alt={card.value} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryGame;
