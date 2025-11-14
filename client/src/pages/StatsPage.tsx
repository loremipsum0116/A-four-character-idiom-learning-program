import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsAPI } from '../services/api';
import type { UserStats } from '../types';

export default function StatsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await statsAPI.getUserStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  if (!stats) {
    return <div>데이터를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <button onClick={() => navigate('/')} className="btn btn-outline mb-4">
            ← 홈으로
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">개인 기록</h1>
          <p className="text-gray-600">학습 통계와 성과를 확인하세요</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">총 문제 수</div>
            <div className="text-3xl font-bold text-blue-600">{stats.totalQuestions}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">정답 수</div>
            <div className="text-3xl font-bold text-green-600">{stats.correctCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">정확도</div>
            <div className="text-3xl font-bold text-purple-600">{stats.accuracy.toFixed(1)}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">총 데미지</div>
            <div className="text-3xl font-bold text-red-600">{stats.totalDamage}</div>
          </div>
        </div>

        {/* Stats by Difficulty */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">난이도별 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.byDifficulty).map(([difficulty, diffStats]) => (
              <div key={difficulty} className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3">
                  {difficulty === 'EASY' ? '초급' : difficulty === 'MEDIUM' ? '중급' : '고급'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">총 문제:</span>
                    <span className="font-bold">{diffStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">정답:</span>
                    <span className="font-bold text-green-600">{diffStats.correct}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">정확도:</span>
                    <span className="font-bold text-purple-600">{diffStats.accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">평균 시간:</span>
                    <span className="font-bold">{(diffStats.averageResponseTime / 1000).toFixed(1)}초</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats by Action Type */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">행동별 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.byActionType).map(([actionType, actionStats]) => (
              <div key={actionType} className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3">
                  {actionType === 'ATTACK' ? '⚔️ 공격' : actionType === 'DEFEND' ? '🛡️ 방어' : '📚 학습'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">총 횟수:</span>
                    <span className="font-bold">{actionStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">성공:</span>
                    <span className="font-bold text-green-600">{actionStats.correct}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">성공률:</span>
                    <span className="font-bold text-purple-600">{actionStats.accuracy.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
