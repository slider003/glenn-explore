using System.Collections.Generic;
using System.Threading.Tasks;
using Api.Source.Features.Toplist.Models;
using Api.Source.Features.Toplist.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Source.Features.Toplist.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToplistController : ControllerBase
{
    private readonly ToplistService _toplistService;

    public ToplistController(ToplistService toplistService)
    {
        _toplistService = toplistService;
    }

    [HttpGet("time")]
    public async Task<ActionResult<List<ToplistEntry>>> GetTimeToplist()
    {
        var result = await _toplistService.GetTimeToplistAsync();
        return Ok(result);
    }

    [HttpGet("kilometers")]
    public async Task<ActionResult<List<ToplistEntry>>> GetKilometersToplist()
    {
        var result = await _toplistService.GetKilometersToplistAsync();
        return Ok(result);
    }
}