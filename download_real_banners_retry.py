import os
import requests

games_direct = {
    "hsr": "https://cdn1.epicgames.com/offer/3f9f4a7c6f094eb8aa9fb49fbacb4700/EGS_HonkaiStarRail_COGNOSPHEREPTE_LTD_S1_2560x1440-1a2c3a0715f5c35b8e907d61184a7e93",
    "valorant": "https://cdn1.epicgames.com/offer/cb2604e42007421cb417387401c40b85/EGS_VALORANT_RiotGames_S1_2560x1440-6058b76c12aa13cf4a5ee3e5d3fa3ad9",
    "wuwa": "https://cdn1.epicgames.com/offer/3041935e408d447fa0d9bb57c7a36ba4/EGS_WutheringWaves_KUROGAMESSG_S1_2560x1440-02c3e1e626786c57f7b3dfd2e33f6a27",
    "zzz": "https://cdn1.epicgames.com/offer/2a5592ec76d34e9cb4e7300c7e2f5b66/EGS_ZenlessZoneZero_COGNOSPHEREPTELTD_S1_2560x1440-1e56b4600109635f37ccb83cc905df75",
    "hok": "https://cdn1.epicgames.com/offer/663ccb5c404b4976a2adcb87dd88421b/EGS_HonorofKings_LevelInfinite_S1_2560x1440-42cf638f3cbffc74cdd27d8272de38e8",
    "df": "https://cdn1.epicgames.com/offer/1f61fb716bdf492bae1144f6f70ba877/EGS_DeltaForce_TeamJade_S1_2560x1440-482f768b4ef262fce0a7e6b7201c1f4e",
    "bs": "https://cdn1.epicgames.com/offer/07ccce6271c045b8af17997ed8e5cc69/EGS_BloodStrike_NetEaseGames_S1_2560x1440-15bd846950392348c5d2b1f1f2e22c15",
    "arknights-endfield": "https://media.rawg.io/media/games/6be/6bede3e3b79d2b292eab098528ba04db.jpg",
    "fcm": "https://media.rawg.io/media/games/7bd/7bd17e90f212265074ff53e20e8a7156.jpg",
    "aether-gazer": "https://media.rawg.io/media/games/eb1/eb1bfb7f872322384a569cc061264c78.jpg"
}

output_dir = "public/images/hero"
os.makedirs(output_dir, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://store.epicgames.com/'
}

def download(slug, url):
    print(f"Downloading {slug}...")
    try:
        response = requests.get(url, headers=headers, timeout=10)
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

for slug, url in games_direct.items():
    download(slug, url)
