// src/components/MiniGames/CatchingGame/endings.ts

/**
 * 점수 구간별 엔딩 메시지 설정
 * 모든 플레이어가 통과하고 축하받는 톤으로 구성
 */
export const SCORE_TIERS = [
  {
    min: 0,
    title: "탐험가 등급 🐣",
    msg: "미션 완료! 오늘의 힌트를 가방에 담았어요.",
    cta: "시작화면으로 이동"
  },
  {
    min: 100,
    title: "과일 수호자 🍏",
    msg: "집중력이 반짝! 수집이 아주 안정적이었어요.",
    cta: "시작화면으로 이동"
  },
  {
    min: 230,
    title: "요시 에이스 ⭐",
    msg: "속도가 빨라져도 침착했어요. 전설의 무기에 한 걸음 더!",
    cta: "시작화면으로 이동"
  },
  {
    min: 350,
    title: "전설의 요시 🏆",
    msg: "환상적인 플레이! 팀을 대표할 만한 실력이에요.",
    cta: "시작화면으로 이동"
  }
] as const;

/**
 * 점수에 따른 티어 결정
 */
export const getScoreTier = (score: number) => {
  // 높은 점수부터 확인하여 해당하는 최고 티어 반환
  for (let i = SCORE_TIERS.length - 1; i >= 0; i--) {
    if (score >= SCORE_TIERS[i].min) {
      return SCORE_TIERS[i];
    }
  }
  return SCORE_TIERS[0]; // 기본값 (0점 이상)
};

export type ScoreTier = typeof SCORE_TIERS[number];
