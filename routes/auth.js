const express = require('express');
const { body } = require('express-validator');
const {
  login,
  register,
  kakaoLogin,
  kakaoCallback,
  getProfile,
  logout,
  deleteAccount
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// 입력 검증 미들웨어
const validateRegister = [
  body('nickname')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('닉네임은 2-20자 사이여야 합니다.'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('올바른 이메일 형식이 아닙니다.'),
  body('password')
    .isLength({ min: 10 })
    .withMessage('비밀번호는 최소 10자 이상이어야 합니다.')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('올바른 이메일 형식이 아닙니다.'),
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요.')
];

// 라우트 정의
router.post('/login', validateLogin, login);
router.post('/register', validateRegister, register);
router.get('/kakao', kakaoLogin);
router.get('/kakao/callback', kakaoCallback);
router.get('/profile', authenticateToken, getProfile);
router.post('/logout', authenticateToken, logout);
router.delete('/delete-account', authenticateToken, deleteAccount);

module.exports = router;