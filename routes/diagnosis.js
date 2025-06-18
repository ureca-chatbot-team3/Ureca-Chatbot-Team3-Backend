const express = require('express');
const { body, param } = require('express-validator');
const {
  getDiagnosisQuestions,
  processDiagnosisResult,
  getDiagnosisResult
} = require('../controllers/diagnosisController');

const router = express.Router();

// 입력 검증 미들웨어
const validateDiagnosisResult = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('답변은 최소 1개 이상이어야 합니다.'),
  body('answers.*.questionId')
    .isMongoId()
    .withMessage('유효하지 않은 질문 ID입니다.'),
  body('answers.*.answer')
    .notEmpty()
    .withMessage('답변은 필수입니다.'),
  body('sessionId')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('세션 ID는 1-100자 사이여야 합니다.')
];

const validateSessionId = [
  param('sessionId')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('유효하지 않은 세션 ID입니다.')
];

// 라우트 정의
router.get('/questions', getDiagnosisQuestions);
router.post('/result', validateDiagnosisResult, processDiagnosisResult);
router.get('/result/:sessionId', validateSessionId, getDiagnosisResult);

module.exports = router;