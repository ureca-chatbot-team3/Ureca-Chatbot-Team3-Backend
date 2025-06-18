const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req, res) => {
  const { message } = req.body;

  try {
    const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: `당신은 요플랜 통신요금제 안내 전문 챗봇 요플밍 입니다. 
사용자가 요금제에 대해 질문하면, 친절하고 정확하게 요금제를 추천해 주세요. 
요금제 조건, 가격, 데이터량, 통화량 등을 고려해 설명하고, 친근한 말투를 사용하세요.
요금제와 관련 없는 질문을 할때에는 "죄송합니다. 요금제 관련 질문만 도와드릴 수 있습니다."로 대답하세요`,
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
