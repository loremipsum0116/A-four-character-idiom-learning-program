const GameStage = require('../models/GameStage');
const LearningLog = require('../models/LearningLog');
const User = require('../models/User');
const { calculateAttackDamage, calculateDefenseDamage } = require('../utils/combatCalculator');

/**
 * FR 4.1: 스테이지 맵 조회 (12지신)
 */
async function getStages(req, res) {
  try {
    const stages = await GameStage.find().sort({ stage_id: 1 });
    res.json({ stages });
  } catch (error) {
    console.error('Get stages error:', error);
    res.status(500).json({ error: 'Failed to get stages', message: error.message });
  }
}

/**
 * FR 4.2: 특정 스테이지 정보 조회
 */
async function getStage(req, res) {
  try {
    const { stageId } = req.params;
    const stage = await GameStage.findOne({ stage_id: stageId });

    if (!stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    res.json({ stage });
  } catch (error) {
    console.error('Get stage error:', error);
    res.status(500).json({ error: 'Failed to get stage', message: error.message });
  }
}

/**
 * FR 4.6: 공격 턴 처리 (데미지 연산 핵심 로직)
 */
async function processAttack(req, res) {
  try {
    const { stageId, idiomId, difficulty, isCorrect, responseTimeMs } = req.body;
    const userId = req.user._id;

    // 입력 검증
    if (!stageId || !idiomId || !difficulty || typeof isCorrect !== 'boolean' || !responseTimeMs) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // FR 4.6: 데미지 연산 (특허 핵심 로직)
    const damage = calculateAttackDamage(difficulty, isCorrect, responseTimeMs);

    // FR 4.5: 학습 성과 데이터 저장
    const learningLog = new LearningLog({
      user_id: userId,
      stage_id: stageId,
      idiom_id: idiomId,
      action_type: 'ATTACK',
      chosen_difficulty: difficulty,
      is_correct: isCorrect,
      response_time_ms: responseTimeMs,
      calculated_damage: damage,
    });

    await learningLog.save();

    res.json({
      damage,
      isCorrect,
      difficulty,
      responseTimeMs,
      message: isCorrect ? '정답입니다!' : '오답입니다!',
    });
  } catch (error) {
    console.error('Process attack error:', error);
    res.status(500).json({ error: 'Failed to process attack', message: error.message });
  }
}

/**
 * FR 4.8: 방어 턴 처리 (데미지 감소)
 */
async function processDefense(req, res) {
  try {
    const { stageId, idiomId, defenseSuccess, responseTimeMs, bossDamage } = req.body;
    const userId = req.user._id;

    // 입력 검증
    if (!stageId || !idiomId || typeof defenseSuccess !== 'boolean' || !responseTimeMs || !bossDamage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // FR 7.3: 방어 데미지 계산
    const damageTaken = calculateDefenseDamage(bossDamage, defenseSuccess);

    // 학습 로그 저장
    const learningLog = new LearningLog({
      user_id: userId,
      stage_id: stageId,
      idiom_id: idiomId,
      action_type: 'DEFEND',
      is_correct: defenseSuccess,
      response_time_ms: responseTimeMs,
      calculated_damage: damageTaken,
    });

    await learningLog.save();

    res.json({
      damageTaken,
      defenseSuccess,
      message: defenseSuccess ? '방어 성공!' : '방어 실패!',
    });
  } catch (error) {
    console.error('Process defense error:', error);
    res.status(500).json({ error: 'Failed to process defense', message: error.message });
  }
}

/**
 * FR 4.9: 스테이지 클리어 처리
 */
async function clearStage(req, res) {
  try {
    const { stageId } = req.body;
    const userId = req.user._id;

    // 사용자 조회
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 이미 클리어한 스테이지인지 확인
    if (!user.clearedStages.includes(stageId)) {
      user.clearedStages.push(stageId);
    }

    // FR 5.2: 12단계 모두 클리어 시 엔딩 콘텐츠 잠금 해제
    if (user.clearedStages.length >= 12) {
      user.unlockedContent.hiddenBoss = true;
      user.unlockedContent.infiniteMode = true;
      user.unlockedContent.pvpMode = true;
    }

    await user.save();

    res.json({
      message: 'Stage cleared!',
      clearedStages: user.clearedStages,
      unlockedContent: user.unlockedContent,
    });
  } catch (error) {
    console.error('Clear stage error:', error);
    res.status(500).json({ error: 'Failed to clear stage', message: error.message });
  }
}

/**
 * 사용자의 스테이지 진행 상황 조회
 */
async function getProgress(req, res) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      clearedStages: user.clearedStages,
      lionStats: user.lionStats,
      unlockedContent: user.unlockedContent,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress', message: error.message });
  }
}

module.exports = {
  getStages,
  getStage,
  processAttack,
  processDefense,
  clearStage,
  getProgress,
};
