using SassyGurl.Api.Services;
using Xunit;
using FluentAssertions;

namespace SassyGurl.Api.Tests;

public class ProductRegressionTests
{
    [Fact]
    public void ClassifyStrict_ShouldSeparateWeeklyPassFromDiamonds()
    {
        // Arrange
        string passName = "Mobile Legends - Weekly Diamond Pass";
        string diamondName = "Mobile Legends - 86 Diamonds";

        // Act
        var passResult = ProductClassifier.ClassifyStrict(passName);
        var diamondResult = ProductClassifier.ClassifyStrict(diamondName);

        // Assert
        passResult.Slug.Should().Be("PASS_MEMBERSHIP");
        passResult.IsAmbiguous.Should().BeFalse();

        diamondResult.Slug.Should().Be("CURRENCY");
        diamondResult.IsAmbiguous.Should().BeFalse();

        passResult.Slug.Should().NotBe(diamondResult.Slug);
    }

    [Fact]
    public void ClassifyStrict_ShouldFlagAmbiguousItems()
    {
        // Arrange
        string ambiguousName = "Promo Kemerdekaan Item Super";

        // Act
        var result = ProductClassifier.ClassifyStrict(ambiguousName);

        // Assert
        result.IsAmbiguous.Should().BeTrue();
        result.Slug.Should().Be("OTHER");
    }

    [Fact]
    public void ClassifyStrict_ShouldGroupBundlesCorrectly()
    {
        // Arrange
        string bundleName = "PUBG Mobile Elite Pass Plus";
        string voucherName = "Garena Shell 100";

        // Act
        var bundleResult = ProductClassifier.ClassifyStrict(bundleName);
        var voucherResult = ProductClassifier.ClassifyStrict(voucherName);

        // Assert
        bundleResult.Slug.Should().Be("BUNDLES");
        voucherResult.Slug.Should().Be("VOUCHER");
    }
}
