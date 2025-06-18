const mongoose = require('mongoose');
const DiagnosisQuestion = require('../models/DiagnosisQuestion');
require('dotenv').config();

// 진단 질문 데이터
const questionsData = [
  {
    order: 1,
    question: "한 달 평균 데이터 사용량은 얼마인가요?",
    type: "single",
    options: [
      "5GB 미만",
      "5GB - 20GB",
      "20GB - 50GB", 
      "50GB - 100GB",
      "100GB 이상 (무제한 필요)"
    ],
    category: "data",
    weight: 10,
    isActive: true
  },
  {
    order: 2,
    question: "월 통신비 예산은 얼마인가요?",
    type: "single",
    options: [
      "3만원 이하",
      "3-5만원",
      "5-7만원",
      "7-10만원",
      "10만원 이상"
    ],
    category: "budget",
    weight: 9,
    isActive: true
  },
  {
    order: 3,
    question: "연령대를 선택해주세요.",
    type: "single",
    options: [
      "10대",
      "20대", 
      "30대",
      "40대",
      "50대",
      "60대 이상"
    ],
    category: "age",
    weight: 7,
    isActive: true
  },
  {
    order: 4,
    question: "주로 사용하는 기능을 선택해주세요. (복수 선택 가능)",
    type: "multiple",
    options: [
      "영상 스트리밍 (유튜브, 넷플릭스 등)",
      "모바일 게임",
      "음악 감상",
      "SNS (인스타그램, 틱톡 등)",
      "업무용 (이메일, 문서 작업)",
      "전화/문자 위주"
    ],
    category: "usage",
    weight: 8,
    isActive: true
  },
  {
    order: 5,
    question: "통신 속도 중요도는 어느 정도인가요?",
    type: "single",
    options: [
      "매우 중요 (빠른 속도 필수)",
      "보통 (일반적인 속도면 충분)",
      "상관없음 (느려도 괜찮음)"
    ],
    category: "preference",
    weight: 6,
    isActive: true
  },
  {
    order: 6,
    question: "추가 혜택 중 관심 있는 것은? (복수 선택 가능)",
    type: "multiple", 
    options: [
      "OTT 서비스 (넷플릭스, 디즈니+ 등)",
      "음악 스트리밍 (지니뮤직, 바이브 등)",
      "할인 혜택",
      "데이터 쉐어링",
      "특별한 혜택 불필요"
    ],
    category: "preference",
    weight: 5,
    isActive: true
  },
  {
    order: 7,
    question: "통신사 서비스 이용 스타일은?",
    type: "single",
    options: [
      "최신 기술과 서비스 선호",
      "검증된 안정적인 서비스 선호", 
      "가격이 가장 중요",
      "특별한 선호 없음"
    ],
    category: "preference",
    weight: 4,
    isActive: true
  }
];

async function seedDiagnosisQuestions() {
  try {
    console.log('MongoDB 연결 시도...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yoplan');
    console.log('MongoDB 연결 성공');

    // 기존 진단 질문 데이터 삭제
    console.log('기존 진단 질문 데이터 삭제 중...');
    await DiagnosisQuestion.deleteMany({});
    console.log('기존 진단 질문 데이터 삭제 완료');

    // 새 진단 질문 데이터 삽입
    console.log('새 진단 질문 데이터 삽입 중...');
    const result = await DiagnosisQuestion.insertMany(questionsData);
    console.log(`✅ ${result.length}개의 진단 질문 데이터 삽입 완료`);

    // 통계 출력
    const stats = await DiagnosisQuestion.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n📊 카테고리별 통계:');
    stats.forEach(stat => {
      console.log(`- ${stat._id}: ${stat.count}개`);
    });

    console.log('\n✨ 진단 질문 데이터 시딩 완료!');
    
  } catch (error) {
    console.error('❌ 진단 질문 데이터 시딩 중 오류 발생:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB 연결 종료');
    process.exit(0);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  console.log('🚀 진단 질문 데이터 시딩을 시작합니다...');
  seedDiagnosisQuestions();
}

module.exports = seedDiagnosisQuestions;