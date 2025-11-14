import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { gameAPI, idiomAPI } from '../services/api';
import type { Difficulty, BlankQuiz } from '../types';

type Phase = 'difficulty' | 'question' | 'defense' | 'result';

export default function BattlePage() {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();
  const { currentStage, selectStage, playerHp, bossHp, setPlayerHp, setBossHp, turn, setTurn } = useGameStore();

  const [phase, setPhase] = useState<Phase>('difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [quiz, setQuiz] = useState<BlankQuiz | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (stageId) {
      selectStage(parseInt(stageId));
    }
  }, [stageId, selectStage]);

  const handleDifficultySelect = async (diff: Difficulty) => {
    setDifficulty(diff);
    const data = await idiomAPI.getBlankQuiz(diff);
    setQuiz(data);
    setPhase('question');
    setStartTime(Date.now());
    setSelectedAnswer('');
    setMessage('');
  };

  const handleAnswerSubmit = async () => {
    if (!quiz || !currentStage) return;

    const responseTime = Date.now() - startTime;
    const isCorrect = selectedAnswer === quiz.correctAnswer;

    try {
      const result = await gameAPI.processAttack({
        stageId: currentStage.stage_id,
        idiomId: quiz.idiom_id,
        difficulty,
        isCorrect,
        responseTimeMs: responseTime,
      });

      setMessage(result.message);
      setBossHp(bossHp - result.damage);

      setTimeout(() => {
        if (bossHp - result.damage <= 0) {
          handleVictory();
        } else {
          startBossTurn();
        }
      }, 2000);
    } catch (error) {
      console.error('Attack failed:', error);
    }
  };

  const startBossTurn = async () => {
    if (!currentStage) return;

    setTurn('boss');
    setPhase('defense');

    // 방어 문제 로드
    const data = await idiomAPI.getBlankQuiz('EASY');
    setQuiz(data);
    setSelectedAnswer('');
    setStartTime(Date.now());
  };

  const handleDefense = async () => {
    if (!quiz || !currentStage) return;

    const responseTime = Date.now() - startTime;
    const defenseSuccess = selectedAnswer === quiz.correctAnswer;

    try {
      const result = await gameAPI.processDefense({
        stageId: currentStage.stage_id,
        idiomId: quiz.idiom_id,
        defenseSuccess,
        responseTimeMs: responseTime,
        bossDamage: currentStage.boss_attack_power,
      });

      setMessage(result.message);
      setPlayerHp(playerHp - result.damageTaken);

      setTimeout(() => {
        if (playerHp - result.damageTaken <= 0) {
          handleDefeat();
        } else {
          setTurn('player');
          setPhase('difficulty');
        }
      }, 2000);
    } catch (error) {
      console.error('Defense failed:', error);
    }
  };

  const handleVictory = async () => {
    if (!currentStage) return;

    await gameAPI.clearStage(currentStage.stage_id);
    alert(`🎉 Stage ${currentStage.stage_id} 클리어!`);
    navigate('/game');
  };

  const handleDefeat = () => {
    alert('💀 패배했습니다...');
    navigate('/game');
  };

  if (!currentStage) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Battle Header */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <button onClick={() => navigate('/game')} className="btn btn-outline mb-4 text-white border-white">
            ← 나가기
          </button>
          <div className="flex justify-between items-center">
            <div className="text-white">
              <h2 className="text-2xl font-bold">{currentStage.boss_name}</h2>
              <p className="text-gray-400">Stage {currentStage.stage_id}</p>
            </div>
            <div className="text-4xl">⚔️</div>
          </div>
        </div>

        {/* HP Bars */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Player HP */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">사자 (플레이어)</div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">HP</span>
              <span className="font-bold text-green-600">{playerHp} / 100</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${(playerHp / 100) * 100}%` }}
              />
            </div>
          </div>

          {/* Boss HP */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">{currentStage.zodiac_animal}</div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">HP</span>
              <span className="font-bold text-red-600">{bossHp} / {currentStage.boss_hp}</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-500"
                style={{ width: `${(bossHp / currentStage.boss_hp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Battle Area */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Difficulty Selection Phase */}
          {phase === 'difficulty' && turn === 'player' && (
            <div>
              <h3 className="text-2xl font-bold text-center mb-6">공격 난이도를 선택하세요</h3>
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                <button
                  onClick={() => handleDifficultySelect('EASY')}
                  className="btn btn-outline p-8 flex flex-col items-center"
                >
                  <div className="text-4xl mb-2">🟢</div>
                  <div className="font-bold">초급</div>
                  <div className="text-sm text-gray-600">데미지: 10</div>
                  <div className="text-sm text-gray-600">시간: 15초</div>
                </button>
                <button
                  onClick={() => handleDifficultySelect('MEDIUM')}
                  className="btn btn-outline p-8 flex flex-col items-center"
                >
                  <div className="text-4xl mb-2">🟡</div>
                  <div className="font-bold">중급</div>
                  <div className="text-sm text-gray-600">데미지: 20</div>
                  <div className="text-sm text-gray-600">시간: 10초</div>
                </button>
                <button
                  onClick={() => handleDifficultySelect('HARD')}
                  className="btn btn-outline p-8 flex flex-col items-center"
                >
                  <div className="text-4xl mb-2">🔴</div>
                  <div className="font-bold">고급</div>
                  <div className="text-sm text-gray-600">데미지: 30</div>
                  <div className="text-sm text-gray-600">시간: 5초</div>
                </button>
              </div>
            </div>
          )}

          {/* Question Phase (Attack or Defense) */}
          {phase === 'question' && quiz && (
            <div>
              <h3 className="text-xl font-bold text-center mb-6 text-primary-600">
                {turn === 'player' ? '⚔️ 공격 턴' : '🛡️ 방어 턴'}
              </h3>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-primary-600 mb-4">{quiz.question}</div>
                <div className="text-xl text-gray-700 mb-2">{quiz.hangul}</div>
                <div className="text-gray-600">{quiz.meaning}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 max-w-2xl mx-auto">
                {quiz.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedAnswer(option)}
                    className={`p-4 text-2xl font-bold rounded-lg border-2 transition-all ${
                      selectedAnswer === option
                        ? 'bg-blue-100 border-blue-500'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <button
                onClick={turn === 'player' ? handleAnswerSubmit : handleDefense}
                disabled={!selectedAnswer}
                className="w-full btn btn-primary max-w-md mx-auto block"
              >
                {turn === 'player' ? '공격!' : '방어!'}
              </button>
            </div>
          )}

          {/* Defense Phase */}
          {phase === 'defense' && quiz && (
            <div>
              <h3 className="text-xl font-bold text-center mb-6 text-orange-600">
                🛡️ 보스의 공격! 방어하세요!
              </h3>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-primary-600 mb-4">{quiz.question}</div>
                <div className="text-xl text-gray-700 mb-2">{quiz.hangul}</div>
                <div className="text-gray-600">{quiz.meaning}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 max-w-2xl mx-auto">
                {quiz.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedAnswer(option)}
                    className={`p-4 text-2xl font-bold rounded-lg border-2 transition-all ${
                      selectedAnswer === option
                        ? 'bg-blue-100 border-blue-500'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <button
                onClick={handleDefense}
                disabled={!selectedAnswer}
                className="w-full btn btn-primary max-w-md mx-auto block"
              >
                방어!
              </button>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className="mt-6 text-center">
              <div className="text-2xl font-bold text-primary-600">{message}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
