/**
 * FR 7.0: 핵심 로직 - 전투 연산부 (170)
 * 특허 핵심 로직: 학습 성과 데이터를 기반으로 데미지를 연산
 */

// FR 7.1: 난이도별 기본 데미지
const BASE_DAMAGE = {
  EASY: 10,
  MEDIUM: 20,
  HARD: 30,
};

// FR 7.2: 난이도별 제한 시간 (밀리초)
const TIME_LIMIT = {
  EASY: 15000,   // 15초
  MEDIUM: 10000, // 10초
  HARD: 5000,    // 5초
};

/**
 * FR 7.1: 공격 데미지 계산 공식
 * Final_Damage = f(난이도, 정확도, 응답속도)
 *
 * @param {string} difficulty - 난이도 ('EASY', 'MEDIUM', 'HARD')
 * @param {boolean} isCorrect - 정답 여부
 * @param {number} responseTimeMs - 응답 시간 (밀리초)
 * @returns {number} 최종 데미지
 */
function calculateAttackDamage(difficulty, isCorrect, responseTimeMs) {
  // 기본 데미지 (난이도에 따라 차등)
  const baseDamage = BASE_DAMAGE[difficulty] || BASE_DAMAGE.EASY;

  // 정확도: 정답일 때만 데미지 적용
  const accuracy = isCorrect ? 1.0 : 0.0;

  // 응답 속도에 따른 보너스 데미지 계산
  const bonusDamage = calculateBonusDamage(difficulty, responseTimeMs);

  // 최종 데미지 = 기본 데미지 * 정확도 + 보너스 데미지
  const finalDamage = (baseDamage * accuracy) + bonusDamage;

  return Math.floor(finalDamage);
}

/**
 * 응답 속도에 따른 보너스 데미지 계산
 * 빠를수록 더 많은 보너스 (0~10 사이)
 *
 * @param {string} difficulty - 난이도
 * @param {number} responseTimeMs - 응답 시간 (밀리초)
 * @returns {number} 보너스 데미지
 */
function calculateBonusDamage(difficulty, responseTimeMs) {
  const timeLimit = TIME_LIMIT[difficulty] || TIME_LIMIT.EASY;

  // 제한 시간을 초과한 경우 보너스 없음
  if (responseTimeMs >= timeLimit) {
    return 0;
  }

  // 응답 시간 비율 (0.0 ~ 1.0)
  const timeRatio = responseTimeMs / timeLimit;

  // 보너스는 빠를수록 높음 (역비례)
  // 최대 10의 보너스 데미지
  const bonus = (1 - timeRatio) * 10;

  return Math.floor(bonus);
}

/**
 * FR 7.3: 방어 데미지 계산 공식
 * Damage_Taken = Base_Boss_Damage * f(방어성공여부)
 *
 * @param {number} baseBossDamage - 보스의 기본 공격력
 * @param {boolean} defenseSuccess - 방어 성공 여부
 * @returns {number} 사용자가 받는 최종 데미지
 */
function calculateDefenseDamage(baseBossDamage, defenseSuccess) {
  // 방어 성공 시 데미지 감소 (30%만 받음)
  const defenseMultiplier = defenseSuccess ? 0.3 : 1.0;

  const finalDamage = baseBossDamage * defenseMultiplier;

  return Math.floor(finalDamage);
}

/**
 * 난이도에 따른 제한 시간 반환
 *
 * @param {string} difficulty - 난이도
 * @returns {number} 제한 시간 (밀리초)
 */
function getTimeLimit(difficulty) {
  return TIME_LIMIT[difficulty] || TIME_LIMIT.EASY;
}

/**
 * 난이도에 따른 기본 데미지 반환
 *
 * @param {string} difficulty - 난이도
 * @returns {number} 기본 데미지
 */
function getBaseDamage(difficulty) {
  return BASE_DAMAGE[difficulty] || BASE_DAMAGE.EASY;
}

/**
 * 학습 성과 데이터 검증
 *
 * @param {Object} data - 학습 성과 데이터
 * @returns {boolean} 유효성 여부
 */
function validateLearningData(data) {
  const { difficulty, isCorrect, responseTimeMs } = data;

  if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
    return false;
  }

  if (typeof isCorrect !== 'boolean') {
    return false;
  }

  if (typeof responseTimeMs !== 'number' || responseTimeMs < 0) {
    return false;
  }

  return true;
}

module.exports = {
  calculateAttackDamage,
  calculateDefenseDamage,
  calculateBonusDamage,
  getTimeLimit,
  getBaseDamage,
  validateLearningData,
  BASE_DAMAGE,
  TIME_LIMIT,
};
