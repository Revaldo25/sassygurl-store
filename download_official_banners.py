import os
import requests
from duckduckgo_search import DDGS
import time

games = {
    "mlbb": "Mobile Legends Bang Bang official PC wallpaper 1920x1080",
    "ff": "Garena Free Fire official desktop wallpaper 1920x1080 HD",
    "pubg": "PUBG Mobile official key art wallpaper 1920x1080 HD",
    "genshin": "Genshin Impact official key art wallpaper 1920x1080",
    "hsr": "Honkai Star Rail official key art wallpaper 1920x1080",
    "valorant": "Valorant official key art wallpaper 1920x1080",
    "roblox": "Roblox official promotional wallpaper 1920x1080",
    "arknights-endfield": "Arknights Endfield official wallpaper 1920x1080",
    "wuwa": "Wuthering Waves official key art wallpaper 1920x1080",
    "lol": "League of Legends official key art wallpaper 1920x1080",
    "nikke": "Goddess of Victory NIKKE official wallpaper 1920x1080"
}

output_dir = "public/images/hero"
os.makedirs(output_dir, exist_ok=True)

ddgs = DDGS()

for slug, query in games.items():
    print(f"Searching for {slug}...")
    try:
        results = list(ddgs.images(query, max_results=5))
        downloaded = False
        for res in results:
            image_url = res['image']
            print(f"  Found URL: {image_url}")
            try:
                response = requests.get(image_url, timeout=10)
                if response.status_code == 200:
                    ext = image_url.split('.')[-1].split('?')[0].lower()
                    if ext not in ['jpg', 'jpeg', 'png', 'webp']:
                        ext = 'jpg'
                    filepath = os.path.join(output_dir, f"hero_{slug}.{ext}")
                    with open(filepath, 'wb') as f:
                        f.write(response.content)
                    print(f"  [SUCCESS] Saved to {filepath}")
                    downloaded = True
                    break
            except Exception as e:
                print(f"  [WARN] Failed to download {image_url}: {e}")
        if not downloaded:
            print(f"  [ERROR] Could not download any image for {slug}")
    except Exception as e:
        print(f"  [ERROR] Search failed for {slug}: {e}")
    
    time.sleep(1)

print("Done downloading official banners.")
