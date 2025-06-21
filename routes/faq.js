const express = require('express');
const router = express.Router();
const Faq = require('../models/Faq');

// GET /api/faq - 랜덤 추천 질문 4개
router.get('/', async (req, res) => {
  try {
    const faqs = await Faq.aggregate([{ $sample: { size: 4 } }]); // 랜덤 4개
    const questions = faqs.map(faq => faq.question);
    res.json(questions);
  } catch (err) {
    console.error('❌ FAQ 조회 오류:', err.message);
    res.status(500).json({ error: 'FAQ를 불러오는 중 오류 발생' });
  }
});

module.exports = router;
