const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Plan = require('../models/Plan');
const Bookmark = require('../models/Bookmark');
const DiagnosisQuestion = require('../models/DiagnosisQuestion');
const DiagnosisResult = require('../models/DiagnosisResult');

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

const clearAllData = async () => {
  try {
    await connectDB();
    
    console.log('모든 데이터를 삭제합니다...');
    
    await User.deleteMany({});
    console.log('사용자 데이터 삭제 완료');
    
    await Plan.deleteMany({});
    console.log('요금제 데이터 삭제 완료');
    
    await Bookmark.deleteMany({});
    console.log('보관함 데이터 삭제 완료');
    
    await DiagnosisQuestion.deleteMany({});
    console.log('진단 질문 데이터 삭제 완료');
    
    await DiagnosisResult.deleteMany({});
    console.log('진단 결과 데이터 삭제 완료');
    
    console.log('모든 데이터 삭제가 완료되었습니다!');
    process.exit(0);
  } catch (error) {
    console.error('데이터 삭제 중 오류 발생:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  clearAllData();
}