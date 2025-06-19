const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { fetchPlansForChatbotSummary } = require('../utils/chatbotPlanHelper');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/chat
router.post('/', async (req, res) => {
  const { message } = req.body;

  // 1. FAQ에서 먼저 확인
  try {
    const faqPath = path.join(__dirname, '../data/faq.json');
    const faqData = fs.readFileSync(faqPath, 'utf-8');
    const faqList = JSON.parse(faqData);

    const matched = faqList.find(
      (item) => item.question.trim().toLowerCase() === message.trim().toLowerCase()
    );

    if (matched) {
      return res.json({ reply: matched.answer });
    }
  } catch (faqErr) {
    console.error('❌ FAQ 처리 중 오류:', faqErr);
    // FAQ 에러는 무시하고 계속 진행 (OpenAI로 fallback)
  }

  // 2. FAQ에 없으면 OpenAI로 요청
  try {
    const summaries = await fetchPlansForChatbotSummary(50);
    const summaryText = summaries.join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 요플랜 통신요금제 안내 전문 챗봇 요플밍 입니다.

아래 제공된 요금제를 참고해, 사용자의 조건(가격, 데이터 사용량, 나이, 통화 등)을 기준으로 최적의 요금제를 추천하세요.

요금제에 대한 설명, 비교, 추천, 조건 분석 모두 포함하여 자연스럽고 친절하게 응답하세요.

명백히 관련 없는 질문(날씨, 게임, 정치 등)일 경우에만 다음처럼 대답하세요:
"죄송합니다. 요금제 관련 질문만 도와드릴 수 있습니다."

아래는 요금제 목록입니다:
${summaryText}
`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI 응답 오류:', error.message);
    res.status(500).json({ reply: '죄송해요, 지금은 응답할 수 없어요 😢' });
  }
});

module.exports = router;
