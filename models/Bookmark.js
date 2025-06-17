const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  }
}, {
  timestamps: true
});

// 복합 인덱스로 중복 방지
bookmarkSchema.index({ userId: 1, planId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);