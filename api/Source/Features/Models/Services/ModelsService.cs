using Api.Core.Infrastructure.Database;
using Api.Features.Auth.Models;
using Api.Source.Features.Models.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Api.Source.Features.Models.Services;

public class ModelsService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<ModelsService> _logger;
    
    // Single source of model data containing all model information
    private readonly Dictionary<string, ModelInfo> _modelsData = new()
    {
        // Premium car models
        { "limousineLondon", new ModelInfo { Name = "Limousine", Price = 0.99m, IsPremium = true, Category = "car" } },
        { "whiteSedan", new ModelInfo { Name = "White Sedan", Price = 0.5m, IsPremium = true, Category = "car" } },
        
        // Free car models
        { "lambo", new ModelInfo { Name = "Lamborghini", Price = 0m, IsPremium = false, Category = "car" } },
        { "vikingBoat", new ModelInfo { Name = "Viking Boat", Price = 0m, IsPremium = false, Category = "car" } },
        { "golfCart", new ModelInfo { Name = "Golf Cart", Price = 0m, IsPremium = false, Category = "car" } },
        { "pepeFrogRide", new ModelInfo { Name = "Pepe Frog", Price = 0m, IsPremium = false, Category = "car" } },
        
        // Premium character models
        { "william", new ModelInfo { Name = "William", Price = 0.25m, IsPremium = true, Category = "character" } },
        
        // Free character models
        { "dino", new ModelInfo { Name = "Dinosaur", Price = 0m, IsPremium = false, Category = "character" } },
        { "animeTeenage", new ModelInfo { Name = "Anime Character", Price = 0m, IsPremium = false, Category = "character" } },
        { "levels", new ModelInfo { Name = "Levels", Price = 0m, IsPremium = false, Category = "character" } },
        { "setupSpawn", new ModelInfo { Name = "Spawn Character", Price = 0m, IsPremium = false, Category = "character" } }
        
        // To add a new model, follow this format:
        // { "modelId", new ModelInfo { Name = "Display Name", Price = 0m, IsPremium = false, Category = "car" } },
    };
    
    // Private class for storing model information
    private class ModelInfo
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool IsPremium { get; set; }
        public string Category { get; set; } = string.Empty;
    }
    
    public ModelsService(ApplicationDbContext dbContext, ILogger<ModelsService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }
    
    public async Task<List<UnlockedModelDto>> GetUserUnlockedModelsAsync(string userId)
    {
        var unlockedModels = await _dbContext.UnlockedModels
            .Where(m => m.UserId == userId)
            .Select(m => new UnlockedModelDto
            {
                ModelId = m.ModelId,
                PurchasedAt = m.PurchasedAt
            })
            .ToListAsync();
            
        return unlockedModels;
    }
    
    public async Task<List<ModelInfoDto>> GetAllModelsWithStatusAsync(User user)
    {
        // Get user's unlocked models
        var unlockedModelIds = await _dbContext.UnlockedModels
            .Where(m => m.UserId == user.Id)
            .Select(m => m.ModelId)
            .ToListAsync();
        
        // Create complete list of models with status
        var allModels = new List<ModelInfoDto>();
        
        // Convert from internal model data to DTO
        foreach (var (modelId, info) in _modelsData)
        {
            allModels.Add(new ModelInfoDto
            {
                ModelId = modelId,
                Name = info.Name,
                Price = info.Price,
                IsPremium = info.IsPremium,
                IsUnlocked = !info.IsPremium || unlockedModelIds.Contains(modelId) // Free models are always unlocked
            });
        }
        
        return allModels;
    }
    
    public async Task<bool> IsModelUnlockedAsync(string userId, string modelId)
    {
        // Get model info
        if (!_modelsData.TryGetValue(modelId, out var modelInfo))
        {
            _logger.LogWarning("Unknown model ID: {ModelId}", modelId);
            return false;
        }
        
        // Free models are always unlocked
        if (!modelInfo.IsPremium)
        {
            return true;
        }
        
        // Check if premium model is unlocked
        return await _dbContext.UnlockedModels
            .AnyAsync(m => m.UserId == userId && m.ModelId == modelId);
    }
    
    public async Task UnlockModelAsync(string userId, string modelId)
    {
        // Check if model exists
        if (!_modelsData.ContainsKey(modelId))
        {
            _logger.LogWarning("Attempted to unlock unknown model: {ModelId}", modelId);
            return;
        }
        
        // Check if already unlocked
        var existing = await _dbContext.UnlockedModels
            .FirstOrDefaultAsync(m => m.UserId == userId && m.ModelId == modelId);
            
        if (existing != null)
        {
            _logger.LogInformation("Model {ModelId} already unlocked for user {UserId}", modelId, userId);
            return;
        }
        
        // Add unlocked model record
        _dbContext.UnlockedModels.Add(new UnlockedModel
        {
            UserId = userId,
            ModelId = modelId,
            PurchasedAt = DateTime.UtcNow
        });
        
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Model {ModelId} unlocked for user {UserId}", modelId, userId);
    }
    
    public bool IsModelPremium(string modelId)
    {
        return _modelsData.TryGetValue(modelId, out var info) && info.IsPremium;
    }
    
    public decimal GetModelPrice(string modelId)
    {
        return _modelsData.TryGetValue(modelId, out var info) ? info.Price : 0;
    }
    
    public string GetModelDisplayName(string modelId)
    {
        return _modelsData.TryGetValue(modelId, out var info) ? info.Name : modelId;
    }
} 