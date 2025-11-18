using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IdiomLearningAPI.Models
{
    /// <summary>
    /// 학습 로그 모델 (특허 핵심 데이터)
    /// FR 4.5: 학습 성과 데이터 수신
    /// FR 6.1: 학습 데이터 수집
    /// </summary>
    public class LearningLog
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("user_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("stage_id")]
        public int? StageId { get; set; }

        [BsonElement("idiom_id")]
        public int IdiomId { get; set; }

        [BsonElement("action_type")]
        public ActionType ActionType { get; set; }

        [BsonElement("chosen_difficulty")]
        public Difficulty? ChosenDifficulty { get; set; }

        [BsonElement("is_correct")]
        public bool IsCorrect { get; set; }

        [BsonElement("response_time_ms")]
        public int ResponseTimeMs { get; set; }

        [BsonElement("calculated_damage")]
        public int CalculatedDamage { get; set; }

        [BsonElement("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public enum ActionType
    {
        ATTACK,
        DEFEND,
        LEARN
    }
}
