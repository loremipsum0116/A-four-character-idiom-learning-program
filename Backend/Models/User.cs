using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IdiomLearningAPI.Models
{
    /// <summary>
    /// 사용자 모델
    /// FR 1.0: 사용자 계정 및 인증
    /// </summary>
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        [BsonElement("password")]
        public string Password { get; set; } = string.Empty;

        [BsonElement("nickname")]
        public string Nickname { get; set; } = string.Empty;

        [BsonElement("profileImage")]
        public string? ProfileImage { get; set; }

        [BsonElement("clearedStages")]
        public List<int> ClearedStages { get; set; } = new List<int>();

        [BsonElement("lionStats")]
        public LionStats LionStats { get; set; } = new LionStats();

        [BsonElement("unlockedContent")]
        public UnlockedContent UnlockedContent { get; set; } = new UnlockedContent();

        [BsonElement("settings")]
        public UserSettings Settings { get; set; } = new UserSettings();

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("lastLogin")]
        public DateTime LastLogin { get; set; } = DateTime.UtcNow;
    }

    public class LionStats
    {
        [BsonElement("hp")]
        public int Hp { get; set; } = 100;

        [BsonElement("maxHp")]
        public int MaxHp { get; set; } = 100;

        [BsonElement("level")]
        public int Level { get; set; } = 1;
    }

    public class UnlockedContent
    {
        [BsonElement("hiddenBoss")]
        public bool HiddenBoss { get; set; } = false;

        [BsonElement("infiniteMode")]
        public bool InfiniteMode { get; set; } = false;

        [BsonElement("pvpMode")]
        public bool PvpMode { get; set; } = false;
    }

    public class UserSettings
    {
        [BsonElement("sound")]
        public bool Sound { get; set; } = true;

        [BsonElement("notification")]
        public bool Notification { get; set; } = true;
    }
}
