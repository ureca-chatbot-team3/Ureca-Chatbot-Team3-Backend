const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 마이페이지 정보 조회
const getUserProfile = async (req, res) => {
  try {
    const { nickname } = req.params;
    
    const user = await User.findOne({ nickname }).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: {
        nickname: user.nickname,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다.'
    });
  }
};

// 사용자 정보 수정
const updateUser = async (req, res) => {
  try {
    const { nickname, password } = req.body;
    const updateData = {};

    if (nickname) {
      // 닉네임 중복 검사
      const existingUser = await User.findOne({ 
        nickname, 
        _id: { $ne: req.user._id } 
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '이미 사용 중인 닉네임입니다.'
        });
      }
      updateData.nickname = nickname;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: '사용자 정보가 수정되었습니다.',
      data: {
        nickname: updatedUser.nickname,
        email: updatedUser.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '사용자 정보 수정 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getUserProfile,
  updateUser
};