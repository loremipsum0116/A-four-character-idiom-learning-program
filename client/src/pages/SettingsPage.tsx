import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { userAPI } from '../services/api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [sound, setSound] = useState(user?.settings?.sound ?? true);
  const [notification, setNotification] = useState(user?.settings?.notification ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      await userAPI.updateSettings({ sound, notification });
      setMessage('설정이 저장되었습니다.');
    } catch (error) {
      setMessage('설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-500 to-gray-700 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <button onClick={() => navigate('/')} className="btn btn-outline mb-4">
            ← 홈으로
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">환경 설정</h1>
          <p className="text-gray-600">사운드 및 알림 설정을 변경하세요</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-6">
            {/* Sound Setting */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-bold text-lg">사운드</h3>
                <p className="text-sm text-gray-600">게임 효과음 및 배경음악</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sound}
                  onChange={(e) => setSound(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Notification Setting */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-bold text-lg">알림</h3>
                <p className="text-sm text-gray-600">학습 리마인더 및 알림</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notification}
                  onChange={(e) => setNotification(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full btn btn-primary"
              >
                {isSaving ? '저장 중...' : '설정 저장'}
              </button>

              {message && (
                <div className={`mt-4 p-4 rounded-lg ${
                  message.includes('실패') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">사용자 정보</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">닉네임:</span>
                <span className="font-bold">{user.nickname}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">이메일:</span>
                <span className="font-bold">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">레벨:</span>
                <span className="font-bold">Lv. {user.lionStats.level}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
