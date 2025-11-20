/**
 * 게임 상수 및 설정
 */

/**
 * 난이도 설정 (FR 7.1, FR 7.2)
 */
export const GAME_CONSTANTS = {
  DIFFICULTY: {
    EASY: {
      name: '초급',
      baseDamage: 10,
      timeLimit: 15000, // 15초
      color: 0x4ade80  // 초록색
    },
    MEDIUM: {
      name: '중급',
      baseDamage: 20,
      timeLimit: 10000, // 10초
      color: 0xfacc15  // 노란색
    },
    HARD: {
      name: '고급',
      baseDamage: 30,
      timeLimit: 5000,  // 5초
      color: 0xf87171  // 빨간색
    }
  },

  BATTLE: {
    PLAYER_MAX_HP: 100,
    BOSS_BASE_ATTACK: 15,
    DEFENSE_MULTIPLIER_SUCCESS: 0.3,
    DEFENSE_MULTIPLIER_FAIL: 1.0
  },

  STAGES: [
    { id: 1, name: '토끼', emoji: '🐰', bossHp: 100, bossAttack: 10, image: '/pictures/rabbit.png', description: '평화로운 토끼, 여정의 시작' },
    { id: 2, name: '양', emoji: '🐑', bossHp: 120, bossAttack: 12, image: '/pictures/sheep.png', description: '온순한 양, 따뜻한 시험' },
    { id: 3, name: '원숭이', emoji: '🐵', bossHp: 140, bossAttack: 14, image: '/pictures/monkey.png', description: '영리한 원숭이, 지혜의 도전' },
    { id: 4, name: '쥐', emoji: '🐭', bossHp: 160, bossAttack: 16, image: '/pictures/mouse.png', description: '민첩한 쥐, 초급의 마지막 관문' },
    { id: 5, name: '돼지', emoji: '🐷', bossHp: 180, bossAttack: 18, image: '/pictures/pig.png', description: '강건한 돼지, 중급의 시작' },
    { id: 6, name: '개', emoji: '🐶', bossHp: 200, bossAttack: 20, image: '/pictures/dog.png', description: '충직한 개, 충성의 시험' },
    { id: 7, name: '소', emoji: '🐮', bossHp: 220, bossAttack: 22, image: '/pictures/bull.png', description: '우직한 소, 인내의 벽' },
    { id: 8, name: '뱀', emoji: '🐍', bossHp: 240, bossAttack: 24, image: '/pictures/snake.png', description: '신비로운 뱀, 중급의 마지막 시련' },
    { id: 9, name: '말', emoji: '🐴', bossHp: 260, bossAttack: 26, image: '/pictures/horse.png', description: '질주하는 말, 고급의 서막' },
    { id: 10, name: '봉황', emoji: '🐔', bossHp: 280, bossAttack: 28, image: '/pictures/chicken.png', description: '불사조 봉황, 불꽃의 심판' },
    { id: 11, name: '용', emoji: '🐲', bossHp: 300, bossAttack: 30, image: '/pictures/dragon.png', description: '천상의 용, 하늘의 지배자' },
    { id: 12, name: '호랑이', emoji: '🐯', bossHp: 500, bossAttack: 35, image: '/pictures/tiger.png', description: '백수의 왕 호랑이, 최종 보스' }
  ],

  ANIMATIONS: {
    ATTACK_DURATION: 300,
    HURT_DURATION: 200,
    VICTORY_DURATION: 500
  },

  COLORS: {
    PRIMARY: 0x667eea,
    SECONDARY: 0x764ba2,
    SUCCESS: 0x4ade80,
    WARNING: 0xfacc15,
    DANGER: 0xf87171,
    INFO: 0x60a5fa
  },

  /**
   * 사자(플레이어) 레벨 정보
   */
  LION_LEVELS: {
    BASIC: {
      name: '견습 사자',
      image: '/pictures/lion-basic.png',
      minStage: 1,
      maxStage: 4,
      description: '여정을 시작한 방랑 검객',
      hpBonus: 0,        // 체력 보너스
      attackBonus: 0     // 공격력 보너스 (%)
    },
    INTERMEDIATE: {
      name: '전사 사자',
      image: '/pictures/lion-intermediate.png',
      minStage: 5,
      maxStage: 8,
      description: '실력을 쌓은 중견 전사',
      hpBonus: 100,      // +100 HP (기본 100 + 100 = 200)
      attackBonus: 5     // +5% 데미지
    },
    ADVANCED: {
      name: '대장군 사자',
      image: '/pictures/lion-advanced.png',
      minStage: 9,
      maxStage: 12,
      description: '전장을 호령하는 백전노장',
      hpBonus: 200,      // +200 HP (기본 100 + 200 = 300)
      attackBonus: 10    // +10% 데미지
    },
    KING: {
      name: '사자왕',
      image: '/pictures/lion-king.png',
      minStage: 13,      // 12단계 클리어 후에만 도달
      maxStage: 99,
      description: '마침내 호랑이를 무찌르고 권위를 되찾은 사자 왕',
      hpBonus: 500,      // +500 HP (기본 100 + 500 = 600)
      attackBonus: 20,   // +20% 데미지
      damageBonus: 50    // +50 고정 데미지 추가 (사자왕 전용)
    }
  }
};

/**
 * API 엔드포인트
 */
export const API_ENDPOINTS = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    ME: '/auth/me'
  },
  GAME: {
    STAGES: '/game/stages',
    ATTACK: '/game/attack',
    DEFEND: '/game/defend',
    CLEAR: '/game/clear',
    PROGRESS: '/game/progress'
  },
  IDIOM: {
    QUIZ: '/game/quiz',
    RANDOM: '/game/quiz/random'
  },
  STATS: {
    USER: '/stats/user',
    LEADERBOARD: '/stats/leaderboard'
  }
};
