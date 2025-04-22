using Api.Core.Infrastructure.Database;
using Api.Features.Auth.Models;
using Api.Source.Features.Files.Services;
using Api.Source.Features.Models.Dtos;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Api.Source.Features.Models.Services;

public class ModelsService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly FileService _fileService;
    private readonly ILogger<ModelsService> _logger;
    

    
    public ModelsService(
        ApplicationDbContext dbContext,
        FileService fileService,
        ILogger<ModelsService> logger)
    {
        _dbContext = dbContext;
        _fileService = fileService;
        _logger = logger;
    }
    
    public async Task<List<ModelInfoDto>> GetAllModelsAsync()
    {
        var models = await _dbContext.Models
            .Include(m => m.ThumbnailFile)
            .Include(m => m.ModelFile)
            .Where(m => m.IsActive)
            .ToListAsync();

        return models.Select(m => new ModelInfoDto
        {
            ModelId = m.ModelId,
            Name = m.Name,
            Type = m.Type,
            Price = m.Price,
            IsPremium = m.IsPremium,
            IsActive = m.IsActive,
            IsUnlocked = false, // This will be set by the controller based on user
            ThumbnailUrl = m.ThumbnailFile != null ? $"/uploads/files/{m.ThumbnailFile.Id}{Path.GetExtension(m.ThumbnailFile.Name)}" : null,
            ModelUrl = m.ModelFile != null ? $"/uploads/files/{m.ModelFile.Id}{Path.GetExtension(m.ModelFile.Name)}" : null,
            Config = ParseModelConfig(m.Type, m.ConfigJson),
            Screenshot = GetScreenshotFromConfig(m.Type, m.ConfigJson)
        }).ToList();
    }
    
    private IModelConfig ParseModelConfig(string type, string configJson)
    {
        try
        {
            return type.ToLower() switch
            {
                "car" => JsonSerializer.Deserialize<CarModelConfig>(configJson),
                "walking" => JsonSerializer.Deserialize<PlayerModelConfig>(configJson),
                _ => throw new ArgumentException($"Invalid model type: {type}")
            };
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse model config for type {Type}: {Json}", type, configJson);
            return type.ToLower() switch
            {
                "car" => new CarModelConfig { Model = new ModelObject(), Physics = new CarPhysics(), DrivingAnimation = new CarDrivingAnimation() },
                "walking" => new PlayerModelConfig { Model = new ModelObject(), Physics = new PlayerPhysics(), WalkingAnimation = new PlayerWalkingAnimation() },
                _ => throw new ArgumentException($"Invalid model type: {type}")
            };
        }
    }

    private string GetScreenshotFromConfig(string type, string configJson)
    {
        try
        {
            var config = ParseModelConfig(type, configJson);
            var screenshot = config?.Model?.Screenshot;
            return !string.IsNullOrEmpty(screenshot) ? screenshot : "";
        }
        catch
        {
            return "";
        }
    }
    
    public async Task<Model?> GetModelByIdAsync(string modelId)
    {
        return await _dbContext.Models
            .Include(m => m.ThumbnailFile)
            .Include(m => m.ModelFile)
            .FirstOrDefaultAsync(m => m.ModelId == modelId && m.IsActive);
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
        
        // Convert from database models to DTO
        var models = await _dbContext.Models.ToListAsync();
        foreach (var model in models)
        {
            allModels.Add(new ModelInfoDto
            {
                ModelId = model.ModelId,
                Name = model.Name,
                Price = model.Price,
                IsPremium = model.IsPremium,
                IsUnlocked = !model.IsPremium || unlockedModelIds.Contains(model.ModelId) // Free models are always unlocked
            });
        }
        
        return allModels;
    }
    
    public async Task<bool> IsModelUnlockedAsync(string userId, string modelId)
    {
        var model = await _dbContext.Models
            .FirstOrDefaultAsync(m => m.ModelId == modelId);

        if (model == null || !model.IsActive)
        {
            _logger.LogWarning("Model {ModelId} not found or inactive", modelId);
            return false;
        }

        // Free models are always unlocked
        if (!model.IsPremium)
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
        var model = await _dbContext.Models.FirstOrDefaultAsync(m => m.ModelId == modelId);
        if (model == null)
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
    
    public async Task<bool> IsModelPremium(string modelId)
    {
        var model = await _dbContext.Models.FirstOrDefaultAsync(m => m.ModelId == modelId);
        return model?.IsPremium ?? false;
    }
    
    public async Task<decimal> GetModelPrice(string modelId)
    {
        var model = await _dbContext.Models.FirstOrDefaultAsync(m => m.ModelId == modelId);
        return model?.Price ?? 0m;
    }
    
    public async Task<string> GetModelDisplayName(string modelId)
    {
        var model = await _dbContext.Models.FirstOrDefaultAsync(m => m.ModelId == modelId);
        return model?.Name ?? modelId;
    }

    public async Task<ModelDetailsDto> CreateModelAsync(CreateModelRequest request)
    {
        // Validate JSON and type match
        try
        {
            var validConfig = request.Type.ToLower() switch
            {
                "car" => JsonSerializer.Deserialize<CarModelConfig>(request.ConfigJson) as IModelConfig,
                "walking" => JsonSerializer.Deserialize<PlayerModelConfig>(request.ConfigJson) as IModelConfig,
                _ => throw new ArgumentException($"Invalid model type: {request.Type}", nameof(request.Type))
            };

            if (validConfig == null)
            {
                throw new ArgumentException("Invalid configuration", nameof(request.ConfigJson));
            }
        }
        catch (JsonException ex)
        {
            throw new ArgumentException($"Invalid JSON configuration for type {request.Type}", nameof(request.ConfigJson), ex);
        }

        // Verify file references exist
        if (!string.IsNullOrEmpty(request.ThumbnailFileId))
        {
            var thumbnailFile = await _dbContext.Files.FirstOrDefaultAsync(f => f.Id == request.ThumbnailFileId);
            if (thumbnailFile == null)
            {
                throw new ArgumentException($"Thumbnail file with ID {request.ThumbnailFileId} not found", nameof(request.ThumbnailFileId));
            }
        }

        if (!string.IsNullOrEmpty(request.ModelFileId))
        {
            var modelFile = await _dbContext.Files.FirstOrDefaultAsync(f => f.Id == request.ModelFileId);
            if (modelFile == null)
            {
                throw new ArgumentException($"Model file with ID {request.ModelFileId} not found", nameof(request.ModelFileId));
            }
        }

        var model = new Model
        {
            ModelId = Guid.NewGuid().ToString(),
            Name = request.Name,
            Type = request.Type,
            ConfigJson = request.ConfigJson,
            IsPremium = request.IsPremium,
            Price = request.Price,
            ThumbnailFileId = request.ThumbnailFileId,
            ModelFileId = request.ModelFileId,
            IsActive = true // New models are active by default
        };

        _dbContext.Models.Add(model);
        await _dbContext.SaveChangesAsync();

        // Reload the model with file references
        model = await _dbContext.Models
            .Include(m => m.ThumbnailFile)
            .Include(m => m.ModelFile)
            .FirstOrDefaultAsync(m => m.ModelId == model.ModelId);

        if (model == null)
            throw new InvalidOperationException("Model not found after creation");

        return await GetModelDetailsDtoAsync(model);
    }

    public async Task<ModelDetailsDto> UpdateModelAsync(string modelId, UpdateModelRequest request)
    {
        var model = await _dbContext.Models
            .Include(m => m.ThumbnailFile)
            .Include(m => m.ModelFile)
            .FirstOrDefaultAsync(m => m.ModelId == modelId);

        if (model == null)
            throw new KeyNotFoundException($"Model with ID {modelId} not found");

        // Update properties if provided
        if (request.Name != null) model.Name = request.Name;
        
        // If type is changing, validate new config if provided, or validate existing config against new type
        if (request.Type != null)
        {
            string configToValidate = request.ConfigJson ?? model.ConfigJson;
            try
            {
                var validConfig = request.Type.ToLower() switch
                {
                    "car" => JsonSerializer.Deserialize<CarModelConfig>(configToValidate) as IModelConfig,
                    "walking" => JsonSerializer.Deserialize<PlayerModelConfig>(configToValidate) as IModelConfig,
                    _ => throw new ArgumentException($"Invalid model type: {request.Type}", nameof(request.Type))
                };

                if (validConfig == null)
                {
                    throw new ArgumentException("Invalid configuration", nameof(request.ConfigJson));
                }
                
                model.Type = request.Type;
            }
            catch (JsonException ex)
            {
                throw new ArgumentException($"Existing configuration is not valid for new type {request.Type}", nameof(request.Type), ex);
            }
        }
        
        // If only config is changing, validate against current type
        if (request.ConfigJson != null)
        {
            try
            {
                var validConfig = model.Type.ToLower() switch
                {
                    "car" => JsonSerializer.Deserialize<CarModelConfig>(request.ConfigJson) as IModelConfig,
                    "walking" => JsonSerializer.Deserialize<PlayerModelConfig>(request.ConfigJson) as IModelConfig,
                    _ => throw new ArgumentException($"Invalid model type: {model.Type}", nameof(model.Type))
                };

                if (validConfig == null)
                {
                    throw new ArgumentException("Invalid configuration", nameof(request.ConfigJson));
                }
                
                model.ConfigJson = request.ConfigJson;
            }
            catch (JsonException ex)
            {
                throw new ArgumentException($"Invalid JSON configuration for type {model.Type}", nameof(request.ConfigJson), ex);
            }
        }
        
        if (request.IsPremium.HasValue) model.IsPremium = request.IsPremium.Value;
        if (request.Price.HasValue) model.Price = request.Price.Value;

        // Update file references and reload file entities
        if (!string.IsNullOrEmpty(request.ThumbnailFileId))
        {
            model.ThumbnailFileId = request.ThumbnailFileId;
            // Reload thumbnail file entity
            model.ThumbnailFile = await _dbContext.Files.FirstOrDefaultAsync(f => f.Id == request.ThumbnailFileId);
        }

        if (!string.IsNullOrEmpty(request.ModelFileId))
        {
            model.ModelFileId = request.ModelFileId;
            // Reload model file entity
            model.ModelFile = await _dbContext.Files.FirstOrDefaultAsync(f => f.Id == request.ModelFileId);
        }

        model.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        // Reload the model with updated file references
        model = await _dbContext.Models
            .Include(m => m.ThumbnailFile)
            .Include(m => m.ModelFile)
            .FirstOrDefaultAsync(m => m.ModelId == modelId);

        if (model == null)
            throw new InvalidOperationException("Model not found after update");

        return await GetModelDetailsDtoAsync(model);
    }

    public async Task<List<ModelDetailsDto>> GetAllModelsWithDetailsAsync()
    {
        var models = await _dbContext.Models
            .Include(m => m.ThumbnailFile)
            .Include(m => m.ModelFile)
            .ToListAsync();

        var dtos = new List<ModelDetailsDto>();
        foreach (var model in models)
        {
            dtos.Add(await GetModelDetailsDtoAsync(model));
        }

        return dtos;
    }

    public async Task<ModelDetailsDto?> GetModelByIdWithDetailsAsync(string modelId)
    {
        var model = await _dbContext.Models
            .Include(m => m.ThumbnailFile)
            .Include(m => m.ModelFile)
            .FirstOrDefaultAsync(m => m.ModelId == modelId);

        if (model == null)
        {
            return null;
        }

        return await GetModelDetailsDtoAsync(model);
    }

    public async Task<ModelDetailsDto> ToggleModelActiveAsync(string modelId)
    {
        var model = await _dbContext.Models
            .Include(m => m.ThumbnailFile)
            .Include(m => m.ModelFile)
            .FirstOrDefaultAsync(m => m.ModelId == modelId);

        if (model == null)
        {
            throw new KeyNotFoundException($"Model with ID {modelId} not found");
        }

        model.IsActive = !model.IsActive;
        model.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return await GetModelDetailsDtoAsync(model);
    }

    private async Task<ModelDetailsDto> GetModelDetailsDtoAsync(Model model)
    {
        // Ensure file entities are loaded
        if (model.ThumbnailFileId != null && model.ThumbnailFile == null)
        {
            model.ThumbnailFile = await _dbContext.Files.FirstOrDefaultAsync(f => f.Id == model.ThumbnailFileId);
        }
        if (model.ModelFileId != null && model.ModelFile == null)
        {
            model.ModelFile = await _dbContext.Files.FirstOrDefaultAsync(f => f.Id == model.ModelFileId);
        }

        var config = ParseModelConfig(model.Type, model.ConfigJson);

        return new ModelDetailsDto
        {
            ModelId = model.ModelId,
            Name = model.Name,
            Type = model.Type,
            ConfigJson = model.ConfigJson,
            Config = config,
            IsPremium = model.IsPremium,
            IsActive = model.IsActive,
            Price = model.Price,
            CreatedAt = model.CreatedAt,
            UpdatedAt = model.UpdatedAt,
            ThumbnailUrl = model.ThumbnailFile != null ? $"/uploads/files/{model.ThumbnailFile.Id}{Path.GetExtension(model.ThumbnailFile.Name)}" : null,
            ModelUrl = model.ModelFile != null ? $"/uploads/files/{model.ModelFile.Id}{Path.GetExtension(model.ModelFile.Name)}" : null,
            ThumbnailFileId = model.ThumbnailFileId,
            ModelFileId = model.ModelFileId,
            Screenshot = GetScreenshotFromConfig(model.Type, model.ConfigJson)
        };
    }
} 