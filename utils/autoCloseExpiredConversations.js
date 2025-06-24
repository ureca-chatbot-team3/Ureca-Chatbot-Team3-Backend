// utils/autoCloseExpiredConversations.js
const Conversation = require('../models/Conversation');

const CONVERSATION_TIMEOUT =  60 * 1000; // 15분(테스트 용으로1분)

async function expireOldConversations() {
  const expiredTime = new Date(Date.now() - CONVERSATION_TIMEOUT);

  const conversations = await Conversation.find({
    updatedAt: { $lt: expiredTime },
  });

  for (const convo of conversations) {
    const lastMsg = convo.messages.at(-1);
    const alreadyClosed = lastMsg?.type === 'notice' && lastMsg?.content?.includes('종료');

    if (alreadyClosed) continue;

    convo.messages.push({
      role: 'system',
      content: '💬 이 대화는 종료되었습니다.',
      type: 'notice',
      timestamp: new Date(),
    });

    convo.markModified('messages');
    await convo.save();
    console.log('✅ 종료 메시지 추가됨:', convo._id);
  }
}

module.exports = expireOldConversations;
