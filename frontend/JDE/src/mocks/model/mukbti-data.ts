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

// 16유형 상세 정보 (수정된 정식 버전)
export const MUKBTI_TYPES: Record<string, { 
  label: string; 
  description: string;
  nickname: string;
  keywords: string[];
  goodMatch: string[];
  badMatch: string[];
}> = {
  MPST: { 
    label: '현실파 점심헌터', 
    nickname: '현실파 점심헌터',
    keywords: ['가성비', '한정식', '빨리먹고간다'],
    description: '식사=연료. 점심시간엔 빠르게, 익숙한 메뉴만 고수.',
    goodMatch: ['NPSD'],
    badMatch: ['MQAD'],
  },
  MPSD: { 
    label: '실속형 루틴러', 
    nickname: '실속형 루틴러',
    keywords: ['가성비', '일상식사', '분식집단골'],
    description: '가격 대비 만족감 추구. 익숙하고 합리적인 메뉴 선호.',
    goodMatch: ['NPST'],
    badMatch: ['MQAD'],
  },
  MPAT: { 
    label: '즉흥적 푸드러버', 
    nickname: '즉흥적 푸드러버',
    keywords: ['길거리음식', '야시장', '새로운조합'],
    description: '호기심 많은 즉흥파. 길거리 신메뉴 발견 시 바로 줄 선다.',
    goodMatch: ['NQAD'],
    badMatch: ['NQST'],
  },
  MPAD: { 
    label: '감성형 탐식가', 
    nickname: '감성형 탐식가',
    keywords: ['감성식당', '야시장', '카메라먼저'],
    description: '분위기도 맛도 놓치지 않음. 먹는 게 하나의 예술.',
    goodMatch: ['MQAD'],
    badMatch: ['NQST'],
  },
  MQST: { 
    label: '평온한 루틴러', 
    nickname: '평온한 루틴러',
    keywords: ['고급분식', '일상식사', '조용한카페'],
    description: '안정된 일상, 조용한 식사. 큰 모험은 싫지만 퀄리티는 챙김.',
    goodMatch: ['NQSD'],
    badMatch: ['MPAD'],
  },
  MQSD: { 
    label: '고급 실속파', 
    nickname: '고급 실속파',
    keywords: ['가심비', '조용한카페', '안정적'],
    description: '안정 속에서도 디테일한 품질을 챙기는 타입.',
    goodMatch: ['NQST'],
    badMatch: ['MPAT'],
  },
  MQAT: { 
    label: '기획형 미식가', 
    nickname: '기획형 미식가',
    keywords: ['고급한끼', '가심비', '예약필수'],
    description: '미리 조사하고 움직이는 계획파. 가성비보다 완성도.',
    goodMatch: ['NQAD'],
    badMatch: ['MPST'],
  },
  MQAD: { 
    label: '느긋한 탐미가', 
    nickname: '느긋한 탐미가',
    keywords: ['분위기맛집', '식사도여행', '와인페어링'],
    description: '여유로운 식사와 대화. 음식은 하나의 경험.',
    goodMatch: ['MPAD'],
    badMatch: ['NPST'],
  },
  NPST: { 
    label: '루틴형 직장인', 
    nickname: '루틴형 직장인',
    keywords: ['한식정식', '가성비', '점심30분'],
    description: '새로운 건 부담. 효율·속도 최우선.',
    goodMatch: ['MPST'],
    badMatch: ['MQAD'],
  },
  NPSD: { 
    label: '현실형 실속러', 
    nickname: '현실형 실속러',
    keywords: ['가성비', '무난한메뉴', '점심정식'],
    description: '효율 중시, 모험보단 확실한 만족.',
    goodMatch: ['MPST'],
    badMatch: ['MQAD'],
  },
  NPAT: { 
    label: '열정적 플랜러', 
    nickname: '열정적 플랜러',
    keywords: ['프로맛집러', '계획형', '시간관리'],
    description: '신메뉴도 철저히 조사 후 선택. 실패 없는 탐험가.',
    goodMatch: ['MQAT'],
    badMatch: ['MPST'],
  },
  NPAD: { 
    label: '느긋한 생활미식가', 
    nickname: '느긋한 생활미식가',
    keywords: ['브런치카페', '산책후식사', '일상힐링'],
    description: '맛집 탐방이 힐링 루틴. 느긋한 식사와 대화 선호.',
    goodMatch: ['MQAD'],
    badMatch: ['NPST'],
  },
  NQST: { 
    label: '완벽주의 미식가', 
    nickname: '완벽주의 미식가',
    keywords: ['정갈한한식', '프리미엄', '디테일'],
    description: '위생·품질·서비스 모두 따지는 철저한 평가자.',
    goodMatch: ['MQSD'],
    badMatch: ['MPAT'],
  },
  NQSD: { 
    label: '꼼꼼한 루틴러', 
    nickname: '꼼꼼한 루틴러',
    keywords: ['고급분식', '디테일', '안정지향'],
    description: '안정과 퀄리티의 균형. 과한 모험은 부담스러움.',
    goodMatch: ['MQST'],
    badMatch: ['MPAD'],
  },
  NQAT: { 
    label: '고급탐험가', 
    nickname: '고급탐험가',
    keywords: ['예약맛집', '특별한경험', '한정메뉴'],
    description: '시간·돈 아깝지 않게 특별한 한 끼를 추구.',
    goodMatch: ['MQAT'],
    badMatch: ['MPST'],
  },
  NQAD: { 
    label: '감성형 미식탐험가', 
    nickname: '감성형 미식탐험가',
    keywords: ['분위기', '느긋한식사', '새로움'],
    description: '미식과 분위기 모두 즐기는 완벽한 여유형.',
    goodMatch: ['MQAD'],
    badMatch: ['MPST'],
  },
};

