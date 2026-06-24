using Microsoft.EntityFrameworkCore;
using SassyGurl.Store.Core.Data;
using SassyGurl.Store.Core.Data.Models;
using SassyGurl.Store.Core.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SassyGurl.Store.Core.Services
{
    public class GameCatalogService
    {
        private readonly ApplicationDbContext _context;

        public GameCatalogService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<GameListDTO>> GetAllGamesAsync()
        {
            return await _context.Games
                .AsNoTracking()
                .Where(g => g.IsActive)
                .Select(g => new GameListDTO
                {
                    Id = g.Id,
                    Name = g.Name,
                    Slug = g.Slug,
                    IconUrl = g.IconUrl,
                    BannerUrl = g.BannerUrl,
                    Description = g.Description
                })
                .ToListAsync();
        }

        public async Task<GameDetailDTO> GetGameBySlugAsync(string slug)
        {
            return await _context.Games
                .AsNoTracking()
                .Where(g => g.Slug == slug && g.IsActive)
                .Select(g => new GameDetailDTO
                {
                    Id = g.Id,
                    Name = g.Name,
                    Slug = g.Slug,
                    IconUrl = g.IconUrl,
                    BannerUrl = g.BannerUrl,
                    Description = g.Description,
                    Products = g.GameProducts.Where(gp => gp.IsActive).Select(gp => new GameProductDTO
                    {
                        Id = gp.Id,
                        Name = gp.Name,
                        Slug = gp.Slug,
                        Description = gp.Description,
                        Categories = gp.Categories.Where(c => c.IsActive).OrderBy(c => c.DisplayOrder).Select(c => new CategoryDTO
                        {
                            Id = c.Id,
                            Name = c.Name,
                            Slug = c.Slug,
                            Description = c.Description,
                            DisplayOrder = c.DisplayOrder,
                            Items = c.Items.Where(i => i.IsActive).Select(i => new ItemDTO
                            {
                                Id = i.Id,
                                Name = i.Name,
                                PriceIDR = i.PriceIDR,
                                OriginalPriceIDR = i.OriginalPriceIDR,
                                PriceRM = i.PriceRM,
                                OriginalPriceRM = i.OriginalPriceRM,
                                BonusInfo = i.BonusInfo
                            }).ToList()
                        }).ToList()
                    }).ToList()
                })
                .FirstOrDefaultAsync();
        }

        public async Task<List<PaymentGroupDTO>> GetPaymentMethodsAsync()
        {
            return await _context.PaymentGroups
                .AsNoTracking()
                .Where(pg => pg.IsActive)
                .OrderBy(pg => pg.DisplayOrder)
                .Select(pg => new PaymentGroupDTO
                {
                    Id = pg.Id,
                    Name = pg.Name,
                    Slug = pg.Slug,
                    DisplayOrder = pg.DisplayOrder,
                    PaymentMethods = pg.PaymentMethods.Where(pm => pm.IsActive).OrderBy(pm => pm.DisplayOrder).Select(pm => new PaymentMethodDTO
                    {
                        Id = pm.Id,
                        Name = pm.Name,
                        Slug = pm.Slug,
                        IconUrl = pm.IconUrl,
                        AdminFee = pm.AdminFee,
                        DisplayOrder = pm.DisplayOrder
                    }).ToList()
                })
                .ToListAsync();
        }
    }
}
