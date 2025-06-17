const mongoose = require('mongoose');

const diagnosisResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // 비로그인 사용자도 가능
  },
  sessionId: {
    type: String,
    required: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiagnosisQuestion',
      required: true
    },
    answer: {
      type: String,
      required: true
    }
  }],
  recommendedPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  }],
  score: {
    data: {
      type: Number,
      default: 0
    },
    call: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DiagnosisResult', diagnosisResultSchema);