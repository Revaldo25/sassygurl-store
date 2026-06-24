using Microsoft.AspNetCore.Mvc;
using SassyGurl.Store.Core.DTOs;
using SassyGurl.Store.Core.Services;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SassyGurl.Store.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GameCatalogController : ControllerBase
    {
        private readonly GameCatalogService _gameCatalogService;

        public GameCatalogController(GameCatalogService gameCatalogService)
        {
            _gameCatalogService = gameCatalogService;
        }

        [HttpGet]
        public async Task<ActionResult<List<GameListDTO>>> GetGames()
        {
            var games = await _gameCatalogService.GetAllGamesAsync();
            return Ok(games);
        }

        [HttpGet("{slug}")]
        public async Task<ActionResult<GameDetailDTO>> GetGameDetail(string slug)
        {
            var game = await _gameCatalogService.GetGameBySlugAsync(slug);
            if (game == null)
            {
                return NotFound();
            }
            return Ok(game);
        }

        [HttpGet("payment-methods")]
        public async Task<ActionResult<List<PaymentGroupDTO>>> GetPaymentMethods()
        {
            var paymentMethods = await _gameCatalogService.GetPaymentMethodsAsync();
            return Ok(paymentMethods);
        }
    }
}
