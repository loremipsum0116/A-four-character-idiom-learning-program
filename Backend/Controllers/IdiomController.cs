using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;
using IdiomLearningAPI.Models;

namespace IdiomLearningAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IdiomController : ControllerBase
    {
        private readonly IMongoCollection<Idiom> _idiomsCollection;
        private readonly ILogger<IdiomController> _logger;

        public IdiomController(IMongoDatabase database, ILogger<IdiomController> logger)
        {
            _idiomsCollection = database.GetCollection<Idiom>("Idioms");
            _logger = logger;
        }

        /// <summary>
        /// 난이도별 랜덤 사자성어 조회
        /// GET /api/idiom/random?difficulty=EASY
        /// </summary>
        [HttpGet("random")]
        public async Task<IActionResult> GetRandomIdiom([FromQuery] string difficulty = "EASY")
        {
            try
            {
                // 난이도 파싱
                if (!Enum.TryParse<Difficulty>(difficulty.ToUpper(), out var parsedDifficulty))
                {
                    return BadRequest(new { message = "유효하지 않은 난이도입니다. (EASY, MEDIUM, HARD)" });
                }

                // 해당 난이도의 사자성어 가져오기
                var idioms = await _idiomsCollection
                    .Find(i => i.BaseDifficulty == parsedDifficulty)
                    .ToListAsync();

                if (idioms.Count == 0)
                {
                    return NotFound(new { message = "해당 난이도의 사자성어가 없습니다." });
                }

                // 랜덤 선택
                var random = new Random();
                var randomIdiom = idioms[random.Next(idioms.Count)];

                return Ok(randomIdiom);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "랜덤 사자성어 조회 실패");
                return StatusCode(500, new { message = "서버 오류가 발생했습니다." });
            }
        }

        /// <summary>
        /// 빈칸 맞추기 퀴즈 생성
        /// GET /api/idiom/quiz/blank?difficulty=MEDIUM
        /// </summary>
        [HttpGet("quiz/blank")]
        public async Task<IActionResult> GetBlankQuiz([FromQuery] string difficulty = "EASY")
        {
            try
            {
                if (!Enum.TryParse<Difficulty>(difficulty.ToUpper(), out var parsedDifficulty))
                {
                    return BadRequest(new { message = "유효하지 않은 난이도입니다." });
                }

                // 해당 난이도의 사자성어들 가져오기
                var idioms = await _idiomsCollection
                    .Find(i => i.BaseDifficulty == parsedDifficulty)
                    .ToListAsync();

                if (idioms.Count < 4)
                {
                    return NotFound(new { message = "퀴즈 생성에 필요한 사자성어가 부족합니다." });
                }

                // 랜덤 선택
                var random = new Random();
                var correctIdiom = idioms[random.Next(idioms.Count)];

                // 오답 보기 3개 생성 (같은 난이도에서)
                var wrongChoices = idioms
                    .Where(i => i.IdiomId != correctIdiom.IdiomId)
                    .OrderBy(x => random.Next())
                    .Take(3)
                    .ToList();

                // 보기 섞기
                var choices = new List<string>
                {
                    correctIdiom.Meaning,
                    wrongChoices[0].Meaning,
                    wrongChoices[1].Meaning,
                    wrongChoices[2].Meaning
                }
                .OrderBy(x => random.Next())
                .ToList();

                var correctIndex = choices.IndexOf(correctIdiom.Meaning);

                var quiz = new
                {
                    idiomId = correctIdiom.IdiomId,
                    question = $"{correctIdiom.Hanja} ({correctIdiom.Hangul})",
                    hanja = correctIdiom.Hanja,
                    hangul = correctIdiom.Hangul,
                    choices = choices,
                    answer = correctIndex,
                    difficulty = correctIdiom.BaseDifficulty.ToString(),
                    category = correctIdiom.Category
                };

                return Ok(quiz);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "빈칸 퀴즈 생성 실패");
                return StatusCode(500, new { message = "서버 오류가 발생했습니다." });
            }
        }

        /// <summary>
        /// 카드 매칭 퀴즈 생성
        /// GET /api/idiom/quiz/matching?count=6
        /// </summary>
        [HttpGet("quiz/matching")]
        public async Task<IActionResult> GetMatchingQuiz([FromQuery] int count = 6)
        {
            try
            {
                // 전체 사자성어에서 랜덤 선택
                var allIdioms = await _idiomsCollection
                    .Find(_ => true)
                    .ToListAsync();

                if (allIdioms.Count < count)
                {
                    return NotFound(new { message = "퀴즈 생성에 필요한 사자성어가 부족합니다." });
                }

                var random = new Random();
                var selectedIdioms = allIdioms
                    .OrderBy(x => random.Next())
                    .Take(count)
                    .ToList();

                var cards = selectedIdioms.Select(idiom => new
                {
                    idiomId = idiom.IdiomId,
                    hanja = idiom.Hanja,
                    hangul = idiom.Hangul,
                    meaning = idiom.Meaning,
                    category = idiom.Category
                }).ToList();

                return Ok(new { cards });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "매칭 퀴즈 생성 실패");
                return StatusCode(500, new { message = "서버 오류가 발생했습니다." });
            }
        }

        /// <summary>
        /// 모든 사자성어 조회 (페이지네이션)
        /// GET /api/idiom?page=1&limit=20&difficulty=EASY
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllIdioms(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20,
            [FromQuery] string? difficulty = null)
        {
            try
            {
                var filter = Builders<Idiom>.Filter.Empty;

                // 난이도 필터
                if (!string.IsNullOrEmpty(difficulty) && Enum.TryParse<Difficulty>(difficulty.ToUpper(), out var parsedDifficulty))
                {
                    filter = Builders<Idiom>.Filter.Eq(i => i.BaseDifficulty, parsedDifficulty);
                }

                var total = await _idiomsCollection.CountDocumentsAsync(filter);
                var idioms = await _idiomsCollection
                    .Find(filter)
                    .Skip((page - 1) * limit)
                    .Limit(limit)
                    .ToListAsync();

                return Ok(new
                {
                    total,
                    page,
                    limit,
                    data = idioms
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "사자성어 목록 조회 실패");
                return StatusCode(500, new { message = "서버 오류가 발생했습니다." });
            }
        }

        /// <summary>
        /// 특정 사자성어 조회
        /// GET /api/idiom/{id}
        /// </summary>
        [HttpGet("{idiomId}")]
        public async Task<IActionResult> GetIdiomById(int idiomId)
        {
            try
            {
                var idiom = await _idiomsCollection
                    .Find(i => i.IdiomId == idiomId)
                    .FirstOrDefaultAsync();

                if (idiom == null)
                {
                    return NotFound(new { message = "사자성어를 찾을 수 없습니다." });
                }

                return Ok(idiom);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "사자성어 조회 실패");
                return StatusCode(500, new { message = "서버 오류가 발생했습니다." });
            }
        }

        /// <summary>
        /// 난이도별 사자성어 개수 조회
        /// GET /api/idiom/stats/count
        /// </summary>
        [HttpGet("stats/count")]
        public async Task<IActionResult> GetIdiomCount()
        {
            try
            {
                var total = await _idiomsCollection.CountDocumentsAsync(_ => true);
                var easy = await _idiomsCollection.CountDocumentsAsync(i => i.BaseDifficulty == Difficulty.EASY);
                var medium = await _idiomsCollection.CountDocumentsAsync(i => i.BaseDifficulty == Difficulty.MEDIUM);
                var hard = await _idiomsCollection.CountDocumentsAsync(i => i.BaseDifficulty == Difficulty.HARD);

                return Ok(new
                {
                    total,
                    byDifficulty = new
                    {
                        easy,
                        medium,
                        hard
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "사자성어 통계 조회 실패");
                return StatusCode(500, new { message = "서버 오류가 발생했습니다." });
            }
        }
    }
}
