const OpenAI = require('openai');
const Conversation = require('../models/Conversation');
const { getClientIP, generateSessionId } = require('../utils/helpers');
const { fetchPlansForChatbotSummary } = require('../utils/chatbotPlanHelper');
const Faq = require('../models/Faq');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let cachedPlanSummary = null;
let lastCacheTime = 0;
const CACHE_DURATION_MS = 15 * 60 * 1000;

const generateSystemPrompt = async () => {
  const now = Date.now();
  if (cachedPlanSummary && now - lastCacheTime < CACHE_DURATION_MS) {
    console.log('✅ 캐시된 요금제 데이터 사용됨');
    return cachedPlanSummary;
  }

  console.log('⏳ 캐시 만료 또는 최초 호출 - 요금제 데이터 새로 로드');
  const summaries = await fetchPlansForChatbotSummary(50);
  const summaryText = summaries.join('\n');

  const prompt = `
당신은 요플랜 통신요금제 안내 전문 챗봇 "요플밍" 입니다.
사용자에게 친절하고 신뢰감 있게 요금제를 안내하는 역할입니다.  
항상 존댓말을 사용하며, 너무 딱딱하지 않게 자연스럽게 응답하세요.

---

응답 가이드:

1. 사용자가 **인사하거나 말을 걸면**:
→ 친근한 인사말로 응답하고, 어떤 요금제가 궁금한지 유도하세요.

2. 사용자가 **요금제 조건을 말하면**:
→ 아래 제공된 요금제 목록을 참고하여,  
   사용자의 조건(가격, 데이터, 통화량, 나이 등)에 맞는 요금제를 추천하세요.

3. 특히 **나이 조건**이 명시된 경우:
→ \`min_age <= 나이 <= max_age\` 조건을 만족하는 요금제만 추천하세요.

4. **요금제 설명, 비교, 추천, 조건 분석** 모두 가능하며,  
   각 요금제의 특성과 사용자에게 적합한 이유도 함께 설명하세요.

5. 사용자가 **요금제와 무관한 질문**을 할 경우:
→ "죄송합니다. 요금제 관련 질문만 도와드릴 수 있어요." 라고 응답하세요.

---

📦 아래는 요금제 목록입니다:
${summaryText}
`.trim();

  cachedPlanSummary = prompt;
  lastCacheTime = now;

  return prompt;
};

async function findMatchingFAQ(userQuestion) {
  const cleaned = userQuestion.trim().toLowerCase();
  const faqList = await Faq.find({});

  return faqList.find((faq) => {
    const baseQuestion = faq.question.trim().toLowerCase();
    const variations = (faq.variations || []).map((v) => v.trim().toLowerCase());
    const keywords = (faq.keywords || []).map((k) => k.trim().toLowerCase());

    return (
      cleaned === baseQuestion ||
      variations.includes(cleaned) ||
      keywords.some((keyword) => cleaned.includes(keyword))
    );
  });
}

const handleUserMessage = async (socket, message, sessionId, clientIP, userAgent) => {
  try {
    message = message.trim();
    console.log('💬 수신된 메시지:', message);

    const matchedFAQ = await findMatchingFAQ(message);
    const safeUserId = socket.userId && socket.userId !== 'undefined' && socket.userId !== 'null' ? socket.userId : null;
    const query = safeUserId ? { userId: safeUserId } : { sessionId };
    let conversation = await Conversation.findOne(query);

    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        userId: safeUserId,
        messages: [],
        metadata: { ipAddress: clientIP, userAgent, createdAt: new Date() },
      });
    }

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    if (matchedFAQ) {
      const faqResponse = {
        role: 'assistant',
        content: matchedFAQ.answer,
        timestamp: new Date(),
      };

      conversation.messages.push(userMessage, faqResponse);
      await conversation.save();

      const faqMessageId = 'faq-' + Date.now();
      socket.emit('user-message-confirmed', {
        ...userMessage,
        id: faqMessageId + '-user',
      });

      socket.emit('stream-start', {
        messageId: faqMessageId,
        timestamp: new Date().toISOString(),
      });

      socket.emit('stream-end', {
        message: {
          id: faqMessageId,
          role: 'assistant',
          content: matchedFAQ.answer,
          timestamp: new Date(),
        },
      });

      return;
    }

    conversation.messages.push(userMessage);
    await conversation.save();

    socket.emit('user-message-confirmed', {
      ...userMessage,
      id: conversation.messages.at(-1)._id,
    });

    const systemPrompt = await generateSystemPrompt();
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const tempMessageId = 'temp-' + Date.now();
    socket.emit('stream-start', {
      messageId: tempMessageId,
      timestamp: new Date().toISOString(),
    });

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        socket.emit('stream-chunk', content);
      }
    }

    const assistantMessage = {
      role: 'assistant',
      content: fullResponse,
      timestamp: new Date(),
    };

    conversation.messages.push(assistantMessage);
    await conversation.save();

    socket.emit('stream-end', {
      message: {
        ...assistantMessage,
        id: conversation.messages.at(-1)._id,
      },
    });
  } catch (error) {
    console.error('❌ 메시지 처리 오류:', error.message);
    socket.emit('error', {
      message: '메시지 처리 중 오류가 발생했습니다.',
      details: error.message,
    });

    socket.emit('stream-end', {
      message: {
        role: 'assistant',
        content: '문제가 발생했지만 처리는 완료되었습니다.',
        timestamp: new Date(),
      },
    });
  }
};

const setupSocketConnection = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 클라이언트 연결됨:', socket.id);

    const clientIP = getClientIP(socket);
    const userAgent = socket.handshake.headers['user-agent'] || '';
    const sessionId = socket.handshake.query.sessionId || generateSessionId(clientIP, userAgent);

    const rawUserId = socket.handshake.query.userId;
    const safeUserId = rawUserId && rawUserId !== 'undefined' && rawUserId !== 'null' ? rawUserId : null;
    socket.userId = safeUserId;

    socket.on('authenticate', ({ userId }) => {
      socket.userId = userId;
      console.log('🔐 사용자 인증됨:', userId);
    });

    socket.on('user-message', (message) => {
      handleUserMessage(socket, message, sessionId, clientIP, userAgent);
    });

    let tempAssistantMessage = null;

    socket.on('stream-start', ({ role = 'assistant', content = '' }) => {
      console.log('📥 stream-start 수신됨:', content);
      tempAssistantMessage = {
        role,
        content,
        timestamp: new Date(),
      };
    });

    socket.on('stream-chunk', (chunk) => {
      if (tempAssistantMessage) {
        tempAssistantMessage.content += chunk;
      }
    });

    socket.on('stream-end', async (data = {}) => {
      const { message } = data;
      console.log('📤 stream-end 저장 시작');

      try {
        const finalMessage = message || tempAssistantMessage;
        if (!finalMessage?.content) return;

        const userId = socket.userId && socket.userId !== 'undefined' && socket.userId !== 'null' ? socket.userId : null;
        const query = userId ? { userId } : { sessionId };
        let conversation = await Conversation.findOne(query);

        if (!conversation) {
          conversation = new Conversation({
            sessionId,
            userId,
            messages: [],
            metadata: { ipAddress: clientIP, userAgent, createdAt: new Date() },
          });
        }

        conversation.messages.push({
          role: finalMessage.role,
          content: finalMessage.content,
          timestamp: new Date(),
        });

        await conversation.save();

        socket.emit('stream-end', {
          message: {
            ...finalMessage,
            id: conversation.messages.at(-1)._id,
            timestamp: new Date(),
          },
        });

        tempAssistantMessage = null;
      } catch (err) {
        console.error('❌ stream-end 저장 오류:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ 클라이언트 연결 종료:', socket.id);
    });
  });
};

module.exports = {
  setupSocketConnection,
  handleUserMessage,
};
