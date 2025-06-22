const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 비밀번호 변경 API의 경우 비밀번호 포함해서 조회
    const shouldIncludePassword = req.url.includes('/change-password');
    
    const user = shouldIncludePassword 
      ? await User.findById(decoded.userId) // 비밀번호 포함
      : await User.findById(decoded.userId).select('-password'); // 비밀번호 제외
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '토큰 인증에 실패했습니다.'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      req.user = user;
    }
    
    next();
  } catch (error) {
    // 토큰이 유효하지 않아도 계속 진행
    next();
  }
};

module.exports = { authenticateToken, optionalAuth };