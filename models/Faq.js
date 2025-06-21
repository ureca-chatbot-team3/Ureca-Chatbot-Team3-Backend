const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  variations: { type: [String], default: [] },
  keywords: { type: [String], default: [] },
  category: { type: String },
  answer: { type: String, required: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Faq', faqSchema);
