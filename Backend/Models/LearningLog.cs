using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IdiomLearningAPI.Models
{
    /// <summary>
    /// 학습 로그 모델 (특허 핵심 데이터)
    /// FR 4.5: 학습 성과 데이터 수신
    /// FR 6.1: 학습 데이터 수집
    /// </summary>
    [Table("LearningLogs")]
    public class LearningLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        public int? StageId { get; set; }

        [Required]
        public int IdiomId { get; set; }

        [Required]
        public ActionType ActionType { get; set; }

        public Difficulty? ChosenDifficulty { get; set; }

        public bool IsCorrect { get; set; }

        public int ResponseTimeMs { get; set; }

        public int CalculatedDamage { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public enum ActionType
    {
        ATTACK,
        DEFEND,
        LEARN
    }
}
