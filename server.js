const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { handleValidationErrors } = require('./middleware/validation');
require('dotenv').config();

// 라우트 import
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const planRoutes = require('./routes/plans');
const diagnosisRoutes = require('./routes/diagnosis');
const bookmarkRoutes = require('./routes/bookmarks');
const chatRoute = require('./routes/chat');
const faqRoutes = require('./routes/faq');

const app = express();

// 정적 파일 서빙 설정
app.use('/images', express.static(path.join(__dirname, 'public/images')));
// 또는 전체 public 폴더를 서빙하는 경우
app.use(express.static(path.join(__dirname, 'public')));
// 보안 미들웨어
app.use(helmet());

// 요청 수 제한 설정 (15분당 100회)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS 설정
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// 기타 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(handleValidationErrors);

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// 라우트 등록
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/chat', chatRoute);
app.use('/api/faq', faqRoutes);

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '서버가 정상적으로 작동 중입니다.',
    timestamp: new Date().toISOString(),
  });
});

// 404 처리
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다.',
    path: req.originalUrl,
  });
});

// 에러 처리
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `이미 사용 중인 ${field}입니다.`,
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: '데이터 유효성 검사에 실패했습니다.',
      errors,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '토큰이 만료되었습니다.',
    });
  }

  res.status(500).json({
    success: false,
    message: '서버 내부 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

// 서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`🌐 환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 프론트엔드 URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

module.exports = app;
