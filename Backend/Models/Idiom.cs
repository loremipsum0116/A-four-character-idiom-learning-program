using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IdiomLearningAPI.Models
{
    /// <summary>
    /// 사자성어 모델
    /// FR 3.1: 사자성어 DB
    /// </summary>
    public class Idiom
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("idiom_id")]
        public int IdiomId { get; set; }

        [BsonElement("hanja")]
        public string Hanja { get; set; } = string.Empty;

        [BsonElement("hangul")]
        public string Hangul { get; set; } = string.Empty;

        [BsonElement("meaning")]
        public string Meaning { get; set; } = string.Empty;

        [BsonElement("example_sentence")]
        public string ExampleSentence { get; set; } = string.Empty;

        [BsonElement("base_difficulty")]
        public Difficulty BaseDifficulty { get; set; }
    }

    public enum Difficulty
    {
        EASY,
        MEDIUM,
        HARD
    }
}
