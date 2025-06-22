const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');

// ✅ userId 또는 sessionId 기반 대화 조회
router.get('/', async (req, res) => {
  const { userId, sessionId } = req.query;

  try {
    let conversation;

    if (userId) {
      conversation = await Conversation.findOne({ userId }).sort({ updatedAt: -1 });
    } else if (sessionId) {
      conversation = await Conversation.findOne({ sessionId }).sort({ updatedAt: -1 });
    } else {
      return res.status(400).json({ message: 'userId 또는 sessionId가 필요합니다.' });
    }

    if (!conversation) {
      return res.status(204).send(); // 대화 없음
    }

    res.status(200).json({ messages: conversation.messages });
  } catch (err) {
    console.error('❌ 대화 불러오기 실패:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// ✅ 기존 sessionId 기반 조회 (백워드 호환)
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

// ✅ userId 또는 sessionId 기반 대화 삭제
router.delete('/', async (req, res) => {
  const { userId, sessionId } = req.query;

  try {
    let result;

    if (userId) {
      result = await Conversation.deleteMany({ userId });
    } else if (sessionId) {
      result = await Conversation.deleteMany({ sessionId });
    } else {
      return res.status(400).json({ message: 'userId 또는 sessionId가 필요합니다.' });
    }

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
