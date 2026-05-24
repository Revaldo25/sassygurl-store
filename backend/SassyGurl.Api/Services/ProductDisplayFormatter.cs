using System.Text.RegularExpressions;

namespace SassyGurl.Api.Services;

public static class ProductDisplayFormatter
{
    public static string FormatProductName(string productName, string gameName)
    {
        if (string.IsNullOrWhiteSpace(productName)) return productName;

        string cleanName = productName;
        
        // List of common prefixes to strip. We avoid fuzzy matching, just explicit game prefixes.
        var prefixesToRemove = new[]
        {
            $"{gameName} - ",
            $"{gameName} ",
            "Mobile Legends - ",
            "Mobile Legends ",
            "Free Fire - ",
            "Free Fire ",
            "Garena Free Fire - ",
            "PUBG Mobile - ",
            "PUBG Mobile ",
            "PUBGM - ",
            "Honor of Kings - ",
            "Honor of Kings ",
            "HOK - "
        };

        foreach (var prefix in prefixesToRemove)
        {
            if (cleanName.StartsWith(prefix, System.StringComparison.OrdinalIgnoreCase))
            {
                cleanName = cleanName.Substring(prefix.Length).Trim();
                break; // Only strip the first matching prefix
            }
        }

        // Additional deterministic cleanup for messy VipReseller/Digiflazz patterns
        // e.g. "50 Diamonds + 5 Bonus" -> we keep it as is, because we must preserve denomination values.
        
        return cleanName;
    }
}
