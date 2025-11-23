using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace IdiomLearningAPI.Models
{
    /// <summary>
    /// 사용자 모델
    /// FR 1.0: 사용자 계정 및 인증
    /// </summary>
    [Table("Users")]
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Nickname { get; set; } = string.Empty;

        [MaxLength(500)]
        public string ClearedStagesJson { get; set; } = "[]";

        [NotMapped]
        public List<int> ClearedStages
        {
            get => System.Text.Json.JsonSerializer.Deserialize<List<int>>(ClearedStagesJson) ?? new List<int>();
            set => ClearedStagesJson = System.Text.Json.JsonSerializer.Serialize(value);
        }

        [MaxLength(1000)]
        public string LionStatsJson { get; set; } = "{}";

        [NotMapped]
        public LionStats LionStats
        {
            get => System.Text.Json.JsonSerializer.Deserialize<LionStats>(LionStatsJson) ?? new LionStats();
            set => LionStatsJson = System.Text.Json.JsonSerializer.Serialize(value);
        }

        [MaxLength(1000)]
        public string UnlockedContentJson { get; set; } = "{}";

        [NotMapped]
        public UnlockedContent UnlockedContent
        {
            get => System.Text.Json.JsonSerializer.Deserialize<UnlockedContent>(UnlockedContentJson) ?? new UnlockedContent();
            set => UnlockedContentJson = System.Text.Json.JsonSerializer.Serialize(value);
        }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime LastLogin { get; set; } = DateTime.UtcNow;
    }

    public class LionStats
    {
        public int Hp { get; set; } = 100;
        public int MaxHp { get; set; } = 100;
        public int Level { get; set; } = 1;
    }

    public class UnlockedContent
    {
        public bool HiddenBoss { get; set; } = false;
        public bool InfiniteMode { get; set; } = false;
        public bool PvpMode { get; set; } = false;
    }
}
