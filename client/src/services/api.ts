import axios from 'axios';
import type {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  User,
  Idiom,
  GameStage,
  BlankQuiz,
  CardMatchingQuiz,
  AttackRequest,
  AttackResponse,
  DefenseRequest,
  DefenseResponse,
  UserStats,
  StageStats,
  LearningLog,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 또는 인증 실패
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== 인증 API =====
export const authAPI = {
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  },
};

// ===== 사자성어 API =====
export const idiomAPI = {
  getIdioms: async (params?: {
    difficulty?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ idioms: Idiom[]; total: number }> => {
    const response = await api.get<{ idioms: Idiom[]; total: number }>('/idioms', { params });
    return response.data;
  },

  getIdiom: async (idiomId: number): Promise<{ idiom: Idiom }> => {
    const response = await api.get<{ idiom: Idiom }>(`/idioms/${idiomId}`);
    return response.data;
  },

  getBlankQuiz: async (difficulty?: string): Promise<BlankQuiz> => {
    const response = await api.get<BlankQuiz>('/idioms/quiz/blank', {
      params: { difficulty },
    });
    return response.data;
  },

  getCardMatchingQuiz: async (params?: {
    difficulty?: string;
    count?: number;
  }): Promise<CardMatchingQuiz> => {
    const response = await api.get<CardMatchingQuiz>('/idioms/quiz/card-matching', { params });
    return response.data;
  },

  submitLearnResult: async (data: {
    idiomId: number;
    isCorrect: boolean;
    responseTimeMs: number;
    quizType: string;
  }): Promise<{ message: string; isCorrect: boolean }> => {
    const response = await api.post('/idioms/learn/submit', data);
    return response.data;
  },
};

// ===== 게임 API =====
export const gameAPI = {
  getStages: async (): Promise<{ stages: GameStage[] }> => {
    const response = await api.get<{ stages: GameStage[] }>('/game/stages');
    return response.data;
  },

  getStage: async (stageId: number): Promise<{ stage: GameStage }> => {
    const response = await api.get<{ stage: GameStage }>(`/game/stages/${stageId}`);
    return response.data;
  },

  processAttack: async (data: AttackRequest): Promise<AttackResponse> => {
    const response = await api.post<AttackResponse>('/game/attack', data);
    return response.data;
  },

  processDefense: async (data: DefenseRequest): Promise<DefenseResponse> => {
    const response = await api.post<DefenseResponse>('/game/defend', data);
    return response.data;
  },

  clearStage: async (stageId: number): Promise<{
    message: string;
    clearedStages: number[];
    unlockedContent: User['unlockedContent'];
  }> => {
    const response = await api.post('/game/clear', { stageId });
    return response.data;
  },

  getProgress: async (): Promise<{
    clearedStages: number[];
    lionStats: User['lionStats'];
    unlockedContent: User['unlockedContent'];
  }> => {
    const response = await api.get('/game/progress');
    return response.data;
  },
};

// ===== 통계 API =====
export const statsAPI = {
  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get<UserStats>('/stats/user');
    return response.data;
  },

  getStageStats: async (stageId: number): Promise<StageStats> => {
    const response = await api.get<StageStats>(`/stats/stage/${stageId}`);
    return response.data;
  },

  getRecentLogs: async (limit?: number): Promise<{ logs: LearningLog[] }> => {
    const response = await api.get<{ logs: LearningLog[] }>('/stats/recent', {
      params: { limit },
    });
    return response.data;
  },

  getLearningPattern: async (): Promise<{
    dailyStats: Record<string, { total: number; correct: number }>;
    hourlyStats: Record<number, { total: number; correct: number }>;
  }> => {
    const response = await api.get('/stats/pattern');
    return response.data;
  },

  getWrongAnswers: async (): Promise<{ wrongIdioms: Idiom[] }> => {
    const response = await api.get('/stats/wrong-answers');
    return response.data;
  },
};

// ===== 사용자 API =====
export const userAPI = {
  updateSettings: async (settings: Partial<User['settings']>): Promise<{
    message: string;
    settings: User['settings'];
  }> => {
    const response = await api.put('/users/settings', settings);
    return response.data;
  },

  updateProfile: async (profile: {
    nickname?: string;
    profileImage?: string;
  }): Promise<{
    message: string;
    user: Partial<User>;
  }> => {
    const response = await api.put('/users/profile', profile);
    return response.data;
  },

  updateLionStats: async (stats: Partial<User['lionStats']>): Promise<{
    message: string;
    lionStats: User['lionStats'];
  }> => {
    const response = await api.put('/users/lion-stats', stats);
    return response.data;
  },
};

export default api;
