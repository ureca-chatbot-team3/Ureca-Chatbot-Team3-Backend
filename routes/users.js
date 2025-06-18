const express = require('express');
const { body } = require('express-validator');
const {
  getUserProfile,
  updateUserInfo  // camelCase로 변경된 함수명
} = require('../controllers/userController');
const { getBookmarks } = require('../controllers/bookmarkController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 입력 검증 미들웨어
const validateUpdate = [
  body('nickname')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('닉네임은 2-20자 사이여야 합니다.'),
  body('password')
    .optional()
    .isLength({ min: 10 })
    .withMessage('비밀번호는 최소 10자 이상이어야 합니다.')
];

// 라우트 정의
router.get('/:nickname', getUserProfile);
router.get('/:nickname/bookmarks', authenticateToken, getBookmarks);
router.put('/update', authenticateToken, validateUpdate, updateUserInfo);

module.exports = router;