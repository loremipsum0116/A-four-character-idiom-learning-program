using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IdiomLearningAPI.Models
{
    /// <summary>
    /// 게임 스테이지 모델 (12지신)
    /// FR 4.1: 스테이지 맵
    /// </summary>
    [Table("GameStages")]
    public class GameStage
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int StageId { get; set; }

        [Required]
        [MaxLength(100)]
        public string BossName { get; set; } = string.Empty;

        public int BossHp { get; set; }

        public int BossAttackPower { get; set; }

        [MaxLength(500)]
        public string? BossImageUrl { get; set; }

        [Required]
        [MaxLength(100)]
        public string ZodiacAnimal { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [MaxLength(10)]
        public string Emoji { get; set; } = string.Empty;

        [Required]
        public Difficulty RequiredDifficulty { get; set; }
    }
}
