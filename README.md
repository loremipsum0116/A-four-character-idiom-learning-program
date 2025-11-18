# 강약 조절 데미지 연동형 턴제 전투 사자성어 학습 프로그램

## 프로젝트 개요

사자가 십이지신에 들지 못해 분노하여 12신을 물리치고 왕이 되려 한다는 스토리를 바탕으로,
학습 성과가 전투 데미지에 직접 연동되는 턴제 전투 게임을 통해 사자성어를 학습하는 Unity 기반 게임 애플리케이션입니다.

## 핵심 특징

- **특허 기술**: 학습 성과(난이도, 정확도, 응답속도)를 전투 데미지로 연동
- **12지신 스테이지**: 12개의 보스 스테이지 공략
- **다양한 학습 모드**: 빈칸 맞추기, 카드 매칭
- **게임화 학습**: 턴제 전투를 통한 몰입형 학습 경험
- **통계 시스템**: 학습 패턴 분석 및 시각화

## 기술 스택

### Frontend (Unity)
- Unity 2021 LTS 이상
- C# Scripts
- UnityWebRequest (HTTP 통신)
- TextMeshPro (UI 텍스트)
- PlayerPrefs (로컬 저장)

### Backend
- ASP.NET Core 8.0
- C#
- MongoDB (MongoDB.Driver)
- JWT Bearer Authentication
- BCrypt.Net-Next (암호화)
- Swagger (API 문서)

## 프로젝트 구조

```
├── Backend/                    # ASP.NET Core 백엔드
│   ├── Controllers/            # API 컨트롤러
│   │   ├── AuthController.cs   # 인증 API
│   │   └── GameController.cs   # 게임 API
│   ├── Models/                 # 데이터 모델
│   │   ├── User.cs             # 사용자 모델
│   │   ├── Idiom.cs            # 사자성어 모델
│   │   ├── GameStage.cs        # 게임 스테이지 모델
│   │   └── LearningLog.cs      # 학습 로그 모델
│   ├── Services/               # 비즈니스 로직
│   │   ├── AuthService.cs      # 인증 서비스
│   │   └── CombatCalculator.cs # 전투 연산 (특허 핵심)
│   ├── DTOs/                   # 데이터 전송 객체
│   │   ├── AuthDTOs.cs         # 인증 DTO
│   │   └── GameDTOs.cs         # 게임 DTO
│   ├── Data/                   # 데이터베이스 컨텍스트
│   │   └── MongoDbContext.cs   # MongoDB 연결
│   ├── Middleware/             # 미들웨어
│   ├── Program.cs              # 애플리케이션 진입점
│   ├── appsettings.json        # 설정 파일
│   └── IdiomLearningAPI.csproj # 프로젝트 파일
├── Unity/                      # Unity 클라이언트
│   └── Scripts/                # Unity C# 스크립트
│       ├── Models/             # 데이터 모델
│       │   └── DataModels.cs   # 직렬화 가능 데이터 클래스
│       ├── API/                # HTTP 통신
│       │   └── APIClient.cs    # API 클라이언트
│       └── Game/               # 게임 로직
│           └── BattleManager.cs # 턴제 전투 매니저
├── .env.example                # 환경 변수 예제
├── .gitignore                  # Git 제외 파일
├── LICENSE                     # 라이선스
├── README.md                   # 프로젝트 문서
├── README_CSHARP.md            # C# 상세 가이드
└── 구현내용상세.txt            # 구현 내용 상세
```

## 설치 및 실행

### 사전 요구사항

- .NET 8.0 SDK
- MongoDB (로컬 또는 MongoDB Atlas)
- Unity 2021 LTS 이상

### 1. MongoDB 설정

```bash
# MongoDB 실행 (로컬)
mongod

# 또는 MongoDB Atlas 클라우드 사용
```

### 2. 백엔드 설정 및 실행

```bash
# Backend 디렉토리로 이동
cd Backend

# appsettings.json 파일 설정
# ConnectionStrings:MongoDB와 Jwt:Secret 값 설정

# 의존성 복원
dotnet restore

# 프로젝트 실행
dotnet run
```

백엔드 서버가 `http://localhost:5000`에서 실행됩니다.

Swagger API 문서는 `http://localhost:5000/swagger`에서 확인할 수 있습니다.

### 3. appsettings.json 설정 예시

```json
{
  "ConnectionStrings": {
    "MongoDB": "mongodb://localhost:27017"
  },
  "DatabaseName": "IdiomLearningDB",
  "Jwt": {
    "Secret": "your-secret-key-min-32-characters-long",
    "Issuer": "IdiomLearningAPI",
    "Audience": "UnityClient",
    "ExpireDays": 7
  }
}
```

### 4. Unity 클라이언트 설정

1. Unity Hub에서 Unity 2021 LTS 이상 설치
2. 새 Unity 프로젝트 생성 (2D 또는 3D)
3. `Unity/Scripts` 폴더를 Unity 프로젝트의 `Assets/Scripts`로 복사
4. 빈 GameObject를 생성하고 APIClient 스크립트 부착
5. Inspector에서 API URL을 `http://localhost:5000/api`로 설정
6. Unity Editor에서 Play 버튼으로 테스트

## API 엔드포인트

### 인증 (AuthController)
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보 (인증 필요)

### 게임 (GameController)
- `GET /api/game/stages` - 전체 스테이지 목록
- `GET /api/game/stages/{stageId}` - 특정 스테이지 정보
- `POST /api/game/attack` - 공격 처리 및 데미지 연산
- `POST /api/game/defend` - 방어 처리 및 데미지 감소
- `POST /api/game/clear` - 스테이지 클리어 처리
- `GET /api/game/progress` - 사용자 진행 상황

## 주요 기능

### FR 1.0: 사용자 인증
- BCrypt 기반 비밀번호 해싱
- JWT 토큰 인증 (7일 유효기간)
- Unity PlayerPrefs에 토큰 저장

### FR 2.0: 메인 화면
- 학습 모드, 게임 모드, 개인 기록, 환경 설정 네비게이션
- Unity Scene 기반 화면 전환

### FR 3.0: 학습 모드
- MongoDB 기반 사자성어 데이터베이스
- 빈칸 맞추기 퀴즈 (4지선다)
- 카드 매칭 게임

### FR 4.0: 게임 모드 (핵심)
- 12지신 스테이지 맵 (쥐, 소, 호랑이, ...)
- 난이도 선택 (초급/중급/고급)
- **학습 성과 기반 데미지 연산 (특허 핵심)**
- 턴제 전투 시스템 (공격 턴 → 방어 턴)
- 승리/패배 처리 및 진행 상황 저장

### FR 5.0: 엔딩 이후 콘텐츠 (향후 구현)
- 히든 보스전
- 무한 모드
- 유저 간 대결 (PvP)

### FR 6.0: 통계 시스템
- LearningLog 모델을 통한 학습 데이터 수집
- 난이도, 정확도, 응답 속도 기록
- 학습 패턴 분석 및 시각화 (향후 구현)

### FR 7.0: 전투 연산 로직 (특허 핵심)
`Backend/Services/CombatCalculator.cs`에 구현

**공격 데미지 계산:**
- 난이도별 기본 데미지 (초급: 10, 중급: 20, 고급: 30)
- 정확도 기반 데미지 (정답: 1.0, 오답: 0.0)
- 응답 속도 기반 보너스 데미지 (0~10점)
- 공식: `Final_Damage = (BaseDamage × Accuracy) + BonusDamage`

**방어 데미지 계산:**
- 방어 성공 시 30% 데미지만 받음
- 방어 실패 시 100% 데미지
- 공식: `Damage_Taken = Base_Boss_Damage × Defense_Multiplier`

## 데미지 계산 상세

### 공격 데미지 예시

```csharp
// Backend/Services/CombatCalculator.cs
public int CalculateAttackDamage(Difficulty difficulty, bool isCorrect, int responseTimeMs)
{
    int baseDamage = GetBaseDamage(difficulty);
    double accuracy = isCorrect ? 1.0 : 0.0;
    int bonusDamage = CalculateBonusDamage(difficulty, responseTimeMs);

    int finalDamage = (int)(baseDamage * accuracy) + bonusDamage;
    return Math.Max(0, finalDamage);
}
```

**계산 예시:**
- 고급 + 정답 + 1초 응답 = 30 × 1.0 + 8 = **38 데미지**
- 중급 + 정답 + 5초 응답 = 20 × 1.0 + 5 = **25 데미지**
- 초급 + 정답 + 10초 응답 = 10 × 1.0 + 3 = **13 데미지**
- 중급 + 오답 + 3초 응답 = 20 × 0.0 + 0 = **0 데미지**

**제한 시간:**
- 초급: 15초
- 중급: 10초
- 고급: 5초

### 방어 데미지 예시

```csharp
// Backend/Services/CombatCalculator.cs
public int CalculateDefenseDamage(int baseBossDamage, bool defenseSuccess)
{
    double multiplier = defenseSuccess ? 0.3 : 1.0;
    return (int)Math.Ceiling(baseBossDamage * multiplier);
}
```

**계산 예시 (보스 공격력 15):**
- 방어 성공: 15 × 0.3 = **5 데미지** (70% 감소)
- 방어 실패: 15 × 1.0 = **15 데미지** (100% 그대로)

## 데이터베이스 모델

### User (사용자)
- Email, PasswordHash, Nickname, ProfileImage
- ClearedStages (클리어한 스테이지 목록)
- LionStats (HP, MaxHP, Level)
- UnlockedContent (잠금 해제된 콘텐츠)
- Settings (사운드, 알림 설정)

### Idiom (사자성어)
- IdiomId, Hanja, Hangul, Meaning
- ExampleSentence, BaseDifficulty

### GameStage (게임 스테이지)
- StageId, BossName, BossHp, BossAttack
- Description, ImageUrl

### LearningLog (학습 로그)
- UserId, IdiomId, ActionType (ATTACK/DEFEND/LEARN)
- ChosenDifficulty, IsCorrect, ResponseTimeMs
- CalculatedDamage, Timestamp

## 개발 환경

- **IDE**: Visual Studio 2022 또는 Visual Studio Code + C# Extension
- **Unity**: Unity 2021 LTS 이상
- **.NET**: .NET 8.0 SDK
- **Database**: MongoDB 6.0 이상

## 테스트

### Swagger UI를 통한 API 테스트

1. 백엔드 실행 후 `http://localhost:5000/swagger` 접속
2. `POST /api/auth/signup`으로 계정 생성
3. `POST /api/auth/login`으로 JWT 토큰 획득
4. "Authorize" 버튼 클릭 → `Bearer {token}` 입력
5. 다른 API 엔드포인트 테스트

## 향후 구현 계획

### 백엔드
- [ ] 데이터 시드 스크립트 (C# 콘솔 앱)
- [ ] 통계 API (IdiomController)
- [ ] 사용자 설정 API (UserController)
- [ ] PvP 대전 로직
- [ ] 관리자 API (사자성어 CRUD)

### Unity 클라이언트
- [ ] UI 디자인 및 레이아웃
- [ ] 애니메이션 (HP 바, 공격 이펙트)
- [ ] 효과음 / 배경음악
- [ ] 파티클 이펙트
- [ ] 씬 전환 애니메이션
- [ ] 로딩 화면 및 에러 팝업

### 게임 콘텐츠
- [ ] 히든 보스전
- [ ] 무한 모드
- [ ] PvP 모드
- [ ] 업적 시스템
- [ ] 랭킹 시스템

## 라이선스

GPL-3.0 License

## 작성자

loremipsum0116

## 버전

2.0.0 (C# 리팩토링 버전)

## 참고 문서

- [C# 상세 가이드](README_CSHARP.md) - ASP.NET Core 및 Unity 구현 상세
- [구현내용상세.txt](구현내용상세.txt) - 전체 구현 내용 및 설명
