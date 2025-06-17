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
    enum: ['single', 'multiple', 'range']
  },
  options: [{
    type: String
  }],
  weight: {
    type: Number,
    default: 1,
    min: 0,
    max: 10
  },
  category: {
    type: String,
    required: true,
    enum: ['data', 'call', 'price', 'general']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DiagnosisQuestion', diagnosisQuestionSchema);