const DiagnosisQuestion = require("../models/DiagnosisQuestion");
const DiagnosisResult = require("../models/DiagnosisResult");
const DiagnosisService = require("../services/diagnosisService");
const Validators = require("../utils/validators");
const { v4: uuidv4 } = require("uuid");

// 진단 질문 조회
const getDiagnosisQuestions = async (req, res) => {
  try {
    const questions = await DiagnosisQuestion.find({ isActive: true })
      .sort({ order: 1 })
      .select("-createdAt -updatedAt -__v")
      .lean(); // 성능 향상을 위한 lean() 사용

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    console.error("진단 질문 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "진단 질문을 불러오는 중 오류가 발생했습니다.",
    });
  }
};

// 진단 결과 처리 (개선된 버전)
const processDiagnosisResult = async (req, res) => {
  try {
    const { answers, sessionId: providedSessionId } = req.body;

    // 1. 입력값 검증
    try {
      Validators.validateDiagnosisAnswers(answers);

      if (
        providedSessionId &&
        !Validators.isValidSessionId(providedSessionId)
      ) {
        return res.status(400).json({
          success: false,
          message: "유효하지 않은 세션 ID입니다.",
        });
      }
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }

    // 2. 세션 ID 생성 또는 사용
    const sessionId = providedSessionId || uuidv4();

    // 3. 질문 데이터 조회 (답변 검증용)
    const questions = await DiagnosisQuestion.find({ isActive: true }).lean();

    // 4. 답변된 질문이 실제로 존재하는지 검증
    const validQuestionIds = questions.map((q) => q._id.toString());
    const invalidAnswers = answers.filter(
      (answer) => !validQuestionIds.includes(answer.questionId)
    );

    if (invalidAnswers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "존재하지 않는 질문에 대한 답변이 포함되어 있습니다.",
        invalidQuestionIds: invalidAnswers.map((a) => a.questionId),
      });
    }

    // 5. 중복 세션 ID 체크
    const existingResult = await DiagnosisResult.findOne({ sessionId });
    if (existingResult) {
      return res.status(409).json({
        success: false,
        message: "이미 처리된 세션입니다. 새로운 세션 ID를 사용해주세요.",
        existingSessionId: sessionId,
      });
    }

    // 6. 사용자 정보 추가 (로그인된 경우)
    let userAge = null;
    if (req.user && req.user.birthYear) {
      userAge = req.user.getAge();
    }

    // 7. 서비스 레이어에서 분석 및 추천 처리
    const analysis = DiagnosisService.analyzeAnswers(
      answers,
      questions,
      userAge
    );
    const recommendations = await DiagnosisService.recommendPlans(analysis);

    // 7. 추천 결과가 없는 경우 처리
    if (recommendations.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          sessionId,
          analysisResult: analysis,
          recommendedPlans: [],
          totalScore: 0,
          message:
            "답변에 맞는 추천 요금제를 찾을 수 없습니다. 조건을 다시 검토해보세요.",
        },
      });
    }

    // 8. 결과 저장
    const savedResult = await DiagnosisService.saveDiagnosisResult(
      sessionId,
      req.user ? req.user._id : null,
      answers,
      analysis,
      recommendations
    );

    // 9. 응답 데이터 구성
    const responseData = {
      _id: savedResult._id,
      sessionId: savedResult.sessionId,
      analysisResult: analysis,
      recommendedPlans: recommendations.map((rec) => ({
        plan: rec.plan,
        matchScore: rec.matchScore,
        reasons: rec.reasons,
      })),
      totalScore: savedResult.totalScore,
      createdAt: savedResult.createdAt,
    };

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("진단 결과 처리 오류:", error);

    // 상세한 에러 타입별 처리
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "데이터 검증에 실패했습니다.",
        details: Object.values(error.errors).map((e) => e.message),
      });
    }

    if (error.name === "MongoServerError" && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "중복된 세션 ID입니다.",
      });
    }

    res.status(500).json({
      success: false,
      message: "진단 결과 처리 중 오류가 발생했습니다.",
      errorCode: "DIAGNOSIS_PROCESSING_ERROR",
    });
  }
};

// 진단 결과 조회 API 수정
const getDiagnosisResult = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!Validators.isValidSessionId(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 세션 ID입니다.",
      });
    }

    const result = await DiagnosisResult.findOne({ sessionId })
      .populate({
        path: "recommendedPlans.planId",
        select:
          "name price sale_price price_value sale_price_value category infos benefits badge brands imagePath iconPath icon",
        match: { isActive: true },
      })
      .select("-__v")
      .lean();

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "해당 세션의 진단 결과를 찾을 수 없습니다.",
      });
    }

    // 이미지 경로 처리 (상대 경로로 유지)
    result.recommendedPlans = result.recommendedPlans
      .filter((plan) => plan.planId !== null)
      .map((plan) => ({
        ...plan,
        planId: {
          ...plan.planId,
          // 이미지 경로는 상대 경로로 유지 (프론트엔드에서 처리)
          imagePath: plan.planId.imagePath || null,
          iconPath: plan.planId.iconPath || null,
        },
      }));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("진단 결과 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "진단 결과 조회 중 오류가 발생했습니다.",
    });
  }
};

// 사용자별 진단 기록 조회 (새로운 기능)
const getUserDiagnosisHistory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "로그인이 필요합니다.",
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const { pageNum, limitNum } = Validators.validatePagination(page, limit);
    const skip = (pageNum - 1) * limitNum;

    const results = await DiagnosisResult.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select("sessionId totalScore createdAt analysisResult")
      .lean();

    const totalCount = await DiagnosisResult.countDocuments({
      userId: req.user._id,
    });
    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: {
        history: results,
        pagination: {
          totalPages,
          currentPage: pageNum,
          totalCount,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("진단 기록 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "진단 기록 조회 중 오류가 발생했습니다.",
    });
  }
};

// 진단 통계 조회 (관리자용)
const getDiagnosisStats = async (req, res) => {
  try {
    // 기본 통계
    const totalDiagnosis = await DiagnosisResult.countDocuments();
    const todayDiagnosis = await DiagnosisResult.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    });

    // 연령대별 통계
    const ageStats = await DiagnosisResult.aggregate([
      {
        $match: {
          "analysisResult.age": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ["$analysisResult.age", 20] }, then: "10대" },
                { case: { $lt: ["$analysisResult.age", 30] }, then: "20대" },
                { case: { $lt: ["$analysisResult.age", 40] }, then: "30대" },
                { case: { $lt: ["$analysisResult.age", 50] }, then: "40대" },
                { case: { $lt: ["$analysisResult.age", 60] }, then: "50대" },
              ],
              default: "60대+",
            },
          },
          count: { $sum: 1 },
          avgScore: { $avg: "$totalScore" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 예산대별 통계
    const budgetStats = await DiagnosisResult.aggregate([
      {
        $match: {
          "analysisResult.budget": { $exists: true, $gt: 0 },
        },
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                {
                  case: { $lt: ["$analysisResult.budget", 30000] },
                  then: "3만원 미만",
                },
                {
                  case: { $lt: ["$analysisResult.budget", 50000] },
                  then: "3-5만원",
                },
                {
                  case: { $lt: ["$analysisResult.budget", 70000] },
                  then: "5-7만원",
                },
                {
                  case: { $lt: ["$analysisResult.budget", 100000] },
                  then: "7-10만원",
                },
              ],
              default: "10만원 이상",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalDiagnosis,
          todayDiagnosis,
        },
        ageDistribution: ageStats,
        budgetDistribution: budgetStats,
      },
    });
  } catch (error) {
    console.error("진단 통계 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "통계 조회 중 오류가 발생했습니다.",
    });
  }
};

module.exports = {
  getDiagnosisQuestions,
  processDiagnosisResult,
  getDiagnosisResult,
  getUserDiagnosisHistory,
  getDiagnosisStats,
};
