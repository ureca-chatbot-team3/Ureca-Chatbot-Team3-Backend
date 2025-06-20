// controllers/socketHandlers.js
const OpenAI = require('openai');
const Conversation = require('../models/Conversation');
const { getClientIP, generateSessionId } = require('../utils/helpers');
const { fetchPlansForChatbotSummary } = require('../utils/chatbotPlanHelper');
const faqList = require('../data/faq.json');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateSystemPrompt = async () => {
  const summaries = await fetchPlansForChatbotSummary(50);
  const summaryText = summaries.join('\n');

  return `
당신은 요플랜 통신요금제 안내 전문 챗봇 "요플밍" 입니다.

사용자가 인사하거나 간단한 말을 걸어오면 친절하게 응답해주세요.
아래 제공된 요금제를 참고해, 사용자의 조건(가격, 데이터 사용량, 나이, 통화 등)을 기준으로 최적의 요금제를 추천하세요.
사용자의 연령 조건에 주의해서 요금제를 추천하세요.
예: 사용자가 '50살인데 추천해줘'라고 하면, max_age >= 50 인 요금제를 추천해야 합니다.

요금제에 대한 설명, 비교, 추천, 조건 분석 모두 포함하여 자연스럽고 친절하게 응답하세요.

정치, 날씨, 게임 등 **요금제와 무관한 주제**일 경우 다음처럼 대답하세요:
"죄송합니다. 요금제 관련 질문만 도와드릴 수 있습니다."

아래는 요금제 목록입니다:
${summaryText}
`.trim();
};

function findMatchingFAQ(userQuestion, faqList) {
  const cleaned = userQuestion.trim().toLowerCase();

  return faqList.find((faq) => {
    const base = faq.question.trim().toLowerCase();
    const variations = (faq.variations || []).map((v) => v.trim().toLowerCase());
    return cleaned === base || variations.includes(cleaned);
  });
}

const handleUserMessage = async (socket, message, sessionId, clientIP, userAgent) => {
  try {
    message = message.trim();
    console.log('💬 수신된 메시지:', message);

    // ✅ FAQ 매칭 시 응답
    const matchedFAQ = findMatchingFAQ(message, faqList);
    if (matchedFAQ) {
      let conversation = await Conversation.findOne({ sessionId });
      if (!conversation) {
        conversation = new Conversation({
          sessionId,
          messages: [],
          metadata: { ipAddress: clientIP, userAgent, createdAt: new Date() },
        });
      }

      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      const faqResponse = {
        role: 'assistant',
        content: matchedFAQ.answer,
        timestamp: new Date(),
      };

      conversation.messages.push(userMessage, faqResponse);
      await conversation.save();

      const userMessageId = conversation.messages.at(-2)?._id;
      const faqMessageId = 'faq-' + Date.now();

      socket.emit('user-message-confirmed', {
        ...userMessage,
        id: userMessageId,
      });

      // ✅ FAQ는 stream-chunk 없이 end만 사용해 간결하게 처리
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

    // 🤖 OpenAI 응답 처리
    let conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        messages: [],
        metadata: { ipAddress: clientIP, userAgent, createdAt: new Date() },
      });
    }

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

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

    // 무조건 stream-end 전송 (로딩 중 방지)
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
    const sessionId = generateSessionId(clientIP, userAgent);

    socket.on('user-message', (message) => {
      handleUserMessage(socket, message, sessionId, clientIP, userAgent);
    });

    socket.on('disconnect', () => {
      console.log('❌ 클라이언트 연결 종료:', socket.id);
    });
  });
};

module.exports = {
  handleUserMessage,
  setupSocketConnection,
};
