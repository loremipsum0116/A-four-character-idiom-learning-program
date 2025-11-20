import { GAME_CONSTANTS } from './constants.js';
import { saveGameData, loadGameData } from './storageManager.js';

/**
 * 데미지 계산 유틸리티
 *
 * 요구사항 정의서 FR 7.0 - 핵심 로직 - 전투 연산부
 * 특허 명세서의 핵심 알고리즘 구현
 */

/**
 * 공격 데미지 계산 (FR 7.1)
 *
 * 공식: Final_Damage = (BaseDamage × Accuracy) + BonusDamage
 *
 * @param {string} difficulty - 'EASY' | 'MEDIUM' | 'HARD'
 * @param {boolean} isCorrect - 정답 여부
 * @param {number} responseTimeMs - 응답 시간 (밀리초)
 * @returns {number} 최종 데미지
 *
 * 예시:
 * - 고급 + 정답 + 1초 응답 = 30 × 1.0 + 8 = 38 데미지
 * - 중급 + 정답 + 5초 응답 = 20 × 1.0 + 5 = 25 데미지
 * - 초급 + 정답 + 10초 응답 = 10 × 1.0 + 3 = 13 데미지
 * - 중급 + 오답 + 3초 응답 = 20 × 0.0 + 0 = 0 데미지
 */
export function calculateAttackDamage(difficulty, isCorrect, responseTimeMs) {
  // 1. 난이도별 기본 데미지 (FR 7.1)
  const difficultyConfig = GAME_CONSTANTS.DIFFICULTY[difficulty];
  if (!difficultyConfig) {
    console.error(`Invalid difficulty: ${difficulty}`);
    return 0;
  }

  const baseDamage = difficultyConfig.baseDamage;
  const timeLimit = difficultyConfig.timeLimit;

  // 2. 정확도 (FR 7.1)
  // 정답: 1.0 (100%), 오답: 0.0 (0%)
  const accuracy = isCorrect ? 1.0 : 0.0;

  // 3. 응답 속도 기반 보너스 데미지 (FR 7.1)
  let bonusDamage = 0;

  if (isCorrect && responseTimeMs <= timeLimit) {
    // 제한 시간 내에 정답을 맞춘 경우에만 보너스
    // 빠를수록 보너스가 높음 (최대 10점)
    const ratio = 1.0 - (responseTimeMs / timeLimit);
    bonusDamage = Math.floor(ratio * 10);
  }

  // 4. 최종 데미지 계산
  const finalDamage = (baseDamage * accuracy) + bonusDamage;

  // 로그 출력 (디버깅용)
  console.log(`[데미지 계산]`, {
    difficulty,
    baseDamage,
    isCorrect,
    accuracy,
    responseTimeMs,
    timeLimit,
    bonusDamage,
    finalDamage
  });

  return Math.max(0, finalDamage);
}

/**
 * 방어 데미지 계산 (FR 7.3)
 *
 * 공식: Damage_Taken = Base_Boss_Damage × Defense_Multiplier
 *
 * @param {number} baseBossDamage - 보스의 기본 공격력
 * @param {boolean} defenseSuccess - 방어 성공 여부
 * @returns {number} 플레이어가 받는 데미지
 *
 * 예시 (보스 공격력 15):
 * - 방어 성공: 15 × 0.3 = 5 데미지 (70% 감소)
 * - 방어 실패: 15 × 1.0 = 15 데미지 (100% 그대로)
 */
export function calculateDefenseDamage(baseBossDamage, defenseSuccess) {
  // 방어 성공 시 0.3 (30%만 받음), 실패 시 1.0 (100% 받음)
  const multiplier = defenseSuccess
    ? GAME_CONSTANTS.BATTLE.DEFENSE_MULTIPLIER_SUCCESS
    : GAME_CONSTANTS.BATTLE.DEFENSE_MULTIPLIER_FAIL;

  const damageTaken = Math.ceil(baseBossDamage * multiplier);

  console.log(`[방어 데미지 계산]`, {
    baseBossDamage,
    defenseSuccess,
    multiplier,
    damageTaken
  });

  return damageTaken;
}

/**
 * 난이도별 제한 시간 조회 (FR 7.2)
 *
 * @param {string} difficulty - 'EASY' | 'MEDIUM' | 'HARD'
 * @returns {number} 제한 시간 (밀리초)
 */
export function getTimeLimit(difficulty) {
  const config = GAME_CONSTANTS.DIFFICULTY[difficulty];
  return config ? config.timeLimit : 15000; // 기본값 15초
}

/**
 * 난이도별 기본 데미지 조회
 *
 * @param {string} difficulty - 'EASY' | 'MEDIUM' | 'HARD'
 * @returns {number} 기본 데미지
 */
export function getBaseDamage(difficulty) {
  const config = GAME_CONSTANTS.DIFFICULTY[difficulty];
  return config ? config.baseDamage : 10; // 기본값 10
}

/**
 * 데미지 계산 결과를 시각적으로 표현
 *
 * @param {number} damage - 데미지 값
 * @returns {object} 색상 및 텍스트 정보
 */
export function getDamageDisplayInfo(damage) {
  if (damage === 0) {
    return {
      color: '#9ca3af', // 회색
      text: 'MISS!',
      size: 24
    };
  } else if (damage < 15) {
    return {
      color: '#60a5fa', // 파란색
      text: damage.toString(),
      size: 28
    };
  } else if (damage < 25) {
    return {
      color: '#facc15', // 노란색
      text: damage.toString(),
      size: 32
    };
  } else if (damage < 35) {
    return {
      color: '#f97316', // 주황색
      text: damage.toString() + '!',
      size: 36
    };
  } else {
    return {
      color: '#ef4444', // 빨간색
      text: 'CRITICAL ' + damage + '!!',
      size: 40
    };
  }
}

/**
 * 전투 연산 결과 검증
 *
 * @param {object} attackData - 공격 데이터
 * @returns {boolean} 유효성 여부
 */
export function validateCombatData(attackData) {
  const { difficulty, isCorrect, responseTimeMs } = attackData;

  // 난이도 검증
  if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
    console.error('Invalid difficulty');
    return false;
  }

  // 정답 여부 검증
  if (typeof isCorrect !== 'boolean') {
    console.error('Invalid isCorrect value');
    return false;
  }

  // 응답 시간 검증
  if (typeof responseTimeMs !== 'number' || responseTimeMs < 0) {
    console.error('Invalid responseTimeMs');
    return false;
  }

  return true;
}

/**
 * 현재 스테이지에 맞는 사자 레벨 정보 반환
 *
 * @param {number} currentStageId - 현재 전투 중인 스테이지 ID (1-12)
 * @returns {object} 사자 레벨 정보 { name, image, description }
 */
export function getLionLevel(currentStageId) {
  const { LION_LEVELS } = GAME_CONSTANTS;

  // 스테이지 기반으로 기본 레벨 결정
  let stageBasedLevel;
  if (currentStageId >= LION_LEVELS.KING.minStage) {
    stageBasedLevel = LION_LEVELS.KING;
  } else if (currentStageId >= LION_LEVELS.ADVANCED.minStage) {
    stageBasedLevel = LION_LEVELS.ADVANCED;
  } else if (currentStageId >= LION_LEVELS.INTERMEDIATE.minStage) {
    stageBasedLevel = LION_LEVELS.INTERMEDIATE;
  } else {
    stageBasedLevel = LION_LEVELS.BASIC;
  }

  // 저장된 최고 레벨 확인
  const maxLionLevel = getMaxLionLevel();
  const savedLevel = getLionLevelByName(maxLionLevel);

  // 스테이지 기반 레벨과 저장된 레벨 중 높은 것 사용
  if (savedLevel && getLionLevelRank(savedLevel.name) > getLionLevelRank(stageBasedLevel.name)) {
    console.log(`🦁 사자 레벨: ${savedLevel.name} (저장된 최고 레벨 사용)`);
    return savedLevel;
  }

  console.log(`🦁 사자 레벨: ${stageBasedLevel.name} (스테이지 ${currentStageId} 기반)`);
  return stageBasedLevel;
}

/**
 * 레벨 이름으로 레벨 정보 가져오기
 */
function getLionLevelByName(levelName) {
  const { LION_LEVELS } = GAME_CONSTANTS;

  for (const key in LION_LEVELS) {
    if (LION_LEVELS[key].name === levelName) {
      return LION_LEVELS[key];
    }
  }

  return null;
}

/**
 * 스테이지 클리어 후 사자가 레벨업하는지 확인
 *
 * @param {number} clearedStageId - 방금 클리어한 스테이지 ID
 * @returns {object|null} 레벨업 정보 또는 null
 */
export function checkLionLevelUp(clearedStageId) {
  const currentLevel = getLionLevel(clearedStageId);
  const nextLevel = getLionLevel(clearedStageId + 1);

  // 레벨이 변경되었는지 확인
  if (currentLevel.name !== nextLevel.name) {
    // 이미 도달한 레벨인지 확인 (중복 진화 방지)
    const maxLionLevel = getMaxLionLevel();

    // 새 레벨이 현재 최고 레벨보다 높을 때만 진화
    if (getLionLevelRank(nextLevel.name) > getLionLevelRank(maxLionLevel)) {
      // 최고 레벨 저장
      saveMaxLionLevel(nextLevel.name);

      return {
        oldLevel: currentLevel,
        newLevel: nextLevel,
        isLevelUp: true
      };
    }
  }

  return null;
}

/**
 * 사자 레벨의 순위 반환 (숫자가 높을수록 상위 레벨)
 */
function getLionLevelRank(levelName) {
  const ranks = {
    '견습 사자': 1,
    '전사 사자': 2,
    '대장군 사자': 3,
    '사자왕': 4
  };
  return ranks[levelName] || 0;
}

/**
 * 스토리지에서 최고 사자 레벨 가져오기
 * 게스트: sessionStorage, 일반: localStorage
 */
function getMaxLionLevel() {
  return loadGameData('maxLionLevel', '견습 사자');
}

/**
 * 스토리지에 최고 사자 레벨 저장
 * 게스트: sessionStorage, 일반: localStorage
 */
function saveMaxLionLevel(levelName) {
  saveGameData('maxLionLevel', levelName);
}
