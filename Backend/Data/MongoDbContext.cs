using MongoDB.Driver;
using IdiomLearningAPI.Models;

namespace IdiomLearningAPI.Data
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("MongoDB")
                ?? "mongodb://localhost:27017";
            var databaseName = configuration["DatabaseName"] ?? "idiom_learning";

            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);
        }

        public IMongoCollection<User> Users => _database.GetCollection<User>("users");
        public IMongoCollection<Idiom> Idioms => _database.GetCollection<Idiom>("idioms");
        public IMongoCollection<GameStage> GameStages => _database.GetCollection<GameStage>("game_stages");
        public IMongoCollection<LearningLog> LearningLogs => _database.GetCollection<LearningLog>("learning_logs");
    }
}
