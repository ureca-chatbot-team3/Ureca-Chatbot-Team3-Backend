const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Plan = require('../models/Plan');
const Bookmark = require('../models/Bookmark');
const DiagnosisQuestion = require('../models/DiagnosisQuestion');
const DiagnosisResult = require('../models/DiagnosisResult');

class DataCleaner {
  
  static async connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB 연결 성공');
    } catch (error) {
      console.error('❌ MongoDB 연결 실패:', error);
      process.exit(1);
    }
  }

  // 사용자 관련 데이터 삭제
  static async clearUserData() {
    try {
      const userCount = await User.countDocuments();
      const bookmarkCount = await Bookmark.countDocuments();
      
      await User.deleteMany({});
      await Bookmark.deleteMany({}); // 사용자 삭제 시 보관함도 함께 삭제
      
      console.log(`🗑️  사용자 데이터 삭제 완료: ${userCount}개`);
      console.log(`🗑️  보관함 데이터 삭제 완료: ${bookmarkCount}개`);
      
      return { users: userCount, bookmarks: bookmarkCount };
    } catch (error) {
      console.error('❌ 사용자 데이터 삭제 실패:', error);
      throw error;
    }
  }

  // 요금제 데이터 삭제
  static async clearPlanData() {
    try {
      const planCount = await Plan.countDocuments();
      const bookmarkCount = await Bookmark.countDocuments();
      
      await Plan.deleteMany({});
      await Bookmark.deleteMany({}); // 요금제 삭제 시 관련 보관함도 삭제
      
      console.log(`🗑️  요금제 데이터 삭제 완료: ${planCount}개`);
      console.log(`🗑️  관련 보관함 데이터 삭제 완료: ${bookmarkCount}개`);
      
      return { plans: planCount, bookmarks: bookmarkCount };
    } catch (error) {
      console.error('❌ 요금제 데이터 삭제 실패:', error);
      throw error;
    }
  }

  // 진단 관련 데이터 삭제
  static async clearDiagnosisData() {
    try {
      const questionCount = await DiagnosisQuestion.countDocuments();
      const resultCount = await DiagnosisResult.countDocuments();
      
      await DiagnosisQuestion.deleteMany({});
      await DiagnosisResult.deleteMany({});
      
      console.log(`🗑️  진단 질문 데이터 삭제 완료: ${questionCount}개`);
      console.log(`🗑️  진단 결과 데이터 삭제 완료: ${resultCount}개`);
      
      return { questions: questionCount, results: resultCount };
    } catch (error) {
      console.error('❌ 진단 데이터 삭제 실패:', error);
      throw error;
    }
  }

  // 보관함만 삭제
  static async clearBookmarkData() {
    try {
      const bookmarkCount = await Bookmark.countDocuments();
      
      await Bookmark.deleteMany({});
      
      console.log(`🗑️  보관함 데이터 삭제 완료: ${bookmarkCount}개`);
      
      return { bookmarks: bookmarkCount };
    } catch (error) {
      console.error('❌ 보관함 데이터 삭제 실패:', error);
      throw error;
    }
  }

  // 진단 결과만 삭제 (질문은 유지)
  static async clearDiagnosisResults() {
    try {
      const resultCount = await DiagnosisResult.countDocuments();
      
      await DiagnosisResult.deleteMany({});
      
      console.log(`🗑️  진단 결과 데이터 삭제 완료: ${resultCount}개`);
      console.log(`ℹ️  진단 질문은 유지됩니다.`);
      
      return { results: resultCount };
    } catch (error) {
      console.error('❌ 진단 결과 삭제 실패:', error);
      throw error;
    }
  }

  // 테스트 데이터만 삭제 (운영 환경 보호)
  static async clearTestData() {
    try {
      // 테스트 사용자 삭제 (이메일에 'test' 포함)
      const testUsers = await User.deleteMany({
        $or: [
          { email: { $regex: /test/i } },
          { nickname: { $regex: /test/i } }
        ]
      });
      
      // 오래된 세션 기반 진단 결과 삭제 (7일 이상)
      const oldResults = await DiagnosisResult.deleteMany({
        userId: null,
        createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });
      
      console.log(`🗑️  테스트 사용자 삭제 완료: ${testUsers.deletedCount}개`);
      console.log(`🗑️  오래된 익명 진단 결과 삭제 완료: ${oldResults.deletedCount}개`);
      
      return { testUsers: testUsers.deletedCount, oldResults: oldResults.deletedCount };
    } catch (error) {
      console.error('❌ 테스트 데이터 삭제 실패:', error);
      throw error;
    }
  }

  // 전체 데이터 삭제 (기존 기능 유지)
  static async clearAllData() {
    try {
      const stats = {
        users: await User.countDocuments(),
        plans: await Plan.countDocuments(),
        bookmarks: await Bookmark.countDocuments(),
        questions: await DiagnosisQuestion.countDocuments(),
        results: await DiagnosisResult.countDocuments()
      };
      
      await User.deleteMany({});
      await Plan.deleteMany({});
      await Bookmark.deleteMany({});
      await DiagnosisQuestion.deleteMany({});
      await DiagnosisResult.deleteMany({});
      
      console.log('🗑️  전체 데이터 삭제 완료:');
      console.log(`   - 사용자: ${stats.users}개`);
      console.log(`   - 요금제: ${stats.plans}개`);
      console.log(`   - 보관함: ${stats.bookmarks}개`);
      console.log(`   - 진단 질문: ${stats.questions}개`);
      console.log(`   - 진단 결과: ${stats.results}개`);
      
      return stats;
    } catch (error) {
      console.error('❌ 전체 데이터 삭제 실패:', error);
      throw error;
    }
  }

  // 데이터베이스 상태 확인
  static async checkDatabaseStatus() {
    try {
      const stats = {
        users: await User.countDocuments(),
        plans: await Plan.countDocuments(),
        bookmarks: await Bookmark.countDocuments(),
        questions: await DiagnosisQuestion.countDocuments(),
        results: await DiagnosisResult.countDocuments()
      };
      
      console.log('📊 현재 데이터베이스 상태:');
      console.log(`   - 사용자: ${stats.users}개`);
      console.log(`   - 요금제: ${stats.plans}개`);
      console.log(`   - 보관함: ${stats.bookmarks}개`);
      console.log(`   - 진단 질문: ${stats.questions}개`);
      console.log(`   - 진단 결과: ${stats.results}개`);
      
      return stats;
    } catch (error) {
      console.error('❌ 데이터베이스 상태 확인 실패:', error);
      throw error;
    }
  }

  // 안전한 종료
  static async disconnect() {
    await mongoose.connection.close();
    console.log('📴 MongoDB 연결 종료');
  }
}

// CLI 실행 함수
const runClearCommand = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  
  await DataCleaner.connectDB();
  
  try {
    switch (command) {
      case 'users':
        console.log('👥 사용자 데이터를 삭제합니다...');
        await DataCleaner.clearUserData();
        break;
        
      case 'plans':
        console.log('📋 요금제 데이터를 삭제합니다...');
        await DataCleaner.clearPlanData();
        break;
        
      case 'diagnosis':
        console.log('🔍 진단 관련 데이터를 삭제합니다...');
        await DataCleaner.clearDiagnosisData();
        break;
        
      case 'bookmarks':
        console.log('⭐ 보관함 데이터를 삭제합니다...');
        await DataCleaner.clearBookmarkData();
        break;
        
      case 'results':
        console.log('📊 진단 결과만 삭제합니다...');
        await DataCleaner.clearDiagnosisResults();
        break;
        
      case 'test':
        console.log('🧪 테스트 데이터를 삭제합니다...');
        await DataCleaner.clearTestData();
        break;
        
      case 'status':
        await DataCleaner.checkDatabaseStatus();
        break;
        
      case 'all':
      case undefined:
        console.log('⚠️  전체 데이터를 삭제합니다...');
        console.log('⚠️  3초 후 삭제를 시작합니다...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await DataCleaner.clearAllData();
        break;
        
      default:
        console.log('❌ 올바르지 않은 명령어입니다.');
        console.log('');
        console.log('📖 사용법:');
        console.log('  node scripts/clearData.js [command]');
        console.log('');
        console.log('🔧 사용 가능한 명령어:');
        console.log('  all      - 전체 데이터 삭제 (기본값)');
        console.log('  users    - 사용자 + 보관함 데이터 삭제');
        console.log('  plans    - 요금제 + 관련 보관함 데이터 삭제');
        console.log('  diagnosis - 진단 질문 + 결과 데이터 삭제');
        console.log('  bookmarks - 보관함 데이터만 삭제');
        console.log('  results  - 진단 결과만 삭제 (질문 유지)');
        console.log('  test     - 테스트 데이터만 삭제');
        console.log('  status   - 현재 데이터베이스 상태 확인');
        console.log('');
        console.log('💡 예시:');
        console.log('  npm run clear:users');
        console.log('  npm run clear:plans');
        console.log('  npm run clear:test');
        process.exit(1);
    }
    
    console.log('✅ 작업이 완료되었습니다!');
  } catch (error) {
    console.error('❌ 작업 중 오류가 발생했습니다:', error);
    process.exit(1);
  } finally {
    await DataCleaner.disconnect();
    process.exit(0);
  }
};

// 스크립트 직접 실행 시
if (require.main === module) {
  runClearCommand();
}

module.exports = DataCleaner;
