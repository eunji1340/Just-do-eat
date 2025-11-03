import type { Question, Axis } from './mukbti-types';

// 각 축의 총 문항 수 (가중치 참고용)
export const AXIS_DISTRIBUTION: Record<Axis, number> = {
  M: 3, N: 3,
  P: 3, Q: 3,
  S: 3, A: 3,
  T: 5, D: 5,
};

// 질문 정의: 선택지마다 해당 축에 +1 기여
export const MUKBTI_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: '아침/저녁 약속을 잡을 때, “오늘 뭐 먹을래?”',
    choices: [
      { id: 'A', text: '그때 가서 분위기 봐서 정하자~', axes: ['M'] },
      { id: 'B', text: '어제 미리 찾아둔 맛집 리스트 보낼게.', axes: ['N'] },
    ],
  },
  {
    id: 'q2',
    text: '점심 후보 두 개! 무엇을 선택할까?',
    choices: [
      { id: 'A', text: '직장 근처 7천원 백반집', axes: ['P', 'T'] },
      { id: 'B', text: '좀 멀지만 리뷰 좋은 만원대 맛집', axes: ['Q', 'D'] },
    ],
  },
  {
    id: 'q3',
    text: '낯선 향이 확! 풍기는 식당에 들어섰다',
    choices: [
      { id: 'A', text: '유명한 신메뉴? 한 번 먹어볼까!', axes: ['A'] },
      { id: 'B', text: '음… 다른 메뉴로 바꿔야겠다', axes: ['S'] },
    ],
  },
  {
    id: 'q4',
    text: '점심시간 40분만 남음!',
    choices: [
      { id: 'A', text: '그냥 빠른 메뉴로 먹자', axes: ['T'] },
      { id: 'B', text: '그래도 천천히 먹자, 시간 맞출 수 있어', axes: ['D'] },
    ],
  },
  {
    id: 'q5',
    text: '음식이 나왔다! 먼저 할 일은?',
    choices: [
      { id: 'A', text: '사진부터 📷', axes: ['M', 'D'] },
      { id: 'B', text: '식기 전에 먹자!', axes: ['N', 'T'] },
    ],
  },
  {
    id: 'q6',
    text: '퇴근 후 고깃집 제안',
    choices: [
      { id: 'A', text: '새로 생긴 곳 가보자!', axes: ['A'] },
      { id: 'B', text: '지난번 갔던 곳이 낫지 않아?', axes: ['S'] },
    ],
  },
  {
    id: 'q7',
    text: '대기가 길다…',
    choices: [
      { id: 'A', text: '기다리기 싫다, 다른 데 가자', axes: ['T'] },
      { id: 'B', text: '진짜 맛있다는데 좀 기다리자', axes: ['D'] },
    ],
  },
  {
    id: 'q8',
    text: '친구가 온두라스 음식점 제안!',
    choices: [
      { id: 'A', text: '재밌겠다, 좋아!', axes: ['A'] },
      { id: 'B', text: '적당히 무난한 곳이 좋겠다', axes: ['S'] },
    ],
  },
  {
    id: 'q9',
    text: '오늘 하루를 떠올리며…',
    choices: [
      { id: 'A', text: '분위기도 좋고 색달랐어 😌', axes: ['M', 'D', 'Q'] },
      { id: 'B', text: '시간·가격 모두 효율적이었어 💼', axes: ['N', 'T', 'P'] },
    ],
  },
];

// 16유형 라벨/설명 (요약본)
export const MUKBTI_TYPES: Record<string, { label: string; description: string }> = {
  MPST: { label: '현실파 점심헌터', description: '식사=연료, 빠르고 익숙하게.' },
  MPSA: { label: '실속형 미식러', description: '합리적인 모험, 가성비+재미.' },
  MPAT: { label: '즉흥적 푸드러버', description: '길거리 신메뉴 즉시 도전.' },
  MPAD: { label: '감성형 탐식가', description: '분위기+맛, 기록하는 미식.' },
  MQST: { label: '평온한 루틴러', description: '큰 모험은 적당히, 품질 챙김.' },
  MQSA: { label: '고급스런 실험가', description: '트렌드 빠르게, 감성+퀄.' },
  MQAT: { label: '기획형 미식가', description: '조사→실행, 완성도 중시.' },
  MQAD: { label: '느긋한 탐미가', description: '식사는 경험, 여유롭게.' },
  NPST: { label: '루틴형 직장인', description: '가성비·속도 최우선.' },
  NPSA: { label: '전략적 미식가', description: '합리선 안에서 도전.' },
  NPAT: { label: '열정적 플랜러', description: '조사 철저, 실패 없는 탐험.' },
  NPAD: { label: '느긋한 생활미식가', description: '힐링 루틴, 대화 선호.' },
  NQST: { label: '완벽주의 미식가', description: '품질·서비스·위생 철저.' },
  NQSA: { label: '트렌드 감별사', description: '신상 빠른 시도/리뷰.' },
  NQAT: { label: '고급탐험가', description: '특별한 한 끼 추구.' },
  NQAD: { label: '감성형 미식탐험가', description: '분위기+미식 완벽 조합.' },
};
