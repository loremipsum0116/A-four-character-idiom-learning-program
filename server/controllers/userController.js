const User = require('../models/User');

/**
 * FR 2.2: 환경 설정 업데이트
 */
async function updateSettings(req, res) {
  try {
    const userId = req.user._id;
    const { sound, notification } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (typeof sound === 'boolean') {
      user.settings.sound = sound;
    }

    if (typeof notification === 'boolean') {
      user.settings.notification = notification;
    }

    await user.save();

    res.json({
      message: 'Settings updated',
      settings: user.settings,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings', message: error.message });
  }
}

/**
 * 프로필 업데이트
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user._id;
    const { nickname, profileImage } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (nickname) {
      user.nickname = nickname;
    }

    if (profileImage) {
      user.profileImage = profileImage;
    }

    await user.save();

    res.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
}

/**
 * 사자 스탯 업데이트
 */
async function updateLionStats(req, res) {
  try {
    const userId = req.user._id;
    const { hp, maxHp, level } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (typeof hp === 'number') {
      user.lionStats.hp = hp;
    }

    if (typeof maxHp === 'number') {
      user.lionStats.maxHp = maxHp;
    }

    if (typeof level === 'number') {
      user.lionStats.level = level;
    }

    await user.save();

    res.json({
      message: 'Lion stats updated',
      lionStats: user.lionStats,
    });
  } catch (error) {
    console.error('Update lion stats error:', error);
    res.status(500).json({ error: 'Failed to update lion stats', message: error.message });
  }
}

module.exports = {
  updateSettings,
  updateProfile,
  updateLionStats,
};
