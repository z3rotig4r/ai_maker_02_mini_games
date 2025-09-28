import React, { useEffect, useState, useRef } from 'react';
import './Board.css';
import bgmFile from './assets/mini_game_title_song.mp3';

interface BoardProps {
  currentGameType: string | null;
}

const Board: React.FC<BoardProps> = ({ currentGameType }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    // 오디오 객체 생성
    const audio = new Audio(bgmFile);
    audio.loop = true;
    audio.volume = 0.3;
    audio.preload = 'auto';
    audioRef.current = audio;

    console.log('🎵 Board BGM 파일 경로:', bgmFile);
    console.log('🎵 오디오 객체 생성됨:', audio);

    // 오디오 이벤트 리스너
    const handleCanPlay = () => {
      console.log('✅ 오디오 파일 로드 완료');
      setAudioError(null);
    };

    const handleError = (e: any) => {
      console.error('❌ 오디오 로드 에러:', e);
      console.error('❌ 오디오 에러 상세:', audio.error);
      setAudioError(`오디오 로드 실패: ${audio.error?.message || 'Unknown error'}`);
    };

    const handlePlay = () => {
      console.log('▶️ 배경음악 재생 시작');
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log('⏸️ 배경음악 일시정지');
      setIsPlaying(false);
    };

    const handleLoadStart = () => {
      console.log('🔄 오디오 로딩 시작...');
    };

    const handleLoadedData = () => {
      console.log('📊 오디오 데이터 로드됨');
    };

    // 이벤트 리스너 등록
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);

    // 자동 재생 시도
    const tryAutoPlay = async () => {
      try {
        console.log('🎵 자동 재생 시도...');
        await audio.play();
        console.log('✅ 자동 재생 성공!');
      } catch (error) {
        console.log('⚠️ 자동 재생 차단됨, 사용자 상호작용 대기 중...', error);
        
        // 사용자 상호작용 시 재생
        const handleUserInteraction = async () => {
          try {
            await audio.play();
            console.log('✅ 사용자 상호작용 후 재생 성공!');
            // 이벤트 리스너 제거
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
          } catch (e) {
            console.error('❌ 사용자 상호작용 후에도 재생 실패:', e);
          }
        };

        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('keydown', handleUserInteraction);
        document.addEventListener('touchstart', handleUserInteraction);
      }
    };

    // 약간의 지연 후 자동 재생 시도
    setTimeout(tryAutoPlay, 500);

    // 컴포넌트 언마운트 시 정리
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);  
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
      
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      console.log('🧹 Board 오디오 정리 완료');
    };
  }, []);

  // 수동 음악 제어 함수
  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
        console.log('▶️ 수동 재생 시작');
      } else {
        audio.pause();
        console.log('⏸️ 수동 일시정지');
      }
    } catch (error) {
      console.error('❌ 수동 재생/정지 실패:', error);
    }
  };

  return (
    <div className="board">
      {/* 음악 제어 버튼 */}
      <button 
        onClick={toggleMusic}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '8px 12px',
          backgroundColor: isPlaying ? '#ff4444' : '#44ff44',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '12px',
          zIndex: 1000
        }}
      >
        {isPlaying ? '🔇 음악 끄기' : '🎵 음악 켜기'}
      </button>
      
      {/* 디버깅 정보 */}
      {audioError && (
        <div style={{ position: 'absolute', top: 50, right: 10, background: 'red', color: 'white', padding: '5px', fontSize: '12px' }}>
          {audioError}
        </div>
      )}
      
      {/* 재생 상태 표시 */}
      {isPlaying && (
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'green', color: 'white', padding: '5px', fontSize: '12px' }}>
          🎵 배경음악 재생 중
        </div>
      )}

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