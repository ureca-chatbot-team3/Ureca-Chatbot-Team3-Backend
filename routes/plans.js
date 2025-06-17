const express = require('express');
const { query } = require('express-validator');
const {
  getPlans,
  getPlanDetail
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
    .isIn(['5G', 'LTE'])
    .withMessage('카테고리는 5G 또는 LTE여야 합니다.')
];

// 라우트 정의
router.get('/', validatePlanQuery, getPlans);
router.get('/:planId', getPlanDetail);

module.exports = router;