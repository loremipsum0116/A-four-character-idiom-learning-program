# 🦁 사자의 역습 - 웹 게임 프론트엔드

**요구사항 정의서 기반 웹 게임 구현**

Unity 없이 순수 웹 기술(Phaser.js)로 구현한 사자성어 학습 게임입니다.

---

## 📋 프로젝트 개요

- **프로젝트명**: 강약 조절 데미지 연동형 턴제 전투 사자성어 학습 프로그램
- **플랫폼**: 웹 (데스크탑 & 모바일 브라우저)
- **엔진**: Phaser 3 (2D 게임 엔진)
- **특징**: 학습 성과가 전투 데미지로 직접 연동되는 특허 기술 구현

---

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저가 자동으로 열립니다: `http://localhost:3000`

### 3. 백엔드 서버 실행

백엔드 API가 필요합니다:

```bash
cd ../Backend
dotnet run
```

백엔드 서버: `http://localhost:5000`

---

## 📁 프로젝트 구조

```
frontend/
├── public/
│   └── assets/               # 게임 에셋 (이미지, 사운드)
├── src/
│   ├── game/
│   │   ├── config.js         # Phaser 설정
│   │   └── scenes/           # 게임 씬들
│   │       ├── BootScene.js          # 로딩
│   │       ├── LoginScene.js         # 로그인/회원가입
│   │       ├── MainMenuScene.js      # 메인 메뉴
│   │       ├── StageSelectScene.js   # 스테이지 선택
│   │       ├── BattleScene.js        # ⭐ 턴제 전투 (핵심)
│   │       ├── LearningModeScene.js  # 학습 모드
│   │       ├── StatisticsScene.js    # 통계
│   │       ├── EndingScene.js        # 엔딩
│   │       └── PvPScene.js           # PvP
│   ├── services/
│   │   ├── APIClient.js      # 백엔드 API 통신
│   │   └── GestureRecognition.js # MediaPipe 제스처 인식
│   ├── utils/
│   │   └── damageCalculator.js # ⭐ 데미지 계산 로직 (특허)
│   ├── styles/
│   │   └── main.css
│   └── main.js               # 엔트리 포인트
├── package.json
├── vite.config.js
└── README.md
```

---

## 🎮 게임 기능

### 구현 완료 ✅

| 기능 | 요구사항 | 상태 |
|------|----------|------|
| **로그인/회원가입** | FR 1.1, 1.2 | ✅ 완료 |
| **메인 메뉴** | FR 2.1 | ✅ 완료 |
| **12지신 스테이지 선택** | FR 4.1 | ✅ 완료 |
| **턴제 전투 시스템** | FR 4.0 | ✅ 완료 |
| **난이도 선택** | FR 4.3 | ✅ 완료 |
| **퀴즈 문제 풀이** | FR 4.4 | ✅ 완료 |
| **데미지 연산 로직** | FR 7.0 | ✅ 완료 (특허 핵심) |
| **공격/방어 턴** | FR 4.6, 4.8 | ✅ 완료 |
| **승리/패배 처리** | FR 4.9, 4.10 | ✅ 완료 |

### 준비 중 🚧

| 기능 | 요구사항 | 상태 |
|------|----------|------|
| **학습 모드** | FR 3.0 | 🚧 UI만 구현 |
| **통계 시스템** | FR 6.0 | 🚧 UI만 구현 |
| **제스처 인식** | - | 🚧 준비 중 |
| **2D 캐릭터 애니메이션** | - | 🚧 준비 중 |
| **PvP 모드** | FR 5.5 | 🚧 UI만 구현 |

---

## ⚔️ 핵심 기능: 턴제 전투

### BattleScene 동작 흐름

```
1. 전투 시작
   └─ 플레이어 HP: 100, 보스 HP: 스테이지별 설정

2. [플레이어 공격 턴]
   ├─ 난이도 선택 (초급/중급/고급)
   ├─ 사자성어 퀴즈 출제
   ├─ 제한 시간 내 답안 제출
   ├─ 데미지 계산 (난이도 + 정확도 + 응답속도)
   └─ 보스 HP 감소

3. [보스 공격 턴]
   ├─ 방어 퀴즈 출제
   ├─ 답안 제출
   ├─ 방어 성공/실패에 따라 데미지 감소
   └─ 플레이어 HP 감소

4. 2~3 반복
   └─ 보스 HP 0 → 승리
   └─ 플레이어 HP 0 → 패배
```

### 데미지 계산 공식 (특허 핵심)

**공격 데미지** (FR 7.1):
```
Final_Damage = (BaseDamage × Accuracy) + BonusDamage

- BaseDamage: 초급(10), 중급(20), 고급(30)
- Accuracy: 정답(1.0), 오답(0.0)
- BonusDamage: 응답속도에 따라 0~10점
```

**방어 데미지** (FR 7.3):
```
Damage_Taken = Base_Boss_Damage × Defense_Multiplier

- Defense_Multiplier: 방어 성공(0.3), 실패(1.0)
```

**예시**:
- 고급 + 정답 + 1초 응답 = 30 × 1.0 + 8 = **38 데미지**
- 중급 + 오답 + 3초 응답 = 20 × 0.0 + 0 = **0 데미지**
- 보스 공격력 15, 방어 성공 = 15 × 0.3 = **5 데미지**

---

## 🎯 제스처 인식 (준비 중)

MediaPipe Hands를 사용한 손동작 인식 기능을 추가할 예정입니다.

### 지원 예정 제스처

| 제스처 | 동작 |
|--------|------|
| ✊ 주먹 | 공격 |
| ✋ 손바닥 | 방어 |
| ☝️ 1개 손가락 | 초급 선택 |
| ✌️ 2개 손가락 | 중급 선택 |
| 🤟 3개 손가락 | 고급 선택 |

### 통합 방법

```javascript
import { GestureRecognition } from './services/GestureRecognition.js';

const gesture = new GestureRecognition();
await gesture.initialize();

gesture.on('detected', (type) => {
  if (type === 'ATTACK') {
    // 공격 턴 시작
  }
});
```

---

## 🛠️ 개발 가이드

### 새로운 씬 추가

1. `src/game/scenes/` 폴더에 새 파일 생성
2. `Phaser.Scene`을 상속하는 클래스 작성
3. `src/game/config.js`의 `scene` 배열에 추가

```javascript
// NewScene.js
import Phaser from 'phaser';

export default class NewScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NewScene' });
  }

  create() {
    // 씬 로직
  }
}

// config.js
import NewScene from './scenes/NewScene.js';

export const gameConfig = {
  scene: [
    // ... 기존 씬들
    NewScene
  ]
};
```

### API 호출 추가

`services/APIClient.js`에 새 메서드 추가:

```javascript
async getNewData() {
  return await this.request('/api/new-endpoint');
}
```

### 데미지 계산 로직 수정

`utils/damageCalculator.js` 파일 수정

---

## 📦 빌드 & 배포

### 프로덕션 빌드

```bash
npm run build
```

빌드 결과물: `dist/` 폴더

### Vercel 배포

```bash
npm install -g vercel
vercel
```

### 환경 변수 설정

`.env` 파일 생성:

```env
VITE_API_URL=http://localhost:5000/api
```

프로덕션 환경:

```env
VITE_API_URL=https://your-backend-api.com/api
```

---

## 🐛 트러블슈팅

### CORS 에러

백엔드 `Program.cs`에서 CORS 설정:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader());
});

app.UseCors("AllowAll");
```

### 인증 실패

1. 백엔드 서버가 실행 중인지 확인
2. localStorage에 `jwt_token`이 저장되어 있는지 확인
3. F12 개발자 도구 → Network 탭에서 API 요청 확인

### 게임이 표시되지 않음

1. 브라우저 콘솔(F12)에서 에러 확인
2. `npm run dev` 명령이 정상적으로 실행 중인지 확인
3. 캐시 삭제 후 새로고침 (Ctrl + Shift + R)

---

## 📝 TODO

- [ ] MediaPipe 제스처 인식 통합
- [ ] 2D 캐릭터 스프라이트 애니메이션
- [ ] 학습 모드 완성 (빈칸 맞추기, 카드 매칭)
- [ ] 통계 시스템 (Chart.js 그래프)
- [ ] 효과음 & 배경음악
- [ ] PvP 모드 실시간 대전
- [ ] 모바일 반응형 UI 개선

---

## 📄 라이선스

GPL-3.0 License

---

## 👤 작성자

loremipsum0116

---

## 🔗 관련 링크

- [요구사항 정의서](../요구사항%20정의서.pdf)
- [Phaser 3 공식 문서](https://photonstorm.github.io/phaser3-docs/)
- [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
