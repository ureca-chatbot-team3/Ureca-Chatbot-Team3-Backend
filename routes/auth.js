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
    .isLength({ min: 2, max: 8 })
    .withMessage('닉네임은 2-8자 사이여야 합니다.')
    .matches(/^[\uac00-\ud7a3a-zA-Z0-9]+$/)
    .withMessage('닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.')
    .custom((value) => {
      if (/\s/.test(value)) {
        throw new Error('닉네임에는 공백을 포함할 수 없습니다.');
      }
      return true;
    }),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('올바른 이메일 형식이 아닙니다.'),
  body('password')
    .isLength({ min: 10, max: 20 })
    .withMessage('비밀번호는 10-20자 사이여야 합니다.')
    .custom((value) => {
      const hasLetter = /[a-zA-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      
      if (!hasLetter || !hasNumber || !hasSpecialChar) {
        throw new Error('비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.');
      }
      return true;
    }),
  body('birthYear')
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`태어난 년도는 1900년부터 ${new Date().getFullYear()}년 사이여야 합니다.`)
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