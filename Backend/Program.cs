using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using IdiomLearningAPI.Data;
using IdiomLearningAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger/OpenAPI configuration
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Idiom Learning API",
        Version = "v1",
        Description = "Turn-based combat idiom learning program API"
    });

    // JWT Authentication in Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// MySQL Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DataSeeder>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? "default-secret-key-change-this";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/api/health", () => new { status = "OK", message = "Server is running" });

// Data seeding endpoint (Development only)
app.MapPost("/api/seed/all", async (DataSeeder seeder) =>
{
    try
    {
        await seeder.SeedAllAsync();
        return Results.Ok(new { message = "데이터 초기화가 완료되었습니다." });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPost("/api/seed/idioms", async (DataSeeder seeder) =>
{
    try
    {
        await seeder.SeedIdiomsAsync();
        return Results.Ok(new { message = "사자성어 데이터 초기화가 완료되었습니다." });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.MapPost("/api/seed/stages", async (DataSeeder seeder) =>
{
    try
    {
        await seeder.SeedGameStagesAsync();
        return Results.Ok(new { message = "스테이지 데이터 초기화가 완료되었습니다." });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

// Swap Hanja and Hangul columns (temporary fix)
app.MapPost("/api/fix/swap-hanja-hangul", async (ApplicationDbContext context) =>
{
    try
    {
        var idioms = await context.Idioms.ToListAsync();
        foreach (var idiom in idioms)
        {
            var temp = idiom.Hanja;
            idiom.Hanja = idiom.Hangul;
            idiom.Hangul = temp;
        }
        await context.SaveChangesAsync();
        return Results.Ok(new { message = "Hanja와 Hangul 컬럼이 성공적으로 교환되었습니다.", count = idioms.Count });
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.Message, statusCode: 500);
    }
});

app.Run();
