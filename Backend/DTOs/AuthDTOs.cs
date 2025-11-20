namespace IdiomLearningAPI.DTOs
{
    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class SignupRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Nickname { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public UserDTO User { get; set; } = null!;
        public string Message { get; set; } = string.Empty;
    }

    public class UserDTO
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Nickname { get; set; } = string.Empty;
        public List<int> ClearedStages { get; set; } = new();
        public LionStatsDTO LionStats { get; set; } = new();
        public UnlockedContentDTO UnlockedContent { get; set; } = new();
    }

    public class LionStatsDTO
    {
        public int Hp { get; set; }
        public int MaxHp { get; set; }
        public int Level { get; set; }
    }

    public class UnlockedContentDTO
    {
        public bool HiddenBoss { get; set; }
        public bool InfiniteMode { get; set; }
        public bool PvpMode { get; set; }
    }
}
