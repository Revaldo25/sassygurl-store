#!/usr/bin/env python3
"""
SassyGurl Asset Manager

Fungsi:
1) Membaca daftar game dari Excel.
2) Mencari dan mengunduh aset logo, item icon, dan banner.
3) Menyimpan file ke struktur Next.js: public/assets/games/[game-name]/[type]/
4) Sinkronisasi ke PostgreSQL (INSERT / UPDATE).
5) Logging error ke error_log.txt dan progress bar di terminal.

Catatan:
- Script ini dibuat dengan pendekatan praktis dan fleksibel.
- Pinterest sering membatasi scraping; selector/struktur halaman bisa berubah kapan saja.
- Jika perlu stabilitas produksi yang lebih tinggi, pertimbangkan API resmi / sumber aset yang lebih terkontrol.
"""

from __future__ import annotations

import argparse
import logging
import os
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple
from urllib.parse import quote_plus, urlparse

import pandas as pd
import psycopg2
import requests
from bs4 import BeautifulSoup
from openpyxl import load_workbook
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright
from psycopg2.extras import RealDictCursor
from PIL import Image
from tqdm import tqdm


# =========================================================
# KONFIGURASI DASAR
# =========================================================

DEFAULT_EXCEL_SHEET = 0
ERROR_LOG_FILE = "error_log.txt"

# Folder output untuk Next.js
BASE_ASSET_DIR = Path("public/assets/games")

# Header HTTP agar request lebih realistis
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


# =========================================================
# DATA CLASS
# =========================================================

@dataclass
class GameRow:
    game_name: str
    logo_keyword: str
    item_keyword: str
    banner_keyword: str


@dataclass
class DownloadResult:
    logo_url: Optional[str] = None
    item_icon_url: Optional[str] = None
    banner_url: Optional[str] = None


# =========================================================
# UTILITAS
# =========================================================

def setup_logging() -> None:
    """Konfigurasi logging ke terminal + file error."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(ERROR_LOG_FILE, encoding="utf-8"),
        ],
    )


def log_error(message: str) -> None:
    """Tulis error ke file log dan terminal."""
    logging.error(message)


def sanitize_slug(text: str) -> str:
    """
    Ubah nama game menjadi slug yang aman untuk nama folder/file.
    Contoh: 'Mobile Legends: Bang Bang' -> 'mobile-legends-bang-bang'
    """
    text = text.strip().lower()
    text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-{2,}", "-", text)
    return text.strip("-")


def ensure_dir(path: Path) -> None:
    """Pastikan folder target ada."""
    path.mkdir(parents=True, exist_ok=True)


def normalize_public_path(file_path: Path) -> str:
    """
    Ubah path lokal menjadi path publik Next.js.
    Contoh:
      public/assets/games/x/logo/logo.png -> /assets/games/x/logo/logo.png
    """
    parts = file_path.as_posix().split("/public/")
    if len(parts) == 2:
        return "/" + parts[1]
    # fallback jika path tidak mengandung /public/
    return "/" + file_path.as_posix().lstrip("./")


def resolve_extension_from_content_type(content_type: str, fallback: str = ".bin") -> str:
    content_type = (content_type or "").lower()
    if "png" in content_type:
        return ".png"
    if "jpeg" in content_type or "jpg" in content_type:
        return ".jpg"
    if "webp" in content_type:
        return ".webp"
    if "gif" in content_type:
        return ".gif"
    return fallback


def safe_filename(name: str, suffix: str) -> str:
    return f"{sanitize_slug(name)}{suffix}"


def read_excel_games(excel_path: str | Path, sheet_name: int | str = DEFAULT_EXCEL_SHEET) -> List[GameRow]:
    """
    Baca Excel dan cari kolom yang diperlukan.
    Script ini mendukung nama kolom yang sedikit berbeda dari file asli.
    """
    df = pd.read_excel(excel_path, sheet_name=sheet_name, engine="openpyxl")
    df.columns = [str(c).strip() for c in df.columns]

    def find_column(possible_names: Iterable[str]) -> Optional[str]:
        lower_map = {c.lower(): c for c in df.columns}
        for candidate in possible_names:
            if candidate.lower() in lower_map:
                return lower_map[candidate.lower()]
        return None

    col_game = find_column(["Game Name", "game name", "Nama Game", "game"])
    col_logo = find_column(["Logo Keyword", "Logo Search Keyword (PNG)", "logo keyword", "logo search keyword (png)"])
    col_item = find_column(["Item Keyword", "Item Icon Keyword (PNG)", "item keyword", "item icon keyword (png)"])
    col_banner = find_column(["Pinterest Keyword", "Pinterest Banner Keyword", "banner keyword"])

    missing = [name for name, col in [
        ("Game Name", col_game),
        ("Logo Keyword", col_logo),
        ("Item Keyword", col_item),
        ("Pinterest Keyword", col_banner),
    ] if col is None]

    if missing:
        raise ValueError(
            "Kolom Excel tidak lengkap. Kolom yang dibutuhkan tidak ditemukan: "
            + ", ".join(missing)
        )

    games: List[GameRow] = []
    for _, row in df.iterrows():
        game_name = str(row[col_game]).strip()
        if not game_name or game_name.lower() == "nan":
            continue

        games.append(
            GameRow(
                game_name=game_name,
                logo_keyword=str(row[col_logo]).strip(),
                item_keyword=str(row[col_item]).strip(),
                banner_keyword=str(row[col_banner]).strip(),
            )
        )

    return games


# =========================================================
# PENCARIAN ASET
# =========================================================

def pick_best_image_url(urls: List[str]) -> Optional[str]:
    """
    Pilih URL terbaik dari list kandidat.
    Prioritas:
    - Hindari data URL
    - Utamakan pinimg / wikimedia
    - Ambil yang paling panjang/kemungkinan resolusi lebih tinggi
    """
    clean = []
    for u in urls:
        if not u:
            continue
        u = u.strip()
        if u.startswith("data:"):
            continue
        if u.startswith("//"):
            u = "https:" + u
        clean.append(u)

    if not clean:
        return None

    def score(u: str) -> Tuple[int, int]:
        domain = urlparse(u).netloc.lower()
        domain_score = 0
        if "pinimg.com" in domain:
            domain_score += 50
        if "wikimedia.org" in domain:
            domain_score += 40
        if "wikipedia.org" in domain:
            domain_score += 30
        # URL yang lebih panjang sering menandakan resolusi lebih besar
        return (domain_score, len(u))

    clean.sort(key=score, reverse=True)
    return clean[0]


def search_pinterest_image(query: str, browser_context) -> Optional[str]:
    """
    Cari gambar di Pinterest menggunakan Playwright.

    Strategi:
    1) Buka halaman pencarian Pinterest.
    2) Kumpulkan src gambar dari tag img.
    3) Pilih kandidat terbaik.

    Catatan:
    - Struktur Pinterest dapat berubah.
    - Kadang halaman menampilkan gambar placeholder.
    """
    search_url = f"https://www.pinterest.com/search/pins/?q={quote_plus(query)}"
    page = browser_context.new_page()
    try:
        page.goto(search_url, wait_until="domcontentloaded", timeout=45000)
        page.wait_for_timeout(2500)

        urls = page.evaluate(
            """
            () => Array.from(document.querySelectorAll('img'))
                .map(img => img.currentSrc || img.src || '')
                .filter(Boolean)
            """
        )

        best = pick_best_image_url(urls)

        if not best:
            # Coba ambil dari srcset jika src biasa kosong
            urls = page.evaluate(
                """
                () => Array.from(document.querySelectorAll('img'))
                    .flatMap(img => {
                        const srcset = img.getAttribute('srcset') || '';
                        return srcset.split(',').map(x => x.trim().split(' ')[0]).filter(Boolean);
                    })
                """
            )
            best = pick_best_image_url(urls)

        return best
    except PlaywrightTimeoutError as exc:
        log_error(f"[Pinterest] Timeout saat mencari '{query}': {exc}")
        return None
    except Exception as exc:
        log_error(f"[Pinterest] Gagal mencari '{query}': {exc}")
        return None
    finally:
        page.close()


def wikimedia_original_url_from_thumb_url(thumb_url: str) -> Optional[str]:
    """
    Ubah URL thumbnail Wikimedia menjadi URL original.
    Contoh:
      .../commons/thumb/a/ab/Foo.jpg/250px-Foo.jpg
    menjadi:
      .../commons/a/ab/Foo.jpg
    """
    if not thumb_url:
        return None

    parsed = urlparse(thumb_url)
    if "upload.wikimedia.org" not in parsed.netloc:
        return thumb_url

    parts = parsed.path.split("/")
    # Format thumbnail:
    # /wikipedia/commons/thumb/a/ab/File.jpg/250px-File.jpg
    if "/thumb/" in parsed.path:
        try:
            idx = parts.index("thumb")
            # path original ada setelah folder hash, lalu nama file sebelum ukuran thumbnail
            # contoh: [..., 'thumb', 'a', 'ab', 'File.jpg', '250px-File.jpg']
            original_parts = parts[:idx] + parts[idx + 1: idx + 4]
            return f"{parsed.scheme}://{parsed.netloc}{'/'.join(original_parts)}"
        except Exception:
            return thumb_url

    return thumb_url


def search_wiki_banner(query: str) -> Optional[str]:
    """
    Cari banner dari wiki menggunakan BeautifulSoup.
    Strategi:
    1) Cari halaman hasil pencarian Wikipedia.
    2) Ambil artikel pertama.
    3) Buka artikel dan ambil gambar infobox / gambar utama.
    """
    try:
        search_url = f"https://en.wikipedia.org/wiki/Special:Search?search={quote_plus(query)}"
        resp = requests.get(search_url, headers=DEFAULT_HEADERS, timeout=30)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        # Ambil link artikel pertama dari hasil pencarian
        first_link = None
        for a in soup.select("ul.mw-search-results li a"):
            href = a.get("href")
            if href and href.startswith("/wiki/"):
                first_link = "https://en.wikipedia.org" + href
                break

        # Fallback: jika pencarian langsung menuju artikel
        if not first_link:
            canonical = soup.select_one("link[rel='canonical']")
            if canonical and canonical.get("href"):
                first_link = canonical.get("href")

        if not first_link:
            return None

        article_resp = requests.get(first_link, headers=DEFAULT_HEADERS, timeout=30)
        article_resp.raise_for_status()
        article_soup = BeautifulSoup(article_resp.text, "html.parser")

        candidates: List[str] = []

        # Gambar infobox biasanya paling relevan
        for img in article_soup.select("table.infobox img"):
            src = img.get("src")
            if src:
                if src.startswith("//"):
                    src = "https:" + src
                candidates.append(src)
                candidates.append(wikimedia_original_url_from_thumb_url(src) or src)

        # Fallback: gambar utama dari konten artikel
        for img in article_soup.select("figure img, p img"):
            src = img.get("src")
            if src:
                if src.startswith("//"):
                    src = "https:" + src
                candidates.append(src)
                candidates.append(wikimedia_original_url_from_thumb_url(src) or src)

        best = pick_best_image_url(candidates)
        return best
    except Exception as exc:
        log_error(f"[Wiki] Gagal mencari banner '{query}': {exc}")
        return None


# =========================================================
# DOWNLOAD & KONVERSI FILE
# =========================================================

def download_binary(url: str, out_path: Path, referer: Optional[str] = None) -> bool:
    """
    Download file dari URL ke path target.
    Jika response sukses, file ditulis mentah ke disk.
    """
    try:
        headers = dict(DEFAULT_HEADERS)
        if referer:
            headers["Referer"] = referer

        with requests.get(url, headers=headers, stream=True, timeout=60) as resp:
            resp.raise_for_status()
            ensure_dir(out_path.parent)
            with open(out_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=1024 * 64):
                    if chunk:
                        f.write(chunk)
        return True
    except Exception as exc:
        log_error(f"[Download] Gagal mengunduh {url} -> {out_path}: {exc}")
        return False


def convert_to_png(source_path: Path, target_path: Path) -> bool:
    """Konversi file apa pun yang didukung Pillow menjadi PNG."""
    try:
        ensure_dir(target_path.parent)
        with Image.open(source_path) as img:
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGBA")
            else:
                img = img.convert("RGBA")
            img.save(target_path, format="PNG", optimize=True)
        return True
    except Exception as exc:
        log_error(f"[Convert PNG] Gagal konversi {source_path} -> {target_path}: {exc}")
        return False


def convert_to_jpg(source_path: Path, target_path: Path, quality: int = 92) -> bool:
    """Konversi file apa pun yang didukung Pillow menjadi JPG."""
    try:
        ensure_dir(target_path.parent)
        with Image.open(source_path) as img:
            if img.mode in ("RGBA", "P"):
                # JPG tidak mendukung alpha, jadi latar dibuat putih
                background = Image.new("RGB", img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                background.save(target_path, format="JPEG", quality=quality, optimize=True)
            else:
                img.convert("RGB").save(target_path, format="JPEG", quality=quality, optimize=True)
        return True
    except Exception as exc:
        log_error(f"[Convert JPG] Gagal konversi {source_path} -> {target_path}: {exc}")
        return False


def download_logo_or_item(
    browser_context,
    keyword: str,
    target_dir: Path,
    filename_stem: str,
    asset_kind: str,
) -> Optional[Path]:
    """
    Download logo/item icon dari Pinterest.
    Hasil akhir dipaksa menjadi PNG.
    """
    url = search_pinterest_image(keyword, browser_context)
    if not url:
        log_error(f"[{asset_kind}] Gambar tidak ditemukan untuk keyword: {keyword}")
        return None

    tmp_ext = ".png"
    tmp_path = target_dir / f"{filename_stem}_source{tmp_ext}"
    final_path = target_dir / f"{filename_stem}.png"

    ok = download_binary(url, tmp_path, referer="https://www.pinterest.com/")
    if not ok:
        return None

    if not convert_to_png(tmp_path, final_path):
        try:
            tmp_path.unlink(missing_ok=True)
        except Exception:
            pass
        return None

    try:
        tmp_path.unlink(missing_ok=True)
    except Exception:
        pass

    return final_path


def download_banner(keyword: str, target_dir: Path, filename_stem: str) -> Optional[Path]:
    """
    Download banner dari wiki, lalu simpan sebagai JPG.
    Bila file sumber bukan JPG, script akan mengonversi ke JPG.
    """
    url = search_wiki_banner(keyword)
    if not url:
        log_error(f"[Banner] Gambar tidak ditemukan untuk keyword: {keyword}")
        return None

    parsed = urlparse(url)
    ext = resolve_extension_from_content_type("", fallback=Path(parsed.path).suffix or ".img")
    if ext == ".bin":
        ext = Path(parsed.path).suffix or ".img"

    source_path = target_dir / f"{filename_stem}_source{ext}"
    final_path = target_dir / f"{filename_stem}.jpg"

    ok = download_binary(url, source_path)
    if not ok:
        return None

    # Jika sumber sudah jpg/jpeg, cukup rename/copy
    if source_path.suffix.lower() in [".jpg", ".jpeg"]:
        try:
            source_path.replace(final_path)
            return final_path
        except Exception as exc:
            log_error(f"[Banner] Gagal rename JPG {source_path} -> {final_path}: {exc}")
            return None

    # Kalau bukan JPG, konversi
    if not convert_to_jpg(source_path, final_path):
        try:
            source_path.unlink(missing_ok=True)
        except Exception:
            pass
        return None

    try:
        source_path.unlink(missing_ok=True)
    except Exception:
        pass

    return final_path


# =========================================================
# DATABASE POSTGRESQL
# =========================================================

def get_db_connection():
    """
    Ambil koneksi PostgreSQL dari environment variable.
    Wajib diisi:
      PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
    """
    return psycopg2.connect(
        host=os.getenv("PGHOST", "localhost"),
        port=os.getenv("PGPORT", "5432"),
        dbname=os.getenv("PGDATABASE", "postgres"),
        user=os.getenv("PGUSER", "postgres"),
        password=os.getenv("PGPASSWORD", ""),
    )


def upsert_game_assets(
    conn,
    game_name: str,
    logo_url: Optional[str],
    item_icon_url: Optional[str],
    banner_url: Optional[str],
) -> None:
    """
    Insert/update data ke tabel Games.
    Asumsi:
      - ada kolom game_name yang unik / primary key
      - kolom target: logo_url, item_icon_url, banner_url

    Jika skema berbeda, sesuaikan query-nya.
    """
    sql = """
        INSERT INTO Games (game_name, logo_url, item_icon_url, banner_url)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (game_name)
        DO UPDATE SET
            logo_url = EXCLUDED.logo_url,
            item_icon_url = EXCLUDED.item_icon_url,
            banner_url = EXCLUDED.banner_url
    """
    with conn.cursor() as cur:
        cur.execute(sql, (game_name, logo_url, item_icon_url, banner_url))
    conn.commit()


# =========================================================
# PROSES UTAMA
# =========================================================

def process_single_game(game: GameRow, browser_context, db_conn) -> DownloadResult:
    """
    Proses 1 game:
    - Download logo
    - Download item icon
    - Download banner
    - Sync ke database
    """
    slug = sanitize_slug(game.game_name)
    base_dir = BASE_ASSET_DIR / slug
    logo_dir = base_dir / "logo"
    item_dir = base_dir / "item"
    banner_dir = base_dir / "banner"

    ensure_dir(logo_dir)
    ensure_dir(item_dir)
    ensure_dir(banner_dir)

    filename_logo = safe_filename(game.game_name, "-logo")
    filename_item = safe_filename(game.game_name, "-item-icon")
    filename_banner = safe_filename(game.game_name, "-banner")

    result = DownloadResult()

    logo_file = download_logo_or_item(
        browser_context=browser_context,
        keyword=game.logo_keyword,
        target_dir=logo_dir,
        filename_stem=filename_logo,
        asset_kind="Logo",
    )
    if logo_file:
        result.logo_url = normalize_public_path(logo_file)

    item_file = download_logo_or_item(
        browser_context=browser_context,
        keyword=game.item_keyword,
        target_dir=item_dir,
        filename_stem=filename_item,
        asset_kind="Item Icon",
    )
    if item_file:
        result.item_icon_url = normalize_public_path(item_file)

    banner_file = download_banner(
        keyword=game.banner_keyword,
        target_dir=banner_dir,
        filename_stem=filename_banner,
    )
    if banner_file:
        result.banner_url = normalize_public_path(banner_file)

    # Sync ke PostgreSQL
    try:
        upsert_game_assets(
            conn=db_conn,
            game_name=game.game_name,
            logo_url=result.logo_url,
            item_icon_url=result.item_icon_url,
            banner_url=result.banner_url,
        )
    except Exception as exc:
        log_error(f"[DB] Gagal sync '{game.game_name}' ke PostgreSQL: {exc}")

    return result


def filter_games(games: List[GameRow], selected: str) -> List[GameRow]:
    """
    Pilih satu game tertentu atau proses semua.
    Jika selected = 'all', semua game diproses.
    """
    selected = selected.strip()
    if selected.lower() == "all":
        return games

    for g in games:
        if g.game_name.lower() == selected.lower():
            return [g]

    # fallback: cocokkan berdasarkan slug
    selected_slug = sanitize_slug(selected)
    for g in games:
        if sanitize_slug(g.game_name) == selected_slug:
            return [g]

    raise ValueError(f"Game '{selected}' tidak ditemukan di Excel.")


def run(excel_path: str, game_selector: str) -> None:
    """
    Jalankan seluruh pipeline:
    - baca Excel
    - buka browser Playwright
    - konek PostgreSQL
    - proses game satu per satu
    """
    setup_logging()

    logging.info("Membaca data Excel...")
    games = read_excel_games(excel_path)

    if not games:
        logging.warning("Tidak ada data game yang bisa diproses.")
        return

    selected_games = filter_games(games, game_selector)
    logging.info(f"Total game yang akan diproses: {len(selected_games)}")

    # Koneksi DB sekali saja untuk efisiensi
    db_conn = None
    try:
        db_conn = get_db_connection()
    except Exception as exc:
        log_error(f"[DB] Gagal konek ke PostgreSQL: {exc}")
        # Tetap lanjut download meskipun DB gagal, supaya aset tetap tersimpan
        db_conn = None

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent=DEFAULT_HEADERS["User-Agent"])

        try:
            for game in tqdm(selected_games, desc="Memproses game", unit="game"):
                logging.info(f"Memproses: {game.game_name}")
                process_single_game(game, context, db_conn) if db_conn else process_single_game_no_db(game, context)
                time.sleep(1)  # jeda kecil agar tidak terlalu agresif ke sumber
        finally:
            context.close()
            browser.close()

    if db_conn:
        db_conn.close()

    logging.info("Selesai.")


def process_single_game_no_db(game: GameRow, browser_context) -> DownloadResult:
    """
    Versi tanpa database connection.
    Dipakai hanya saat PostgreSQL tidak tersedia.
    """
    slug = sanitize_slug(game.game_name)
    base_dir = BASE_ASSET_DIR / slug
    logo_dir = base_dir / "logo"
    item_dir = base_dir / "item"
    banner_dir = base_dir / "banner"

    ensure_dir(logo_dir)
    ensure_dir(item_dir)
    ensure_dir(banner_dir)

    filename_logo = safe_filename(game.game_name, "-logo")
    filename_item = safe_filename(game.game_name, "-item-icon")
    filename_banner = safe_filename(game.game_name, "-banner")

    result = DownloadResult()

    logo_file = download_logo_or_item(
        browser_context=browser_context,
        keyword=game.logo_keyword,
        target_dir=logo_dir,
        filename_stem=filename_logo,
        asset_kind="Logo",
    )
    if logo_file:
        result.logo_url = normalize_public_path(logo_file)

    item_file = download_logo_or_item(
        browser_context=browser_context,
        keyword=game.item_keyword,
        target_dir=item_dir,
        filename_stem=filename_item,
        asset_kind="Item Icon",
    )
    if item_file:
        result.item_icon_url = normalize_public_path(item_file)

    banner_file = download_banner(
        keyword=game.banner_keyword,
        target_dir=banner_dir,
        filename_stem=filename_banner,
    )
    if banner_file:
        result.banner_url = normalize_public_path(banner_file)

    return result


# =========================================================
# CLI
# =========================================================

def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="SassyGurl Asset Manager - download aset game dari Excel, Pinterest, dan Wiki."
    )
    parser.add_argument(
        "--excel",
        required=True,
        help="Path file Excel sumber.",
    )
    parser.add_argument(
        "--game",
        default="all",
        help="Nama game tertentu atau 'all' untuk memproses seluruh Excel.",
    )
    parser.add_argument(
        "--sheet",
        default=DEFAULT_EXCEL_SHEET,
        help="Nama sheet atau index sheet Excel. Default: 0",
    )
    return parser


def main() -> None:
    args = build_arg_parser().parse_args()

    excel_path = args.excel
    if not Path(excel_path).exists():
        raise FileNotFoundError(f"File Excel tidak ditemukan: {excel_path}")

    # Jika user mengisi sheet numerik, ubah ke int
    sheet_name: int | str
    if isinstance(args.sheet, str) and args.sheet.isdigit():
        sheet_name = int(args.sheet)
    else:
        sheet_name = args.sheet

    # Override fungsi read_excel_games jika sheet dipilih non-default
    global DEFAULT_EXCEL_SHEET
    DEFAULT_EXCEL_SHEET = sheet_name  # tetap sederhana dan praktis untuk CLI

    run(excel_path=excel_path, game_selector=args.game)


if __name__ == "__main__":
    main()
