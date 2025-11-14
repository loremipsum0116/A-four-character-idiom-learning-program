using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IdiomLearningAPI.Models
{
    /// <summary>
    /// 게임 스테이지 모델 (12지신)
    /// FR 4.1: 스테이지 맵
    /// </summary>
    public class GameStage
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("stage_id")]
        public int StageId { get; set; }

        [BsonElement("boss_name")]
        public string BossName { get; set; } = string.Empty;

        [BsonElement("boss_hp")]
        public int BossHp { get; set; }

        [BsonElement("boss_attack_power")]
        public int BossAttackPower { get; set; }

        [BsonElement("boss_image_url")]
        public string? BossImageUrl { get; set; }

        [BsonElement("zodiac_animal")]
        public string ZodiacAnimal { get; set; } = string.Empty;

        [BsonElement("description")]
        public string Description { get; set; } = string.Empty;
    }
}
