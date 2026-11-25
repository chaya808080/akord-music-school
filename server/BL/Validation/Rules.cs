using System.Text.RegularExpressions;

namespace BL.Validation;

public static partial class Rules
{
    public const string Active = "פעיל";
    public const string Waiting = "מחכה";
    public const string Finished = "גמר";
    public static readonly string[] StudentStatuses = [Active, Waiting, Finished];
    public static readonly string[] CourseGenders = ["בנים", "בנות", "מעורב"];
    public static readonly string[] HebrewDays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

    /// <summary>Israeli ID check digit (Luhn variant over 9 digits).</summary>
    public static bool IsValidIsraeliId(string? id)
    {
        if (string.IsNullOrWhiteSpace(id)) return false;
        id = id.Trim();
        if (id.Length > 9 || !id.All(char.IsDigit)) return false;
        id = id.PadLeft(9, '0');
        var sum = 0;
        for (var i = 0; i < 9; i++)
        {
            var d = (id[i] - '0') * (i % 2 + 1);
            sum += d > 9 ? d - 9 : d;
        }
        return sum % 10 == 0 && id != "000000000";
    }

    public static bool IsValidPhone(string? phone) =>
        phone != null && PhoneRegex().IsMatch(phone.Replace("-", "").Trim());

    public static bool IsValidEmail(string? mail) =>
        string.IsNullOrWhiteSpace(mail) || EmailRegex().IsMatch(mail.Trim());

    public static int AgeOn(DateOnly birth, DateOnly on) =>
        on.Year - birth.Year - (on < birth.AddYears(on.Year - birth.Year) ? 1 : 0);

    /// <summary>"בנים" courses accept boys, "בנות" accept girls, "מעורב" accepts everyone.</summary>
    public static bool GenderFits(string? courseGender, string? studentGender) => courseGender?.Trim() switch
    {
        "בנים" => studentGender?.Trim() is null or "" or "בן",
        "בנות" => studentGender?.Trim() is null or "" or "בת",
        _ => true
    };

    public static void Require(bool condition, string message)
    {
        if (!condition) throw new BusinessRuleException(message);
    }

    [GeneratedRegex(@"^0\d{8,9}$")] private static partial Regex PhoneRegex();
    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")] private static partial Regex EmailRegex();
}
