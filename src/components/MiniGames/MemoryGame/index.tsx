import React, { useState, useEffect, useCallback } from 'react';
import './MemoryGame.css';
import bukkuImg from './assets/bukku.png';

type CardValue = 'mario' | 'luigi' | 'peach' | 'toad' | 'yoshi' | 'bowser' | 'koopa' | 'goomba';

interface ShuffleAnimationProps {
  isShuffling: boolean;
  onAnimationEnd: () => void;
}

interface MemoryGameProps {
  difficulty: number;
  onComplete: (hint: string) => void;
}

interface Card {
  id: number;
  value: CardValue;
  isFlipped: boolean;
  isMatched: boolean;
}

// 카드 이미지 import
import marioImg from './assets/mario.png';
import luigiImg from './assets/luigi.png';
import peachImg from './assets/peach.png';
import toadImg from './assets/toad.png';
import yoshiImg from './assets/yoshi.png';
import bowserImg from './assets/bowser.png';
import koopaImg from './assets/koopa.png';
import goombaImg from './assets/goomba.png';

// 카드 이미지 매핑
const CARD_IMAGES: Record<CardValue, string> = {
  mario: marioImg,
  luigi: luigiImg,
  peach: peachImg,
  toad: toadImg,
  yoshi: yoshiImg,
  bowser: bowserImg,
  koopa: koopaImg,
  goomba: goombaImg
};

// 사용 가능한 카드 값 목록
const CARD_VALUES: CardValue[] = [
  'mario', 'luigi', 'peach', 'toad',
  'yoshi', 'bowser', 'koopa', 'goomba'
];

const ShuffleAnimation: React.FC<ShuffleAnimationProps> = ({ isShuffling, onAnimationEnd }) => {
  useEffect(() => {
    if (isShuffling) {
      const timer = setTimeout(onAnimationEnd, 2000); // 애니메이션 지속 시간
      return () => clearTimeout(timer);
    }
  }, [isShuffling, onAnimationEnd]);

  if (!isShuffling) return null;

  return (
    <div className="shuffle-animation">
      <div className="bukku-container">
        <img src={bukkuImg} alt="부끄" className="bukku-image" />
      </div>
      <div className="shuffle-cards">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="shuffle-card" 
            style={{ 
              animationDelay: `${i * 0.15}s`,
              '--tx': `${(Math.random() - 0.5) * 150}px`,
              '--ty': `${(Math.random() - 0.5) * 100}px`,
              '--r': `${(Math.random() - 0.5) * 180}deg`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
};

const MemoryGame: React.FC<MemoryGameProps> = ({ difficulty, onComplete }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [isGameCompleted, setIsGameCompleted] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);

  const shuffleCards = useCallback((count: number) => {
    const selectedValues = CARD_VALUES.slice(0, count / 2);
    const pairs = [...selectedValues, ...selectedValues];
    
    return pairs
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false
      }));
  }, []);

  const initializeGame = useCallback(() => {
    console.log('Initializing game...');
    const minPairs = 4;
    const maxPairs = 8;
    const cardCount = Math.min(maxPairs * 2, Math.max(minPairs * 2, 8 + (difficulty - 1) * 4));
    
    setIsShuffling(true);
    setCards([]);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
  }, [difficulty, shuffleCards]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

const handleCardClick = useCallback((cardId: number) => {
    console.log('Card clicked:', cardId);
    
    if (isGameCompleted || isProcessing) {
      console.log('Game is completed or processing');
      return;
    }

    const clickedCard = cards[cardId];
    if (!clickedCard || clickedCard.isMatched || clickedCard.isFlipped || flippedCards.length >= 2) {
      console.log('Invalid card click');
      return;
    }

    // 첫 클릭시 게임 시작
    if (!isGameStarted) {
      console.log('Game starting...');
      setIsGameStarted(true);
    }

    // 새로운 카드를 뒤집을 때마다 상태 업데이트
    setCards(prevCards => 
      prevCards.map(card =>
        card.id === cardId ? { ...card, isFlipped: true } : card
      )
    );

    // 첫 번째 카드를 뒤집은 경우
    if (flippedCards.length === 0) {
      setFlippedCards([cardId]);
      return;
    }

    // 두 번째 카드를 뒤집은 경우
    const firstCardId = flippedCards[0];
    const firstCard = cards[firstCardId];
    
    // 같은 카드를 두 번 클릭한 경우
    if (firstCardId === cardId) {
      return;
    }

    // 새로운 이동 횟수 추가
    setMoves(prev => prev + 1);
    setIsProcessing(true); // 처리 중 상태로 설정

    // 카드 매칭 확인
    if (firstCard.value === clickedCard.value) {
      // 매칭 성공
      console.log('Match found!');
      setMatchedPairs(prev => prev + 1);
      setCards(prev => 
        prev.map(card =>
          card.id === cardId || card.id === firstCardId
            ? { ...card, isMatched: true, isFlipped: true }
            : card
        )
      );
      setFlippedCards([]); // 뒤집힌 카드 목록 초기화
      setIsProcessing(false); // 처리 완료
    } else {
      // 매칭 실패
      console.log('No match');
      setFlippedCards([firstCardId, cardId]); // 두 번째 카드도 flippedCards에 추가
      // 잠시 보여준 후 다시 뒤집기
      setTimeout(() => {
        setCards(prev =>
          prev.map(card =>
            card.id === cardId || card.id === firstCardId
              ? { ...card, isFlipped: false }
              : card
          )
        );
        setFlippedCards([]);
        setIsProcessing(false); // 처리 완료
      }, 1000);
    }
  }, [cards, flippedCards, isGameCompleted, isGameStarted]);

  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  useEffect(() => {
    const totalPairs = Math.floor(cards.length / 2);
    console.log(`Matched pairs: ${matchedPairs}, Total pairs: ${totalPairs}`);
    
    if (isGameStarted && matchedPairs > 0 && matchedPairs === totalPairs && !isGameCompleted) {
      console.log('Game completed!');
      setIsGameCompleted(true);
      setShowSuccessModal(true);
    }
  }, [isGameStarted, matchedPairs, cards.length, isGameCompleted]);

  const handleSuccessConfirm = useCallback(() => {
    onComplete('두 번째 무기엔... 부끄부끄의 힘이 필요할 거야!');
    setShowSuccessModal(false);
  }, [onComplete]);

  const handleShuffleComplete = useCallback(() => {
    setIsShuffling(false);
    setCards(shuffleCards(Math.min(16, Math.max(8, 8 + (difficulty - 1) * 4))));
  }, [difficulty, shuffleCards]);

  return (
    <div className="memory-game">
      <ShuffleAnimation isShuffling={isShuffling} onAnimationEnd={handleShuffleComplete} />
      <div className="game-info">
        <div className="info-box moves">
          <span className="info-label">이동 횟수</span>
          <span className="info-value">{moves}</span>
        </div>
        <div className="info-box pairs">
          <span className="info-label">찾은 짝</span>
          <span className="info-value">{matchedPairs}</span>
        </div>
        {isGameCompleted && (
          <div className="game-complete">
            <div>게임 완료!</div>
          </div>
        )}
      </div>
      {showSuccessModal && (
        <div className="success-modal">
          <div className="modal-content">
            <h2 className="modal-title">🎉 축하합니다! 🎉</h2>
            <p className="modal-message">
              모든 카드의 짝을 찾으셨네요!<br/>
              계속하시려면 아래 버튼을 눌러주세요.
            </p>
            <button className="modal-button" onClick={handleSuccessConfirm}>
              다음으로
            </button>
          </div>
        </div>
      )}
      <div 
        className="cards-grid" 
        style={{
          gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cards.length))}, 1fr)`,
          gap: '10px',
          padding: '20px'
        }}
      >
        {cards.map(card => (
          <div
            key={card.id}
            className={`card ${card.isFlipped ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            <div className="card-inner">
              <div className="card-front">
                <div className="card-question">?</div>
              </div>
              <div className="card-back">
                <img src={CARD_IMAGES[card.value]} alt={card.value} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryGame;
