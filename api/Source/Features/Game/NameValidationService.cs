using System.Text.RegularExpressions;

namespace Api.Source.Features.Game;

public class NameValidationResult
{
    public bool IsValid { get; }
    public string? ErrorMessage { get; }

    private NameValidationResult(bool isValid, string? errorMessage = null)
    {
        IsValid = isValid;
        ErrorMessage = errorMessage;
    }

    public static NameValidationResult Success() => new(true);
    public static NameValidationResult Failure(string message) => new(false, message);
}

public class NameValidationService
{
    private static readonly HashSet<string> ReservedNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "admin",
        "administrator",
        "mod",
        "moderator",
        "system",
        "server",
        "bot",
        "owner",
        "staff",
        "support",
        "help",
        "info",
        "test",
        "guest",
        "official",
        "dev",
        "developer",
        "gm",
        "gamemaster",
        "supervisor",
        "manager",
        "glenn",
        "glennbot",
        "glennai",
        "glennmod",
        "glennstaff",
        "glennadmin",
        "glenndev",
        "glennowner",
        "glennmanager",
        "glennsupport",
        "glennhelp",
        "glenninfo",
        "glenntest",
        "glennguest"
    };

    private static readonly HashSet<string> BannedWords = new(StringComparer.OrdinalIgnoreCase)
    {
        // Racial slurs
        "nigger", "nigga", "negro", "chink", "gook", "spic", "wetback", "kike", "beaner",
        
        // Sexual orientation slurs
        "faggot", "fag", "dyke", "homo", "queer",
        
        // Disability slurs
        "retard", "retarded", "spastic", "spaz",
        
        // Sexual content
        "penis", "dick", "cock", "pussy", "vagina", "cunt", "whore", "slut", "hoe",
        "anal", "anus", "cum", "wank", "fap", "masturbat", "dildo", "porn",
        
        // Profanity
        "fuck", "shit", "piss", "bitch", "bastard", "damn", "crap", "ass",
        
        // Violence
        "rape", "rapist", "killer", "murder", "terrorist",
        
        // Drug references
        "cocaine", "heroin", "meth", "crack", "weed", "drug",
        
        // Common variations and l33t speak
        "n1gger", "n1gga", "nigg", "f4g", "ph4g", "phag", "f4ggot", "b1tch",
        "fuk", "fck", "fcuk", "sh1t", "sh!t", "b!tch", "b1tch", "h0e",
        
        // Common prefixes/suffixes to catch variations
        "nazi", "hitler", "kkk",
        
        // Inappropriate religious references
        "jihad", "allah", "jesus", "christ", "god",
    
        
        // Harassment-related
        "hate", "kys", "die", "suicide",
        
        // Spam-like
        "spam", "scam", "hack", "cheat", "bot",
        
        // Inappropriate anatomical terms
        "boob", "tit", "nip",
        
        // Common toxic gaming terms
       "scrub","trash",
        
        // Combinations and partial matches
        "fck", "fuk", "fk", "ph", "sh", "kys"
    };

    private static readonly Regex ValidNamePattern = new(@"^[a-zA-Z0-9-_]+$");
    private const int MinNameLength = 2;
    private const int MaxNameLength = 20;

    public NameValidationResult ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return NameValidationResult.Failure("Name cannot be empty.");

        name = name.Trim();

        if (name.Length < MinNameLength)
            return NameValidationResult.Failure($"Name must be at least {MinNameLength} characters long.");

        if (name.Length > MaxNameLength)
            return NameValidationResult.Failure($"Name cannot be longer than {MaxNameLength} characters.");

        if (!ValidNamePattern.IsMatch(name))
            return NameValidationResult.Failure("Name can only contain letters, numbers, hyphens, and underscores.");

        if (ReservedNames.Contains(name))
            return NameValidationResult.Failure("This name is reserved and cannot be used.");

        // Check for banned words (including partial matches)
        if (BannedWords.Any(word => name.Contains(word, StringComparison.OrdinalIgnoreCase)))
            return NameValidationResult.Failure("This name contains inappropriate content.");

        return NameValidationResult.Success();
    }
}