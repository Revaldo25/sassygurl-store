import os
import requests
from google_play_scraper import app

games_playstore = {
    "mlbb": "com.mobile.legends",
    "ff": "com.dts.freefireth",
    "pubg": "com.tencent.ig",
    "roblox": "com.roblox.client",
    "nikke": "com.proximabeta.nikke",
    "mccg": "com.mobile.legends", # MC is part of MLBB, but maybe we can use a different image.
}

games_direct = {
    "genshin": "https://cdn1.epicgames.com/salesEvent/salesEvent/EGS_GenshinImpact_miHoYoLimited_S1_2560x1440-91c6cd7312cc2647c3ebccca10f30399",
    "hsr": "https://cdn1.epicgames.com/offer/3f9f4a7c6f094eb8aa9fb49fbacb4700/EGS_HonkaiStarRail_COGNOSPHEREPTE_LTD_S1_2560x1440-1a2c3a0715f5c35b8e907d61184a7e93",
    "valorant": "https://cdn1.epicgames.com/offer/cb2604e42007421cb417387401c40b85/EGS_VALORANT_RiotGames_S1_2560x1440-6058b76c12aa13cf4a5ee3e5d3fa3ad9",
    "lol": "https://cdn1.epicgames.com/offer/24b9b5e323bc40eea252a10cdd3b2f10/EGS_LeagueofLegends_RiotGames_S1_2560x1440-80471666c140f790f28dff68d72c384b",
    "wuwa": "https://cdn1.epicgames.com/offer/3041935e408d447fa0d9bb57c7a36ba4/EGS_WutheringWaves_KUROGAMESSG_S1_2560x1440-02c3e1e626786c57f7b3dfd2e33f6a27",
    "zzz": "https://cdn1.epicgames.com/offer/2a5592ec76d34e9cb4e7300c7e2f5b66/EGS_ZenlessZoneZero_COGNOSPHEREPTELTD_S1_2560x1440-1e56b4600109635f37ccb83cc905df75",
    "arknights-endfield": "https://media.rawg.io/media/games/6be/6bede3e3b79d2b292eab098528ba04db.jpg", # Or any direct
    "hok": "https://cdn1.epicgames.com/offer/663ccb5c404b4976a2adcb87dd88421b/EGS_HonorofKings_LevelInfinite_S1_2560x1440-42cf638f3cbffc74cdd27d8272de38e8",
    "df": "https://cdn1.epicgames.com/offer/1f61fb716bdf492bae1144f6f70ba877/EGS_DeltaForce_TeamJade_S1_2560x1440-482f768b4ef262fce0a7e6b7201c1f4e",
    "fcm": "https://media.rawg.io/media/games/7bd/7bd17e90f212265074ff53e20e8a7156.jpg",
    "bs": "https://cdn1.epicgames.com/offer/07ccce6271c045b8af17997ed8e5cc69/EGS_BloodStrike_NetEaseGames_S1_2560x1440-15bd846950392348c5d2b1f1f2e22c15",
    "steam": "https://cdn.akamai.steamstatic.com/steam/apps/1066890/library_hero.jpg",
    "lolwr": "https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg",
    "aether-gazer": "https://media.rawg.io/media/games/eb1/eb1bfb7f872322384a569cc061264c78.jpg"
}

output_dir = "public/images/hero"
os.makedirs(output_dir, exist_ok=True)

def download(slug, url):
    print(f"Downloading {slug} from {url}")
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            ext = 'jpg'
            filepath = os.path.join(output_dir, f"hero_{slug}.{ext}")
            with open(filepath, 'wb') as f:
                f.write(response.content)
            print(f"  [SUCCESS] Saved to {filepath}")
        else:
            print(f"  [ERROR] Status {response.status_code}")
    except Exception as e:
        print(f"  [ERROR] {e}")

# Download Play Store banners
for slug, app_id in games_playstore.items():
    try:
        result = app(app_id)
        if result and result.get('videoImage'):
            download(slug, result['videoImage'])
        elif result and result.get('headerImage'):
            download(slug, result['headerImage'])
        else:
            print(f"  [WARN] No header image for {slug}")
    except Exception as e:
        print(f"  [ERROR] PlayStore fetch failed for {slug}: {e}")

# Download Direct banners
for slug, url in games_direct.items():
    download(slug, url)

print("Finished downloading real banners.")
