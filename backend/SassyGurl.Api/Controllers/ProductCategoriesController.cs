using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SassyGurl.Api.Data;
using SassyGurl.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SassyGurl.Api.Controllers;

[ApiController]
[Route("api/catalog/games/{gameId}/categories")]
public class ProductCategoriesController : ControllerBase
{
    private readonly SassyGurlDbContext _context;

    public ProductCategoriesController(SassyGurlDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetCategories(string gameId)
    {
        var game = await _context.Games.FindAsync(gameId);
        if (game == null)
            return NotFound(new { message = "Game not found" });

        var categories = await _context.ProductCategories
            .Where(pc => pc.GameId == gameId)
            .OrderBy(pc => pc.SortOrder)
            .Select(pc => new {
                pc.Id,
                pc.Name,
                pc.Icon,
                pc.SortOrder
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpPost]
    [Authorize(Roles = "SUPERADMIN,ADMIN")]
    public async Task<ActionResult<object>> CreateCategory(string gameId, [FromBody] CreateCategoryDto dto)
    {
        var game = await _context.Games.FindAsync(gameId);
        if (game == null)
            return NotFound(new { message = "Game not found" });

        var category = new ProductCategory
        {
            GameId = gameId,
            Name = dto.Name,
            Icon = dto.Icon ?? "💎",
            SortOrder = dto.SortOrder
        };

        _context.ProductCategories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCategories), new { gameId }, new {
            category.Id,
            category.Name,
            category.Icon,
            category.SortOrder
        });
    }

    [HttpPut("{categoryId}")]
    [Authorize(Roles = "SUPERADMIN,ADMIN")]
    public async Task<IActionResult> UpdateCategory(string gameId, string categoryId, [FromBody] UpdateCategoryDto dto)
    {
        var category = await _context.ProductCategories
            .FirstOrDefaultAsync(pc => pc.Id == categoryId && pc.GameId == gameId);

        if (category == null)
            return NotFound(new { message = "Category not found" });

        category.Name = dto.Name ?? category.Name;
        category.Icon = dto.Icon ?? category.Icon;
        if (dto.SortOrder.HasValue) category.SortOrder = dto.SortOrder.Value;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{categoryId}")]
    [Authorize(Roles = "SUPERADMIN,ADMIN")]
    public async Task<IActionResult> DeleteCategory(string gameId, string categoryId)
    {
        var category = await _context.ProductCategories
            .FirstOrDefaultAsync(pc => pc.Id == categoryId && pc.GameId == gameId);

        if (category == null)
            return NotFound(new { message = "Category not found" });

        _context.ProductCategories.Remove(category);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{categoryId}/products")]
    [Authorize(Roles = "SUPERADMIN,ADMIN")]
    public async Task<IActionResult> AssignProducts(string gameId, string categoryId, [FromBody] List<string> productIds)
    {
        var category = await _context.ProductCategories
            .FirstOrDefaultAsync(pc => pc.Id == categoryId && pc.GameId == gameId);

        if (category == null)
            return NotFound(new { success = false, message = "Kategori tidak ditemukan." });

        // Temukan semua produk dalam game ini
        var gameProducts = await _context.Products
            .Where(p => p.GameId == gameId)
            .ToListAsync();

        // Kosongkan kategori untuk produk yang sebelumnya di kategori ini tapi tidak ada di productIds
        var toRemove = gameProducts.Where(p => p.ProductCategoryId == categoryId && !productIds.Contains(p.Id)).ToList();
        foreach(var p in toRemove) {
            p.ProductCategoryId = null;
        }

        // Set kategori untuk produk yang terpilih
        var toAdd = gameProducts.Where(p => productIds.Contains(p.Id)).ToList();
        foreach(var p in toAdd) {
            p.ProductCategoryId = categoryId;
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Produk berhasil ditambahkan ke kategori." });
    }
}

public class CreateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public int SortOrder { get; set; } = 0;
}

public class UpdateCategoryDto
{
    public string? Name { get; set; }
    public string? Icon { get; set; }
    public int? SortOrder { get; set; }
}
