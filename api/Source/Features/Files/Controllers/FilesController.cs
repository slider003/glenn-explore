using System.Threading.Tasks;
using Api.Features.Auth.Models;
using Api.Source.Features.Files.Dtos;
using Api.Source.Features.Files.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Api.Source.Features.Files.Controllers;

[ApiController]
[Route("api/files")]
[Authorize(Roles = "Admin")]
public class FilesController : ControllerBase
{
    private readonly FileService _fileService;
    private readonly UserManager<User> _userManager;

    public FilesController(
        FileService fileService,
        UserManager<User> userManager)
    {
        _fileService = fileService;
        _userManager = userManager;
    }

    [HttpPost]
    public async Task<ActionResult<FileUploadDto>> UploadFile(IFormFile file)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        try
        {
            var result = await _fileService.UploadFileAsync(file, user.Id);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<FileInfoDto>>> GetAllFiles()
    {
        var files = await _fileService.GetAllFilesAsync();
        return Ok(files);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FileInfoDto>> GetFile(string id)
    {
        var file = await _fileService.GetFileByIdAsync(id);
        if (file == null) return NotFound();
        return Ok(file);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteFile(string id)
    {
        await _fileService.DeleteFileAsync(id);
        return Ok();
    }
} 