# 강약 조절 데미지 연동형 턴제 전투 사자성어 학습 프로그램

## 프로젝트 개요

사자가 십이지신에 들지 못해 분노하여 12신을 물리치고 왕이 되려 한다는 스토리를 바탕으로,
학습 성과가 전투 데미지에 직접 연동되는 턴제 전투 게임을 통해 사자성어를 학습하는 웹/모바일 애플리케이션입니다.

## 핵심 특징

- **특허 기술**: 학습 성과(난이도, 정확도, 응답속도)를 전투 데미지로 연동
- **12지신 스테이지**: 12개의 보스 스테이지 공략
- **다양한 학습 모드**: 빈칸 맞추기, 카드 매칭
- **게임화 학습**: 턴제 전투를 통한 몰입형 학습 경험
- **통계 시스템**: 학습 패턴 분석 및 시각화

## 기술 스택

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Zustand (상태 관리)
- React Router

### Backend
- Node.js
- Express
- MongoDB (Mongoose)
- JWT Authentication
- bcrypt

## 프로젝트 구조

```
├── client/                 # Frontend (React)
│   ├── src/
│   │   ├── components/    # UI 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── store/         # 상태 관리
│   │   ├── services/      # API 서비스
│   │   ├── utils/         # 유틸리티 함수
│   │   └── types/         # TypeScript 타입 정의
│   └── public/            # 정적 파일
├── server/                # Backend (Node.js)
│   ├── models/            # 데이터 모델
│   ├── routes/            # API 라우트
│   ├── controllers/       # 비즈니스 로직
│   ├── middleware/        # 미들웨어
│   └── utils/             # 유틸리티 함수
├── idioms.json            # 사자성어 데이터셋
└── README.md
```

## 설치 및 실행

### 1. 의존성 설치

```bash
# 루트 디렉토리에서 서버 의존성 설치
npm install

# 클라이언트 디렉토리로 이동하여 클라이언트 의존성 설치
cd client
npm install
```

### 2. 환경 변수 설정

루트 디렉토리에 `.env` 파일 생성:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/idiom-learning
JWT_SECRET=your_jwt_secret_key_here
```

### 3. 개발 서버 실행

```bash
# 루트 디렉토리에서
npm run dev
```

이 명령어는 백엔드 서버(포트 5000)와 프론트엔드 개발 서버(포트 5173)를 동시에 실행합니다.

### 4. 프로덕션 빌드

```bash
npm run build
npm start
```

## 주요 기능

### FR 1.0: 사용자 인증
- 회원가입 및 로그인
- JWT 기반 인증

### FR 2.0: 메인 화면
- 학습 모드, 게임 모드, 개인 기록, 환경 설정 네비게이션

### FR 3.0: 학습 모드
- 약 2,000개의 사자성어 데이터베이스
- 빈칸 맞추기 퀴즈
- 카드 매칭 게임

### FR 4.0: 게임 모드 (핵심)
- 12지신 스테이지 맵
- 난이도 선택 (초급/중급/고급)
- 학습 성과 기반 데미지 연산
- 방어 턴 시스템
- 승리/패배 처리

### FR 5.0: 엔딩 이후 콘텐츠
- 히든 보스전
- 무한 모드
- 유저 간 대결 (PvP)

### FR 6.0: 통계 시스템
- 학습 데이터 수집 및 분석
- 성과 시각화

### FR 7.0: 전투 연산 로직
- 난이도별 기본 데미지 차등 적용
- 정확도 기반 데미지 계산
- 응답 속도 기반 보너스 데미지
- 방어 성공 시 데미지 감소

## 데미지 계산 공식

### 공격 데미지
```
Final_Damage = Base_Damage(난이도) * Accuracy(정답여부) + Bonus_Damage(응답속도)

- 난이도별 Base_Damage:
  - 초급: 10
  - 중급: 20
  - 고급: 30

- Accuracy:
  - 정답: 1.0
  - 오답: 0.0

- Bonus_Damage:
  - 응답시간에 반비례하여 0~10 사이 값
```

### 방어 데미지
```
Damage_Taken = Base_Boss_Damage * Defense_Multiplier

- Defense_Multiplier:
  - 방어 성공: 0.3
  - 방어 실패: 1.0
```

## 라이선스

GPL-3.0 license

## 작성자

loremipsum0116

## 버전

1.0.0
