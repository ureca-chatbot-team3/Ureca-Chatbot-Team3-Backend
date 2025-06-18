const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Plan = require('../models/Plan');

const checkDatabaseHealth = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ MongoDB 연결 성공');
    
    // 컬렉션 상태 확인
    const userCount = await User.countDocuments();
    const planCount = await Plan.countDocuments();
    
    console.log(`📊 데이터 상태:`);
    console.log(`   - 사용자: ${userCount}명`);
    console.log(`   - 요금제: ${planCount}개`);
    
    // 인덱스 확인
    const userIndexes = await User.collection.getIndexes();
    const planIndexes = await Plan.collection.getIndexes();
    
    console.log(`🔍 인덱스 상태:`);
    console.log(`   - User 인덱스: ${Object.keys(userIndexes).length}개`);
    console.log(`   - Plan 인덱스: ${Object.keys(planIndexes).length}개`);
    
    console.log('✅ 데이터베이스 상태 정상');
    process.exit(0);
  } catch (error) {
    console.error('❌ 데이터베이스 상태 확인 실패:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  checkDatabaseHealth();
}