// 사용자 타입
export interface User {
  id: string;
  email: string;
  nickname: string;
  clearedStages: number[];
  lionStats: LionStats;
  unlockedContent: UnlockedContent;
  settings?: Settings;
}

export interface LionStats {
  hp: number;
  maxHp: number;
  level: number;
}

export interface UnlockedContent {
  hiddenBoss: boolean;
  infiniteMode: boolean;
  pvpMode: boolean;
}

export interface Settings {
  sound: boolean;
  notification: boolean;
}

// 사자성어 타입
export interface Idiom {
  idiom_id: number;
  hanja: string;
  hangul: string;
  meaning: string;
  example_sentence: string;
  base_difficulty: Difficulty;
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

// 게임 스테이지 타입
export interface GameStage {
  stage_id: number;
  boss_name: string;
  boss_hp: number;
  boss_attack_power: number;
  boss_image_url?: string;
  zodiac_animal: string;
  description: string;
}

// 학습 로그 타입
export interface LearningLog {
  _id: string;
  user_id: string;
  stage_id?: number;
  idiom_id: number;
  action_type: 'ATTACK' | 'DEFEND' | 'LEARN';
  chosen_difficulty?: Difficulty;
  is_correct: boolean;
  response_time_ms: number;
  calculated_damage: number;
  timestamp: Date;
}

// 퀴즈 타입
export interface BlankQuiz {
  idiom_id: number;
  question: string;
  hangul: string;
  meaning: string;
  options: string[];
  correctAnswer: string;
  blankPosition: number;
}

export interface Card {
  id: string;
  type: 'hanja' | 'meaning';
  content: string;
  idiom_id: number;
}

export interface CardMatchingQuiz {
  cards: Card[];
  totalPairs: number;
}

// 통계 타입
export interface UserStats {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  averageResponseTime: number;
  totalDamage: number;
  byDifficulty: {
    [key in Difficulty]?: DifficultyStats;
  };
  byActionType: {
    [key: string]: ActionStats;
  };
}

export interface DifficultyStats {
  total: number;
  correct: number;
  accuracy: number;
  averageResponseTime: number;
}

export interface ActionStats {
  total: number;
  correct: number;
  accuracy: number;
}

export interface StageStats {
  stageId: number;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  totalDamage: number;
  attackSuccessRate: number;
  averageResponseTime: number;
}

// API 응답 타입
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// 인증 관련 타입
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

// 게임 플레이 타입
export interface AttackRequest {
  stageId: number;
  idiomId: number;
  difficulty: Difficulty;
  isCorrect: boolean;
  responseTimeMs: number;
}

export interface AttackResponse {
  damage: number;
  isCorrect: boolean;
  difficulty: Difficulty;
  responseTimeMs: number;
  message: string;
}

export interface DefenseRequest {
  stageId: number;
  idiomId: number;
  defenseSuccess: boolean;
  responseTimeMs: number;
  bossDamage: number;
}

export interface DefenseResponse {
  damageTaken: number;
  defenseSuccess: boolean;
  message: string;
}
