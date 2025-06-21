const faqList = require('../data/faq.json');

// 사용자의 입력 메시지를 받아 가장 잘 맞는 FAQ를 반환
function matchFaq(userMessage) {
  const normalized = userMessage.trim().toLowerCase();

  for (const faq of faqList) {
    // 직접 질문 또는 variations 포함 여부 확인
    if (
      normalized.includes(faq.question.toLowerCase()) ||
      (faq.variations && faq.variations.some(v => normalized.includes(v.toLowerCase())))
    ) {
      return faq;
    }

    // 키워드 포함 여부 확인
    if (
      faq.keywords &&
      faq.keywords.some(keyword => normalized.includes(keyword.toLowerCase()))
    ) {
      return faq;
    }
  }

  return null; // 일치하는 FAQ가 없으면 null
}

module.exports = { matchFaq };
