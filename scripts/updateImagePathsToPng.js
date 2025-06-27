// scripts/updateImagePathsToPng.js
const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const fs = require('fs');
const path = require('path');
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

// SVG 경로를 PNG 경로로 변경하는 함수
const updateImagePathsToPng = async () => {
  try {
    console.log('🔄 이미지 경로를 SVG에서 PNG로 업데이트 시작...\n');
    
    // 모든 활성 요금제 조회
    const plans = await Plan.find({ isActive: true });
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const plan of plans) {
      let updated = false;
      const updateData = {};
      
      // imagePath 업데이트
      if (plan.imagePath && plan.imagePath.includes('.svg')) {
        const pngPath = plan.imagePath.replace('.svg', '.png');
        
        // 실제 PNG 파일이 존재하는지 확인
        const fullPngPath = path.join(__dirname, '../public', pngPath);
        
        if (fs.existsSync(fullPngPath)) {
          updateData.imagePath = pngPath;
          updated = true;
          console.log(`✅ ${plan.name}: ${plan.imagePath} → ${pngPath}`);
        } else {
          console.log(`❌ ${plan.name}: PNG 파일이 존재하지 않음 (${pngPath})`);
          notFoundCount++;
        }
      }
      
      // iconPath 업데이트 (characters 폴더의 SVG는 그대로 유지)
      // iconPath는 캐릭터 이미지이므로 SVG를 유지
      
      // 업데이트 실행
      if (updated) {
        await Plan.findByIdAndUpdate(plan._id, updateData);
        updatedCount++;
      }
    }
    
    console.log(`\n📊 업데이트 완료!`);
    console.log(`   성공: ${updatedCount}개 요금제`);
    console.log(`   실패: ${notFoundCount}개 요금제 (파일 없음)`);
    
    // 업데이트 결과 확인
    const plansWithPng = await Plan.countDocuments({ 
      isActive: true, 
      imagePath: { $regex: '\\.png$' } 
    });
    const plansWithSvg = await Plan.countDocuments({ 
      isActive: true, 
      imagePath: { $regex: '\\.svg$' } 
    });
    
    console.log(`\n📈 현재 상태:`);
    console.log(`   PNG 경로: ${plansWithPng}개`);
    console.log(`   SVG 경로: ${plansWithSvg}개`);
    
  } catch (error) {
    console.error('❌ 업데이트 오류:', error);
    throw error;
  }
};

// 실제 파일 확인 함수
const checkAvailableFiles = () => {
  console.log('\n🔍 사용 가능한 PNG 파일 확인...');
  
  const plansDir = path.join(__dirname, '../public/images/plans');
  
  try {
    const files = fs.readdirSync(plansDir);
    const pngFiles = files.filter(file => file.endsWith('.png'));
    const svgFiles = files.filter(file => file.endsWith('.svg'));
    
    console.log(`PNG 파일: ${pngFiles.length}개`);
    console.log(`SVG 파일: ${svgFiles.length}개`);
    
    console.log('\n📁 PNG 파일 목록:');
    pngFiles.forEach(file => {
      const filePath = path.join(plansDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   ${file} (${sizeKB}KB)`);
    });
    
    if (svgFiles.length > 0) {
      console.log('\n⚠️  남은 SVG 파일:');
      svgFiles.forEach(file => console.log(`   ${file}`));
    }
    
  } catch (error) {
    console.error('❌ 파일 확인 오류:', error);
  }
};

// 메인 실행 함수
const main = async () => {
  try {
    await connectDB();
    checkAvailableFiles();
    await updateImagePathsToPng();
    
    console.log('\n✅ 모든 작업이 완료되었습니다!');
    console.log('💡 프론트엔드 서버를 재시작하여 변경사항을 확인하세요.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
    process.exit(1);
  }
};

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = {
  updateImagePathsToPng,
  checkAvailableFiles
};
