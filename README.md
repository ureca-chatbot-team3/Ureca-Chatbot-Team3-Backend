# YoPlan Backend - 사용자 맞춤형 통신사 요금제 추천 서비스

## 1. 프로젝트 개요

YoPlan 백엔드는 사용자 맞춤형 통신사 요금제 추천 서비스의 서버 사이드 API를 제공합니다. AI 챗봇을 활용한 실시간 상담, 요금제 진단, 사용자 관리, 요금제 데이터 관리 등의 핵심 기능을 담당하며, RESTful API와 Socket.IO를 통한 실시간 통신을 지원합니다.

### 핵심 가치

- **확장 가능한 아키텍처**: MVC 패턴 기반의 체계적인 코드 구조
- **실시간 통신**: Socket.IO를 활용한 AI 챗봇 실시간 상담
- **데이터 무결성**: MongoDB와 Mongoose를 활용한 안정적인 데이터 관리
- **보안 강화**: JWT 인증, 요청 제한, 헬멧 등 다층 보안 시스템
- **성능 최적화**: 효율적인 쿼리 및 캐싱 전략

## 2. 서비스 소개

YoPlan 백엔드는 Node.js와 Express.js 기반으로 구축된 RESTful API 서버입니다. 사용자 인증, 요금제 데이터 관리, AI 챗봇 상담, 개인화된 요금제 진단 등의 기능을 제공하며, 프론트엔드와의 원활한 데이터 통신을 담당합니다.

## 3. YoPlan 관련 페이지

- **YoPlan**: [YoPlan](https://yoplan.vercel.app/)
- **Frontend**: [프론트엔드](https://github.com/ureca-chatbot-team3/Ureca-Chatbot-Team3-Frontend)
- **Notion**: [노션](https://boundless-bread-fb1.notion.site/3-YoPlan-206a44b1a0d48009ba3af40bac9fd295)
- **디자인 시안**: [디자인 시안 보러가기](https://www.figma.com/design/CaxLZjtFqQi5twrWLiql1V/3%EC%A1%B0-%7C-%EC%9A%94%ED%94%8C%EB%9E%9C?node-id=16-117&p=f&t=mF617FRsa9rHpkOu-0)

## 4. 디렉터리 구조

```
Ureca-Chatbot-Team3-Backend/
├── config/                          # 설정 파일
├── controllers/                     # 컨트롤러 (비즈니스 로직)
│   ├── authController.js           # 인증 관련 컨트롤러
│   ├── userController.js           # 사용자 관리 컨트롤러
│   ├── planController.js           # 요금제 관리 컨트롤러
│   ├── diagnosisController.js      # 진단 관련 컨트롤러
│   ├── bookmarkController.js       # 북마크 관리 컨트롤러
│   └── faqController.js            # FAQ 관리 컨트롤러
├── data/                            # 초기 데이터 및 시드 파일
├── handlers/                        # Socket.IO 핸들러
│   └── socketHandlers.js           # 실시간 채팅 핸들러
├── middleware/                      # 미들웨어
│   └── validation.js               # 유효성 검사 미들웨어
├── models/                          # MongoDB 모델 정의
│   ├── User.js                     # 사용자 모델
│   ├── Plan.js                     # 요금제 모델
│   ├── DiagnosisQuestion.js        # 진단 질문 모델
│   ├── DiagnosisResult.js          # 진단 결과 모델
│   ├── Conversation.js             # 대화 내역 모델
│   ├── Bookmark.js                 # 북마크 모델
│   └── Faq.js                      # FAQ 모델
├── public/                          # 정적 파일 (이미지 등)
│   └── images/                     # 요금제 이미지
├── routes/                          # API 라우트 정의
│   ├── auth.js                     # 인증 라우트
│   ├── users.js                    # 사용자 라우트
│   ├── plans.js                    # 요금제 라우트
│   ├── diagnosis.js                # 진단 라우트
│   ├── bookmarks.js                # 북마크 라우트
│   ├── faq.js                      # FAQ 라우트
│   └── conversationRoutes.js       # 대화 내역 라우트
├── scripts/                         # 유틸리티 스크립트
│   ├── seedPlansUpdate.js          # 요금제 데이터 시딩
│   ├── seedDiagnosisQuestions.js   # 진단 질문 시딩
│   ├── clearData.js                # 데이터 초기화
│   ├── checkHealth.js              # 헬스 체크
│   └── updatePlansWithImages.js    # 이미지 업데이트
├── services/                        # 비즈니스 서비스 로직
│   └── diagnosisService.js         # 진단 서비스
├── utils/                           # 유틸리티 함수
├── .env                            # 환경 변수
├── server.js                       # 메인 서버 파일
└── package.json                    # 의존성 관리
```

## 5. 서버 실행 방법

### 개발 환경 설정

1. **Node.js 설치**
   - Node.js 16.0.0 이상 버전 필요

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   ```bash
   # .env 파일 생성 후 다음 변수들을 설정
   MONGODB_URI=MongoDB 연결 문자열
   JWT_SECRET=JWT 시크릿 키
   FRONTEND_URL=프론트엔드 URL (예: http://localhost:5173)
   OPENAI_API_KEY=OpenAI API 키 (챗봇용)
   PORT=5000
   NODE_ENV=development
   ```

4. **데이터베이스 초기화 및 시딩**
   ```bash
   # 전체 설정 (데이터 초기화 + 시딩)
   npm run setup
   
   # 또는 개별 실행
   npm run clear        # 데이터 초기화
   npm run seed         # 요금제 데이터 시딩
   npm run seed:questions # 진단 질문 시딩
   ```

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```
   - 개발 서버가 http://localhost:5000에서 실행됩니다.

6. **프로덕션 서버 실행**
   ```bash
   npm start
   ```

### 추가 스크립트

```bash
# 헬스 체크
npm run health

# 데이터베이스 상태 확인
npm run db:status

# 특정 데이터만 초기화
npm run clear:users      # 사용자 데이터만
npm run clear:plans      # 요금제 데이터만
npm run clear:diagnosis  # 진단 데이터만

# 요금제 이미지 업데이트
npm run update:images

# 테스트 실행
npm test
```

## 6. 주요 기능 소개

### 6.1 인증 시스템 (authController.js)
- **주요 기능**: 회원가입, 로그인, JWT 토큰 관리, 카카오 소셜 로그인
- **API 엔드포인트**:
  - `POST /api/auth/register` - 회원가입
  - `POST /api/auth/login` - 로그인
  - `POST /api/auth/logout` - 로그아웃
  - `GET /api/auth/profile` - 사용자 프로필 조회
  - `GET /api/auth/kakao` - 카카오 로그인
- **특징**: bcrypt 암호화, JWT 토큰 기반 인증, 쿠키 관리

### 6.2 요금제 관리 (planController.js)
- **주요 기능**: 요금제 CRUD, 검색, 필터링, 정렬
- **API 엔드포인트**:
  - `GET /api/plans` - 요금제 목록 조회 (필터링, 정렬 지원)
  - `GET /api/plans/:id` - 요금제 상세 조회
  - `POST /api/plans` - 요금제 생성 (관리자)
  - `PUT /api/plans/:id` - 요금제 수정 (관리자)
  - `DELETE /api/plans/:id` - 요금제 삭제 (관리자)
- **특징**: 동적 필터링, 페이지네이션, 검색 기능, 이미지 관리

### 6.3 AI 챗봇 시스템 (socketHandlers.js)
- **주요 기능**: 실시간 AI 상담, OpenAI API 연동, 대화 내역 관리
- **Socket 이벤트**:
  - `user-message` - 사용자 메시지 수신
  - `stream-start` - AI 응답 스트림 시작
  - `stream-chunk` - AI 응답 청크 전송
  - `stream-end` - AI 응답 완료
  - `force-end-session` - 세션 강제 종료
- **특징**: 실시간 스트리밍 응답, 세션 관리, 자동 대화 종료

### 6.4 요금제 진단 시스템 (diagnosisController.js)
- **주요 기능**: 개인화된 요금제 추천을 위한 진단 질문 및 결과 생성
- **API 엔드포인트**:
  - `GET /api/diagnosis/questions` - 진단 질문 조회
  - `POST /api/diagnosis/submit` - 진단 답변 제출
  - `GET /api/diagnosis/result/:sessionId` - 진단 결과 조회
- **특징**: 단계별 질문 시스템, 알고리즘 기반 추천, 세션 관리

### 6.5 사용자 관리 (userController.js)
- **주요 기능**: 사용자 프로필 관리, 정보 수정
- **API 엔드포인트**:
  - `GET /api/users/profile` - 프로필 조회
  - `PUT /api/users/profile` - 프로필 수정
  - `PUT /api/users/password` - 비밀번호 변경
- **특징**: 프로필 유효성 검증, 보안 강화

### 6.6 북마크 시스템 (bookmarkController.js)
- **주요 기능**: 요금제 저장 및 관리
- **API 엔드포인트**:
  - `GET /api/bookmarks` - 북마크 목록 조회
  - `POST /api/bookmarks` - 북마크 추가
  - `DELETE /api/bookmarks/:planId` - 북마크 삭제
- **특징**: 사용자별 북마크 관리, 중복 방지

### 6.7 FAQ 관리 (faqController.js)
- **주요 기능**: 자주 묻는 질문 관리
- **API 엔드포인트**:
  - `GET /api/faq` - FAQ 목록 조회
  - `POST /api/faq` - FAQ 생성 (관리자)
  - `PUT /api/faq/:id` - FAQ 수정 (관리자)
  - `DELETE /api/faq/:id` - FAQ 삭제 (관리자)
- **특징**: 카테고리 분류, 검색 기능

### 6.8 대화 내역 관리 (conversationRoutes.js)
- **주요 기능**: 챗봇 대화 내역 저장 및 조회
- **API 엔드포인트**:
  - `GET /api/conversations` - 대화 내역 조회
  - `DELETE /api/conversations` - 대화 내역 삭제
- **특징**: 사용자별/세션별 관리, 자동 만료

## 7. 기술 스택

### Backend Framework & Language
- **Node.js 16+**: 서버 사이드 JavaScript 런타임
- **Express.js 4.21.2**: 웹 애플리케이션 프레임워크
- **JavaScript (ES6+)**: 프로그래밍 언어

### 데이터베이스 & ODM
- **MongoDB**: NoSQL 데이터베이스
- **Mongoose 8.0.0**: MongoDB ODM (Object Document Mapper)

### 인증 & 보안
- **JWT (jsonwebtoken 9.0.0)**: 토큰 기반 인증
- **bcryptjs 2.4.3**: 비밀번호 암호화
- **Helmet 7.1.0**: 보안 헤더 설정
- **Express Rate Limit 7.1.0**: 요청 제한
- **CORS 2.8.5**: Cross-Origin Resource Sharing

### 실시간 통신 & AI
- **Socket.IO 4.8.1**: 실시간 양방향 통신
- **OpenAI 5.5.1**: AI 챗봇 API 연동
- **Axios 1.6.0**: HTTP 클라이언트

### 유틸리티 & 미들웨어
- **dotenv 16.3.1**: 환경 변수 관리
- **cookie-parser 1.4.6**: 쿠키 파싱
- **express-validator 7.0.1**: 입력 유효성 검증
- **uuid 9.0.1**: 고유 ID 생성

### 개발 도구
- **nodemon 3.0.1**: 개발 서버 자동 재시작
- **Jest 29.7.0**: 테스트 프레임워크
- **npm**: 패키지 관리

### 배포 & 운영
- **환경 변수**: dotenv를 통한 설정 관리
- **헬스 체크**: 서버 상태 모니터링
- **자동 스케줄링**: 오래된 대화 자동 정리

## 8. 팀원 소개

### 👨‍💼 유동석 (팀장)

- 기획 및 UI / UX
- 챗봇 기능
- 챗봇 대화창 모달
- 챗봇 상담 내역 페이지
- 모바일 반응형

### 👩‍💻 김소은

- 기획 및 UI / UX
- 메인 페이지
- 챗봇 안내 페이지
- 모바일 반응형

### 👨‍💻 김준서

- 기획 및 UI / UX
- 요금제 진단 페이지
- 요금제 비교 페이지
- 마이페이지
- 백엔드 개발
- 모바일 반응형

### 👨‍💻 양세현

- 기획 및 UI / UX
- 데이터 정제 및 정규화
- 요금제 리스트 페이지
- 모바일 반응형

### 👨‍💻 홍석준

- 기획 및 UI / UX
- 로그인/회원가입
- 요금제 상세 페이지
- 모바일 반응형


---

## 9. API 문서

### 인증 관련
```
POST /api/auth/register    # 회원가입
POST /api/auth/login       # 로그인
POST /api/auth/logout      # 로그아웃
GET  /api/auth/profile     # 프로필 조회
```

### 요금제 관련
```
GET    /api/plans          # 요금제 목록 (필터링, 검색 지원)
GET    /api/plans/:id      # 요금제 상세 조회
POST   /api/plans          # 요금제 생성 (관리자)
PUT    /api/plans/:id      # 요금제 수정 (관리자)
DELETE /api/plans/:id      # 요금제 삭제 (관리자)
```

### 진단 관련
```
GET  /api/diagnosis/questions           # 진단 질문 조회
POST /api/diagnosis/submit              # 진단 답변 제출
GET  /api/diagnosis/result/:sessionId   # 진단 결과 조회
```

### 북마크 관련
```
GET    /api/bookmarks          # 북마크 목록
POST   /api/bookmarks          # 북마크 추가
DELETE /api/bookmarks/:planId  # 북마크 삭제
```

### Socket.IO 이벤트
```
user-message        # 사용자 메시지 전송
stream-start        # AI 응답 시작
stream-chunk        # AI 응답 청크
stream-end          # AI 응답 완료
force-end-session   # 세션 강제 종료
```

---

## 10. 프로젝트 특징

### 확장 가능한 아키텍처
- MVC 패턴 기반 구조
- 모듈화된 컨트롤러 및 서비스
- 재사용 가능한 미들웨어

### 실시간 통신
- Socket.IO 기반 실시간 챗봇
- 스트리밍 응답 처리
- 세션 관리 및 자동 정리

### 보안 강화
- JWT 토큰 기반 인증
- 비밀번호 암호화 (bcrypt)
- 요청 제한 및 보안 헤더
- 입력 유효성 검증

### 성능 최적화
- MongoDB 인덱싱 활용
- 효율적인 쿼리 최적화
- 자동 데이터 정리 스케줄링

### 개발 편의성
- 풍부한 NPM 스크립트
- 자동 데이터 시딩
- 헬스 체크 기능
- 개발/프로덕션 환경 분리

---

*이 README는 YoPlan 백엔드 프로젝트의 개요와 사용법을 안내합니다. 추가 질문이나 기술 지원이 필요한 경우 팀원에게 문의해주세요.*
