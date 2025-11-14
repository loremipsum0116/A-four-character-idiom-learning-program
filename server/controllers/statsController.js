const LearningLog = require('../models/LearningLog');

/**
 * FR 6.0: 개인 기록 (통계 시스템)
 */

/**
 * FR 6.2, 6.3: 사용자 전체 통계 조회
 */
async function getUserStats(req, res) {
  try {
    const userId = req.user._id;

    // 전체 학습 로그 조회
    const allLogs = await LearningLog.find({ user_id: userId });

    if (allLogs.length === 0) {
      return res.json({
        totalQuestions: 0,
        correctCount: 0,
        incorrectCount: 0,
        accuracy: 0,
        averageResponseTime: 0,
        totalDamage: 0,
        byDifficulty: {},
        byActionType: {},
      });
    }

    // 기본 통계
    const totalQuestions = allLogs.length;
    const correctCount = allLogs.filter(log => log.is_correct).length;
    const incorrectCount = totalQuestions - correctCount;
    const accuracy = (correctCount / totalQuestions) * 100;

    // 평균 응답 시간
    const totalResponseTime = allLogs.reduce((sum, log) => sum + log.response_time_ms, 0);
    const averageResponseTime = totalResponseTime / totalQuestions;

    // 총 데미지
    const totalDamage = allLogs.reduce((sum, log) => sum + (log.calculated_damage || 0), 0);

    // 난이도별 통계
    const byDifficulty = {};
    ['EASY', 'MEDIUM', 'HARD'].forEach(difficulty => {
      const difficultyLogs = allLogs.filter(log => log.chosen_difficulty === difficulty);
      if (difficultyLogs.length > 0) {
        byDifficulty[difficulty] = {
          total: difficultyLogs.length,
          correct: difficultyLogs.filter(log => log.is_correct).length,
          accuracy: (difficultyLogs.filter(log => log.is_correct).length / difficultyLogs.length) * 100,
          averageResponseTime: difficultyLogs.reduce((sum, log) => sum + log.response_time_ms, 0) / difficultyLogs.length,
        };
      }
    });

    // 액션 타입별 통계
    const byActionType = {};
    ['ATTACK', 'DEFEND', 'LEARN'].forEach(actionType => {
      const actionLogs = allLogs.filter(log => log.action_type === actionType);
      if (actionLogs.length > 0) {
        byActionType[actionType] = {
          total: actionLogs.length,
          correct: actionLogs.filter(log => log.is_correct).length,
          accuracy: (actionLogs.filter(log => log.is_correct).length / actionLogs.length) * 100,
        };
      }
    });

    res.json({
      totalQuestions,
      correctCount,
      incorrectCount,
      accuracy: Math.round(accuracy * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      totalDamage,
      byDifficulty,
      byActionType,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get stats', message: error.message });
  }
}

/**
 * FR 6.2: 스테이지별 통계 조회
 */
async function getStageStats(req, res) {
  try {
    const { stageId } = req.params;
    const userId = req.user._id;

    const stageLogs = await LearningLog.find({
      user_id: userId,
      stage_id: stageId,
    });

    if (stageLogs.length === 0) {
      return res.json({
        stageId,
        totalQuestions: 0,
        correctCount: 0,
        accuracy: 0,
        totalDamage: 0,
      });
    }

    const totalQuestions = stageLogs.length;
    const correctCount = stageLogs.filter(log => log.is_correct).length;
    const accuracy = (correctCount / totalQuestions) * 100;
    const totalDamage = stageLogs.reduce((sum, log) => sum + (log.calculated_damage || 0), 0);

    // 공격 성공률
    const attackLogs = stageLogs.filter(log => log.action_type === 'ATTACK');
    const attackSuccessRate = attackLogs.length > 0
      ? (attackLogs.filter(log => log.is_correct).length / attackLogs.length) * 100
      : 0;

    // 평균 응답 시간
    const averageResponseTime = stageLogs.reduce((sum, log) => sum + log.response_time_ms, 0) / totalQuestions;

    res.json({
      stageId: parseInt(stageId),
      totalQuestions,
      correctCount,
      accuracy: Math.round(accuracy * 100) / 100,
      totalDamage,
      attackSuccessRate: Math.round(attackSuccessRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
    });
  } catch (error) {
    console.error('Get stage stats error:', error);
    res.status(500).json({ error: 'Failed to get stage stats', message: error.message });
  }
}

/**
 * FR 6.2: 최근 학습 기록 조회
 */
async function getRecentLogs(req, res) {
  try {
    const userId = req.user._id;
    const { limit = 20 } = req.query;

    const logs = await LearningLog.find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('idiom_id', 'hanja hangul meaning');

    res.json({ logs });
  } catch (error) {
    console.error('Get recent logs error:', error);
    res.status(500).json({ error: 'Failed to get recent logs', message: error.message });
  }
}

/**
 * FR 6.3: 학습 패턴 분석 (시간대별)
 */
async function getLearningPattern(req, res) {
  try {
    const userId = req.user._id;

    // 최근 30일간의 로그
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await LearningLog.find({
      user_id: userId,
      timestamp: { $gte: thirtyDaysAgo },
    });

    // 일별 통계
    const dailyStats = {};
    logs.forEach(log => {
      const date = log.timestamp.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          total: 0,
          correct: 0,
        };
      }
      dailyStats[date].total++;
      if (log.is_correct) {
        dailyStats[date].correct++;
      }
    });

    // 시간대별 통계
    const hourlyStats = {};
    logs.forEach(log => {
      const hour = log.timestamp.getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = {
          total: 0,
          correct: 0,
        };
      }
      hourlyStats[hour].total++;
      if (log.is_correct) {
        hourlyStats[hour].correct++;
      }
    });

    res.json({
      dailyStats,
      hourlyStats,
    });
  } catch (error) {
    console.error('Get learning pattern error:', error);
    res.status(500).json({ error: 'Failed to get learning pattern', message: error.message });
  }
}

/**
 * 틀린 문제 목록 조회
 */
async function getWrongAnswers(req, res) {
  try {
    const userId = req.user._id;

    const wrongLogs = await LearningLog.find({
      user_id: userId,
      is_correct: false,
    })
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('idiom_id', 'hanja hangul meaning');

    // idiom_id별로 그룹화하여 중복 제거
    const uniqueWrongIdioms = [];
    const seenIds = new Set();

    wrongLogs.forEach(log => {
      if (log.idiom_id && !seenIds.has(log.idiom_id._id.toString())) {
        seenIds.add(log.idiom_id._id.toString());
        uniqueWrongIdioms.push(log.idiom_id);
      }
    });

    res.json({ wrongIdioms: uniqueWrongIdioms });
  } catch (error) {
    console.error('Get wrong answers error:', error);
    res.status(500).json({ error: 'Failed to get wrong answers', message: error.message });
  }
}

module.exports = {
  getUserStats,
  getStageStats,
  getRecentLogs,
  getLearningPattern,
  getWrongAnswers,
};
