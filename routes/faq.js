const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
  const filePath = path.join(__dirname, '../data/faq.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('FAQ 파일 읽기 오류:', err);
      return res.status(500).json({ error: 'FAQ 데이터를 불러올 수 없습니다.' });
    }
    try {
      const faq = JSON.parse(data);
      res.json({ faq }); // ✅ 여기를 객체로 감싸야 프론트에서 res.data.faq로 읽을 수 있음
    } catch (parseErr) {
      console.error('FAQ JSON 파싱 오류:', parseErr);
      res.status(500).json({ error: 'FAQ JSON 파싱 오류' });
    }
  });
});

module.exports = router;
