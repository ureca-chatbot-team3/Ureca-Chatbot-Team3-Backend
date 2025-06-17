const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  data: {
    type: String,
    required: true
  },
  call: {
    type: String,
    required: true
  },
  sms: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  features: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  targetAge: {
    type: String,
    enum: ['10대', '20대', '30대', '40대', '50대+', '전체']
  },
  benefits: [{
    type: String
  }],
  category: {
    type: String,
    required: true,
    enum: ['5G', 'LTE']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 인덱스 설정
planSchema.index({ name: 'text', description: 'text' });
planSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model('Plan', planSchema);