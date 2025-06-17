const express = require('express');
const { body, param } = require('express-validator');
const {
  addBookmark,
  removeBookmark
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
// 보관함 조회는 users 라우트에서 처리 (/api/users/:nickname/bookmarks)
router.post('/', authenticateToken, validateBookmark, addBookmark);
router.delete('/:planId', authenticateToken, validatePlanId, removeBookmark);

module.exports = router;