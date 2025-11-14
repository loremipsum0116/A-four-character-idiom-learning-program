const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticate } = require('../middleware/auth');

// 모든 통계 라우트는 인증 필요
router.use(authenticate);

// FR 6.2, 6.3: 사용자 전체 통계 조회
router.get('/user', statsController.getUserStats);

// FR 6.2: 스테이지별 통계 조회
router.get('/stage/:stageId', statsController.getStageStats);

// FR 6.2: 최근 학습 기록 조회
router.get('/recent', statsController.getRecentLogs);

// FR 6.3: 학습 패턴 분석
router.get('/pattern', statsController.getLearningPattern);

// 틀린 문제 목록 조회
router.get('/wrong-answers', statsController.getWrongAnswers);

module.exports = router;
