// 📦 기본 모듈
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const conversationRoutes = require('./routes/conversationRoutes');
require('dotenv').config();

// 🔐 커스텀 미들웨어
const { handleValidationErrors } = require('./middleware/validation');

// ✅ 앱 및 서버 생성
const app = express();
const server = http.createServer(app);

// ✅ Socket.IO 인스턴스 생성
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ✅ Socket.IO 핸들러 연결
const { setupSocketConnection } = require('./handlers/socketHandlers');
setupSocketConnection(io);

// ✅ 포트 설정
const PORT = process.env.PORT || 5000;

// ✅ 정적 파일 제공
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ 보안 미들웨어
app.use(helmet());

// ✅ 요청 제한 설정
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  },
  standardHeaders: true,
  legacyHeaders: false,
}));

// ✅ 공통 미들웨어
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(handleValidationErrors);

// ✅ DB 연결
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// ✅ REST API 라우트
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/diagnosis', require('./routes/diagnosis'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/faq', require('./routes/faq'));
app.use('/api/conversations', conversationRoutes);
// ❌ 기존 REST 기반 챗봇 라우트 제거됨 → Socket 사용
// app.use('/api/chat', require('./routes/chat'));

// ✅ 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '서버가 정상적으로 작동 중입니다.',
    timestamp: new Date().toISOString(),
  });
});

// ✅ 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다.',
    path: req.originalUrl,
  });
});

// ✅ 글로벌 에러 핸들링
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `이미 사용 중인 ${field}입니다.` });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
    return res.status(400).json({ success: false, message: '유효성 검사 실패', errors });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: '토큰이 만료되었습니다.' });
  }

  res.status(500).json({
    success: false,
    message: '서버 내부 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

// ✅ 서버 실행
server.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`🌐 환경: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 프론트엔드 URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

// ✅ 소켓 및 앱 내보내기 (테스트 등 용도)
module.exports = { app, io };
