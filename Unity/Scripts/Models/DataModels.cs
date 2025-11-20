using System;
using System.Collections.Generic;

namespace IdiomLearning.Models
{
    /// <summary>
    /// Unity용 데이터 모델들
    /// 백엔드 API와 통신하기 위한 데이터 구조
    /// </summary>

    [Serializable]
    public class User
    {
        public string id;
        public string email;
        public string nickname;
        public List<int> clearedStages = new List<int>();
        public LionStats lionStats;
        public UnlockedContent unlockedContent;
    }

    [Serializable]
    public class LionStats
    {
        public int hp = 100;
        public int maxHp = 100;
        public int level = 1;
    }

    [Serializable]
    public class UnlockedContent
    {
        public bool hiddenBoss;
        public bool infiniteMode;
        public bool pvpMode;
    }

    [Serializable]
    public class Idiom
    {
        public string id;
        public int idiom_id;
        public string hanja;
        public string hangul;
        public string meaning;
        public string example_sentence;
        public string base_difficulty;
    }

    [Serializable]
    public class GameStage
    {
        public string id;
        public int stage_id;
        public string boss_name;
        public int boss_hp;
        public int boss_attack_power;
        public string boss_image_url;
        public string zodiac_animal;
        public string description;
    }

    public enum Difficulty
    {
        EASY,
        MEDIUM,
        HARD
    }

    [Serializable]
    public class LoginRequest
    {
        public string email;
        public string password;
    }

    [Serializable]
    public class SignupRequest
    {
        public string email;
        public string password;
        public string nickname;
    }

    [Serializable]
    public class AuthResponse
    {
        public string token;
        public User user;
        public string message;
    }

    [Serializable]
    public class AttackRequest
    {
        public int stageId;
        public int idiomId;
        public int difficulty; // 0=EASY, 1=MEDIUM, 2=HARD
        public bool isCorrect;
        public int responseTimeMs;
    }

    [Serializable]
    public class AttackResponse
    {
        public int damage;
        public bool isCorrect;
        public int difficulty;
        public int responseTimeMs;
        public string message;
    }

    [Serializable]
    public class DefenseRequest
    {
        public int stageId;
        public int idiomId;
        public bool defenseSuccess;
        public int responseTimeMs;
        public int bossDamage;
    }

    [Serializable]
    public class DefenseResponse
    {
        public int damageTaken;
        public bool defenseSuccess;
        public string message;
    }

    [Serializable]
    public class BlankQuiz
    {
        public int idiom_id;
        public string question;
        public string hangul;
        public string meaning;
        public List<string> options;
        public string correctAnswer;
        public int blankPosition;
    }

    [Serializable]
    public class StagesResponse
    {
        public List<GameStage> stages;
    }

    [Serializable]
    public class IdiomsResponse
    {
        public List<Idiom> idioms;
        public int total;
    }
}
