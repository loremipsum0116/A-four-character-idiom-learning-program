using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;
using System.Security.Claims;
using IdiomLearningAPI.Data;
using IdiomLearningAPI.Models;
using IdiomLearningAPI.DTOs;
using IdiomLearningAPI.Services;

namespace IdiomLearningAPI.Controllers
{
    /// <summary>
    /// FR 4.0: 게임 모드 (턴제 전투 - 특허 핵심)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GameController : ControllerBase
    {
        private readonly MongoDbContext _context;

        public GameController(MongoDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// FR 4.1: 스테이지 맵 조회 (12지신)
        /// </summary>
        [HttpGet("stages")]
        public async Task<ActionResult> GetStages()
        {
            try
            {
                var stages = await _context.GameStages
                    .Find(_ => true)
                    .SortBy(s => s.StageId)
                    .ToListAsync();

                return Ok(new { stages });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to get stages", message = ex.Message });
            }
        }

        /// <summary>
        /// FR 4.2: 특정 스테이지 정보 조회
        /// </summary>
        [HttpGet("stages/{stageId}")]
        public async Task<ActionResult> GetStage(int stageId)
        {
            try
            {
                var stage = await _context.GameStages
                    .Find(s => s.StageId == stageId)
                    .FirstOrDefaultAsync();

                if (stage == null)
                {
                    return NotFound(new { error = "Stage not found" });
                }

                return Ok(new { stage });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to get stage", message = ex.Message });
            }
        }

        /// <summary>
        /// FR 4.6: 공격 턴 처리 (데미지 연산 핵심 로직)
        /// </summary>
        [HttpPost("attack")]
        public async Task<ActionResult<AttackResponse>> ProcessAttack([FromBody] AttackRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                // FR 4.6: 데미지 연산 (특허 핵심 로직)
                int damage = CombatCalculator.CalculateAttackDamage(
                    request.Difficulty,
                    request.IsCorrect,
                    request.ResponseTimeMs
                );

                // FR 4.5: 학습 성과 데이터 저장
                var learningLog = new LearningLog
                {
                    UserId = userId,
                    StageId = request.StageId,
                    IdiomId = request.IdiomId,
                    ActionType = ActionType.ATTACK,
                    ChosenDifficulty = request.Difficulty,
                    IsCorrect = request.IsCorrect,
                    ResponseTimeMs = request.ResponseTimeMs,
                    CalculatedDamage = damage,
                    Timestamp = DateTime.UtcNow
                };

                await _context.LearningLogs.InsertOneAsync(learningLog);

                return Ok(new AttackResponse
                {
                    Damage = damage,
                    IsCorrect = request.IsCorrect,
                    Difficulty = request.Difficulty,
                    ResponseTimeMs = request.ResponseTimeMs,
                    Message = request.IsCorrect ? "정답입니다!" : "오답입니다!"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to process attack", message = ex.Message });
            }
        }

        /// <summary>
        /// FR 4.8: 방어 턴 처리 (데미지 감소)
        /// </summary>
        [HttpPost("defend")]
        public async Task<ActionResult<DefenseResponse>> ProcessDefense([FromBody] DefenseRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                // FR 7.3: 방어 데미지 계산
                int damageTaken = CombatCalculator.CalculateDefenseDamage(
                    request.BossDamage,
                    request.DefenseSuccess
                );

                // 학습 로그 저장
                var learningLog = new LearningLog
                {
                    UserId = userId,
                    StageId = request.StageId,
                    IdiomId = request.IdiomId,
                    ActionType = ActionType.DEFEND,
                    IsCorrect = request.DefenseSuccess,
                    ResponseTimeMs = request.ResponseTimeMs,
                    CalculatedDamage = damageTaken,
                    Timestamp = DateTime.UtcNow
                };

                await _context.LearningLogs.InsertOneAsync(learningLog);

                return Ok(new DefenseResponse
                {
                    DamageTaken = damageTaken,
                    DefenseSuccess = request.DefenseSuccess,
                    Message = request.DefenseSuccess ? "방어 성공!" : "방어 실패!"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to process defense", message = ex.Message });
            }
        }

        /// <summary>
        /// FR 4.9: 스테이지 클리어 처리
        /// </summary>
        [HttpPost("clear")]
        public async Task<ActionResult> ClearStage([FromBody] ClearStageRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var user = await _context.Users
                    .Find(u => u.Id == userId)
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                // 이미 클리어한 스테이지인지 확인
                if (!user.ClearedStages.Contains(request.StageId))
                {
                    user.ClearedStages.Add(request.StageId);

                    // FR 5.2: 12단계 모두 클리어 시 엔딩 콘텐츠 잠금 해제
                    if (user.ClearedStages.Count >= 12)
                    {
                        user.UnlockedContent.HiddenBoss = true;
                        user.UnlockedContent.InfiniteMode = true;
                        user.UnlockedContent.PvpMode = true;
                    }

                    // 업데이트
                    var update = Builders<User>.Update
                        .Set(u => u.ClearedStages, user.ClearedStages)
                        .Set(u => u.UnlockedContent, user.UnlockedContent);

                    await _context.Users.UpdateOneAsync(u => u.Id == userId, update);
                }

                return Ok(new
                {
                    message = "Stage cleared!",
                    clearedStages = user.ClearedStages,
                    unlockedContent = user.UnlockedContent
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to clear stage", message = ex.Message });
            }
        }

        /// <summary>
        /// 사용자의 스테이지 진행 상황 조회
        /// </summary>
        [HttpGet("progress")]
        public async Task<ActionResult<ProgressResponse>> GetProgress()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var user = await _context.Users
                    .Find(u => u.Id == userId)
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                return Ok(new ProgressResponse
                {
                    ClearedStages = user.ClearedStages,
                    LionStats = new LionStatsDTO
                    {
                        Hp = user.LionStats.Hp,
                        MaxHp = user.LionStats.MaxHp,
                        Level = user.LionStats.Level
                    },
                    UnlockedContent = new UnlockedContentDTO
                    {
                        HiddenBoss = user.UnlockedContent.HiddenBoss,
                        InfiniteMode = user.UnlockedContent.InfiniteMode,
                        PvpMode = user.UnlockedContent.PvpMode
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to get progress", message = ex.Message });
            }
        }
    }
}
