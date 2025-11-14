const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

/**
 * FR 1.1: 회원가입
 */
async function signup(req, res) {
  try {
    const { email, password, nickname } = req.body;

    // 입력 검증
    if (!email || !password || !nickname) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // 사용자 생성
    const user = new User({
      email,
      password,
      nickname,
    });

    await user.save();

    // JWT 토큰 생성
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        clearedStages: user.clearedStages,
        lionStats: user.lionStats,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed', message: error.message });
  }
}

/**
 * FR 1.2: 로그인
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 입력 검증
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 사용자 조회
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 마지막 로그인 시간 업데이트
    await user.updateLastLogin();

    // JWT 토큰 생성
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        clearedStages: user.clearedStages,
        lionStats: user.lionStats,
        unlockedContent: user.unlockedContent,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
}

/**
 * 현재 사용자 정보 조회
 */
async function getMe(req, res) {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        nickname: req.user.nickname,
        clearedStages: req.user.clearedStages,
        lionStats: req.user.lionStats,
        unlockedContent: req.user.unlockedContent,
        settings: req.user.settings,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info', message: error.message });
  }
}

module.exports = {
  signup,
  login,
  getMe,
};
