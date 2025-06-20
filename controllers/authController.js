const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { getKakaoToken, getKakaoUserInfo } = require('../utils/kakao');
const ResponseHandler = require('../utils/responseHandler');
const Validators = require('../utils/validators');

// 일반 로그인
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return ResponseHandler.sendValidationError(res, '이메일과 비밀번호를 입력해주세요.');
    }

    const user = await User.findOne({ email });
    if (!user || !await user.checkPassword(password)) {
      return ResponseHandler.sendUnauthorized(res, '이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const token = generateToken(user._id);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60, // 1시간
    });

    const userData = {
      nickname: user.nickname,
      email: user.email
    };

    return ResponseHandler.sendSuccess(res, userData, '로그인이 성공적으로 완료되었습니다.');
  } catch (error) {
    console.error('로그인 처리 오류:', error);
    return ResponseHandler.sendError(res, '로그인 처리 중 오류가 발생했습니다.');
  }
};

// 회원가입
const register = async (req, res) => {
  try {
    const { nickname, email, password, birthYear } = req.body;

    if (!nickname || !email || !password || !birthYear) {
      return ResponseHandler.sendValidationError(res, '모든 필드를 입력해주세요.');
    }

    // 입력 값 검증
    try {
      Validators.validateEmail(email);
      Validators.validateNickname(nickname);
      Validators.validatePassword(password);
      
      const currentYear = new Date().getFullYear();
      const year = parseInt(birthYear);
      if (isNaN(year) || year < 1900 || year > currentYear) {
        throw new Error('올바른 출생연도를 입력해주세요.');
      }
    } catch (validationError) {
      return ResponseHandler.sendValidationError(res, validationError.message);
    }

    // 중복 검사
    const existingUser = await User.findOne({
      $or: [{ email }, { nickname }]
    });

    if (existingUser) {
      return ResponseHandler.sendConflict(res, '이미 사용 중인 이메일 또는 닉네임입니다.');
    }

    const user = new User({ nickname, email, password, birthYear: parseInt(birthYear) });
    await user.save();

    return ResponseHandler.sendCreated(res, {
      nickname: user.nickname,
      email: user.email,
      birthYear: user.birthYear,
      age: user.getAge(),
      ageGroup: user.getAgeGroup()
    }, '회원가입이 성공적으로 완료되었습니다.');
  } catch (error) {
    console.error('회원가입 처리 오류:', error);
    return ResponseHandler.handleDatabaseError(res, error, '회원가입 처리 중 오류가 발생했습니다.');
  }
};

// 카카오 로그인 페이지 리다이렉트
const kakaoLogin = (req, res) => {
  const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.KAKAO_REDIRECT_URI}&response_type=code`;
  res.redirect(kakaoAuthURL);
};

// 카카오 콜백 처리
const kakaoCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=kakao_auth_failed`);
    }

    const accessToken = await getKakaoToken(code);
    const kakaoUser = await getKakaoUserInfo(accessToken);

    let user = await User.findOne({ kakaoId: kakaoUser.kakaoId });
    
    if (!user) {
      // 기존 이메일로 가입된 사용자 확인
      const existingUser = await User.findOne({ email: kakaoUser.email });
      if (existingUser) {
        // 기존 계정에 카카오 연동
        existingUser.kakaoId = kakaoUser.kakaoId;
        await existingUser.save();
        user = existingUser;
      } else {
        // 새 사용자 생성 (카카오는 생년월일 대체값 사용)
        const defaultBirthYear = new Date().getFullYear() - 25; // 기본 25세로 설정
        user = new User({
          kakaoId: kakaoUser.kakaoId,
          email: kakaoUser.email,
          nickname: kakaoUser.nickname,
          birthYear: defaultBirthYear
        });
        await user.save();
      }
    }

    const token = generateToken(user._id);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60, // 1시간
    });

    res.redirect(`${process.env.FRONTEND_URL}/`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=kakao_auth_failed`);
  }
};

// 프로필 조회
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        nickname: req.user.nickname,
        email: req.user.email,
        birthYear: req.user.birthYear,
        age: req.user.getAge(),
        ageGroup: req.user.getAgeGroup()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '프로필 조회 중 오류가 발생했습니다.'
    });
  }
};

// 로그아웃
const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    res.json({
      success: true,
      message: '로그아웃 되었습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '로그아웃 처리 중 오류가 발생했습니다.'
    });
  }
};

// 회원탈퇴
const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.clearCookie('token');
    
    res.json({
      success: true,
      message: '계정이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '회원탈퇴 처리 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  login,
  register,
  kakaoLogin,
  kakaoCallback,
  getProfile,
  logout,
  deleteAccount
};