# YoPlan Backend

이 프로젝트는 YoPlan의 챗봇 백엔드 API 서버입니다.

## 📋 목차
- [설치 및 실행](#설치-및-실행)
- [API 문서](#api-문서)
- [환경 설정](#환경-설정)
- [데이터베이스 설정](#데이터베이스-설정)
- [스크립트 명령어](#스크립트-명령어)

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 수정하여 환경 변수를 설정하세요:
```
PORT
MONGODB_URI
JWT_SECRET
KAKAO_CLIENT_ID
KAKAO_CLIENT_SECRET
FRONTEND_URL
```

### 3. 데이터베이스 초기화
```bash
# 샘플 데이터 생성
npm run seed

# 또는 전체 초기화 (데이터 삭제 + 샘플 데이터 생성)
npm run setup
```

### 4. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## 📡 API 문서

### 기본 정보
- **Base URL**: `http://localhost:5000/api`
- **인증 방식**: HTTP-only Cookie (JWT)
- **요청/응답 형식**: JSON

### 주요 엔드포인트

#### 🔐 인증 API
- `POST /auth/login` - 일반 로그인
- `POST /auth/register` - 회원가입
- `GET /auth/kakao` - 카카오 로그인
- `GET /auth/profile` - 프로필 조회
- `POST /auth/logout` - 로그아웃

#### 👤 사용자 API
- `GET /users/:nickname` - 사용자 정보 조회
- `PUT /users/update` - 사용자 정보 수정

#### 📱 요금제 API
- `GET /plans` - 요금제 리스트 조회
- `GET /plans/:planId` - 요금제 상세 조회

#### 🧠 진단 시스템 API
- `GET /diagnosis/questions` - 진단 질문 조회
- `POST /diagnosis/result` - 진단 결과 처리

#### 📌 보관함 API
- `GET /users/:nickname/bookmarks` - 보관함 조회
- `POST /bookmarks` - 요금제 보관
- `DELETE /bookmarks/:planId` - 보관함에서 삭제

## 🛠️ 스크립트 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 서버 실행
npm start

# 샘플 데이터 생성
npm run seed

# 모든 데이터 삭제
npm run clear

# 데이터베이스 상태 확인
npm run health

# 전체 초기화 (삭제 + 샘플 데이터 생성)
npm run setup

# 테스트 실행
npm test
```

## 🗄️ 데이터베이스 스키마

### User
- `nickname`: 닉네임 (유니크)
- `email`: 이메일 (유니크)
- `password`: 암호화된 비밀번호
- `kakaoId`: 카카오 ID (선택사항)

### Plan
- `name`: 요금제명
- `price`: 가격
- `data`: 데이터 용량
- `call`: 통화 시간
- `sms`: 문자 개수
- `description`: 설명
- `features`: 특징 목록
- `category`: 카테고리 (5G/LTE)

### Bookmark
- `userId`: 사용자 ID
- `planId`: 요금제 ID

### DiagnosisQuestion
- `order`: 질문 순서
- `question`: 질문 내용
- `type`: 질문 타입 (single/multiple/range)
- `options`: 선택지 목록
- `category`: 카테고리 (data/call/price/general)

### DiagnosisResult
- `userId`: 사용자 ID (선택사항)
- `sessionId`: 세션 ID
- `answers`: 답변 목록
- `recommendedPlans`: 추천 요금제 목록
- `score`: 점수 정보

## 🔧 환경 설정

### MongoDB 설정
1. MongoDB를 로컬에 설치하거나 MongoDB Atlas 사용
2. `.env` 파일의 `MONGODB_URI` 설정

### 카카오 OAuth 설정
1. 카카오 개발자 센터에서 앱 생성
2. `.env` 파일에 `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` 설정
3. 리다이렉트 URI: `http://localhost:5000/api/auth/kakao/callback`

## 📝 주의사항

1. **보안**: 프로덕션 환경에서는 반드시 강력한 JWT_SECRET과 COOKIE_SECRET 사용
2. **CORS**: 프론트엔드 도메인에 맞게 CORS 설정 조정
3. **Rate Limiting**: API 남용 방지를 위한 요청 제한 적용
4. **환경변수**: `.env` 파일을 Git에 커밋하지 않도록 주의

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.