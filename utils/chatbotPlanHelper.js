const Plan = require('../models/Plan');

async function fetchPlansForChatbotSummary(limit = 10) {
  const plans = await Plan.find({ isActive: true })
    .sort({ price_value: 1 })
    .limit(limit)
    .select('name price_value infos price badge min_age max_age benefits category')
    .lean();

  return plans.map(plan => {
    const dataInfo = plan.infos.find(info => info.includes('데이터')) || '정보 없음';
    const tetheringShareInfo = plan.infos.find(info =>
      info.includes('테더링') || info.includes('쉐어링')
    ) || '정보 없음';

    const benefitText = Object.entries(plan.benefits || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    return `요금제명: ${plan.name}, 카테고리: ${plan.category}, 가격: ${plan.price_value}원,
데이터: ${dataInfo}, 테더링+쉐어링: ${tetheringShareInfo},
혜택: ${benefitText}, 연령대: ${plan.min_age || '전체'}~${plan.max_age || '전체'}, 태그: ${plan.badge || '없음'}`;
  });
}




module.exports = { fetchPlansForChatbotSummary };
