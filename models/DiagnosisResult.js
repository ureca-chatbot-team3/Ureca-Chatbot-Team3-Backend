const mongoose = require('mongoose');

const diagnosisResultSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // 비로그인 사용자도 가능
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiagnosisQuestion',
      required: true
    },
    answer: {
      type: mongoose.Schema.Types.Mixed, // String, Array, Number 등 다양한 타입
      required: true
    }
  }],
  analysisResult: {
    dataUsage: Number,      // 예상 데이터 사용량 (GB)
    budget: Number,         // 예산
    age: Number,            // 나이
    preferences: [String],  // 선호 기능들
    usagePatterns: [String] // 사용 패턴들
  },
  recommendedPlans: [{
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    reasons: [String] // 추천 이유들
  }],
  totalScore: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// 인덱스 설정 (unique 제약이 있는 필드는 인덱스 중복 방지)
// diagnosisResultSchema.index({ sessionId: 1 }); // sessionId는 unique: true로 이미 인덱스 생성됨
diagnosisResultSchema.index({ userId: 1 });
diagnosisResultSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DiagnosisResult', diagnosisResultSchema);