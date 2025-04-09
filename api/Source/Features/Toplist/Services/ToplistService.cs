using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Api.Core.Infrastructure.Database;
using Api.Source.Features.Game;
using Api.Source.Features.Toplist.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Api.Source.Features.Toplist.Services;

public class ToplistService
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private const string TIME_CACHE_KEY = "toplist_time";
    private const string KILOMETERS_CACHE_KEY = "toplist_kilometers";
    private const int CACHE_MINUTES = 5;

    public ToplistService(ApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<List<ToplistEntry>> GetTimeToplistAsync(int limit = 20)
    {
        // Try get from cache first
        if (_cache.TryGetValue(TIME_CACHE_KEY, out List<ToplistEntry> cachedResult))
        {
            return cachedResult;
        }

        // Load players and convert to list for in-memory processing
        var players = await _context.Players
            .AsNoTracking()
            .ToListAsync();

        // Process in memory
        var result = players
            .OrderByDescending(p => p.TotalTimeOnline.TotalSeconds)
            .Take(limit)
            .Select((p, index) => new ToplistEntry
            {
                PlayerId = p.PlayerId,
                PlayerName = p.Name,
                Value = p.TotalTimeOnline,
                Rank = index + 1
            })
            .ToList();

        // Cache the result
        _cache.Set(TIME_CACHE_KEY, result, TimeSpan.FromMinutes(CACHE_MINUTES));

        return result;
    }

    public async Task<List<ToplistEntry>> GetKilometersToplistAsync(int limit = 20)
    {
        // Try get from cache first
        if (_cache.TryGetValue(KILOMETERS_CACHE_KEY, out List<ToplistEntry> cachedResult))
        {
            return cachedResult;
        }

        // Load players and convert to list for in-memory processing
        var players = await _context.Players
            .AsNoTracking()
            .ToListAsync();

        // Process in memory
        var result = players
            .OrderByDescending(p => p.KilometersDriven)
            .Take(limit)
            .Select((p, index) => new ToplistEntry
            {
                PlayerId = p.PlayerId,
                PlayerName = p.Name,
                Value = TimeSpan.FromSeconds(0), // We'll override this with kilometers in the frontend
                ValueString = $"{p.KilometersDriven:F1} km", // Format with 1 decimal
                Rank = index + 1
            })
            .ToList();

        // Cache the result
        _cache.Set(KILOMETERS_CACHE_KEY, result, TimeSpan.FromMinutes(CACHE_MINUTES));

        return result;
    }
}