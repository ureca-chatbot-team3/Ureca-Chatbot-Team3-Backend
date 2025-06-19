// services/diagnosisService.js
const DiagnosisQuestion = require('../models/DiagnosisQuestion');
const DiagnosisResult = require('../models/DiagnosisResult');
const Plan = require('../models/Plan');
const { v4: uuidv4 } = require('uuid');

class DiagnosisService {
  
  // 답변 분석을 별도 서비스로 분리
  static analyzeAnswers(answers, questions, userAge = null) {
    const analysis = {
      dataUsage: 0,
      budget: 0,
      age: null,
      preferences: [],
      usagePatterns: []
    };

    // 사용자 나이 우선 사용
    if (userAge) {
      analysis.age = userAge;
    }

    // 답변 검증 및 분석
    answers.forEach(answer => {
      const question = questions.find(q => q._id.toString() === answer.questionId);
      if (!question) return;

      this.processAnswer(answer.answer, question.category, analysis);
    });

    // 중복 제거
    analysis.preferences = [...new Set(analysis.preferences)];
    analysis.usagePatterns = [...new Set(analysis.usagePatterns)];

    return analysis;
  }

  static processAnswer(answerValue, category, analysis) {
    if (typeof answerValue === 'string') {
      this.processStringAnswer(answerValue, analysis);
    } else if (Array.isArray(answerValue)) {
      answerValue.forEach(item => this.processStringAnswer(item, analysis));
    } else if (typeof answerValue === 'number') {
      this.processNumberAnswer(answerValue, analysis);
    }
  }

  static processStringAnswer(answerValue, analysis) {
    // 데이터 사용량 분석
    if (answerValue.includes('5GB 미만')) analysis.dataUsage = 3;
    else if (answerValue.includes('5GB - 20GB')) analysis.dataUsage = 12;
    else if (answerValue.includes('20GB - 50GB')) analysis.dataUsage = 35;
    else if (answerValue.includes('50GB - 100GB')) analysis.dataUsage = 75;
    else if (answerValue.includes('100GB 이상') || answerValue.includes('무제한')) analysis.dataUsage = 150;
    
    // 예산 분석
    if (answerValue.includes('3만원 이하')) analysis.budget = 30000;
    else if (answerValue.includes('3-5만원')) analysis.budget = 40000;
    else if (answerValue.includes('5-7만원')) analysis.budget = 60000;
    else if (answerValue.includes('7-10만원')) analysis.budget = 85000;
    else if (answerValue.includes('10만원 이상')) analysis.budget = 120000;
    
    // 나이대 분석
    if (answerValue.includes('10대')) analysis.age = 15;
    else if (answerValue.includes('20대')) analysis.age = 25;
    else if (answerValue.includes('30대')) analysis.age = 35;
    else if (answerValue.includes('40대')) analysis.age = 45;
    else if (answerValue.includes('50대')) analysis.age = 55;
    else if (answerValue.includes('60대 이상')) analysis.age = 65;
    
    // 사용 패턴 분석
    if (answerValue.includes('영상') || answerValue.includes('스트리밍')) {
      analysis.usagePatterns.push('영상스트리밍');
      analysis.preferences.push('무제한');
    }
    if (answerValue.includes('게임')) {
      analysis.usagePatterns.push('게임');
      analysis.preferences.push('고속연결');
    }
    if (answerValue.includes('음악')) {
      analysis.usagePatterns.push('음악감상');
    }
    if (answerValue.includes('업무')) {
      analysis.usagePatterns.push('업무용');
    }
    if (answerValue.includes('SNS')) {
      analysis.usagePatterns.push('SNS');
    }
  }

  static processNumberAnswer(answerValue, analysis) {
    if (answerValue < 50000) analysis.budget = answerValue;
    else if (answerValue < 200) analysis.dataUsage = answerValue;
    else if (answerValue < 100) analysis.age = answerValue;
  }

  // 추천 로직을 별도 서비스로 분리
  static async recommendPlans(analysis) {
    try {
      // 쿼리 최적화
      const query = this.buildOptimizedQuery(analysis);
      
      // lean()을 사용하여 성능 향상
      const plans = await Plan.find(query)
        .select('name price sale_price price_value sale_price_value infos benefits category badge min_age max_age brands imagePath iconPath icon')
        .lean();

      // 병렬 처리로 점수 계산
      const scoringPromises = plans.map(plan => 
        this.calculatePlanScore(plan, analysis).catch(error => {
          console.error(`Plan ${plan._id} scoring failed:`, error);
          return null;
        })
      );

      const scoredPlans = await Promise.all(scoringPromises);
      
      // null 값 필터링 후 정렬
      return scoredPlans
        .filter(plan => plan !== null)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);
        
    } catch (error) {
      throw new Error(`추천 처리 실패: ${error.message}`);
    }
  }

  static buildOptimizedQuery(analysis) {
    const query = { isActive: true };
    
    // 나이 조건 최적화
    if (analysis.age) {
      const ageConditions = [];
      
      // min_age 조건
      ageConditions.push({
        $or: [
          { min_age: { $exists: false } },
          { min_age: null },
          { min_age: { $lte: analysis.age } }
        ]
      });
      
      // max_age 조건
      ageConditions.push({
        $or: [
          { max_age: { $exists: false } },
          { max_age: null },
          { max_age: { $gte: analysis.age } }
        ]
      });
      
      query.$and = ageConditions;
    }

    // 예산 조건 (여유분 20% 추가)
    if (analysis.budget && analysis.budget > 0) {
      query.price_value = { $lte: Math.floor(analysis.budget * 1.2) };
    }

    return query;
  }

  static async calculatePlanScore(plan, analysis) {
    let score = 0;
    const reasons = [];
    
    try {
      // 1. 데이터 사용량 점수 (40점)
      const dataScore = this.calculateDataScore(plan, analysis, reasons);
      score += dataScore * 0.4;
      
      // 2. 예산 점수 (30점)
      const budgetScore = this.calculateBudgetScore(plan, analysis, reasons);
      score += budgetScore * 0.3;
      
      // 3. 사용 패턴 점수 (20점)
      const usageScore = this.calculateUsageScore(plan, analysis, reasons);
      score += usageScore * 0.2;
      
      // 4. 보너스 점수 (10점)
      const bonusScore = this.calculateBonusScore(plan, reasons);
      score += bonusScore * 0.1;

      return {
        planId: plan._id,
        plan: plan,
        matchScore: Math.min(Math.round(score), 100),
        reasons: reasons.slice(0, 3)
      };
    } catch (error) {
      console.error(`점수 계산 실패 - Plan: ${plan.name}`, error);
      return null;
    }
  }

  static calculateDataScore(plan, analysis, reasons) {
    const planData = plan.infos.join(' ').toLowerCase();
    
    if (planData.includes('무제한')) {
      if (analysis.dataUsage > 50) {
        reasons.push('무제한 데이터로 대용량 사용에 최적화');
        return 100;
      } else {
        reasons.push('무제한 데이터 제공');
        return 75;
      }
    } else {
      const dataMatch = planData.match(/(\d+)gb/);
      if (dataMatch) {
        const planDataGB = parseInt(dataMatch[1]);
        const diff = Math.abs(planDataGB - analysis.dataUsage);
        
        if (diff <= 10) {
          reasons.push('데이터 사용량과 정확히 일치');
          return 100;
        } else if (diff <= 20) {
          reasons.push('데이터 사용량과 유사함');
          return 75;
        } else if (planDataGB >= analysis.dataUsage) {
          reasons.push('충분한 데이터 제공');
          return 60;
        }
      }
    }
    
    return 25;
  }

  static calculateBudgetScore(plan, analysis, reasons) {
    if (!analysis.budget || analysis.budget === 0) return 50;
    
    const priceDiff = analysis.budget - plan.price_value;
    
    if (priceDiff >= 0) {
      if (priceDiff <= 10000) {
        reasons.push('예산에 딱 맞는 가격');
        return 100;
      } else if (priceDiff <= 20000) {
        reasons.push('예산 내 합리적 가격');
        return 85;
      } else {
        reasons.push(`예산보다 ${priceDiff.toLocaleString()}원 저렴`);
        return 70;
      }
    } else {
      const overBudget = Math.abs(priceDiff);
      if (overBudget <= 10000) {
        reasons.push('예산 약간 초과하지만 좋은 혜택');
        return 40;
      }
      return 15;
    }
  }

  static calculateUsageScore(plan, analysis, reasons) {
    const planText = JSON.stringify(plan).toLowerCase();
    let score = 0;
    
    if (analysis.usagePatterns.includes('영상스트리밍')) {
      if (planText.includes('무제한') || planText.includes('넷플릭스') || planText.includes('youtube')) {
        score += 40;
        reasons.push('영상 스트리밍에 최적화');
      }
    }
    
    if (analysis.usagePatterns.includes('게임')) {
      if (planText.includes('5g') || planText.includes('고속')) {
        score += 35;
        reasons.push('게임에 적합한 고속 연결');
      }
    }
    
    if (analysis.usagePatterns.includes('음악감상')) {
      if (planText.includes('바이브') || planText.includes('지니') || planText.includes('음악')) {
        score += 25;
        reasons.push('음악 서비스 혜택 제공');
      }
    }
    
    return Math.min(score, 100);
  }

  static calculateBonusScore(plan, reasons) {
    let score = 0;
    
    if (plan.badge) {
      if (Array.isArray(plan.badge)) {
        if (plan.badge.includes('인기')) {
          score += 60;
          reasons.push('인기 요금제');
        }
        if (plan.badge.includes('최신')) {
          score += 40;
          reasons.push('최신 요금제');
        }
      } else if (typeof plan.badge === 'string') {
        if (plan.badge === '인기') {
          score += 60;
          reasons.push('인기 요금제');
        }
        if (plan.badge === '최신') {
          score += 40;
          reasons.push('최신 요금제');
        }
      }
    }
    
    return Math.min(score, 100);
  }

  // 진단 결과 저장
  static async saveDiagnosisResult(sessionId, userId, answers, analysis, recommendations) {
    try {
      const diagnosisResult = new DiagnosisResult({
        sessionId,
        userId: userId || null,
        answers: answers.map(answer => ({
          questionId: answer.questionId,
          answer: answer.answer
        })),
        analysisResult: analysis,
        recommendedPlans: recommendations.map(rec => ({
          planId: rec.planId,
          matchScore: rec.matchScore,
          reasons: rec.reasons
        })),
        totalScore: recommendations.length > 0 
          ? Math.round(recommendations.reduce((sum, rec) => sum + rec.matchScore, 0) / recommendations.length)
          : 0
      });
      
      return await diagnosisResult.save();
    } catch (error) {
      throw new Error(`진단 결과 저장 실패: ${error.message}`);
    }
  }
}

module.exports = DiagnosisService;