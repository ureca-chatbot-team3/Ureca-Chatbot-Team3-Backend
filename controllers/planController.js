const Plan = require('../models/Plan');
const Validators = require('../utils/validators');

// 요금제 리스트 조회 (개선된 버전)
const getPlans = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      category, 
      minPrice, 
      maxPrice,
      badge,
      sortBy = 'price_value',
      sortOrder = 'asc'
    } = req.query;
    
    // 입력값 검증
    const { pageNum, limitNum } = Validators.validatePagination(page, limit);
    const { min, max } = Validators.validatePriceRange(minPrice, maxPrice);
    const validCategory = Validators.validateCategory(category);
    const { sortBy: validSortBy, sortOrder: validSortOrder } = Validators.validateSortOptions(sortBy, sortOrder);
    const sanitizedSearch = Validators.sanitizeSearchQuery(search);
    
    const skip = (pageNum - 1) * limitNum;

    // 쿼리 구성
    const query = { isActive: true };
    
    // 검색 조건 (안전한 검색)
    if (sanitizedSearch) {
      query.$or = [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { 'infos': { $elemMatch: { $regex: sanitizedSearch, $options: 'i' } } },
        { 'benefits.기본혜택': { $regex: sanitizedSearch, $options: 'i' } }
      ];
    }
    
    // 카테고리 필터
    if (validCategory && validCategory !== 'all') {
      query.category = validCategory;
    }

    // 가격 범위 필터
    if (min !== null || max !== null) {
      query.price_value = {};
      if (min !== null) query.price_value.$gte = min;
      if (max !== null) query.price_value.$lte = max;
    }

    // 뱃지 필터 (개선된 버전)
    if (badge && badge !== 'all') {
      query.$or = [
        { badge: badge },
        { badge: { $elemMatch: { $eq: badge } } }
      ];
    }

    // 정렬 옵션
    const sortOptions = {};
    sortOptions[validSortBy] = validSortOrder === 'desc' ? -1 : 1;

    // 이미지 정보를 포함한 필드 선택
    const selectFields = '-__v';

    // 성능 최적화된 쿼리 실행
    const [plans, totalCount] = await Promise.all([
      Plan.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .select(selectFields)
        .lean(), // 성능 향상
      Plan.countDocuments(query)
    ]);

    // 이미지 경로 처리 (프론트엔드에서 사용할 수 있도록 절대 경로로 변환)
    const processedPlans = plans.map(plan => ({
      ...plan,
      imagePath: plan.imagePath ? plan.imagePath : null,
      iconPath: plan.iconPath ? plan.iconPath : null
    }));

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: {
        plans: processedPlans,
        pagination: {
          totalPages,
          currentPage: pageNum,
          totalCount,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('요금제 조회 오류:', error);
    
    if (error.message.includes('검증') || error.message.includes('유효하지')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '요금제 조회 중 오류가 발생했습니다.'
    });
  }
};

// 요금제 상세 조회 (개선된 버전)
const getPlanDetail = async (req, res) => {
  try {
    const { planId } = req.params;
    
    // ID 검증
    if (!Validators.isValidObjectId(planId)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 요금제 ID입니다.'
      });
    }
    
    const plan = await Plan.findOne({ _id: planId, isActive: true })
      .select('-__v')
      .lean();
      
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '요금제를 찾을 수 없습니다.'
      });
    }

    // 이미지 경로 처리
    const processedPlan = {
      ...plan,
      imagePath: plan.imagePath ? plan.imagePath : null,
      iconPath: plan.iconPath ? plan.iconPath : null
    };

    // 유사한 요금제 추천 (성능 최적화)
    const priceRange = plan.price_value * 0.3;
    const similarPlansQuery = {
      _id: { $ne: plan._id },
      category: plan.category,
      price_value: {
        $gte: Math.max(0, plan.price_value - priceRange),
        $lte: plan.price_value + priceRange
      },
      isActive: true
    };

    const similarPlans = await Plan.find(similarPlansQuery)
      .select('name price price_value category badge imagePath iconPath icon')
      .limit(3)
      .lean();

    // 유사 요금제들도 이미지 경로 처리
    const processedSimilarPlans = similarPlans.map(similarPlan => ({
      ...similarPlan,
      imagePath: similarPlan.imagePath ? similarPlan.imagePath : null,
      iconPath: similarPlan.iconPath ? similarPlan.iconPath : null
    }));

    res.json({
      success: true,
      data: {
        plan: processedPlan,
        similarPlans: processedSimilarPlans
      }
    });
  } catch (error) {
    console.error('요금제 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '요금제 상세 조회 중 오류가 발생했습니다.'
    });
  }
};

// 요금제 추천 (기존 로직 유지하되 검증 강화)
const getRecommendedPlans = async (req, res) => {
  try {
    const { 
      dataUsage, 
      budget,    
      age,       
      preferences = [] 
    } = req.query;

    // 입력값 검증
    const validAge = Validators.validateAge(age);
    
    let validDataUsage = null;
    if (dataUsage) {
      validDataUsage = parseFloat(dataUsage);
      if (isNaN(validDataUsage) || validDataUsage < 0 || validDataUsage > 1000) {
        return res.status(400).json({
          success: false,
          message: '데이터 사용량은 0GB에서 1000GB 사이여야 합니다.'
        });
      }
    }
    
    let validBudget = null;
    if (budget) {
      validBudget = parseInt(budget);
      if (isNaN(validBudget) || validBudget < 0 || validBudget > 1000000) {
        return res.status(400).json({
          success: false,
          message: '예산은 0원에서 100만원 사이여야 합니다.'
        });
      }
    }

    const query = { isActive: true };
    
    // 나이 조건 필터링 (최적화)
    if (validAge) {
      query.$and = [
        { $or: [{ min_age: { $exists: false } }, { min_age: null }, { min_age: { $lte: validAge } }] },
        { $or: [{ max_age: { $exists: false } }, { max_age: null }, { max_age: { $gte: validAge } }] }
      ];
    }

    // 예산 조건 (상한선 적용)
    if (validBudget) {
      query.price_value = { $lte: validBudget * 1.2 };
    }

    // 이미지 정보도 포함하여 조회
    const plans = await Plan.find(query)
      .select('name price price_value category infos benefits badge imagePath iconPath icon')
      .sort({ price_value: 1 })
      .lean();

    // 추천 점수 계산 (간소화된 버전)
    const scoredPlans = plans.map(plan => {
      let score = 0;
      
      // 데이터 사용량 점수
      if (validDataUsage) {
        const planData = plan.infos.join(' ').toLowerCase();
        if (planData.includes('무제한')) {
          score += validDataUsage > 50 ? 30 : 20;
        } else {
          const dataMatch = planData.match(/(\d+)gb/);
          if (dataMatch) {
            const planDataGB = parseInt(dataMatch[1]);
            const diff = Math.abs(planDataGB - validDataUsage);
            if (diff <= 10) score += 30;
            else if (diff <= 20) score += 20;
            else if (planDataGB >= validDataUsage) score += 15;
          }
        }
      }

      // 예산 점수
      if (validBudget) {
        const priceDiff = validBudget - plan.price_value;
        if (priceDiff >= 0) {
          if (priceDiff <= 10000) score += 25;
          else if (priceDiff <= 20000) score += 20;
          else score += 15;
        }
      }

      // 뱃지 보너스
      if (plan.badge) {
        if (Array.isArray(plan.badge)) {
          if (plan.badge.includes('인기')) score += 10;
          if (plan.badge.includes('최신')) score += 5;
        } else {
          if (plan.badge === '인기') score += 10;
          if (plan.badge === '최신') score += 5;
        }
      }

      // 이미지 경로 처리
      return { 
        ...plan, 
        recommendScore: score,
        imagePath: plan.imagePath ? plan.imagePath : null,
        iconPath: plan.iconPath ? plan.iconPath : null
      };
    });

    // 점수순 정렬
    const recommendedPlans = scoredPlans
      .sort((a, b) => b.recommendScore - a.recommendScore)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        recommendedPlans,
        criteria: { dataUsage: validDataUsage, budget: validBudget, age: validAge, preferences }
      }
    });
  } catch (error) {
    console.error('요금제 추천 오류:', error);
    res.status(500).json({
      success: false,
      message: '요금제 추천 중 오류가 발생했습니다.'
    });
  }
};

// 카테고리별 통계 (개선된 버전)
const getPlanStats = async (req, res) => {
  try {
    // 병렬 처리로 성능 향상
    const [categoryStats, badgeStats, priceRanges, totalPlans] = await Promise.all([
      Plan.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price_value' },
            minPrice: { $min: '$price_value' },
            maxPrice: { $max: '$price_value' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      Plan.aggregate([
        { $match: { isActive: true, badge: { $ne: null } } },
        {
          $group: {
            _id: '$badge',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      Plan.aggregate([
        { $match: { isActive: true } },
        {
          $bucket: {
            groupBy: '$price_value',
            boundaries: [0, 30000, 50000, 70000, 100000, 150000],
            default: '150000+',
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ]),
      
      Plan.countDocuments({ isActive: true })
    ]);

    res.json({
      success: true,
      data: {
        categoryStats,
        badgeStats,
        priceRanges,
        totalPlans
      }
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '통계 조회 중 오류가 발생했습니다.'
    });
  }
};

// 요금제 비교 (개선된 버전)
const comparePlans = async (req, res) => {
  try {
    const { planIds } = req.body;

    // 입력값 검증
    if (!planIds || !Array.isArray(planIds)) {
      return res.status(400).json({
        success: false,
        message: '비교할 요금제 ID 배열이 필요합니다.'
      });
    }

    if (planIds.length < 2 || planIds.length > 5) {
      return res.status(400).json({
        success: false,
        message: '비교할 요금제는 2개 이상 5개 이하여야 합니다.'
      });
    }

    // 모든 ID 검증
    const invalidIds = planIds.filter(id => !Validators.isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 요금제 ID가 포함되어 있습니다.',
        invalidIds
      });
    }

    const plans = await Plan.find({
      _id: { $in: planIds },
      isActive: true
    }).lean();

    if (plans.length !== planIds.length) {
      return res.status(404).json({
        success: false,
        message: '일부 요금제를 찾을 수 없거나 비활성화되었습니다.',
        foundCount: plans.length,
        requestedCount: planIds.length
      });
    }

    // 이미지 경로 처리
    const processedPlans = plans.map(plan => ({
      ...plan,
      imagePath: plan.imagePath ? plan.imagePath : null,
      iconPath: plan.iconPath ? plan.iconPath : null
    }));

    // 비교 분석 (에러 방지)
    const comparison = {
      plans: processedPlans,
      analysis: {
        cheapest: processedPlans.reduce((min, plan) => 
          plan.price_value < min.price_value ? plan : min),
        mostExpensive: processedPlans.reduce((max, plan) => 
          plan.price_value > max.price_value ? plan : max),
        mostData: processedPlans.reduce((max, plan) => {
          const maxData = plan.infos.join(' ').toLowerCase().includes('무제한') ? Infinity : 
            parseInt(plan.infos.join(' ').match(/(\d+)gb/)?.[1] || 0);
          const currentMax = max.infos.join(' ').toLowerCase().includes('무제한') ? Infinity :
            parseInt(max.infos.join(' ').match(/(\d+)gb/)?.[1] || 0);
          return maxData > currentMax ? plan : max;
        }),
        averagePrice: Math.round(processedPlans.reduce((sum, plan) => sum + plan.price_value, 0) / processedPlans.length),
        categories: [...new Set(processedPlans.map(plan => plan.category))],
        hasUnlimited: processedPlans.some(plan => plan.infos.join(' ').toLowerCase().includes('무제한'))
      }
    };

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('요금제 비교 오류:', error);
    res.status(500).json({
      success: false,
      message: '요금제 비교 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getPlans,
  getPlanDetail,
  getRecommendedPlans,
  getPlanStats,
  comparePlans
};