const express = require('express');
const { body } = require('express-validator');
const {
  getUserProfile,
  updateUser
} = require('../controllers/userController');
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
    .isLength({ min: 6 })
    .withMessage('비밀번호는 최소 6자 이상이어야 합니다.')
];

// 라우트 정의
router.get('/:nickname', getUserProfile);
router.put('/update', authenticateToken, validateUpdate, updateUser);

module.exports = router;