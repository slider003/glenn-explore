using Api.Features.Auth.Models;
using Api.Features.OpenRouter.Models;
using Api.Source.Features.Game;
using Api.Source.Features.Models;
using Api.Source.Features.Files.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Api.Core.Infrastructure.Database;

public class ApplicationDbContext : IdentityDbContext<User>
{   
    public DbSet<Player> Players => Set<Player>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<RaceResult> RaceResults => Set<RaceResult>();
    public DbSet<LLMMessage> LLMMessages => Set<LLMMessage>();
    public DbSet<UnlockedModel> UnlockedModels => Set<UnlockedModel>();
    public DbSet<FileEntity> Files => Set<FileEntity>();
    public DbSet<Model> Models => Set<Model>();
    public DbSet<QuestProgress> QuestProgress => Set<QuestProgress>();
    
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // User entity (from IdentityDbContext)
        builder.Entity<User>();
        
        // Message indexes
        builder.Entity<Message>(b =>
        {
            b.HasIndex(m => m.SentAt)
                .HasDatabaseName("IX_Messages_SentAt");
            b.HasIndex(m => new { m.PlayerId, m.SentAt })
                .HasDatabaseName("IX_Messages_PlayerId_SentAt");
            b.HasIndex(m => m.Type)
                .HasDatabaseName("IX_Messages_Type");
        });
        
        // Player indexes
        builder.Entity<Player>(b =>
        {
            b.HasIndex(p => p.PlayerId)
                .HasDatabaseName("IX_Players_PlayerId");
            b.HasIndex(p => p.LastSeen)
                .HasDatabaseName("IX_Players_LastSeen");
            b.HasIndex(p => p.Name)
                .HasDatabaseName("IX_Players_Name");
        });

        // RaceResult indexes and relationships
        builder.Entity<RaceResult>(b =>
        {
            // Indexes for common queries
            b.HasIndex(r => r.PlayerId)
                .HasDatabaseName("IX_RaceResults_PlayerId");
            b.HasIndex(r => r.TrackId)
                .HasDatabaseName("IX_RaceResults_TrackId");
            b.HasIndex(r => r.CompletedAt)
                .HasDatabaseName("IX_RaceResults_CompletedAt");
            b.HasIndex(r => new { r.TrackId, r.Time })
                .HasDatabaseName("IX_RaceResults_TrackId_Time");
            b.HasIndex(r => new { r.PlayerId, r.TrackId, r.Time })
                .HasDatabaseName("IX_RaceResults_PlayerId_TrackId_Time");

            // Relationship with Player
            b.HasOne(r => r.Player)
                .WithMany()
                .HasForeignKey(r => r.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // LLMMessage configuration and indexes
        builder.Entity<LLMMessage>(b =>
        {
            // Primary index for conversation lookup (most common query)
            b.HasIndex(m => new { m.ConversationId, m.SentAt })
                .HasDatabaseName("IX_LLMMessages_ConversationId_SentAt");
            
            // Index for role-based queries
            b.HasIndex(m => new { m.Role, m.SentAt })
                .HasDatabaseName("IX_LLMMessages_Role_SentAt");
            
            // Index for tool-related queries
            b.HasIndex(m => m.ToolName)
                .HasDatabaseName("IX_LLMMessages_ToolName");
            
            // General timestamp index
            b.HasIndex(m => m.SentAt)
                .HasDatabaseName("IX_LLMMessages_SentAt");

            // Set reasonable max lengths for string fields
            b.Property(m => m.ConversationId)
                .HasMaxLength(100);
            
            b.Property(m => m.Role)
                .HasMaxLength(50);
            
            b.Property(m => m.ToolName)
                .HasMaxLength(100);
        });
        
        // Model configuration and indexes
        builder.Entity<Model>(b =>
        {
            // Primary key is ModelId
            b.HasKey(m => m.ModelId);
                
            // Index for type-based queries
            b.HasIndex(m => m.Type)
                .HasDatabaseName("IX_Models_Type");
                
            // Index for premium status
            b.HasIndex(m => m.IsPremium)
                .HasDatabaseName("IX_Models_IsPremium");
                
            // Index for active status
            b.HasIndex(m => m.IsActive)
                .HasDatabaseName("IX_Models_IsActive");
                
            // Relationships with files
            b.HasOne(m => m.ThumbnailFile)
                .WithMany()
                .HasForeignKey(m => m.ThumbnailFileId)
                .OnDelete(DeleteBehavior.SetNull);
                
            b.HasOne(m => m.ModelFile)
                .WithMany()
                .HasForeignKey(m => m.ModelFileId)
                .OnDelete(DeleteBehavior.SetNull);
                
            // Set reasonable max lengths for string fields
            b.Property(m => m.ModelId)
                .HasMaxLength(100);
            b.Property(m => m.Name)
                .HasMaxLength(255);
            b.Property(m => m.Type)
                .HasMaxLength(50);
        });
        
        // UnlockedModel configuration and indexes
        builder.Entity<UnlockedModel>(b =>
        {
            // Primary key
            b.HasKey(u => u.Id);
            
            // Relationship with User
            b.HasOne(u => u.User)
                .WithMany()
                .HasForeignKey(u => u.UserId);
                
            // Relationship with Model using ModelId
            b.HasOne(u => u.Model)
                .WithMany(m => m.UnlockedModels)
                .HasForeignKey(u => u.ModelId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Index for efficient lookups by user and model
            b.HasIndex(u => new { u.UserId, u.ModelId })
                .HasDatabaseName("IX_UnlockedModels_UserId_ModelId");
                
            // Set max length for ModelId to match Model table
            b.Property(u => u.ModelId)
                .HasMaxLength(100);
        });

        // Quest Progress configuration and indexes
        builder.Entity<QuestProgress>(b =>
        {
            // Primary key
            b.HasKey(qp => qp.Id);
            
            // Relationship with Player
            b.HasOne(qp => qp.Player)
                .WithMany()
                .HasForeignKey(qp => qp.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Indexes for common queries
            b.HasIndex(qp => qp.PlayerId)
                .HasDatabaseName("IX_QuestProgress_PlayerId");
            b.HasIndex(qp => new { qp.PlayerId, qp.QuestId })
                .HasDatabaseName("IX_QuestProgress_PlayerId_QuestId");
            b.HasIndex(qp => qp.UpdatedAt)
                .HasDatabaseName("IX_QuestProgress_UpdatedAt");
            
            // Set reasonable max lengths for string fields
            b.Property(qp => qp.QuestId)
                .HasMaxLength(100);
        });

        // File configuration and indexes
        builder.Entity<FileEntity>(b =>
        {
            // Primary key
            b.HasKey(f => f.Id);

            // Relationship with User (uploader)
            b.HasOne<User>()
                .WithMany()
                .HasForeignKey(f => f.UploadedBy)
                .OnDelete(DeleteBehavior.Restrict);  // Don't delete files if user is deleted

            // Indexes for common queries
            b.HasIndex(f => f.Name)
                .HasDatabaseName("IX_Files_Name");
            b.HasIndex(f => f.UploadedAt)
                .HasDatabaseName("IX_Files_UploadedAt");
            b.HasIndex(f => f.MimeType)
                .HasDatabaseName("IX_Files_MimeType");

            // Set reasonable max lengths for string fields
            b.Property(f => f.Id)
                .HasMaxLength(36);  // GUID length
            b.Property(f => f.Name)
                .HasMaxLength(255);
            b.Property(f => f.Path)
                .HasMaxLength(1024);
            b.Property(f => f.MimeType)
                .HasMaxLength(100);
        });
    }
} 