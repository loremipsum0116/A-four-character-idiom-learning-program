const Idiom = require('../models/Idiom');
const LearningLog = require('../models/LearningLog');

/**
 * FR 3.1: 사자성어 목록 조회
 */
async function getIdioms(req, res) {
  try {
    const { difficulty, limit = 20, offset = 0 } = req.query;

    let query = {};
    if (difficulty) {
      query.base_difficulty = difficulty.toUpperCase();
    }

    const idioms = await Idiom.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ idiom_id: 1 });

    const total = await Idiom.countDocuments(query);

    res.json({
      idioms,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get idioms error:', error);
    res.status(500).json({ error: 'Failed to get idioms', message: error.message });
  }
}

/**
 * FR 3.2: 빈칸 맞추기 문제 생성
 */
async function getBlankQuiz(req, res) {
  try {
    const { difficulty } = req.query;

    // 난이도별 사자성어 조회
    let query = {};
    if (difficulty) {
      query.base_difficulty = difficulty.toUpperCase();
    }

    // 랜덤 사자성어 선택
    const count = await Idiom.countDocuments(query);
    const random = Math.floor(Math.random() * count);
    const idiom = await Idiom.findOne(query).skip(random);

    if (!idiom) {
      return res.status(404).json({ error: 'No idiom found' });
    }

    // 빈칸 위치 랜덤 선택 (0-3 중 하나)
    const blankPosition = Math.floor(Math.random() * 4);
    const hanjaArray = idiom.hanja.split('');
    const correctAnswer = hanjaArray[blankPosition];
    hanjaArray[blankPosition] = '_';

    // 오답 선택지 생성 (다른 사자성어에서 랜덤)
    const wrongAnswers = await Idiom.aggregate([
      { $match: query },
      { $sample: { size: 3 } },
    ]);

    const options = [
      correctAnswer,
      ...wrongAnswers.map(w => w.hanja.charAt(blankPosition)),
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);

    // 선택지 섞기
    const shuffledOptions = options.sort(() => Math.random() - 0.5);

    res.json({
      idiom_id: idiom.idiom_id,
      question: hanjaArray.join(''),
      hangul: idiom.hangul,
      meaning: idiom.meaning,
      options: shuffledOptions,
      correctAnswer,
      blankPosition,
    });
  } catch (error) {
    console.error('Get blank quiz error:', error);
    res.status(500).json({ error: 'Failed to get quiz', message: error.message });
  }
}

/**
 * FR 3.3: 카드 매칭 문제 생성
 */
async function getCardMatchingQuiz(req, res) {
  try {
    const { difficulty, count = 6 } = req.query;

    let query = {};
    if (difficulty) {
      query.base_difficulty = difficulty.toUpperCase();
    }

    // 랜덤 사자성어 선택
    const idioms = await Idiom.aggregate([
      { $match: query },
      { $sample: { size: parseInt(count) } },
    ]);

    // 카드 생성 (한자 카드 + 뜻 카드)
    const hanjaCards = idioms.map((idiom, index) => ({
      id: `hanja-${index}`,
      type: 'hanja',
      content: idiom.hanja,
      idiom_id: idiom.idiom_id,
    }));

    const meaningCards = idioms.map((idiom, index) => ({
      id: `meaning-${index}`,
      type: 'meaning',
      content: idiom.meaning,
      idiom_id: idiom.idiom_id,
    }));

    // 모든 카드 섞기
    const allCards = [...hanjaCards, ...meaningCards].sort(() => Math.random() - 0.5);

    res.json({
      cards: allCards,
      totalPairs: idioms.length,
    });
  } catch (error) {
    console.error('Get card matching quiz error:', error);
    res.status(500).json({ error: 'Failed to get card matching quiz', message: error.message });
  }
}

/**
 * FR 3.0: 학습 모드 - 문제 풀이 결과 저장
 */
async function submitLearnResult(req, res) {
  try {
    const { idiomId, isCorrect, responseTimeMs, quizType } = req.body;
    const userId = req.user._id;

    // 학습 로그 저장
    const learningLog = new LearningLog({
      user_id: userId,
      idiom_id: idiomId,
      action_type: 'LEARN',
      is_correct: isCorrect,
      response_time_ms: responseTimeMs,
    });

    await learningLog.save();

    res.json({
      message: 'Learning result saved',
      isCorrect,
    });
  } catch (error) {
    console.error('Submit learn result error:', error);
    res.status(500).json({ error: 'Failed to save result', message: error.message });
  }
}

/**
 * 특정 사자성어 상세 조회
 */
async function getIdiom(req, res) {
  try {
    const { idiomId } = req.params;
    const idiom = await Idiom.findOne({ idiom_id: idiomId });

    if (!idiom) {
      return res.status(404).json({ error: 'Idiom not found' });
    }

    res.json({ idiom });
  } catch (error) {
    console.error('Get idiom error:', error);
    res.status(500).json({ error: 'Failed to get idiom', message: error.message });
  }
}

module.exports = {
  getIdioms,
  getIdiom,
  getBlankQuiz,
  getCardMatchingQuiz,
  submitLearnResult,
};
