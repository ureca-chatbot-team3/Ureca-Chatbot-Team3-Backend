const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  badge: {
    type: mongoose.Schema.Types.Mixed, // String 또는 Array
    default: null
  },
  infos: [{
    type: String
  }],
  plan_speed: {
    type: String,
    default: null
  },
  price: {
    type: String,
    required: true
  },
  price_value: {
    type: Number,
    required: true,
    min: 0
  },
  sale_price: {
    type: String,
    required: true
  },
  sale_price_value: {
    type: Number,
    required: true,
    min: 0
  },
  brands: [{
    type: String
  }],
  benefits: {
    type: mongoose.Schema.Types.Mixed, // Object 형태
    default: {}
  },
  max_age: {
    type: Number,
    default: null
  },
  min_age: {
    type: Number,
    default: null
  },
  category: {
    type: String,
    required: true,
    enum: ['5G', 'LTE', '기타']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // 새로 추가된 이미지 관련 필드들
  imagePath: {
    type: String,
    default: null,
    trim: true
  },
  icon: {
    type: String,
    default: null,
    trim: true
  },
  iconPath: {
    type: String,
    default: null,
    trim: true
  }
}, {
  timestamps: true
});

// 인덱스 설정
planSchema.index({ name: 'text' });
planSchema.index({ category: 1, price_value: 1 });
planSchema.index({ max_age: 1, min_age: 1 });
planSchema.index({ badge: 1 });

module.exports = mongoose.model('Plan', planSchema);
