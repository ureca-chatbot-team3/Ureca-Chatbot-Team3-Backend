const express = require('express');
const { body } = require('express-validator');
const {
  getQuestions,
  processResult
} = require('../controllers/diagnosisController');
const { optionalAuth } = require('../middleware/auth');
const router = express.Router();

// 입력 검증 미들웨어
const validateDiagnosisResult = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('답변은 배열 형태여야 하며 최소 1개 이상이어야 합니다.'),
  body('answers.*.questionId')
    .isMongoId()
    .withMessage('올바른 질문 ID가 아닙니다.'),
  body('answers.*.answer')
    .notEmpty()
    .withMessage('답변은 비어있을 수 없습니다.'),
  body('sessionId')
    .optional()
    .isString()
    .withMessage('세션 ID는 문자열이어야 합니다.')
];

// 라우트 정의
router.get('/questions', getQuestions);
router.post('/result', optionalAuth, validateDiagnosisResult, processResult);

module.exports = router;