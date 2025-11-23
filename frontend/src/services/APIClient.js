import { API_ENDPOINTS } from '../utils/constants.js';

/**
 * API 클라이언트 서비스
 *
 * 기존 ASP.NET Core 백엔드와 통신
 * JWT 토큰 기반 인증
 */
export class APIClient {
  constructor() {
    this.baseURL = API_ENDPOINTS.BASE_URL;
    this.token = localStorage.getItem('jwt_token') || '';
  }

  /**
   * HTTP 요청 헬퍼
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // JWT 토큰 추가
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // 401 Unauthorized - 토큰 만료
      if (response.status === 401) {
        this.logout();
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      // 네트워크 연결 실패는 조용히 처리 (백엔드 미연결 시 정상)
      if (error.message === 'Failed to fetch') {
        console.log(`[API] 백엔드 서버 미연결 - ${endpoint}`);
      } else {
        console.error(`[API Error] ${endpoint}:`, error);
      }
      throw error;
    }
  }

  // ======================
  // FR 1.0: 인증 API
  // ======================

  /**
   * FR 1.1 - 회원가입
   */
  async signup(email, password, nickname) {
    const data = await this.request(API_ENDPOINTS.AUTH.SIGNUP, {
      method: 'POST',
      body: JSON.stringify({ email, password, nickname })
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  /**
   * FR 1.2 - 로그인
   */
  async login(email, password) {
    const data = await this.request(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  /**
   * 현재 사용자 정보 조회
   */
  async getCurrentUser() {
    return await this.request(API_ENDPOINTS.AUTH.ME);
  }

  /**
   * 로그아웃
   */
  logout() {
    this.token = '';
    localStorage.removeItem('jwt_token');
  }

  /**
   * 토큰 저장
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('jwt_token', token);
  }

  // ======================
  // FR 4.0: 게임 API
  // ======================

  /**
   * FR 4.1 - 전체 스테이지 목록 조회
   */
  async getStages() {
    return await this.request(API_ENDPOINTS.GAME.STAGES);
  }

  /**
   * FR 4.1 - 특정 스테이지 정보 조회
   */
  async getStage(stageId) {
    return await this.request(`${API_ENDPOINTS.GAME.STAGES}/${stageId}`);
  }

  /**
   * FR 4.6 - 공격 처리 (핵심 API)
   *
   * @param {object} attackData
   * @param {number} attackData.stageId - 스테이지 ID
   * @param {number} attackData.idiomId - 사자성어 ID
   * @param {string} attackData.difficulty - 'EASY' | 'MEDIUM' | 'HARD'
   * @param {boolean} attackData.isCorrect - 정답 여부
   * @param {number} attackData.responseTimeMs - 응답 시간 (밀리초)
   * @returns {Promise<{damage: number, isCorrect: boolean, message: string}>}
   */
  async attackBoss(attackData) {
    return await this.request(API_ENDPOINTS.GAME.ATTACK, {
      method: 'POST',
      body: JSON.stringify({
        stageId: attackData.stageId,
        idiomId: attackData.idiomId,
        difficulty: attackData.difficulty,
        isCorrect: attackData.isCorrect,
        responseTimeMs: attackData.responseTimeMs
      })
    });
  }

  /**
   * FR 4.8 - 방어 처리
   *
   * @param {object} defenseData
   * @param {number} defenseData.stageId
   * @param {number} defenseData.idiomId
   * @param {boolean} defenseData.defenseSuccess - 방어 성공 여부
   * @param {number} defenseData.responseTimeMs
   * @param {number} defenseData.bossDamage - 보스의 기본 공격력
   * @returns {Promise<{damageTaken: number}>}
   */
  async defendBoss(defenseData) {
    return await this.request(API_ENDPOINTS.GAME.DEFEND, {
      method: 'POST',
      body: JSON.stringify(defenseData)
    });
  }

  /**
   * FR 4.9 - 스테이지 클리어 처리
   */
  async clearStage(stageId) {
    return await this.request(API_ENDPOINTS.GAME.CLEAR, {
      method: 'POST',
      body: JSON.stringify({ stageId })
    });
  }

  /**
   * 사용자 진행 상황 조회
   */
  async getProgress() {
    return await this.request(API_ENDPOINTS.GAME.PROGRESS);
  }

  // ======================
  // FR 3.0: 학습 모드 API
  // ======================

  /**
   * FR 3.2 - 빈칸 맞추기 퀴즈 조회
   *
   * @param {string} difficulty - 난이도
   * @returns {Promise<{idiomId, question, choices, answer}>}
   */
  async getBlankQuiz(difficulty) {
    return await this.request(`${API_ENDPOINTS.IDIOM.QUIZ}/blank?difficulty=${difficulty}`);
  }

  /**
   * 한자 빈칸 채우기 퀴즈 조회 (방어 턴용)
   *
   * @param {string} difficulty - 난이도
   * @returns {Promise<{idiomId, question, fullHanja, hangul, blankPosition, choices, answer}>}
   */
  async getHanjaBlankQuiz(difficulty) {
    return await this.request(`${API_ENDPOINTS.IDIOM.QUIZ}/hanjaBlank?difficulty=${difficulty}`);
  }

  /**
   * FR 3.3 - 카드 매칭 퀴즈 조회
   */
  async getCardMatchingQuiz(count = 6) {
    return await this.request(`${API_ENDPOINTS.IDIOM.QUIZ}/matching?count=${count}`);
  }

  /**
   * 랜덤 사자성어 조회
   */
  async getRandomIdiom() {
    return await this.request(API_ENDPOINTS.IDIOM.RANDOM);
  }

  // ======================
  // FR 6.0: 통계 API
  // ======================

  /**
   * FR 6.3 - 사용자 통계 조회
   */
  async getUserStatistics() {
    return await this.request(API_ENDPOINTS.STATS.USER);
  }

  /**
   * 리더보드 조회
   */
  async getLeaderboard(limit = 10) {
    return await this.request(`${API_ENDPOINTS.STATS.LEADERBOARD}?limit=${limit}`);
  }

  /**
   * FR 6.0 - 개인 학습 기록 조회
   */
  async getStatistics() {
    return await this.request('/game/statistics');
  }

  // ======================
  // 유틸리티
  // ======================

  /**
   * 인증 여부 확인
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * 토큰 가져오기
   */
  getToken() {
    return this.token;
  }
}

// 싱글톤 인스턴스 생성
export const apiClient = new APIClient();
