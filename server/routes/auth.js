const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// FR 1.1: 회원가입
router.post('/signup', authController.signup);

// FR 1.2: 로그인
router.post('/login', authController.login);

// 현재 사용자 정보 조회 (인증 필요)
router.get('/me', authenticate, authController.getMe);

module.exports = router;
