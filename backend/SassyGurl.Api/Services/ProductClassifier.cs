using System.Text.RegularExpressions;

namespace SassyGurl.Api.Services;

public static class ProductClassifier
{
    public static (string Slug, string Label, string Icon, int SortOrder, bool IsAmbiguous) ClassifyStrict(string name)
    {
        // Must use strict word boundaries to avoid fuzzy matching
        // Ex: "Weekly Diamond Pass" won't match just "Diamond" if we evaluate passes first
        
        // 1. PASSES & MEMBERSHIPS
        if (Regex.IsMatch(name, @"\b(weekly|twilight|battle|royale|supply)\s+pass\b", RegexOptions.IgnoreCase) ||
            Regex.IsMatch(name, @"\b(weekly diamond pass|starlight|membership|welkin|blessing)\b", RegexOptions.IgnoreCase))
        {
            return ("PASS_MEMBERSHIP", "Pass & Membership", "🎫", 10, false);
        }

        // 2. BUNDLES & PACKS
        if (Regex.IsMatch(name, @"\b(bundle|pack|package|special|limited|elite pass|starlight member)\b", RegexOptions.IgnoreCase))
        {
            return ("BUNDLES", "Bundles & Packs", "🎁", 35, false);
        }

        // 3. VOUCHERS & WALLET
        if (Regex.IsMatch(name, @"\b(voucher|wallet|gift card|garena shell)\b", RegexOptions.IgnoreCase))
        {
            return ("VOUCHER", "Voucher & E-Wallet", "🎟️", 45, false);
        }

        // 4. CURRENCY (Strict)
        if (Regex.IsMatch(name, @"\b(diamond|diamonds|crystal|crystals|gems|gem|uc|primogem|primogems|stellar jade|polychrome|oneiric|vp|valorant points|credit|credits|zeny|coin|coins|token|tokens|cp|cod points)\b", RegexOptions.IgnoreCase))
        {
            // Make sure it doesn't have "weekly" in it
            if (Regex.IsMatch(name, @"\bweekly\b", RegexOptions.IgnoreCase))
            {
                return ("PASS_MEMBERSHIP", "Pass & Membership", "🎫", 10, false);
            }
            return ("CURRENCY", "Currency", "💎", 5, false);
        }

        // 5. AMBIGUOUS / OTHER
        return ("OTHER", "Other Items", "📌", 90, true);
    }

    public static (string Label, string Icon, int SortOrder) GetCategoryMeta(string slug)
    {
        return slug.ToUpperInvariant() switch
        {
            "CURRENCY" => ("Currency", "💎", 5),
            "PASS_MEMBERSHIP" => ("Pass & Membership", "🎫", 10),
            "BUNDLES" => ("Bundles & Packs", "🎁", 35),
            "VOUCHER" => ("Voucher & E-Wallet", "🎟️", 45),
            _ => ("Other Items", "📌", 90)
        };
    }
}
