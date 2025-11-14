const express = require('express');
const router = express.Router();
const idiomController = require('../controllers/idiomController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

// FR 3.1: 사자성어 목록 조회 (인증 선택)
router.get('/', optionalAuthenticate, idiomController.getIdioms);

// 특정 사자성어 조회
router.get('/:idiomId', optionalAuthenticate, idiomController.getIdiom);

// FR 3.2: 빈칸 맞추기 퀴즈 생성
router.get('/quiz/blank', optionalAuthenticate, idiomController.getBlankQuiz);

// FR 3.3: 카드 매칭 퀴즈 생성
router.get('/quiz/card-matching', optionalAuthenticate, idiomController.getCardMatchingQuiz);

// 학습 결과 저장 (인증 필요)
router.post('/learn/submit', authenticate, idiomController.submitLearnResult);

module.exports = router;
