const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// 모든 사용자 라우트는 인증 필요
router.use(authenticate);

// FR 2.2: 환경 설정 업데이트
router.put('/settings', userController.updateSettings);

// 프로필 업데이트
router.put('/profile', userController.updateProfile);

// 사자 스탯 업데이트
router.put('/lion-stats', userController.updateLionStats);

module.exports = router;
