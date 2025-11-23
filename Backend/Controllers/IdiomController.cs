using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using IdiomLearningAPI.Data;
using IdiomLearningAPI.Models;

namespace IdiomLearningAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IdiomController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<IdiomController> _logger;

        public IdiomController(ApplicationDbContext context, ILogger<IdiomController> logger)
        {
            _context = context;
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
                var idioms = await _context.Idioms
                    .Where(i => i.BaseDifficulty == parsedDifficulty)
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
                var idioms = await _context.Idioms
                    .Where(i => i.BaseDifficulty == parsedDifficulty)
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
        /// 한자 빈칸 채우기 퀴즈 생성 (방어 턴용)
        /// GET /api/idiom/quiz/hanjaBlank?difficulty=MEDIUM
        /// </summary>
        [HttpGet("quiz/hanjaBlank")]
        public async Task<IActionResult> GetHanjaBlankQuiz([FromQuery] string difficulty = "EASY")
        {
            try
            {
                if (!Enum.TryParse<Difficulty>(difficulty.ToUpper(), out var parsedDifficulty))
                {
                    return BadRequest(new { message = "유효하지 않은 난이도입니다." });
                }

                // 해당 난이도의 사자성어들 가져오기
                var idioms = await _context.Idioms
                    .Where(i => i.BaseDifficulty == parsedDifficulty)
                    .ToListAsync();

                if (idioms.Count < 4)
                {
                    return NotFound(new { message = "퀴즈 생성에 필요한 사자성어가 부족합니다." });
                }

                // 랜덤 선택
                var random = new Random();
                var correctIdiom = idioms[random.Next(idioms.Count)];

                // 한자 4글자 중 한 글자를 비움 (0~3)
                var blankPosition = random.Next(4);
                var hanjaChars = correctIdiom.Hanja.ToCharArray();
                var correctChar = hanjaChars[blankPosition].ToString();

                // 빈칸 처리
                hanjaChars[blankPosition] = '_';
                var questionText = new string(hanjaChars);

                // 오답 보기 3개 생성 (다른 사자성어의 한자에서 가져옴)
                var allHanjaChars = idioms
                    .SelectMany(i => i.Hanja.ToCharArray())
                    .Distinct()
                    .Where(c => c.ToString() != correctChar)
                    .ToList();

                var wrongChoices = allHanjaChars
                    .OrderBy(x => random.Next())
                    .Take(3)
                    .Select(c => c.ToString())
                    .ToList();

                // 보기 섞기
                var choices = new List<string> { correctChar };
                choices.AddRange(wrongChoices);
                choices = choices.OrderBy(x => random.Next()).ToList();

                var correctIndex = choices.IndexOf(correctChar);

                var quiz = new
                {
                    idiomId = correctIdiom.IdiomId,
                    question = questionText,
                    fullHanja = correctIdiom.Hanja,
                    hangul = correctIdiom.Hangul,
                    blankPosition = blankPosition,
                    choices = choices,
                    answer = correctIndex,
                    difficulty = correctIdiom.BaseDifficulty.ToString(),
                    meaning = correctIdiom.Meaning
                };

                return Ok(quiz);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "한자 빈칸 퀴즈 생성 실패");
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
                var allIdioms = await _context.Idioms.ToListAsync();

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
                var query = _context.Idioms.AsQueryable();

                // 난이도 필터
                if (!string.IsNullOrEmpty(difficulty) && Enum.TryParse<Difficulty>(difficulty.ToUpper(), out var parsedDifficulty))
                {
                    query = query.Where(i => i.BaseDifficulty == parsedDifficulty);
                }

                var total = await query.CountAsync();
                var idioms = await query
                    .Skip((page - 1) * limit)
                    .Take(limit)
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
                var idiom = await _context.Idioms
                    .FirstOrDefaultAsync(i => i.IdiomId == idiomId);

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
                var total = await _context.Idioms.CountAsync();
                var easy = await _context.Idioms.CountAsync(i => i.BaseDifficulty == Difficulty.EASY);
                var medium = await _context.Idioms.CountAsync(i => i.BaseDifficulty == Difficulty.MEDIUM);
                var hard = await _context.Idioms.CountAsync(i => i.BaseDifficulty == Difficulty.HARD);

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
