const express = require('express');
const { body, param } = require('express-validator');
const {
  getBookmarks,
  addBookmark,
  removeBookmark,
  checkBookmarkStatus
} = require('../controllers/bookmarkController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 입력 검증 미들웨어
const validateBookmark = [
  body('planId')
    .isMongoId()
    .withMessage('올바른 요금제 ID가 아닙니다.')
];

const validatePlanId = [
  param('planId')
    .isMongoId()
    .withMessage('올바른 요금제 ID가 아닙니다.')
];

// 라우트 정의
router.get('/', authenticateToken, getBookmarks);
router.post('/', authenticateToken, validateBookmark, addBookmark);
router.delete('/:planId', authenticateToken, validatePlanId, removeBookmark);
router.get('/status/:planId', authenticateToken, validatePlanId, checkBookmarkStatus);

module.exports = router;