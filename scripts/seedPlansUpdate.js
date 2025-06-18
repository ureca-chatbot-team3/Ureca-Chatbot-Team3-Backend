const mongoose = require('mongoose');
const Plan = require('../models/Plan');
require('dotenv').config();

// 완전한 요금제 데이터 (plans.json에서 가져오기)
const plansData = require('../data/plans.json');

async function seedPlans() {
  try {
    console.log('MongoDB 연결 시도...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yoplan');
    console.log('MongoDB 연결 성공');

    // 기존 요금제 데이터 삭제
    console.log('기존 요금제 데이터 삭제 중...');
    await Plan.deleteMany({});
    console.log('기존 요금제 데이터 삭제 완료');

    // 새 요금제 데이터 삽입
    console.log('새 요금제 데이터 삽입 중...');
    const result = await Plan.insertMany(plansData);
    console.log(`✅ ${result.length}개의 요금제 데이터 삽입 완료`);

    // 통계 출력
    const stats = await Plan.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price_value" }
        }
      }
    ]);
    
    console.log('\n📊 카테고리별 통계:');
    stats.forEach(stat => {
      console.log(`- ${stat._id}: ${stat.count}개, 평균 가격: ${Math.round(stat.avgPrice).toLocaleString()}원`);
    });

    console.log('\n✨ 데이터 시딩 완료!');
    
  } catch (error) {
    console.error('❌ 데이터 시딩 중 오류 발생:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB 연결 종료');
    process.exit(0);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  console.log('🚀 요금제 데이터 시딩을 시작합니다...');
  seedPlans();
}

module.exports = seedPlans;