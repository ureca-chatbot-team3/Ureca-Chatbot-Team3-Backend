const User = require('../models/User');
const bcrypt = require('bcryptjs');
const ResponseHandler = require('../utils/responseHandler');

// 마이페이지 정보 조회 (camelCase 적용)
const getUserProfile = async (req, res) => {
  try {
    const { nickname } = req.params;
    
    const user = await User.findOne({ nickname }).select('-password');
    if (!user) {
      return ResponseHandler.sendNotFound(res, '사용자를 찾을 수 없습니다.');
    }

    const userData = {
      nickname: user.nickname,
      email: user.email,
      birthYear: user.birthYear,
      age: user.getAge(),
      ageGroup: user.getAgeGroup(),
      createdAt: user.createdAt
    };

    return ResponseHandler.sendSuccess(res, userData, '사용자 정보를 성공적으로 조회했습니다.');
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return ResponseHandler.sendError(res, '사용자 정보 조회 중 오류가 발생했습니다.');
  }
};

// 사용자 정보 수정 (camelCase 적용)
const updateUserInfo = async (req, res) => {
  try {
    const { nickname, password, birthYear } = req.body;
    const updateData = {};

    if (nickname) {
      // 닉네임 중복 검사
      const existingUser = await User.findOne({ 
        nickname, 
        _id: { $ne: req.user._id } 
      });
      
      if (existingUser) {
        return ResponseHandler.sendConflict(res, '이미 사용 중인 닉네임입니다.');
      }
      updateData.nickname = nickname;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    if (birthYear) {
      // 생년월일 유효성 검사
      const currentYear = new Date().getFullYear();
      if (birthYear < 1900 || birthYear > currentYear) {
        return ResponseHandler.sendValidationError(res, `태어난 년도는 1900년부터 ${currentYear}년 사이여야 합니다.`);
      }
      updateData.birthYear = birthYear;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    const userData = {
      nickname: updatedUser.nickname,
      email: updatedUser.email,
      birthYear: updatedUser.birthYear,
      age: updatedUser.getAge(),
      ageGroup: updatedUser.getAgeGroup()
    };

    return ResponseHandler.sendSuccess(res, userData, '사용자 정보가 수정되었습니다.');
  } catch (error) {
    console.error('사용자 정보 수정 오류:', error);
    return ResponseHandler.handleDatabaseError(res, error, '사용자 정보 수정 중 오류가 발생했습니다.');
  }
};

module.exports = {
  getUserProfile,
  updateUserInfo  // camelCase로 변경
};