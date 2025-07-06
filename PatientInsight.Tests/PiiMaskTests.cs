using PatientInsight.Api.Logging;

namespace PatientInsight.Tests;

public class PiiMaskTests
{
    [Theory]
    [InlineData("123-45-6789", "***-**-6789")]
    [InlineData("123456789", "***-**-6789")]
    [InlineData("12", "***")]
    [InlineData("", "(none)")]
    [InlineData(null, "(none)")]
    public void Ssn_keeps_only_the_last_four_digits(string? input, string expected)
    {
        Assert.Equal(expected, PiiMask.Ssn(input));
    }
}
