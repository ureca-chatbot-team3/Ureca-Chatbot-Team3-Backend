const axios = require('axios');

const getKakaoToken = async (code) => {
  try {
    const response = await axios.post('https://kauth.kakao.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_CLIENT_ID,
      client_secret: process.env.KAKAO_CLIENT_SECRET,
      redirect_uri: process.env.KAKAO_REDIRECT_URI,
      code
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    throw new Error('카카오 토큰 획득 실패');
  }
};

const getKakaoUserInfo = async (accessToken) => {
  try {
    const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    return {
      kakaoId: response.data.id.toString(),
      email: response.data.kakao_account.email,
      nickname: response.data.properties.nickname
    };
  } catch (error) {
    throw new Error('카카오 사용자 정보 획득 실패');
  }
};

module.exports = { getKakaoToken, getKakaoUserInfo };