// utils/validators.js
const mongoose = require('mongoose');

class Validators {
  
  // 몽고DB ObjectId 검증
  static isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  // 세션 ID 검증
  static isValidSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') return false;
    if (sessionId.length < 1 || sessionId.length > 100) return false;
    // 알파벳, 숫자, 하이픈만 허용
    return /^[a-zA-Z0-9-_]+$/.test(sessionId);
  }

  // 진단 답변 검증
  static validateDiagnosisAnswers(answers) {
    if (!Array.isArray(answers) || answers.length === 0) {
      throw new Error('답변은 배열이어야 하며 최소 1개 이상이어야 합니다.');
    }

    for (const answer of answers) {
      if (!answer.questionId || !this.isValidObjectId(answer.questionId)) {
        throw new Error('유효하지 않은 질문 ID입니다.');
      }

      if (answer.answer === undefined || answer.answer === null) {
        throw new Error('답변이 비어있습니다.');
      }

      // 답변 타입별 검증
      if (typeof answer.answer === 'string') {
        if (answer.answer.trim().length === 0) {
          throw new Error('문자열 답변이 비어있습니다.');
        }
        if (answer.answer.length > 500) {
          throw new Error('답변이 너무 깁니다. (최대 500자)');
        }
      } else if (Array.isArray(answer.answer)) {
        if (answer.answer.length === 0) {
          throw new Error('다중 선택 답변이 비어있습니다.');
        }
        if (answer.answer.length > 10) {
          throw new Error('너무 많은 선택지를 선택했습니다. (최대 10개)');
        }
        for (const item of answer.answer) {
          if (typeof item !== 'string' || item.trim().length === 0) {
            throw new Error('다중 선택 답변에 유효하지 않은 값이 포함되어 있습니다.');
          }
        }
      } else if (typeof answer.answer === 'number') {
        if (!Number.isFinite(answer.answer) || answer.answer < 0) {
          throw new Error('숫자 답변은 0 이상의 유효한 숫자여야 합니다.');
        }
        if (answer.answer > 1000000) {
          throw new Error('숫자 답변이 너무 큽니다.');
        }
      } else {
        throw new Error('지원되지 않는 답변 형식입니다.');
      }
    }

    return true;
  }

  // 검색어 검증 (NoSQL Injection 방지)
  static sanitizeSearchQuery(search) {
    if (!search || typeof search !== 'string') return '';
    
    // 특수 문자 제거 및 길이 제한
    const sanitized = search
      .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ0-9+]/g, '')
      .trim()
      .substring(0, 100);
    
    return sanitized;
  }

  // 페이지네이션 파라미터 검증
  static validatePagination(page, limit) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      throw new Error('페이지 번호는 1 이상이어야 합니다.');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      throw new Error('페이지당 항목 수는 1-100 사이여야 합니다.');
    }
    
    return { pageNum, limitNum };
  }

  // 가격 범위 검증
  static validatePriceRange(minPrice, maxPrice) {
    const min = minPrice ? parseInt(minPrice) : null;
    const max = maxPrice ? parseInt(maxPrice) : null;
    
    if (min !== null && (min < 0 || min > 1000000)) {
      throw new Error('최소 가격은 0원에서 100만원 사이여야 합니다.');
    }
    
    if (max !== null && (max < 0 || max > 1000000)) {
      throw new Error('최대 가격은 0원에서 100만원 사이여야 합니다.');
    }
    
    if (min !== null && max !== null && min > max) {
      throw new Error('최소 가격이 최대 가격보다 클 수 없습니다.');
    }
    
    return { min, max };
  }

  // 카테고리 검증
  static validateCategory(category) {
    const validCategories = ['5G', 'LTE', '기타', 'all'];
    
    if (category && !validCategories.includes(category)) {
      throw new Error(`유효하지 않은 카테고리입니다. 가능한 값: ${validCategories.join(', ')}`);
    }
    
    return category;
  }

  // 정렬 옵션 검증
  static validateSortOptions(sortBy, sortOrder) {
    const validSortBy = ['price_value', 'name', 'createdAt', 'category'];
    const validSortOrder = ['asc', 'desc'];
    
    if (sortBy && !validSortBy.includes(sortBy)) {
      throw new Error(`유효하지 않은 정렬 기준입니다. 가능한 값: ${validSortBy.join(', ')}`);
    }
    
    if (sortOrder && !validSortOrder.includes(sortOrder)) {
      throw new Error(`유효하지 않은 정렬 순서입니다. 가능한 값: ${validSortOrder.join(', ')}`);
    }
    
    return {
      sortBy: sortBy || 'price_value',
      sortOrder: sortOrder || 'asc'
    };
  }

  // 나이 검증
  static validateAge(age) {
    if (age === null || age === undefined) return null;
    
    const ageNum = parseInt(age);
    
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      throw new Error('나이는 1세에서 120세 사이여야 합니다.');
    }
    
    return ageNum;
  }

  // 이메일 검증
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('이메일이 필요합니다.');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('올바른 이메일 형식이 아닙니다.');
    }
    
    if (email.length > 255) {
      throw new Error('이메일이 너무 깁니다.');
    }
    
    return email.toLowerCase().trim();
  }

  // 닉네임 검증
  static validateNickname(nickname) {
    if (!nickname || typeof nickname !== 'string') {
      throw new Error('닉네임이 필요합니다.');
    }
    
    const trimmed = nickname.trim();
    
    if (trimmed.length < 2 || trimmed.length > 20) {
      throw new Error('닉네임은 2자에서 20자 사이여야 합니다.');
    }
    
    // 한글, 영문, 숫자만 허용
    if (!/^[가-힣a-zA-Z0-9]+$/.test(trimmed)) {
      throw new Error('닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.');
    }
    
    return trimmed;
  }

  // 비밀번호 검증
  static validatePassword(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('비밀번호가 필요합니다.');
    }
    
    if (password.length < 8 || password.length > 128) {
      throw new Error('비밀번호는 8자에서 128자 사이여야 합니다.');
    }
    
    // 최소한 영문, 숫자 포함
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      throw new Error('비밀번호는 영문과 숫자를 포함해야 합니다.');
    }
    
    return password;
  }
}

module.exports = Validators;