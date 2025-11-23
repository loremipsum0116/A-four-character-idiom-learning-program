using Microsoft.EntityFrameworkCore;
using IdiomLearningAPI.Models;

namespace IdiomLearningAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Idiom> Idioms { get; set; }
        public DbSet<GameStage> GameStages { get; set; }
        public DbSet<LearningLog> LearningLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User 테이블 설정
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.LastLogin).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Idiom 테이블 설정
            modelBuilder.Entity<Idiom>(entity =>
            {
                entity.HasIndex(e => e.IdiomId).IsUnique();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // GameStage 테이블 설정
            modelBuilder.Entity<GameStage>(entity =>
            {
                entity.HasIndex(e => e.StageId).IsUnique();
            });

            // LearningLog 테이블 설정
            modelBuilder.Entity<LearningLog>(entity =>
            {
                entity.Property(e => e.Timestamp).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Timestamp);
            });
        }
    }
}
