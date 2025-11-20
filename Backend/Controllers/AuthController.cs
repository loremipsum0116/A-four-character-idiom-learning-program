using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;
using IdiomLearningAPI.Data;
using IdiomLearningAPI.Models;
using IdiomLearningAPI.DTOs;
using IdiomLearningAPI.Services;
using System.Security.Claims;

namespace IdiomLearningAPI.Controllers
{
    /// <summary>
    /// FR 1.0: 사용자 계정 및 인증
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly MongoDbContext _context;
        private readonly AuthService _authService;

        public AuthController(MongoDbContext context, AuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        /// <summary>
        /// FR 1.1: 회원가입
        /// </summary>
        [HttpPost("signup")]
        public async Task<ActionResult<AuthResponse>> Signup([FromBody] SignupRequest request)
        {
            try
            {
                // 이메일 중복 확인
                var existingUser = await _context.Users
                    .Find(u => u.Email == request.Email)
                    .FirstOrDefaultAsync();

                if (existingUser != null)
                {
                    return BadRequest(new { error = "Email already exists" });
                }

                // 사용자 생성
                var user = new User
                {
                    Email = request.Email,
                    Password = _authService.HashPassword(request.Password),
                    Nickname = request.Nickname,
                    CreatedAt = DateTime.UtcNow,
                    LastLogin = DateTime.UtcNow
                };

                await _context.Users.InsertOneAsync(user);

                // JWT 토큰 생성
                var token = _authService.GenerateToken(user);

                return Ok(new AuthResponse
                {
                    Token = token,
                    User = MapToUserDTO(user),
                    Message = "User created successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Signup failed", message = ex.Message });
            }
        }

        /// <summary>
        /// FR 1.2: 로그인
        /// </summary>
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        {
            try
            {
                // 사용자 조회
                var user = await _context.Users
                    .Find(u => u.Email == request.Email)
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return Unauthorized(new { error = "Invalid email or password" });
                }

                // 비밀번호 확인
                if (!_authService.VerifyPassword(request.Password, user.Password))
                {
                    return Unauthorized(new { error = "Invalid email or password" });
                }

                // 마지막 로그인 시간 업데이트
                var update = Builders<User>.Update.Set(u => u.LastLogin, DateTime.UtcNow);
                await _context.Users.UpdateOneAsync(u => u.Id == user.Id, update);

                // JWT 토큰 생성
                var token = _authService.GenerateToken(user);

                return Ok(new AuthResponse
                {
                    Token = token,
                    User = MapToUserDTO(user),
                    Message = "Login successful"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Login failed", message = ex.Message });
            }
        }

        /// <summary>
        /// 현재 사용자 정보 조회
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDTO>> GetMe()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { error = "User not authenticated" });
                }

                var user = await _context.Users
                    .Find(u => u.Id == userId)
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                return Ok(new { user = MapToUserDTO(user) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to get user info", message = ex.Message });
            }
        }

        private UserDTO MapToUserDTO(User user)
        {
            return new UserDTO
            {
                Id = user.Id,
                Email = user.Email,
                Nickname = user.Nickname,
                ClearedStages = user.ClearedStages,
                LionStats = new LionStatsDTO
                {
                    Hp = user.LionStats.Hp,
                    MaxHp = user.LionStats.MaxHp,
                    Level = user.LionStats.Level
                },
                UnlockedContent = new UnlockedContentDTO
                {
                    HiddenBoss = user.UnlockedContent.HiddenBoss,
                    InfiniteMode = user.UnlockedContent.InfiniteMode,
                    PvpMode = user.UnlockedContent.PvpMode
                }
            };
        }
    }
}
