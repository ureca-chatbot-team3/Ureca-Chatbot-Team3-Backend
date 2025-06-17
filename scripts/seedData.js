const mongoose = require('mongoose');
require('dotenv').config();

// 모델 import
const Plan = require('../models/Plan');
const DiagnosisQuestion = require('../models/DiagnosisQuestion');

// 데이터베이스 연결
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

// 샘플 요금제 데이터
const samplePlans = [
  {
    name: "청춘 5G 스페셜",
    price: 45000,
    data: "무제한",
    call: "무제한", 
    sms: "무제한",
    description: "젊은 세대를 위한 최적화된 5G 요금제",
    features: ["5G 전국망", "YouTube Premium 무료", "넷플릭스 혜택"],
    tags: ["청춘", "엔터테인먼트", "5G"],
    targetAge: "20대",
    benefits: ["OTT 서비스 무료", "게임 데이터 무제한"],
    category: "5G"
  },
  {
    name: "가족 LTE 플랜",
    price: 35000,
    data: "50GB",
    call: "무제한",
    sms: "무제한", 
    description: "가족 모두가 함께 사용하기 좋은 경제적인 요금제",
    features: ["가족 할인", "안전한 인터넷", "부모 제어"],
    tags: ["가족", "경제적", "안전"],
    targetAge: "전체",
    benefits: ["가족 공유 데이터", "자녀 안심 서비스"],
    category: "LTE"
  },
  {
    name: "프리미엄 5G 플러스",
    price: 75000,
    data: "무제한",
    call: "무제한",
    sms: "무제한",
    description: "최고급 서비스를 원하는 고객을 위한 프리미엄 요금제",
    features: ["5G 최고속", "로밍 무료", "우선 네트워크"],
    tags: ["프리미엄", "비즈니스", "고속"],
    targetAge: "30대",
    benefits: ["해외 로밍 무료", "VIP 고객센터"],
    category: "5G"
  },
  {
    name: "시니어 실버 플랜",
    price: 25000,
    data: "10GB",
    call: "무제한",
    sms: "무제한",
    description: "시니어 고객을 위한 간편하고 저렴한 요금제",
    features: ["큰 글씨 서비스", "간편 메뉴", "24시간 상담"],
    tags: ["시니어", "간편", "저렴"],
    targetAge: "50대+",
    benefits: ["시니어 전용 앱", "건강 관리 서비스"],
    category: "LTE"
  },
  {
    name: "스튜던트 5G",
    price: 30000,
    data: "100GB",
    call: "500분",
    sms: "무제한",
    description: "학생들을 위한 저렴한 5G 요금제",
    features: ["학생 할인", "교육 콘텐츠", "스터디 앱"],
    tags: ["학생", "교육", "할인"],
    targetAge: "10대",
    benefits: ["온라인 강의 무료", "학습 관리 앱"],
    category: "5G"
  },
  {
    name: "비즈니스 프로",
    price: 65000,
    data: "무제한",
    call: "무제한",
    sms: "무제한",
    description: "비즈니스 고객을 위한 전문 요금제",
    features: ["비즈니스 우선망", "보안 강화", "B2B 서비스"],
    tags: ["비즈니스", "보안", "전문"],
    targetAge: "40대",
    benefits: ["법인 할인", "보안 솔루션"],
    category: "5G"
  },
  {
    name: "라이트 LTE",
    price: 20000,
    data: "5GB",
    call: "200분",
    sms: "100건",
    description: "기본적인 통신만 필요한 고객을 위한 저렴한 요금제",
    features: ["기본 통화", "문자 서비스", "간단 데이터"],
    tags: ["기본", "저렴", "심플"],
    targetAge: "전체",
    benefits: ["저렴한 요금", "간단한 서비스"],
    category: "LTE"
  },
  {
    name: "게이머 5G 익스트림",
    price: 55000,
    data: "무제한",
    call: "무제한",
    sms: "무제한",
    description: "게임을 즐기는 고객을 위한 특화 요금제",
    features: ["게임 최적화", "낮은 지연시간", "게임 혜택"],
    tags: ["게임", "고성능", "특화"],
    targetAge: "20대",
    benefits: ["게임 아이템", "e스포츠 혜택"],
    category: "5G"
  }
];

// 샘플 진단 질문 데이터
const sampleQuestions = [
  {
    order: 1,
    question: "한 달 평균 데이터 사용량은 어느 정도인가요?",
    type: "single",
    options: ["1GB 미만", "1-10GB", "10-50GB", "50GB 이상", "무제한 필요"],
    weight: 5,
    category: "data"
  },
  {
    order: 2,
    question: "통화를 얼마나 자주 하시나요?",
    type: "single",
    options: ["거의 안함", "가끔 (월 100분 미만)", "보통 (월 100-500분)", "자주 (월 500분 이상)", "매우 자주 (무제한 필요)"],
    weight: 4,
    category: "call"
  },
  {
    order: 3,
    question: "월 통신비 예산은 얼마인가요?",
    type: "single",
    options: ["3만원 미만", "3-5만원", "5-7만원", "7만원 이상"],
    weight: 5,
    category: "price"
  },
  {
    order: 4,
    question: "주로 사용하는 앱이나 서비스는? (복수 선택 가능)",
    type: "multiple", 
    options: ["동영상 (YouTube, 넷플릭스)", "게임", "음악 스트리밍", "SNS", "업무용 앱", "온라인 쇼핑"],
    weight: 3,
    category: "data"
  },
  {
    order: 5,
    question: "나이대를 선택해주세요.",
    type: "single",
    options: ["10대", "20대", "30대", "40대", "50대 이상"],
    weight: 2,
    category: "general"
  },
  {
    order: 6,
    question: "통신 서비스에서 가장 중요하게 생각하는 것은?",
    type: "single",
    options: ["저렴한 요금", "빠른 속도", "안정적인 연결", "부가 서비스", "고객 서비스"],
    weight: 4,
    category: "general"
  },
  {
    order: 7,
    question: "5G 서비스 이용에 관심이 있으신가요?",
    type: "single",
    options: ["매우 관심 있음", "조금 관심 있음", "보통", "별로 관심 없음", "전혀 관심 없음"],
    weight: 3,
    category: "general"
  },
  {
    order: 8,
    question: "해외 로밍 서비스를 얼마나 사용하시나요?",
    type: "single",
    options: ["자주 이용", "가끔 이용", "거의 이용 안함", "전혀 이용 안함"],
    weight: 2,
    category: "general"
  }
];

// 데이터 생성 함수
const seedPlans = async () => {
  try {
    await Plan.deleteMany({}); // 기존 데이터 삭제
    const plans = await Plan.insertMany(samplePlans);
    console.log(`${plans.length}개의 요금제 데이터가 생성되었습니다.`);
  } catch (error) {
    console.error('요금제 데이터 생성 오류:', error);
  }
};

const seedQuestions = async () => {
  try {
    await DiagnosisQuestion.deleteMany({}); // 기존 데이터 삭제
    const questions = await DiagnosisQuestion.insertMany(sampleQuestions);
    console.log(`${questions.length}개의 진단 질문이 생성되었습니다.`);
  } catch (error) {
    console.error('진단 질문 생성 오류:', error);
  }
};

// 전체 데이터 생성 실행
const seedDatabase = async () => {
  await connectDB();
  
  console.log('샘플 데이터 생성을 시작합니다...');
  
  await seedPlans();
  await seedQuestions();
  
  console.log('샘플 데이터 생성이 완료되었습니다!');
  process.exit(0);
};

// 스크립트 실행
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };