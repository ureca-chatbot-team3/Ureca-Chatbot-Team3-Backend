const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');

// 세션 ID로 대화 내용 조회
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const convo = await Conversation.findOne({ sessionId });

    if (!convo) {
      return res.status(404).json({ message: '대화 기록 없음', messages: [] });
    }

    res.json({ messages: convo.messages });
  } catch (err) {
    console.error('❌ 대화 불러오기 실패:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 세션 ID로 대화 내용 삭제
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await Conversation.deleteOne({ sessionId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: '삭제할 대화 기록이 없습니다.' });
    }

    res.json({ message: '대화 기록이 삭제되었습니다.' });
  } catch (err) {
    console.error('❌ 대화 삭제 실패:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
