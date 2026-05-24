import os
import requests
from google_play_scraper import app

games_playstore = {
    "hsr": "com.HoYoverse.hkrpgoversea",
    "wuwa": "com.kurogame.wutheringwaves.global",
    "zzz": "com.HoYoverse.Nap",
    "hok": "com.levelinfinite.sgameGlobal",
    "bs": "com.netease.newspike",
    "fcm": "com.ea.gp.fifamobile",
    "aether-gazer": "com.YoStar.AetherGazer",
    "arknights-endfield": "com.YoStarEN.Arknights", # Fallback to standard Arknights for now to be safe
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

# Direct fallbacks for PC games
games_direct = {
    "valorant": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Valorant_logo_-_pink_color_version.svg/1920px-Valorant_logo_-_pink_color_version.svg.png",
    "df": "https://upload.wikimedia.org/wikipedia/en/thumb/8/8c/Delta_Force_series_logo.png/800px-Delta_Force_series_logo.png",
}

for slug, url in games_direct.items():
    download(slug, url)

print("Finished downloading additional real banners.")
