using System.Text.RegularExpressions;

namespace Api.Features.Auth.Services;

public static class UsernameGenerator
{
    private static readonly string[] FirstParts = {
        "Swift", "Quick", "Dark", "Light", "Storm", "Fire", "Ice", "Wind",
        "Shadow", "Bright", "Wild", "Brave", "Iron", "Steel", "Silver", "Golden",
        "Mighty", "Royal", "Frost", "Flame"
    };

    private static readonly string[] SecondParts = {
        "Blade", "Wolf", "Hawk", "Rune", "Knight", "Guard", "Slayer", "Hunter",
        "Rider", "Walker", "Master", "Smith", "Mage", "Ranger", "Warrior", "King",
        "Queen", "Lord", "Sage", "Dragon"
    };

    // RuneScape-like username validation
    public static readonly int MaxLength = 16;
    public static readonly Regex UsernameRegex = new(
        @"^[a-zA-Z][a-zA-Z0-9_-]{0,15}$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant
    );

    public static bool IsValidUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username)) return false;
        if (username.Length > MaxLength) return false;
        return UsernameRegex.IsMatch(username);
    }

    public static string GenerateUsername()
    {
        var random = new Random();
        string username;
        
        // Try different combinations until we get a valid username
        do
        {
            var first = FirstParts[random.Next(FirstParts.Length)];
            var second = SecondParts[random.Next(SecondParts.Length)];
            var useUnderscore = random.Next(2) == 1; // 50% chance
            var addNumber = random.Next(2) == 1; // 50% chance
            
            username = useUnderscore ? 
                $"{first}_{second}" : 
                $"{first}{second}";

            if (addNumber)
            {
                var number = random.Next(1, 100);
                username = username.Length + number.ToString().Length <= MaxLength ? 
                    $"{username}{number}" : 
                    username;
            }

        } while (username.Length > MaxLength);

        return username;
    }
} 