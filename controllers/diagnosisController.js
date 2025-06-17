const DiagnosisQuestion = require('../models/DiagnosisQuestion');
const DiagnosisResult = require('../models/DiagnosisResult');
const Plan = require('../models/Plan');
const { v4: uuidv4 } = require('uuid');

// 진단 질문 조회
const getQuestions = async (req, res) => {
  try {
    const questions = await DiagnosisQuestion.find({ isActive: true })
      .sort({ order: 1 })
      .select('-isActive -createdAt -updatedAt');

    res.json({
      success: true,
      data: { questions }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '진단 질문 조회 중 오류가 발생했습니다.'
    });
  }
};

// 진단 결과 처리 및 요금제 추천
const processResult = async (req, res) => {
  try {
    const { answers, sessionId } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: '답변 데이터가 올바르지 않습니다.'
      });
    }

    // 답변 기반 점수 계산
    const score = await calculateScore(answers);
    
    // 추천 요금제 선정
    const recommendedPlans = await getRecommendedPlans(score);

    // 진단 결과 저장
    const result = new DiagnosisResult({
      userId: req.user ? req.user._id : null,
      sessionId: sessionId || uuidv4(),
      answers,
      recommendedPlans: recommendedPlans.map(plan => plan._id),
      score
    });

    await result.save();

    res.json({
      success: true,
      data: {
        recommendedPlans,
        score,
        sessionId: result.sessionId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '진단 결과 처리 중 오류가 발생했습니다.'
    });
  }
};

// 점수 계산 함수
const calculateScore = async (answers) => {
  const score = { data: 0, call: 0, price: 0 };
  
  for (const answer of answers) {
    const question = await DiagnosisQuestion.findById(answer.questionId);
    if (!question) continue;

    const weight = question.weight || 1;
    const answerValue = parseAnswerValue(answer.answer, question.type);
    
    // 카테고리별 점수 누적
    score[question.category] += answerValue * weight;
  }
  
  return score;
};

// 답변 값 파싱
const parseAnswerValue = (answer, type) => {
  switch (type) {
    case 'range':
      return parseInt(answer) || 0;
    case 'single':
    case 'multiple':
      // 답변에 따른 점수 매핑 (예시)
      const scoreMap = {
        '매우 적음': 1,
        '적음': 2,
        '보통': 3,
        '많음': 4,
        '매우 많음': 5,
        '가격 중요': 5,
        '품질 중요': 3,
        '브랜드 중요': 2
      };
      return scoreMap[answer] || 3;
    default:
      return 3;
  }
};

// 추천 요금제 선정
const getRecommendedPlans = async (score) => {
  try {
    // 점수 기반 필터링 조건 생성
    const query = { isActive: true };
    
    // 데이터 사용량에 따른 필터링
    if (score.data >= 15) {
      query.data = { $regex: '무제한', $options: 'i' };
    } else if (score.data >= 10) {
      query.$or = [
        { data: { $regex: '무제한', $options: 'i' } },
        { data: { $regex: '50GB|100GB', $options: 'i' } }
      ];
    }
    
    // 가격 민감도에 따른 정렬
    const sortOrder = score.price >= 15 ? { features: -1, price: 1 } : { price: 1 };
    
    const plans = await Plan.find(query)
      .sort(sortOrder)
      .limit(5);

    return plans;
  } catch (error) {
    console.error('추천 요금제 선정 오류:', error);
    // 기본 추천: 가격순 정렬된 상위 5개
    return await Plan.find({ isActive: true })
      .sort({ price: 1 })
      .limit(5);
  }
};

module.exports = {
  getQuestions,
  processResult
};