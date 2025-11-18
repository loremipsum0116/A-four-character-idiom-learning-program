# 웹 기반 게임 리팩토링 계획서

## 1. 개요

Unity 기반에서 **완전한 웹 기반 게임**으로 전환합니다.

### 전환 이유
- Unity 학습 곡선 제거
- 브라우저에서 즉시 실행 가능
- 제스처 인식 (MediaPipe) 통합 용이
- 빠른 프로토타이핑 및 배포

---

## 2. 기술 스택

### 프론트엔드
| 기술 | 용도 | 선택 이유 |
|------|------|-----------|
| **Vite** | 빌드 도구 | 빠른 개발 서버, HMR |
| **Phaser 3** | 2D 게임 엔진 | 웹 게임 표준, Canvas/WebGL 지원 |
| **MediaPipe Hands** | 제스처 인식 | Google의 안정적인 손동작 인식 |
| **Tailwind CSS** | UI 스타일링 | 빠른 UI 개발 |
| **Chart.js** | 통계 시각화 | 학습 데이터 그래프 |

### 백엔드
| 기술 | 용도 | 상태 |
|------|------|------|
| **ASP.NET Core 8.0** | REST API | ✓ 이미 구현됨 |
| **MongoDB** | 데이터베이스 | ✓ 이미 설계됨 |
| **JWT** | 인증 | ✓ 이미 구현됨 |

---

## 3. 프로젝트 구조

```
idiom-game-web/
├── frontend/                      # 웹 클라이언트 (새로 생성)
│   ├── public/
│   │   ├── assets/
│   │   │   ├── sprites/           # 캐릭터 스프라이트
│   │   │   │   ├── lion/          # 사자 (플레이어)
│   │   │   │   ├── rat/           # 쥐 보스
│   │   │   │   ├── ox/            # 소 보스
│   │   │   │   └── ... (12지신)
│   │   │   ├── backgrounds/       # 배경 이미지
│   │   │   ├── ui/                # UI 요소
│   │   │   └── sounds/            # 효과음/BGM
│   │   └── index.html
│   ├── src/
│   │   ├── main.js                # 엔트리 포인트
│   │   ├── game/
│   │   │   ├── config.js          # Phaser 설정
│   │   │   └── scenes/            # 게임 씬들
│   │   │       ├── BootScene.js   # 로딩 씬
│   │   │       ├── LoginScene.js  # 로그인 (FR 1.1, 1.2)
│   │   │       ├── MainMenuScene.js # 메인 화면 (FR 2.1)
│   │   │       ├── LearningModeScene.js # 학습 모드 (FR 3.0)
│   │   │       ├── StageSelectScene.js # 스테이지 선택 (FR 4.1)
│   │   │       ├── BattleScene.js # 턴제 전투 (FR 4.0) ★핵심★
│   │   │       ├── StatisticsScene.js # 통계 (FR 6.0)
│   │   │       ├── EndingScene.js # 엔딩 (FR 5.1)
│   │   │       └── PvPScene.js    # PvP (FR 5.5)
│   │   ├── services/
│   │   │   ├── APIClient.js       # 백엔드 API 통신
│   │   │   ├── AuthService.js     # 인증 관리
│   │   │   └── GestureRecognition.js # MediaPipe 제스처
│   │   ├── managers/
│   │   │   ├── CombatManager.js   # 전투 로직 관리
│   │   │   ├── AnimationManager.js # 애니메이션 관리
│   │   │   └── SoundManager.js    # 사운드 관리
│   │   ├── ui/
│   │   │   ├── components/        # React 기반 UI 컴포넌트
│   │   │   │   ├── HPBar.jsx
│   │   │   │   ├── QuizPanel.jsx
│   │   │   │   ├── DifficultySelector.jsx
│   │   │   │   └── DamageText.jsx
│   │   │   └── overlays/          # 게임 위 오버레이
│   │   │       ├── GestureOverlay.jsx # 웹캠 + 제스처 인식
│   │   │       └── StatsOverlay.jsx
│   │   ├── utils/
│   │   │   ├── constants.js       # 상수 정의
│   │   │   ├── damageCalculator.js # 데미지 계산 (FR 7.0)
│   │   │   └── validators.js      # 유효성 검증
│   │   └── styles/
│   │       └── main.css
│   ├── package.json
│   └── vite.config.js
│
├── Backend/                       # 기존 백엔드 (유지)
│   └── ... (기존 ASP.NET Core 프로젝트)
│
└── docs/
    ├── API.md                     # API 문서
    ├── GESTURE_GUIDE.md           # 제스처 사용법
    └── DEPLOYMENT.md              # 배포 가이드
```

---

## 4. 씬(Scene) 구조 및 요구사항 매핑

### 4.1. LoginScene (FR 1.1, 1.2)
```javascript
기능:
- 회원가입 폼
- 로그인 폼
- JWT 토큰 획득 및 저장
```

### 4.2. MainMenuScene (FR 2.1, 2.2)
```javascript
기능:
- 학습 모드 버튼
- 게임 모드 버튼
- 개인 기록 버튼
- 환경 설정 버튼
```

### 4.3. LearningModeScene (FR 3.0)
```javascript
기능:
- 빈칸 맞추기 퀴즈 (FR 3.2)
- 카드 매칭 게임 (FR 3.3)
- 학습 데이터 수집 (FR 6.1)
```

### 4.4. StageSelectScene (FR 4.1)
```javascript
기능:
- 12지신 스테이지 맵 표시
- 클리어 상태 표시
- 보스 선택 → BattleScene 이동
```

### 4.5. BattleScene (FR 4.0) ★핵심★
```javascript
기능:
- 턴제 전투 진입 (FR 4.2)
- [공격 턴]
  1. 난이도 선택 UI (FR 4.3)
  2. 사자성어 문제 출제 (FR 4.4)
  3. 정답 여부 + 응답 속도 측정 (FR 4.5)
  4. 데미지 연산 (FR 4.6, FR 7.1)
  5. 보스 HP 감소 애니메이션
- [방어 턴]
  1. 방어 문제 출제 (FR 4.7)
  2. 데미지 감소 처리 (FR 4.8, FR 7.3)
  3. 플레이어 HP 감소 애니메이션
- 승리/패배 처리 (FR 4.9, 4.10)
- 통계 표시 (FR 4.11)
```

### 4.6. StatisticsScene (FR 6.0)
```javascript
기능:
- 학습 데이터 시각화 (FR 6.3)
- Chart.js 그래프
  - 단계별 정확도
  - 평균 응답 시간
  - 난이도별 성공률
```

### 4.7. EndingScene (FR 5.0)
```javascript
기능:
- 엔딩 화면 (FR 5.1)
- 엔딩 콘텐츠 잠금 해제 (FR 5.2)
- 히든 보스전, 무한 모드, PvP 버튼
```

---

## 5. 데미지 계산 로직 (FR 7.0)

### 5.1. 공격 데미지 (utils/damageCalculator.js)

```javascript
/**
 * 공격 데미지 계산
 * Final_Damage = (BaseDamage × Accuracy) + BonusDamage
 */
export function calculateAttackDamage(difficulty, isCorrect, responseTimeMs) {
  // 난이도별 기본 데미지 (FR 7.1)
  const baseDamage = {
    EASY: 10,
    MEDIUM: 20,
    HARD: 30
  }[difficulty];

  // 정확도 (FR 7.1)
  const accuracy = isCorrect ? 1.0 : 0.0;

  // 제한 시간 (FR 7.2)
  const timeLimit = {
    EASY: 15000,   // 15초
    MEDIUM: 10000, // 10초
    HARD: 5000     // 5초
  }[difficulty];

  // 보너스 데미지 (FR 7.1)
  let bonusDamage = 0;
  if (responseTimeMs <= timeLimit && isCorrect) {
    const ratio = 1.0 - (responseTimeMs / timeLimit);
    bonusDamage = Math.floor(ratio * 10);
  }

  // 최종 데미지
  const finalDamage = (baseDamage * accuracy) + bonusDamage;
  return Math.max(0, finalDamage);
}
```

### 5.2. 방어 데미지 (FR 7.3)

```javascript
/**
 * 방어 데미지 계산
 * Damage_Taken = Base_Boss_Damage × multiplier
 */
export function calculateDefenseDamage(baseBossDamage, defenseSuccess) {
  const multiplier = defenseSuccess ? 0.3 : 1.0;
  return Math.ceil(baseBossDamage * multiplier);
}
```

---

## 6. 제스처 인식 시스템

### 6.1. 지원 제스처

| 제스처 | 동작 | 용도 |
|--------|------|------|
| ✊ 주먹 | 공격 의사 표시 | 공격 턴 시작 |
| ✋ 손바닥 | 방어 의사 표시 | 방어 턴 시작 |
| ☝️ 1개 손가락 | 초급 선택 | 난이도 선택 |
| ✌️ 2개 손가락 | 중급 선택 | 난이도 선택 |
| 🤟 3개 손가락 | 고급 선택 | 난이도 선택 |

### 6.2. 구현 방식

```javascript
// services/GestureRecognition.js
import { HandLandmarker } from '@mediapipe/tasks-vision';

export class GestureRecognition {
  async initialize() {
    // MediaPipe 초기화
    // 웹캠 시작
    // 실시간 제스처 감지
  }

  detectGesture(landmarks) {
    // 손가락 위치 분석
    // 제스처 타입 반환
  }
}
```

---

## 7. 2D 캐릭터 애니메이션

### 7.1. 필요한 애니메이션

**사자 (플레이어):**
- `lion_idle` - 대기 (2-4프레임)
- `lion_attack` - 공격 (4-6프레임)
- `lion_defend` - 방어 (3-4프레임)
- `lion_hurt` - 피격 (2-3프레임)
- `lion_victory` - 승리 (4-6프레임)

**12지신 보스 (각각):**
- `{boss}_idle` - 대기 (2-4프레임)
- `{boss}_attack` - 공격 (4-6프레임)
- `{boss}_hurt` - 피격 (2-3프레임)
- `{boss}_death` - 사망 (4-6프레임)

### 7.2. 스프라이트 시트 생성 계획

1. AI 이미지 생성 (Leonardo.ai / DALL-E)
2. 배경 제거 (remove.bg)
3. 스프라이트 시트 제작 (Free Texture Packer)
4. Phaser에서 로드 및 애니메이션 생성

---

## 8. API 연동

### 8.1. APIClient 서비스

```javascript
// services/APIClient.js
export class APIClient {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.token = localStorage.getItem('jwt_token');
  }

  // FR 1.1 - 회원가입
  async signup(email, password, nickname) { }

  // FR 1.2 - 로그인
  async login(email, password) { }

  // FR 4.6 - 공격 처리
  async attackBoss(stageId, idiomId, difficulty, isCorrect, responseTimeMs) { }

  // FR 4.8 - 방어 처리
  async defendBoss(stageId, idiomId, defenseSuccess, responseTimeMs, bossDamage) { }

  // FR 4.9 - 스테이지 클리어
  async clearStage(stageId) { }

  // FR 6.0 - 통계 조회
  async getStatistics() { }
}
```

---

## 9. 개발 단계

### Phase 1: 기본 프로젝트 설정 (1일)
- [x] Vite 프로젝트 생성
- [ ] Phaser 설정
- [ ] 기본 씬 구조 생성
- [ ] APIClient 구현

### Phase 2: 핵심 전투 시스템 (3일)
- [ ] BattleScene 구현
- [ ] 난이도 선택 UI
- [ ] 퀴즈 시스템
- [ ] 데미지 계산 로직
- [ ] HP 바 애니메이션

### Phase 3: 캐릭터 애니메이션 (2일)
- [ ] AI로 캐릭터 이미지 생성
- [ ] 스프라이트 시트 제작
- [ ] Phaser 애니메이션 통합
- [ ] 공격/방어 이펙트

### Phase 4: 제스처 인식 (2일)
- [ ] MediaPipe 통합
- [ ] 제스처 감지 로직
- [ ] UI 오버레이
- [ ] 테스트 및 보정

### Phase 5: 나머지 기능 (3일)
- [ ] 학습 모드
- [ ] 통계 시스템
- [ ] 엔딩 콘텐츠
- [ ] PvP 모드

### Phase 6: 테스트 & 배포 (2일)
- [ ] 통합 테스트
- [ ] 버그 수정
- [ ] Vercel 배포
- [ ] 문서 작성

**총 예상 기간: 13일**

---

## 10. 마이그레이션 전략

### Unity → Web 변환

| Unity 컴포넌트 | Web 대체 |
|----------------|----------|
| MonoBehaviour | Phaser Scene |
| GameObject | Phaser Sprite/Container |
| UnityWebRequest | Fetch API |
| PlayerPrefs | localStorage |
| Animator | Phaser Animations |
| Canvas UI | HTML/CSS + Phaser UI |

### 기존 코드 재활용

```
✓ Backend API - 100% 재사용
✓ 데미지 계산 로직 - JavaScript로 포팅
✓ 데이터 모델 - JSON으로 직렬화
✗ Unity Scripts - 완전히 새로 작성
```

---

## 11. 비기능 요구사항 충족

| 요구사항 | 구현 방법 |
|----------|-----------|
| 플랫폼: 웹/모바일 | 반응형 디자인, PWA 지원 |
| 성능: 200ms 이내 | Vite HMR, 최적화된 번들링 |
| 데이터 영속성 | 백엔드 MongoDB 저장 |
| UI/UX | Phaser + Tailwind CSS |
| 보안 | JWT 인증, HTTPS |
| 확장성 | 모듈화된 구조 |

---

## 12. 다음 단계

1. ✅ 이 문서 작성 완료
2. ⏩ Vite 프로젝트 생성
3. ⏩ Phaser 게임 엔진 통합
4. ⏩ BattleScene 프로토타입 구현

---

**작성일**: 2025-11-18
**작성자**: Claude Code
**목표**: Unity 없이 웹 브라우저에서 즉시 실행 가능한 사자성어 학습 게임
