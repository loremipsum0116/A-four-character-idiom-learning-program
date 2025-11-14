import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const menuItems = [
    {
      title: '학습 모드',
      description: '사자성어를 학습하고 연습하세요',
      path: '/learning',
      icon: '📚',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: '게임 모드 (보스전)',
      description: '12지신을 물리치고 왕이 되세요',
      path: '/game',
      icon: '⚔️',
      color: 'from-red-500 to-red-600',
    },
    {
      title: '개인 기록',
      description: '학습 통계와 성과를 확인하세요',
      path: '/stats',
      icon: '📊',
      color: 'from-green-500 to-green-600',
    },
    {
      title: '환경 설정',
      description: '사운드 및 알림 설정',
      path: '/settings',
      icon: '⚙️',
      color: 'from-gray-500 to-gray-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                사자성어 학습 게임
              </h1>
              <p className="text-gray-600 mt-1">
                환영합니다, <span className="font-semibold text-primary-600">{user?.nickname}</span>님!
              </p>
            </div>
            <button
              onClick={logout}
              className="btn btn-outline"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* Player Stats */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">사자 레벨</div>
              <div className="text-2xl font-bold text-primary-600">
                Lv. {user.lionStats.level}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">체력 (HP)</div>
              <div className="text-2xl font-bold text-green-600">
                {user.lionStats.hp} / {user.lionStats.maxHp}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">클리어 스테이지</div>
              <div className="text-2xl font-bold text-blue-600">
                {user.clearedStages.length} / 12
              </div>
            </div>
          </div>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`bg-gradient-to-br ${item.color} rounded-xl shadow-lg p-8 text-white hover:scale-105 transition-transform duration-200 text-left`}
            >
              <div className="text-6xl mb-4">{item.icon}</div>
              <h2 className="text-2xl font-bold mb-2">{item.title}</h2>
              <p className="text-white/90">{item.description}</p>
            </button>
          ))}
        </div>

        {/* Story Text */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-3">이야기</h3>
          <p className="text-gray-600 leading-relaxed">
            사자는 십이지신에 들지 못한 것에 분노하여, 12지신을 차례로 물리치고
            진정한 왕이 되기로 결심했습니다. 사자성어를 마스터하여 강력한 힘을 얻고,
            12지신과의 전투에서 승리하세요!
          </p>
        </div>

        {/* Unlocked Content */}
        {user && (user.unlockedContent.hiddenBoss || user.unlockedContent.infiniteMode || user.unlockedContent.pvpMode) && (
          <div className="mt-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-3">🏆 잠금 해제된 콘텐츠</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {user.unlockedContent.hiddenBoss && (
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="font-bold">히든 보스전</div>
                  <div className="text-sm">숨겨진 강력한 보스와 대결</div>
                </div>
              )}
              {user.unlockedContent.infiniteMode && (
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="font-bold">무한 모드</div>
                  <div className="text-sm">끝없는 도전과 최고 점수 경쟁</div>
                </div>
              )}
              {user.unlockedContent.pvpMode && (
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="font-bold">PvP 대전</div>
                  <div className="text-sm">다른 사용자와 실시간 대결</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
