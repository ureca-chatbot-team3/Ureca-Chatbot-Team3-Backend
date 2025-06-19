const Bookmark = require('../models/Bookmark');
const Plan = require('../models/Plan');
const ResponseHandler = require('../utils/responseHandler');
const Validators = require('../utils/validators');

// 보관함 조회 (camelCase 적용 및 개선)
const getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user._id })
      .populate({
        path: 'planId',
        match: { isActive: true },
        select: 'name price sale_price price_value sale_price_value category infos benefits badge brands imagePath'
      })
      .sort({ createdAt: -1 })
      .lean(); // 성능 최적화

    // 비활성화된 요금제 필터링
    const validBookmarks = bookmarks
      .filter(bookmark => bookmark.planId !== null)
      .map(bookmark => ({
        plan: bookmark.planId,
        createdAt: bookmark.createdAt
      }));

    return ResponseHandler.sendSuccess(res, { bookmarks: validBookmarks }, '보관함을 성공적으로 조회했습니다.');
  } catch (error) {
    console.error('보관함 조회 오류:', error);
    
    if (error.message.includes('검증') || error.message.includes('유효하지')) {
      return ResponseHandler.sendValidationError(res, error.message);
    }
    
    return ResponseHandler.sendError(res, '보관함 조회 중 오류가 발생했습니다.');
  }
};

// 요금제 보관
const addBookmark = async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: '요금제 ID가 필요합니다.'
      });
    }

    // 요금제 존재 여부 확인
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '요금제를 찾을 수 없습니다.'
      });
    }

    // 이미 보관된 요금제인지 확인
    const existingBookmark = await Bookmark.findOne({
      userId: req.user._id,
      planId
    });

    if (existingBookmark) {
      return res.status(409).json({
        success: false,
        message: '이미 보관함에 추가된 요금제입니다.'
      });
    }

    const bookmark = new Bookmark({
      userId: req.user._id,
      planId
    });

    await bookmark.save();

    res.status(201).json({
      success: true,
      message: '보관함에 추가되었습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '보관함 추가 중 오류가 발생했습니다.'
    });
  }
};

// 보관함에서 삭제
const removeBookmark = async (req, res) => {
  try {
    const { planId } = req.params;

    const bookmark = await Bookmark.findOneAndDelete({
      userId: req.user._id,
      planId
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: '보관함에서 해당 요금제를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '보관함에서 삭제되었습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '보관함 삭제 중 오류가 발생했습니다.'
    });
  }
};

// 보관함 상태 확인
const checkBookmarkStatus = async (req, res) => {
  try {
    const { planId } = req.params;

    const bookmark = await Bookmark.findOne({
      userId: req.user._id,
      planId
    });

    res.json({
      success: true,
      isBookmarked: !!bookmark
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '보관함 상태 확인 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getBookmarks,
  addBookmark,
  removeBookmark,
  checkBookmarkStatus
};