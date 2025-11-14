const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { authenticate } = require('../middleware/auth');

// 모든 게임 라우트는 인증 필요
router.use(authenticate);

// FR 4.1: 스테이지 맵 조회
router.get('/stages', gameController.getStages);

// FR 4.2: 특정 스테이지 정보 조회
router.get('/stages/:stageId', gameController.getStage);

// FR 4.6: 공격 턴 처리
router.post('/attack', gameController.processAttack);

// FR 4.8: 방어 턴 처리
router.post('/defend', gameController.processDefense);

// FR 4.9: 스테이지 클리어
router.post('/clear', gameController.clearStage);

// 사용자 진행 상황 조회
router.get('/progress', gameController.getProgress);

module.exports = router;
