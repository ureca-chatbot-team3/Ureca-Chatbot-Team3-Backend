const mongoose = require('mongoose');
const Plan = require('../models/Plan');
require('dotenv').config();

const getFirstPlanId = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');
    
    const firstPlan = await Plan.findOne({ isActive: true }).select('_id name price category');
    
    if (firstPlan) {
      console.log('📋 첫 번째 요금제 정보:');
      console.log(`   ID: ${firstPlan._id}`);
      console.log(`   이름: ${firstPlan.name}`);
      console.log(`   가격: ${firstPlan.price}`);
      console.log(`   카테고리: ${firstPlan.category}`);
      console.log('');
      console.log('🔗 테스트 URL:');
      console.log(`   http://localhost:5000/api/plans/${firstPlan._id}`);
    } else {
      console.log('❌ 활성화된 요금제가 없습니다.');
      console.log('💡 먼저 npm run seed를 실행하세요.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📴 MongoDB 연결 종료');
    process.exit(0);
  }
};

if (require.main === module) {
  getFirstPlanId();
}

module.exports = getFirstPlanId;