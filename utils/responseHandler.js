// utils/responseHandler.js

/**
 * 표준화된 API 응답 처리 유틸리티
 * camelCase 네이밍 컨벤션 적용
 */
class ResponseHandler {
  
  /**
   * 성공 응답 생성
   * @param {Object} res - Express response 객체
   * @param {*} data - 응답 데이터
   * @param {string} message - 성공 메시지
   * @param {number} statusCode - HTTP 상태 코드 (기본값: 200)
   */
  static sendSuccess(res, data = null, message = '요청이 성공적으로 처리되었습니다.', statusCode = 200) {
    const response = {
      success: true,
      message
    };
    
    if (data !== null) {
      response.data = data;
    }
    
    return res.status(statusCode).json(response);
  }

  /**
   * 생성 성공 응답
   * @param {Object} res - Express response 객체
   * @param {*} data - 생성된 데이터
   * @param {string} message - 성공 메시지
   */
  static sendCreated(res, data = null, message = '리소스가 성공적으로 생성되었습니다.') {
    return this.sendSuccess(res, data, message, 201);
  }

  /**
   * 에러 응답 생성
   * @param {Object} res - Express response 객체
   * @param {string} message - 에러 메시지
   * @param {number} statusCode - HTTP 상태 코드 (기본값: 500)
   * @param {*} details - 추가 에러 정보
   */
  static sendError(res, message = '서버 내부 오류가 발생했습니다.', statusCode = 500, details = null) {
    const response = {
      success: false,
      message
    };
    
    if (details !== null) {
      response.details = details;
    }
    
    return res.status(statusCode).json(response);
  }

  /**
   * 검증 에러 응답
   * @param {Object} res - Express response 객체
   * @param {string} message - 에러 메시지
   * @param {Array} errors - 검증 에러 배열
   */
  static sendValidationError(res, message = '입력 데이터가 올바르지 않습니다.', errors = []) {
    return this.sendError(res, message, 400, { errors });
  }

  /**
   * 인증 에러 응답
   * @param {Object} res - Express response 객체
   * @param {string} message - 에러 메시지
   */
  static sendUnauthorized(res, message = '인증이 필요합니다.') {
    return this.sendError(res, message, 401);
  }

  /**
   * 권한 에러 응답
   * @param {Object} res - Express response 객체
   * @param {string} message - 에러 메시지
   */
  static sendForbidden(res, message = '접근 권한이 없습니다.') {
    return this.sendError(res, message, 403);
  }

  /**
   * 리소스 없음 에러 응답
   * @param {Object} res - Express response 객체
   * @param {string} message - 에러 메시지
   */
  static sendNotFound(res, message = '요청한 리소스를 찾을 수 없습니다.') {
    return this.sendError(res, message, 404);
  }

  /**
   * 중복 리소스 에러 응답
   * @param {Object} res - Express response 객체
   * @param {string} message - 에러 메시지
   */
  static sendConflict(res, message = '이미 존재하는 리소스입니다.') {
    return this.sendError(res, message, 409);
  }

  /**
   * 요청 제한 에러 응답
   * @param {Object} res - Express response 객체
   * @param {string} message - 에러 메시지
   */
  static sendTooManyRequests(res, message = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.') {
    return this.sendError(res, message, 429);
  }

  /**
   * 데이터베이스 에러에 따른 적절한 응답 처리
   * @param {Object} res - Express response 객체
   * @param {Error} error - 에러 객체
   * @param {string} defaultMessage - 기본 에러 메시지
   */
  static handleDatabaseError(res, error, defaultMessage = '데이터베이스 처리 중 오류가 발생했습니다.') {
    console.error('Database Error:', error);

    // MongoDB 중복 키 에러
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return this.sendConflict(res, `이미 사용 중인 ${field}입니다.`);
    }

    // Mongoose 유효성 검사 에러
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      return this.sendValidationError(res, '데이터 유효성 검사에 실패했습니다.', errors);
    }

    // CastError (잘못된 ObjectId 등)
    if (error.name === 'CastError') {
      return this.sendError(res, '올바르지 않은 데이터 형식입니다.', 400);
    }

    // 기본 서버 에러
    return this.sendError(res, defaultMessage);
  }

  /**
   * JWT 에러에 따른 적절한 응답 처리
   * @param {Object} res - Express response 객체
   * @param {Error} error - JWT 에러 객체
   */
  static handleJwtError(res, error) {
    if (error.name === 'JsonWebTokenError') {
      return this.sendUnauthorized(res, '유효하지 않은 토큰입니다.');
    }
    
    if (error.name === 'TokenExpiredError') {
      return this.sendUnauthorized(res, '토큰이 만료되었습니다.');
    }
    
    return this.sendUnauthorized(res, '토큰 인증에 실패했습니다.');
  }

  /**
   * 페이지네이션 정보 생성
   * @param {number} totalCount - 전체 아이템 수
   * @param {number} currentPage - 현재 페이지
   * @param {number} limit - 페이지당 아이템 수
   */
  static createPaginationInfo(totalCount, currentPage, limit) {
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      totalPages,
      currentPage,
      totalCount,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
      limit
    };
  }
}

module.exports = ResponseHandler;
