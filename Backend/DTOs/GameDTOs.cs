using IdiomLearningAPI.Models;

namespace IdiomLearningAPI.DTOs
{
    /// <summary>
    /// FR 4.6: 공격 요청 DTO
    /// </summary>
    public class AttackRequest
    {
        public int StageId { get; set; }
        public int IdiomId { get; set; }
        public Difficulty Difficulty { get; set; }
        public bool IsCorrect { get; set; }
        public int ResponseTimeMs { get; set; }
    }

    /// <summary>
    /// FR 4.6: 공격 응답 DTO
    /// </summary>
    public class AttackResponse
    {
        public int Damage { get; set; }
        public bool IsCorrect { get; set; }
        public Difficulty Difficulty { get; set; }
        public int ResponseTimeMs { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// FR 4.8: 방어 요청 DTO
    /// </summary>
    public class DefenseRequest
    {
        public int StageId { get; set; }
        public int IdiomId { get; set; }
        public bool DefenseSuccess { get; set; }
        public int ResponseTimeMs { get; set; }
        public int BossDamage { get; set; }
    }

    /// <summary>
    /// FR 4.8: 방어 응답 DTO
    /// </summary>
    public class DefenseResponse
    {
        public int DamageTaken { get; set; }
        public bool DefenseSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class ClearStageRequest
    {
        public int StageId { get; set; }
    }

    public class ProgressResponse
    {
        public List<int> ClearedStages { get; set; } = new();
        public LionStatsDTO LionStats { get; set; } = new();
        public UnlockedContentDTO UnlockedContent { get; set; } = new();
    }
}
