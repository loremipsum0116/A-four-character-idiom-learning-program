import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { idiomAPI } from '../services/api';
import type { BlankQuiz, Difficulty } from '../types';

export default function LearningModePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'blank' | 'card'>('select');
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [quiz, setQuiz] = useState<BlankQuiz | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [startTime, setStartTime] = useState(0);

  const loadBlankQuiz = async () => {
    const data = await idiomAPI.getBlankQuiz(difficulty);
    setQuiz(data);
    setSelectedAnswer('');
    setIsAnswered(false);
    setStartTime(Date.now());
  };

  const handleStart = async (selectedMode: 'blank' | 'card') => {
    setMode(selectedMode);
    if (selectedMode === 'blank') {
      await loadBlankQuiz();
    }
  };

  const handleSubmit = async () => {
    if (!quiz || !selectedAnswer) return;

    const responseTime = Date.now() - startTime;
    const isCorrect = selectedAnswer === quiz.correctAnswer;

    await idiomAPI.submitLearnResult({
      idiomId: quiz.idiom_id,
      isCorrect,
      responseTimeMs: responseTime,
      quizType: 'blank',
    });

    setIsAnswered(true);
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <button onClick={() => navigate('/')} className="btn btn-outline mb-4">
              ← 홈으로
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">학습 모드</h1>
            <p className="text-gray-600">학습 방법을 선택하세요</p>
          </div>

          <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-lg mb-3">난이도 선택</h3>
            <div className="flex gap-4">
              {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`btn ${difficulty === d ? 'btn-primary' : 'btn-outline'}`}
                >
                  {d === 'EASY' ? '초급' : d === 'MEDIUM' ? '중급' : '고급'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => handleStart('blank')}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-8 text-white hover:scale-105 transition-transform"
            >
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold mb-2">빈칸 맞추기</h2>
              <p className="text-white/90">사자성어의 빈칸을 채우세요</p>
            </button>

            <button
              onClick={() => handleStart('card')}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-8 text-white hover:scale-105 transition-transform"
            >
              <div className="text-6xl mb-4">🎴</div>
              <h2 className="text-2xl font-bold mb-2">카드 매칭</h2>
              <p className="text-white/90">한자와 뜻을 연결하세요</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'blank' && quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <button onClick={() => setMode('select')} className="btn btn-outline mb-4">
              ← 돌아가기
            </button>

            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-primary-600 mb-4">
                {quiz.question}
              </div>
              <div className="text-xl text-gray-700 mb-2">{quiz.hangul}</div>
              <div className="text-gray-600">{quiz.meaning}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {quiz.options.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedAnswer(option)}
                  disabled={isAnswered}
                  className={`p-4 text-2xl font-bold rounded-lg border-2 transition-all ${
                    isAnswered
                      ? option === quiz.correctAnswer
                        ? 'bg-green-100 border-green-500'
                        : option === selectedAnswer
                        ? 'bg-red-100 border-red-500'
                        : 'border-gray-300'
                      : selectedAnswer === option
                      ? 'bg-blue-100 border-blue-500'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {!isAnswered ? (
              <button
                onClick={handleSubmit}
                disabled={!selectedAnswer}
                className="w-full btn btn-primary"
              >
                제출
              </button>
            ) : (
              <div className="space-y-4">
                <div className={`text-center p-4 rounded-lg ${
                  selectedAnswer === quiz.correctAnswer ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedAnswer === quiz.correctAnswer ? '✅ 정답입니다!' : '❌ 오답입니다!'}
                </div>
                <button onClick={loadBlankQuiz} className="w-full btn btn-primary">
                  다음 문제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
}
