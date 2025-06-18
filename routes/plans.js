const express = require('express');
const { query, body } = require('express-validator');
const {
  getPlans,
  getPlanDetail,
  getRecommendedPlans,
  getPlanStats,
  comparePlans
} = require('../controllers/planController');
const router = express.Router();

// 입력 검증 미들웨어
const validatePlanQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지는 1 이상의 정수여야 합니다.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('한 페이지당 항목 수는 1-100 사이여야 합니다.'),
  query('category')
    .optional()
    .isIn(['5G', 'LTE', '기타', 'all'])
    .withMessage('카테고리는 5G, LTE, 기타, all 중 하나여야 합니다.'),
  query('minPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('최소 가격은 0 이상이어야 합니다.'),
  query('maxPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('최대 가격은 0 이상이어야 합니다.'),
  query('sortBy')
    .optional()
    .isIn(['price_value', 'name', 'createdAt'])
    .withMessage('정렬 기준이 유효하지 않습니다.'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('정렬 순서는 asc 또는 desc여야 합니다.')
];

const validateRecommendQuery = [
  query('dataUsage')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('데이터 사용량은 0 이상의 숫자여야 합니다.'),
  query('budget')
    .optional()
    .isInt({ min: 0 })
    .withMessage('예산은 0 이상의 정수여야 합니다.'),
  query('age')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('나이는 1-120 사이의 정수여야 합니다.')
];

const validateCompareRequest = [
  body('planIds')
    .isArray({ min: 2, max: 5 })
    .withMessage('비교할 요금제는 2-5개 사이여야 합니다.'),
  body('planIds.*')
    .isMongoId()
    .withMessage('유효하지 않은 요금제 ID입니다.')
];

// 라우트 정의
router.get('/', validatePlanQuery, getPlans);
router.get('/stats', getPlanStats);
router.get('/recommend', validateRecommendQuery, getRecommendedPlans);
router.get('/:planId', getPlanDetail);
router.post('/compare', validateCompareRequest, comparePlans);

module.exports = router;