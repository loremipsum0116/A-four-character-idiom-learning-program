using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IdiomLearningAPI.Models
{
    /// <summary>
    /// 사자성어 모델
    /// FR 3.1: 사자성어 DB
    /// </summary>
    [Table("Idioms")]
    public class Idiom
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int IdiomId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Hanja { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Hangul { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Meaning { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string ExampleSentence { get; set; } = string.Empty;

        [Required]
        public Difficulty BaseDifficulty { get; set; }

        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum Difficulty
    {
        EASY,
        MEDIUM,
        HARD
    }
}
