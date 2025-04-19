using System;
using System.IO;
using System.Threading.Tasks;
using Api.Core.Infrastructure.Database;
using Api.Source.Features.Files.Dtos;
using Api.Source.Features.Files.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Api.Source.Features.Files.Services;

public class FileService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<FileService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly string _uploadPath;
    private const long MaxFileSize = 15 * 1024 * 1024; // 15MB
    private readonly string[] AllowedMimeTypes = new[] 
    { 
        "model/gltf-binary",  // .glb
        "image/jpeg",         // .jpg
        "image/png"          // .png
    };

    public FileService(
        ApplicationDbContext dbContext,
        ILogger<FileService> logger,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _dbContext = dbContext;
        _logger = logger;
        _configuration = configuration;
        _environment = environment;
        
        // Set up upload path based on environment
        _uploadPath = _environment.IsDevelopment()
            ? Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "uploads", "files"))
            : Path.Combine(_configuration["DEPLOY_PATH"] ?? "", "data", "uploads", "files");

        // Ensure upload directory exists
        Directory.CreateDirectory(_uploadPath);
        _logger.LogInformation("Upload directory configured at: {Path}", _uploadPath);
    }

    public async Task<FileUploadDto> UploadFileAsync(IFormFile file, string userId)
    {
        // Validate file
        if (file.Length > MaxFileSize)
        {
            throw new InvalidOperationException($"File size exceeds maximum allowed size of {MaxFileSize / 1024 / 1024}MB");
        }

        if (!AllowedMimeTypes.Contains(file.ContentType))
        {
            throw new InvalidOperationException($"File type {file.ContentType} is not allowed");
        }

        // Generate unique filename
        var fileId = Guid.NewGuid().ToString();
        var fileName = Path.GetFileName(file.FileName);
        var filePath = Path.Combine(_uploadPath, fileId + Path.GetExtension(fileName));

        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Create file record
        var fileEntity = new FileEntity
        {
            Id = fileId,
            Name = fileName,
            Path = filePath,
            Size = file.Length,
            MimeType = file.ContentType,
            UploadedAt = DateTime.UtcNow,
            UploadedBy = userId
        };

        _dbContext.Files.Add(fileEntity);
        await _dbContext.SaveChangesAsync();

        return new FileUploadDto
        {
            Id = fileEntity.Id,
            Name = fileEntity.Name,
            Path = $"/uploads/files/{fileId}{Path.GetExtension(fileName)}",
            Size = fileEntity.Size
        };
    }

    public async Task<List<FileInfoDto>> GetAllFilesAsync()
    {
        var files = await _dbContext.Files.ToListAsync();
        return files.Select(f => new FileInfoDto
        {
            Id = f.Id,
            Name = f.Name,
            Path = $"/uploads/files/{f.Id}{Path.GetExtension(f.Name)}",
            Size = f.Size,
            MimeType = f.MimeType,
            UploadedAt = f.UploadedAt
        }).ToList();
    }

    public async Task<FileInfoDto?> GetFileByIdAsync(string id)
    {
        var file = await _dbContext.Files.FindAsync(id);
        if (file == null) return null;

        return new FileInfoDto
        {
            Id = file.Id,
            Name = file.Name,
            Path = $"/uploads/files/{file.Id}{Path.GetExtension(file.Name)}",
            Size = file.Size,
            MimeType = file.MimeType,
            UploadedAt = file.UploadedAt
        };
    }

    public async Task DeleteFileAsync(string id)
    {
        var file = await _dbContext.Files.FindAsync(id);
        if (file == null) return;

        // Delete physical file
        if (System.IO.File.Exists(file.Path))
        {
            System.IO.File.Delete(file.Path);
        }

        // Remove from database
        _dbContext.Files.Remove(file);
        await _dbContext.SaveChangesAsync();
    }
} 