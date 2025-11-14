# 사자성어 학습 프로그램 (C# / Unity 버전)

## 프로젝트 개요

유니티 엔진과 연계 가능한 **C# 기반** 턴제 전투 사자성어 학습 프로그램입니다.

### 기술 스택

**백엔드**
- ASP.NET Core 8.0
- MongoDB Driver
- JWT Authentication (Bearer Token)
- BCrypt.Net for password hashing
- Swagger/OpenAPI

**프론트엔드 (Unity)**
- Unity 2021.3 LTS 이상
- C# UnityWebRequest for HTTP communication
- JSON serialization

## 프로젝트 구조

```
├── Backend/                    # ASP.NET Core API
│   ├── Models/                # 데이터 모델
│   │   ├── User.cs
│   │   ├── Idiom.cs
│   │   ├── GameStage.cs
│   │   └── LearningLog.cs
│   ├── Controllers/           # API 컨트롤러
│   │   ├── AuthController.cs
│   │   └── GameController.cs
│   ├── Services/              # 비즈니스 로직
│   │   ├── AuthService.cs
│   │   └── CombatCalculator.cs  ★핵심 전투 로직★
│   ├── DTOs/                  # 데이터 전송 객체
│   ├── Data/                  # MongoDB 컨텍스트
│   ├── Program.cs             # 애플리케이션 진입점
│   └── appsettings.json       # 설정 파일
│
└── Unity/                     # Unity 클라이언트 스크립트
    └── Scripts/
        ├── API/               # API 통신
        │   └── APIClient.cs
        ├── Models/            # 데이터 모델 (Unity용)
        │   └── DataModels.cs
        └── Game/              # 게임 로직
            └── BattleManager.cs
```

## 설치 및 실행

### 1. 백엔드 (ASP.NET Core API)

#### 요구사항
- .NET 8.0 SDK
- MongoDB (로컬 또는 MongoDB Atlas)

#### 실행 방법

```bash
# 1. Backend 디렉토리로 이동
cd Backend

# 2. 패키지 복원
dotnet restore

# 3. appsettings.json 수정 (MongoDB 연결 문자열 등)

# 4. 실행
dotnet run
```

API는 기본적으로 `http://localhost:5000`에서 실행됩니다.

#### Swagger UI 접속
`http://localhost:5000/swagger`에서 API 문서 확인 및 테스트 가능

### 2. Unity 클라이언트

#### 스크립트 추가 방법

1. Unity 프로젝트 생성 (2021.3 LTS 이상 권장)
2. `Unity/Scripts` 폴더의 모든 C# 파일을 Unity 프로젝트의 `Assets/Scripts/`로 복사
3. `APIClient.cs`의 Inspector에서 `apiBaseUrl` 설정
   - 기본값: `http://localhost:5000/api`

#### 기본 Scene 구성

1. **Empty GameObject** 생성 → `APIClient` 스크립트 추가
2. **Canvas** 생성 → UI 컴포넌트들 추가
3. **Game Manager** 생성 → `BattleManager` 스크립트 추가

## API 엔드포인트

### 인증 (Auth)

```
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
```

### 게임 (Game)

```
GET  /api/game/stages            # 모든 스테이지 조회
GET  /api/game/stages/{id}       # 특정 스테이지 조회
POST /api/game/attack            # 공격 처리 ★핵심★
POST /api/game/defend            # 방어 처리
POST /api/game/clear             # 스테이지 클리어
GET  /api/game/progress          # 진행 상황 조회
```

### 사자성어 (Idioms)

```
GET /api/idioms/quiz/blank       # 빈칸 맞추기 퀴즈
```

## 핵심 기능 구현

### FR 7.0: 전투 연산 로직 (특허 핵심)

위치: `Backend/Services/CombatCalculator.cs`

#### 공격 데미지 계산

```csharp
public static int CalculateAttackDamage(Difficulty difficulty, bool isCorrect, int responseTimeMs)
{
    // 기본 데미지
    int baseDamage = BaseDamage[difficulty];

    // 정확도 (정답=1.0, 오답=0.0)
    double accuracy = isCorrect ? 1.0 : 0.0;

    // 응답 속도 보너스 (0~10)
    int bonusDamage = CalculateBonusDamage(difficulty, responseTimeMs);

    // 최종 데미지 = (기본 데미지 × 정확도) + 보너스
    return (int)(baseDamage * accuracy) + bonusDamage;
}
```

**난이도별 기본 데미지**
- EASY: 10
- MEDIUM: 20
- HARD: 30

**난이도별 제한 시간**
- EASY: 15초
- MEDIUM: 10초
- HARD: 5초

#### 방어 데미지 계산

```csharp
public static int CalculateDefenseDamage(int baseBossDamage, bool defenseSuccess)
{
    // 방어 성공 시 30%만 받음, 실패 시 100%
    double multiplier = defenseSuccess ? 0.3 : 1.0;
    return (int)(baseBossDamage * multiplier);
}
```

### Unity에서 사용 예시

#### 로그인

```csharp
StartCoroutine(APIClient.Instance.Login(
    "test@test.com",
    "password123",
    (response) => {
        Debug.Log($"Login success: {response.user.nickname}");
        // 메인 화면으로 이동
    },
    (error) => {
        Debug.LogError($"Login failed: {error}");
    }
));
```

#### 공격 처리

```csharp
var attackRequest = new AttackRequest
{
    stageId = 1,
    idiomId = 5,
    difficulty = (int)Difficulty.MEDIUM,
    isCorrect = true,
    responseTimeMs = 3500
};

StartCoroutine(APIClient.Instance.ProcessAttack(
    attackRequest,
    (response) => {
        Debug.Log($"Damage: {response.damage}");
        bossHp -= response.damage;
    },
    (error) => {
        Debug.LogError(error);
    }
));
```

## 데이터베이스 초기화

MongoDB에 초기 데이터를 넣으려면:

1. `idioms.json` 파일을 MongoDB에 import
```bash
mongoimport --db idiom_learning --collection idioms --file idioms.json --jsonArray
```

2. 12지신 스테이지 데이터 삽입 (MongoDB Compass 또는 코드로)

## 환경 설정

### appsettings.json

```json
{
  "ConnectionStrings": {
    "MongoDB": "mongodb://localhost:27017"
  },
  "DatabaseName": "idiom_learning",
  "Jwt": {
    "SecretKey": "your-secret-key-minimum-32-characters",
    "Issuer": "IdiomLearningAPI",
    "Audience": "IdiomLearningClient"
  }
}
```

### Unity APIClient 설정

Inspector에서 설정:
- **Api Base Url**: `http://localhost:5000/api`
  - 모바일 빌드 시: 실제 서버 IP로 변경
  - 예: `http://192.168.0.10:5000/api`

## 보안

- JWT 토큰은 Unity PlayerPrefs에 저장
- 비밀번호는 BCrypt로 해싱 (salt round 10)
- HTTPS 사용 권장 (프로덕션 환경)

## 개발 팁

### Unity에서 디버깅

```csharp
// API 호출 로그
Debug.Log($"Request: {JsonUtility.ToJson(request)}");

// 응답 확인
Debug.Log($"Response: {www.downloadHandler.text}");
```

### CORS 설정

개발 중에는 모든 Origin 허용:
```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

프로덕션에서는 특정 Origin만 허용하도록 변경 필요

## 빌드

### 백엔드 빌드

```bash
dotnet publish -c Release -o ./publish
```

### Unity 빌드

1. File → Build Settings
2. Platform 선택 (PC, Android, iOS 등)
3. Build

**주의**: 모바일 빌드 시 `apiBaseUrl`을 실제 서버 주소로 변경해야 함

## 향후 개발 과제

### 백엔드
- [ ] 통계 API 추가
- [ ] PvP 기능 구현
- [ ] 이미지 업로드 기능
- [ ] Redis 캐싱
- [ ] 테스트 코드 작성

### Unity
- [ ] UI 구현 (로그인, 메인, 전투 화면 등)
- [ ] 애니메이션 추가
- [ ] 사운드 효과
- [ ] 보스 캐릭터 스프라이트
- [ ] 이펙트 시스템
- [ ] 세이브/로드 시스템

## 라이선스

MIT License

## 작성자

loremipsum0116

---

**Note**: 이 프로젝트는 Node.js 버전에서 C#/Unity 버전으로 리팩토링되었습니다.
