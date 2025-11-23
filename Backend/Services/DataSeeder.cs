using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using IdiomLearningAPI.Models;
using IdiomLearningAPI.Data;

namespace IdiomLearningAPI.Services
{
    /// <summary>
    /// 데이터베이스 초기 데이터 시드 서비스
    /// </summary>
    public class DataSeeder
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DataSeeder> _logger;

        public DataSeeder(
            ApplicationDbContext context,
            ILogger<DataSeeder> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// 모든 초기 데이터 시드
        /// </summary>
        public async Task SeedAllAsync()
        {
            await SeedIdiomsAsync();
            await SeedGameStagesAsync();
        }

        /// <summary>
        /// 사자성어 데이터 시드
        /// </summary>
        public async Task SeedIdiomsAsync()
        {
            try
            {
                // 기존 데이터 확인
                var count = await _context.Idioms.CountAsync();
                if (count > 0)
                {
                    _logger.LogInformation($"사자성어 데이터가 이미 {count}개 존재합니다. 스킵합니다.");
                    return;
                }

                // JSON 파일 읽기
                var jsonPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "idioms_dataset.json");

                if (!File.Exists(jsonPath))
                {
                    _logger.LogWarning($"데이터 파일을 찾을 수 없습니다: {jsonPath}");
                    return;
                }

                var jsonContent = await File.ReadAllTextAsync(jsonPath);
                var idioms = JsonSerializer.Deserialize<List<IdiomDto>>(jsonContent);

                if (idioms == null || idioms.Count == 0)
                {
                    _logger.LogWarning("파싱된 사자성어 데이터가 없습니다.");
                    return;
                }

                // DTO를 모델로 변환
                var idiomModels = idioms.Select(dto => new Idiom
                {
                    IdiomId = dto.IdiomId,
                    Hanja = dto.Hanja,
                    Hangul = dto.Hangul,
                    Meaning = dto.Meaning,
                    ExampleSentence = dto.ExampleSentence,
                    BaseDifficulty = Enum.Parse<Difficulty>(dto.Difficulty),
                    Category = dto.Category,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                // EF Core로 삽입
                await _context.Idioms.AddRangeAsync(idiomModels);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ {idiomModels.Count}개의 사자성어 데이터를 성공적으로 삽입했습니다.");
                _logger.LogInformation($"  - 초급: {idiomModels.Count(i => i.BaseDifficulty == Difficulty.EASY)}개");
                _logger.LogInformation($"  - 중급: {idiomModels.Count(i => i.BaseDifficulty == Difficulty.MEDIUM)}개");
                _logger.LogInformation($"  - 고급: {idiomModels.Count(i => i.BaseDifficulty == Difficulty.HARD)}개");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "사자성어 데이터 시드 중 에러 발생");
                throw;
            }
        }

        /// <summary>
        /// 게임 스테이지 데이터 시드
        /// </summary>
        public async Task SeedGameStagesAsync()
        {
            try
            {
                var count = await _context.GameStages.CountAsync();
                if (count > 0)
                {
                    _logger.LogInformation($"스테이지 데이터가 이미 {count}개 존재합니다. 스킵합니다.");
                    return;
                }

                // 12지신 스테이지 데이터 (토끼 → 양 → 원숭이 → 쥐 → 돼지 → 개 → 소 → 뱀 → 말 → 닭(봉황) → 용 → 호랑이)
                var stages = new List<GameStage>
                {
                    new GameStage { StageId = 1, BossName = "토끼", Emoji = "🐰", ZodiacAnimal = "토끼", BossHp = 100, BossAttackPower = 10, BossImageUrl = "/pictures/rabbit.png", Description = "평화로운 토끼, 여정의 시작", RequiredDifficulty = Difficulty.EASY },
                    new GameStage { StageId = 2, BossName = "양", Emoji = "🐑", ZodiacAnimal = "양", BossHp = 120, BossAttackPower = 12, BossImageUrl = "/pictures/sheep.png", Description = "온순한 양, 따뜻한 시험", RequiredDifficulty = Difficulty.EASY },
                    new GameStage { StageId = 3, BossName = "원숭이", Emoji = "🐵", ZodiacAnimal = "원숭이", BossHp = 140, BossAttackPower = 14, BossImageUrl = "/pictures/monkey.png", Description = "영리한 원숭이, 지혜의 도전", RequiredDifficulty = Difficulty.EASY },
                    new GameStage { StageId = 4, BossName = "쥐", Emoji = "🐭", ZodiacAnimal = "쥐", BossHp = 160, BossAttackPower = 16, BossImageUrl = "/pictures/mouse.png", Description = "민첩한 쥐, 초급의 마지막 관문", RequiredDifficulty = Difficulty.EASY },
                    new GameStage { StageId = 5, BossName = "돼지", Emoji = "🐷", ZodiacAnimal = "돼지", BossHp = 180, BossAttackPower = 18, BossImageUrl = "/pictures/pig.png", Description = "강건한 돼지, 중급의 시작", RequiredDifficulty = Difficulty.MEDIUM },
                    new GameStage { StageId = 6, BossName = "개", Emoji = "🐶", ZodiacAnimal = "개", BossHp = 200, BossAttackPower = 20, BossImageUrl = "/pictures/dog.png", Description = "충직한 개, 충성의 시험", RequiredDifficulty = Difficulty.MEDIUM },
                    new GameStage { StageId = 7, BossName = "소", Emoji = "🐮", ZodiacAnimal = "소", BossHp = 220, BossAttackPower = 22, BossImageUrl = "/pictures/bull.png", Description = "우직한 소, 인내의 벽", RequiredDifficulty = Difficulty.MEDIUM },
                    new GameStage { StageId = 8, BossName = "뱀", Emoji = "🐍", ZodiacAnimal = "뱀", BossHp = 240, BossAttackPower = 24, BossImageUrl = "/pictures/snake.png", Description = "신비로운 뱀, 중급의 마지막 시련", RequiredDifficulty = Difficulty.MEDIUM },
                    new GameStage { StageId = 9, BossName = "말", Emoji = "🐴", ZodiacAnimal = "말", BossHp = 260, BossAttackPower = 26, BossImageUrl = "/pictures/horse.png", Description = "질주하는 말, 고급의 서막", RequiredDifficulty = Difficulty.HARD },
                    new GameStage { StageId = 10, BossName = "봉황", Emoji = "🐔", ZodiacAnimal = "닭", BossHp = 280, BossAttackPower = 28, BossImageUrl = "/pictures/chicken.png", Description = "불사조 봉황, 불꽃의 심판", RequiredDifficulty = Difficulty.HARD },
                    new GameStage { StageId = 11, BossName = "용", Emoji = "🐲", ZodiacAnimal = "용", BossHp = 300, BossAttackPower = 30, BossImageUrl = "/pictures/dragon.png", Description = "천상의 용, 하늘의 지배자", RequiredDifficulty = Difficulty.HARD },
                    new GameStage { StageId = 12, BossName = "호랑이", Emoji = "🐯", ZodiacAnimal = "호랑이", BossHp = 500, BossAttackPower = 35, BossImageUrl = "/pictures/tiger.png", Description = "백수의 왕 호랑이, 최종 보스", RequiredDifficulty = Difficulty.HARD }
                };

                await _context.GameStages.AddRangeAsync(stages);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ {stages.Count}개의 스테이지 데이터를 성공적으로 삽입했습니다.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "스테이지 데이터 시드 중 에러 발생");
                throw;
            }
        }

        /// <summary>
        /// 모든 데이터 삭제 (개발용)
        /// </summary>
        public async Task ClearAllDataAsync()
        {
            _context.Idioms.RemoveRange(_context.Idioms);
            _context.GameStages.RemoveRange(_context.GameStages);
            await _context.SaveChangesAsync();
            _logger.LogWarning("⚠️ 모든 데이터가 삭제되었습니다.");
        }
    }

    /// <summary>
    /// JSON 파싱용 DTO
    /// </summary>
    public class IdiomDto
    {
        public int IdiomId { get; set; }
        public string Hanja { get; set; } = string.Empty;
        public string Hangul { get; set; } = string.Empty;
        public string Meaning { get; set; } = string.Empty;
        public string ExampleSentence { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }
}
