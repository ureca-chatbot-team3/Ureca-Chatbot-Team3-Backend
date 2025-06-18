const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const plansData = require('../data/plans.json');
require('dotenv').config();

// 데이터베이스 연결
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

// 이미지 경로가 포함된 요금제 데이터 업데이트
const updatePlansWithImages = async () => {
  try {
    console.log('요금제 데이터 업데이트 시작...');
    
    for (const planData of plansData) {
      const updateData = {
        name: planData.name,
        badge: planData.badge,
        infos: planData.infos,
        plan_speed: planData.plan_speed,
        price: planData.price,
        price_value: planData.price_value,
        sale_price: planData.sale_price,
        brands: planData.brands || [],
        benefits: planData.benefits || {},
        max_age: planData.max_age || null,
        min_age: planData.min_age || null,
        category: planData.category,
        isActive: planData.isActive !== false,
        // 새로 추가된 이미지 관련 필드들
        imagePath: planData.imagePath || null,
        icon: planData.icon || null,
        iconPath: planData.iconPath || null
      };

      // upsert를 사용하여 존재하면 업데이트, 없으면 생성
      await Plan.findOneAndUpdate(
        { name: planData.name }, // 요금제 이름으로 찾기
        updateData,
        { 
          upsert: true, 
          new: true,
          runValidators: true 
        }
      );
      
      console.log(`✓ ${planData.name} 업데이트 완료`);
    }
    
    console.log(`총 ${plansData.length}개의 요금제 데이터 업데이트 완료`);
    
    // 업데이트된 데이터 확인
    const totalPlans = await Plan.countDocuments({ isActive: true });
    const plansWithImages = await Plan.countDocuments({ 
      isActive: true, 
      imagePath: { $ne: null } 
    });
    const plansWithIcons = await Plan.countDocuments({ 
      isActive: true, 
      iconPath: { $ne: null } 
    });
    
    console.log('\n=== 업데이트 결과 ===');
    console.log(`전체 활성 요금제: ${totalPlans}개`);
    console.log(`이미지 경로가 있는 요금제: ${plansWithImages}개`);
    console.log(`아이콘 경로가 있는 요금제: ${plansWithIcons}개`);
    
  } catch (error) {
    console.error('요금제 업데이트 오류:', error);
    throw error;
  }
};

// 특정 요금제의 이미지 정보 확인
const checkPlanImages = async () => {
  try {
    console.log('\n=== 이미지 정보 샘플 확인 ===');
    
    const samplePlans = await Plan.find({ 
      isActive: true,
      imagePath: { $ne: null }
    })
    .select('name imagePath iconPath icon')
    .limit(5)
    .lean();
    
    samplePlans.forEach(plan => {
      console.log(`요금제: ${plan.name}`);
      console.log(`  이미지 경로: ${plan.imagePath}`);
      console.log(`  아이콘: ${plan.icon}`);
      console.log(`  아이콘 경로: ${plan.iconPath}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('이미지 정보 확인 오류:', error);
  }
};

// 메인 실행 함수
const main = async () => {
  try {
    await connectDB();
    await updatePlansWithImages();
    await checkPlanImages();
    
    console.log('\n모든 작업이 완료되었습니다!');
    process.exit(0);
    
  } catch (error) {
    console.error('스크립트 실행 오류:', error);
    process.exit(1);
  }
};

// 스크립트 실행 시 직접 실행되도록 설정
if (require.main === module) {
  main();
}

module.exports = {
  updatePlansWithImages,
  checkPlanImages
};
