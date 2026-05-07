using Microsoft.AspNetCore.Mvc;
using SassyGurl.Api.Services;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/products/sync
    /// Triggers the background synchronization of all products from VIP Reseller and Digiflazz.
    /// </summary>
    [HttpPost("sync")]
    public async Task<IActionResult> Sync()
    {
        _logger.LogInformation("Received request to sync all products.");
        try
        {
            var success = await _productService.SyncAllProvidersAsync();
            if (success)
            {
                return Ok(new { success = true, message = "Product synchronization completed successfully." });
            }
            return StatusCode(500, new { success = false, message = "Product synchronization completed with some errors. Check Serilog logs." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception during product synchronization.");
            return StatusCode(500, new { success = false, message = "Internal server error during sync." });
        }
    }

    /// <summary>
    /// GET /api/products
    /// Lists all products from the database.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        _logger.LogInformation("Received request to get all products.");
        var products = await _productService.GetAllProductsAsync();
        return Ok(products);
    }
}
