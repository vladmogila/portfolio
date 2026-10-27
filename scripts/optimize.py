#!/usr/bin/env python3
"""Готовит медиа для сайта из исходников в works/.

Изображения -> docs/assets/works/<проект>/<имя>.webp (длинная сторона до 2000px)
             и <имя>-thumb.webp (до 800px).
Видео        -> <имя>.mp4 (H.264, faststart, до 720px по ширине) и постер <имя>-poster.webp.

Запуск из корня репозитория:  python3 scripts/optimize.py
Нужны: Pillow (pip install pillow) и ffmpeg (для видео).
Новый проект: положите файлы в works/<папка>/ и добавьте строки в MEDIA ниже.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "works"
OUT = ROOT / "docs" / "assets" / "works"

FULL_MAX = 2000
THUMB_MAX = 800
FULL_QUALITY = 82
THUMB_QUALITY = 78

# (папка в works/, файл) -> (папка на сайте, латинское имя без расширения)
MEDIA = [
    ("Карточка товара - блендер", "01_obshiy_offer.jpg", "blender-card", "01-offer"),
    ("Карточка товара - блендер", "02_moshnost.jpg", "blender-card", "02-power"),
    ("Карточка товара - блендер", "03_rezhimy.jpg", "blender-card", "03-modes"),
    ("Карточка товара - блендер", "04_2v1.jpg", "blender-card", "04-2in1"),
    ("Карточка товара - блендер", "05_itog.jpg", "blender-card", "05-summary"),
    ("Карточка товара - блендер", "06_o_brende.jpg", "blender-card", "06-brand"),
    ("Карточка товара - блендер", "07_kontrol_kachestva.jpg", "blender-card", "07-quality"),
    ("Карточка товара - блендер", "08_dostavka.jpg", "blender-card", "08-delivery"),
    ("Карточка товара - блендер", "09_prodavec.jpg", "blender-card", "09-seller"),
    ("Карточка товара - блендер", "10_chat_garantiya.jpg", "blender-card", "10-warranty"),
    ("Карточка товара - таблетки", "HF-magniy-01-oblozhka.png", "magnesium-card", "01-cover"),
    ("Карточка товара - таблетки", "HF-magniy-02-primenenie.png", "magnesium-card", "02-usage"),
    ("Карточка товара - таблетки", "HF-magniy-03-simptomy.png", "magnesium-card", "03-symptoms"),
    ("Салфетки", "01_glavnoe_foto_A.png", "placemats-card", "01-main-a"),
    ("Салфетки", "главное фтото2.png", "placemats-card", "02-main-b"),
    ("Салфетки", "03_slayd_UTP.png", "placemats-card", "03-benefits"),
    ("Креатив - Шампурико", "ПостВариантА.jpg", "shampuriko", "post-a"),
    ("Креатив - Шампурико", "ПостВариантБ.jpg", "shampuriko", "post-b"),
    ("Креатив - Шампурико", "СторисВариантА.jpg", "shampuriko", "stories-a"),
    ("Креатив - Шампурико", "СторисВариантБ.jpg", "shampuriko", "stories-b"),
    ("Креатив - Шампурико", "Постер.jpg", "shampuriko", "poster"),
    ("Merch", "manute-bol-poster.png", "manute-bol", "presentation"),
    ("Ping Pong rackets", "Generated Image October 20, 2026 - 7_49PM.png", "keychain", "light"),
    ("Ping Pong rackets", "Generated Image October 20, 2026 - 7_50PM.png", "keychain", "dark"),
    ("Notebook", "блокнот.jpg", "notebook", "mockup"),
    ("Notebook", "баннер.png", "notebook", "artwork"),
    ("Football Poster", "2 вариант.png", "football-poster", "poster"),
    ("Ping Pong", "Ping Pong Poster v3.mp4", "ping-pong", "animation"),
    ("Blender works", "final render tutorial.png", "blender-3d", "donut"),
    ("Blender works", None, "blender-3d", "popsicle"),  # единственный .mp4 в папке
    ("Menu", "tihij-poster.png", "tihij-menu", "presentation"),
]


def fit(im, limit):
    if max(im.size) > limit:
        im = im.copy()
        im.thumbnail((limit, limit), Image.LANCZOS)
    return im


def prepare(im):
    """RGBA без реальной прозрачности -> RGB: файл меньше, вид тот же."""
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        if im.getchannel("A").getextrema()[0] == 255:
            return im.convert("RGB")
        return im
    return im.convert("RGB")


def save_webp(im, path, quality):
    im.save(path, "WEBP", quality=quality, method=6)
    return {"w": im.width, "h": im.height}


def image(src, dst_dir, name):
    im = prepare(Image.open(src))
    full = save_webp(fit(im, FULL_MAX), dst_dir / f"{name}.webp", FULL_QUALITY)
    save_webp(fit(im, THUMB_MAX), dst_dir / f"{name}-thumb.webp", THUMB_QUALITY)
    return {"type": "image", **full}


def video(src, dst_dir, name):
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg не найден — он нужен для видео")
    mp4 = dst_dir / f"{name}.mp4"
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", str(src),
         "-vf", "scale='min(720,iw)':-2", "-c:v", "libx264", "-crf", "26",
         "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k",
         "-movflags", "+faststart", str(mp4)],
        check=True,
    )
    frame = dst_dir / f"{name}-frame.png"
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-ss", "2", "-i", str(src),
         "-frames:v", "1", str(frame)],
        check=True,
    )
    im = prepare(Image.open(frame))
    frame.unlink()
    size = save_webp(fit(im, THUMB_MAX), dst_dir / f"{name}-poster.webp", THUMB_QUALITY)
    return {"type": "video", **size}


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    manifest = {}
    for folder, filename, project, name in MEDIA:
        src_dir = SRC / folder
        if filename is None:
            src = next(src_dir.glob("*.mp4"))
        else:
            src = src_dir / filename
        dst_dir = OUT / project
        dst_dir.mkdir(parents=True, exist_ok=True)
        info = video(src, dst_dir, name) if src.suffix.lower() == ".mp4" else image(src, dst_dir, name)
        manifest.setdefault(project, {})[name] = info
        print(f"{project}/{name}: {info['w']}x{info['h']}")
    (ROOT / "scripts" / "media.json").write_text(json.dumps(manifest, indent=1, ensure_ascii=False))
    total = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
    print(f"Готово: {total / 1024 / 1024:.1f} МБ в {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
