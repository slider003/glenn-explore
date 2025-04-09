using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Features.Auth.Models;
using Api.Core.Infrastructure.Database;

namespace Api.Source.Features.Game.Controllers;

[ApiController]
[Route("api/race")]
[Authorize]
public class RaceController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly UserManager<User> _userManager;
    private readonly ILogger<RaceController> _logger;

    public RaceController(
        ApplicationDbContext dbContext,
        UserManager<User> userManager,
        ILogger<RaceController> logger)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _logger = logger;
    }

    [HttpGet("records/{trackId}")]
    public async Task<ActionResult<RaceRecordResponse>> GetTrackRecords(string trackId)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        // Get personal best
        var personalBest = await _dbContext.RaceResults
            .Where(r => r.PlayerId == user.Id && r.TrackId == trackId)
            .OrderBy(r => r.Time)
            .Select(r => r.Time)
            .FirstOrDefaultAsync();

        // Get track record and holder
        var trackRecord = await _dbContext.RaceResults
            .Where(r => r.TrackId == trackId)
            .OrderBy(r => r.Time)
            .Select(r => new { r.Time, r.PlayerName })
            .FirstOrDefaultAsync();

        return Ok(new RaceRecordResponse(
            personalBest == 0 ? null : personalBest,
            trackRecord?.Time == 0 ? null : trackRecord?.Time,
            trackRecord?.PlayerName
        ));
    }

    [HttpPost("results")]
    public async Task<ActionResult<RaceResultResponse>> AddRaceResult([FromBody] AddRaceResultRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        // Create new result
        var result = RaceResult.Create(user.Id, user.UserName ?? "Unknown", request.TrackId, request.Time);

        // Check for personal best
        var previousPersonalBest = await _dbContext.RaceResults
            .Where(r => r.PlayerId == user.Id && r.TrackId == request.TrackId)
            .OrderBy(r => r.Time)
            .Select(r => r.Time)
            .FirstOrDefaultAsync();

        var isPersonalBest = previousPersonalBest == 0 || request.Time < previousPersonalBest;

        // Check for track record
        var previousTrackRecord = await _dbContext.RaceResults
            .Where(r => r.TrackId == request.TrackId)
            .OrderBy(r => r.Time)
            .Select(r => r.Time)
            .FirstOrDefaultAsync();

        var isTrackRecord = previousTrackRecord == 0 || request.Time < previousTrackRecord;

        // Save result
        _dbContext.RaceResults.Add(result);
        await _dbContext.SaveChangesAsync();

        return Ok(new RaceResultResponse(
            isPersonalBest,
            isTrackRecord,
            previousPersonalBest == 0 ? null : previousPersonalBest,
            previousTrackRecord == 0 ? null : previousTrackRecord
        ));
    }
}

public record AddRaceResultRequest(
    string TrackId,
    string TrackName,
    double Time
); 