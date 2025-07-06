namespace PatientInsight.Api.Logging;

/// <summary>
/// Masks Social Security numbers before they reach logs, keeping only the last four digits for traceability.
/// </summary>
public static class PiiMask
{
    public static string Ssn(string? ssn)
    {
        if (string.IsNullOrWhiteSpace(ssn))
            return "(none)";

        var digits = new string(ssn.Where(char.IsDigit).ToArray());
        return digits.Length >= 4 ? $"***-**-{digits[^4..]}" : "***";
    }
}
