import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';

export default function GameModePage() {
  const navigate = useNavigate();
  const { stages, loadStages, isLoading } = useGameStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadStages();
  }, [loadStages]);

  const handleStageSelect = (stageId: number) => {
    navigate(`/battle/${stageId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-orange-600 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <button onClick={() => navigate('/')} className="btn btn-outline mb-4">
            ← 홈으로
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">게임 모드 - 12지신 정복</h1>
          <p className="text-gray-600">도전할 스테이지를 선택하세요</p>
        </div>

        {isLoading ? (
          <div className="text-center text-white text-xl">로딩 중...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stages.map((stage) => {
              const isCleared = user?.clearedStages.includes(stage.stage_id) || false;
              const isLocked = stage.stage_id > 1 && !user?.clearedStages.includes(stage.stage_id - 1);

              return (
                <button
                  key={stage.stage_id}
                  onClick={() => !isLocked && handleStageSelect(stage.stage_id)}
                  disabled={isLocked}
                  className={`bg-white rounded-xl shadow-lg p-6 text-left transition-all ${
                    isLocked
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105 hover:shadow-2xl'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Stage {stage.stage_id}</div>
                      <h3 className="text-xl font-bold text-gray-800">{stage.boss_name}</h3>
                    </div>
                    {isCleared && (
                      <div className="text-3xl">✅</div>
                    )}
                    {isLocked && (
                      <div className="text-3xl">🔒</div>
                    )}
                  </div>

                  <div className="text-6xl mb-4 text-center">
                    {getZodiacEmoji(stage.zodiac_animal)}
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{stage.description}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">체력:</span>
                      <span className="font-bold text-red-600">{stage.boss_hp} HP</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">공격력:</span>
                      <span className="font-bold text-orange-600">{stage.boss_attack_power}</span>
                    </div>
                  </div>

                  {!isLocked && (
                    <div className="mt-4 text-center">
                      <span className="text-primary-600 font-bold">
                        {isCleared ? '재도전 →' : '도전 →'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Progress Bar */}
        {user && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-3">진행 상황</h3>
            <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500"
                style={{ width: `${(user.clearedStages.length / 12) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center font-bold text-sm">
                {user.clearedStages.length} / 12 클리어
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getZodiacEmoji(animal: string): string {
  const emojiMap: Record<string, string> = {
    '쥐': '🐭',
    '소': '🐂',
    '호랑이': '🐯',
    '토끼': '🐰',
    '용': '🐲',
    '뱀': '🐍',
    '말': '🐴',
    '양': '🐑',
    '원숭이': '🐵',
    '닭': '🐔',
    '개': '🐶',
    '돼지': '🐷',
  };
  return emojiMap[animal] || '❓';
}
