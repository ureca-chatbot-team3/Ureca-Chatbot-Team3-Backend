require('dotenv').config(); // .env 읽기

const mongoose = require('mongoose');
const Faq = require('../models/Faq');
const faqList = require('../data/faq.json');

async function importFaqs() {
  try {
    await Faq.deleteMany({});
    await Faq.insertMany(faqList);
    console.log('✅ FAQ 데이터 MongoDB로 마이그레이션 완료');
    process.exit();
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    process.exit(1);
  }
}

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yoplan')
  .then(() => {
    console.log('✅ MongoDB 연결 성공');
    importFaqs();
  })
  .catch((err) => {
    console.error('❌ MongoDB 연결 실패:', err.message);
    process.exit(1);
  });
