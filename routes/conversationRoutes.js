const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');

// ✅ userId 또는 sessionId 기반 대화 조회 (full=true 쿼리로 전체 세션 반환 가능)
router.get('/', async (req, res) => {
  const { userId, sessionId, full } = req.query;

  try {
    let conversations;

    if (userId) {
      conversations = await Conversation.find({ userId }).sort({ updatedAt: -1 });
    } else if (sessionId) {
      conversations = await Conversation.find({ sessionId }).sort({ updatedAt: -1 });
    } else {
      return res.status(400).json({ message: 'userId 또는 sessionId가 필요합니다.' });
    }

    if (!conversations || conversations.length === 0) {
      return res.status(204).send(); // 대화 없음
    }

    // ✅ 마이페이지 전용: 전체 세션 배열 반환
    if (full === 'true') {
      return res.status(200).json(conversations);
    }

    // ✅ 기존 챗봇 호환: 가장 최근 대화 messages만 반환
    return res.status(200).json({ messages: conversations[0].messages });
  } catch (err) {
    console.error('❌ 대화 불러오기 실패:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// ✅ 개별 sessionId 조회 (백워드 호환)
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const convo = await Conversation.findOne({ sessionId }).sort({ updatedAt: -1 });

    if (!convo) {
      return res.status(404).json({ message: '대화 기록 없음', messages: [] });
    }

    res.json({ messages: convo.messages });
  } catch (err) {
    console.error('❌ 대화 불러오기 실패:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// ✅ userId 또는 sessionId 기반 전체 대화 삭제
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
