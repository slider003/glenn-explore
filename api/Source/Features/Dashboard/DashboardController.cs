using System;
using System.Threading.Tasks;
using Api.Source.Features.Dashboard.Models;
using Api.Source.Features.Dashboard.Services;
using Microsoft.AspNetCore.Mvc;

namespace Api.Source.Features.Dashboard;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboardService;

    public DashboardController(DashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var stats = await _dashboardService.GetDashboardStats(startDate ?? DateTime.UtcNow.Date, endDate ?? DateTime.UtcNow);
        stats.StartDate = startDate ?? DateTime.UtcNow.Date;
        stats.EndDate = endDate ?? DateTime.UtcNow;
        return Ok(stats);
    }
}
