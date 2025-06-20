const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 8
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '유효한 이메일을 입력해주세요']
  },
  password: {
    type: String,
    required: function() {
      return !this.kakaoId; // 카카오 로그인이 아닌 경우에만 필수
    },
    minlength: 10
  },
  kakaoId: {
    type: String,
    unique: true,
    sparse: true
  },
  birthYear: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear(),
    validate: {
      validator: function(value) {
        return value >= 1900 && value <= new Date().getFullYear();
      },
      message: '올바른 태어난 년도를 입력해주세요 (1900-현재년도)'
    }
  }
}, {
  timestamps: true
});

// 비밀번호 해싱 미들웨어
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 비밀번호 확인 메서드
userSchema.methods.checkPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 나이 계산 메서드
userSchema.methods.getAge = function() {
  const currentYear = new Date().getFullYear();
  return currentYear - this.birthYear;
};

// 나이대 계산 메서드 (10대, 20대 등)
userSchema.methods.getAgeGroup = function() {
  const age = this.getAge();
  if (age < 20) return '10대';
  if (age < 30) return '20대';
  if (age < 40) return '30대';
  if (age < 50) return '40대';
  if (age < 60) return '50대';
  return '60대+';
};

module.exports = mongoose.model('User', userSchema);