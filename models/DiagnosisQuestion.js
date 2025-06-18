const mongoose = require('mongoose');

const diagnosisQuestionSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true,
    unique: true
  },
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['single', 'multiple', 'range', 'input']
  },
  options: [{
    type: String
  }],
  category: {
    type: String,
    required: true,
    enum: ['data', 'budget', 'usage', 'age', 'preference']
  },
  weight: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 인덱스 설정 (unique 제약이 있는 필드는 인덱스 중복 방지)
// diagnosisQuestionSchema.index({ order: 1 }); // order는 unique: true로 이미 인덱스 생성됨
diagnosisQuestionSchema.index({ category: 1 });
diagnosisQuestionSchema.index({ isActive: 1 });

module.exports = mongoose.model('DiagnosisQuestion', diagnosisQuestionSchema);