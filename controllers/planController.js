const Plan = require('../models/Plan');

// 요금제 리스트 조회
const getPlans = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // 검색 및 필터링 조건 구성
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (category) {
      query.category = category;
    }

    const plans = await Plan.find(query)
      .sort({ price: 1 })
      .skip(skip)
      .limit(limitNum);

    const totalCount = await Plan.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: {
        plans,
        totalPages,
        currentPage: pageNum,
        totalCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '요금제 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 요금제 상세 조회
const getPlanDetail = async (req, res) => {
  try {
    const { planId } = req.params;
    
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: '요금제를 찾을 수 없습니다.'
      });
    }

    // 유사한 요금제 추천 (같은 카테고리, 비슷한 가격대)
    const priceRange = plan.price * 0.3; // 30% 범위
    const similarPlans = await Plan.find({
      _id: { $ne: plan._id },
      category: plan.category,
      price: {
        $gte: plan.price - priceRange,
        $lte: plan.price + priceRange
      },
      isActive: true
    }).limit(3);

    res.json({
      success: true,
      data: {
        plan,
        similarPlans
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '요금제 상세 조회 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getPlans,
  getPlanDetail
};