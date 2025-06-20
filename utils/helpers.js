const crypto = require('crypto');

// IP 주소 가져오기 함수
const getClientIP = (socket) => {
  // 로컬 개발 환경에서는 고정 IP 사용
  if (process.env.NODE_ENV !== 'production') {
    return 'local-dev-ip';
  }

  const forwarded = socket.handshake.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const address = socket.handshake.address || socket.conn.remoteAddress;

  if (address === '::1' || address === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }

  return address || 'unknown';
};

// IP 기반 세션 ID 생성
const generateSessionId = (ip, userAgent = '') => {
  const hash = crypto
    .createHash('sha256')
    .update(ip + userAgent)
    .digest('hex');
  return `ip_${hash.substring(0, 16)}`;
};

// 모듈 내보내기
module.exports = {
  getClientIP,
  generateSessionId,
};
