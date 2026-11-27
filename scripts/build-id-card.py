"""
Builds the lanyard badge artwork from the source photo and logo.

    public/images/id card.jpg   (photo)  ─┐
    public/images/aivision21.png (logo)  ─┴─> public/card-front.jpg
                                              public/card-back.jpg
                                              public/band.png

Needs `rembg[cpu]` and `pillow` (rembg downloads its background-removal model,
about 1 GB, on first run). Run from the frontend root:

    python scripts/build-id-card.py

Card geometry mirrors `src/components/ui/lanyard.tsx`: a 1.6 x 2.25 unit portrait
card. Layout below is written for a 1024px-wide face (1 unit = 640px; the slot is
centred 83px below the top and is 218 x 45px) and rendered at SCALE x that, which
must match FACE_WIDTH in lanyard.tsx (2048).
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps
from rembg import remove

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
PHOTO = PUBLIC / "images" / "id card.jpg"
LOGO = PUBLIC / "images" / "aivision21.png"

HANDLE = "@akshayvenu"
NAME = "AKSHAY VENU"
ROLE = "AI & Backend Engineer · AIVision21"

SCALE = 2
W, H = 1024 * SCALE, 1440 * SCALE
CARD_BG = (241, 241, 241)

FONT_DIR = Path("C:/Windows/Fonts")


def px(value: float) -> int:
    """Layout units (1024-wide face) → output pixels."""
    return round(value * SCALE)


def font(size: float, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    names = ["consolab.ttf", "courbd.ttf"] if bold else ["consola.ttf", "cour.ttf"]
    for name in names:
        path = FONT_DIR / name
        if path.exists():
            return ImageFont.truetype(str(path), px(size))
    return ImageFont.load_default(px(size))


# ── Card background ──────────────────────────────────────────────────────────


def card_background() -> Image.Image:
    """Off-white stock with faint grain and a soft vignette toward the edges."""
    rng = np.random.default_rng(7)
    base = np.full((H, W), CARD_BG[0], dtype=np.float32)
    base += rng.normal(0, 1.8, (H, W))
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    dx = (xs - W / 2) / (W / 2)
    dy = (ys - H / 2) / (H / 2)
    base -= 9 * np.clip(np.hypot(dx * 0.9, dy * 0.8) - 0.55, 0, None) ** 1.6
    gray = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8), "L")
    return Image.merge("RGB", (gray, gray, gray)).convert("RGBA")


# ── Logo → solid silhouette ──────────────────────────────────────────────────


def logo_mask() -> Image.Image:
    """Alpha mask of the logo: keeps the red ∞ and black i, drops the pale shadow."""
    # The PNG has a transparent background: flatten onto white before reading colour.
    source = Image.open(LOGO).convert("RGBA")
    logo = Image.new("RGBA", source.size, (255, 255, 255, 255))
    logo.alpha_composite(source)
    logo = logo.convert("RGB")
    logo.thumbnail((2000, 2000), Image.LANCZOS)
    rgb = np.asarray(logo).astype(np.float32)
    lo = rgb.min(axis=2)
    hi = rgb.max(axis=2)
    dark = (255 - lo - 70) / 40  # ink that is clearly darker than paper
    colour = (hi - lo - 40) / 40  # saturated red, incl. the pink bevel highlights
    alpha = np.clip(np.maximum(dark, colour), 0, 1) * 255
    mask = Image.fromarray(alpha.astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(0.8))
    return mask.crop(mask.getbbox())


def silhouette(mask: Image.Image, width: int, colour: tuple[int, int, int], opacity: float = 1.0):
    height = round(mask.height * width / mask.width)
    m = mask.resize((width, height), Image.LANCZOS)
    if opacity < 1:
        m = m.point(lambda v: round(v * opacity))
    solid = Image.new("RGBA", m.size, colour + (255,))
    solid.putalpha(m)
    return solid


# ── Portrait ─────────────────────────────────────────────────────────────────


def sketch(gray: Image.Image) -> Image.Image:
    """Black-and-white with a light pencil pass, like a drawn ID photo."""
    gray = ImageOps.autocontrast(gray, cutoff=1)
    g = np.asarray(gray).astype(np.float32)
    blurred = np.asarray(ImageOps.invert(gray).filter(ImageFilter.GaussianBlur(px(10)))).astype(
        np.float32
    )
    dodge = np.clip(g * 255 / np.maximum(255 - blurred, 1), 0, 255)
    mixed = g * 0.72 + dodge * 0.28
    # Gentle S-curve: deep blacks in the clothes, bright skin, like a print.
    t = mixed / 255
    mixed = 255 * (t * t * (3 - 2 * t) * 0.55 + t * 0.45)
    out = Image.fromarray(np.clip(mixed, 0, 255).astype(np.uint8), "L")
    return out.filter(ImageFilter.UnsharpMask(radius=px(2), percent=120, threshold=2))


def portrait_layer() -> Image.Image:
    """Cut-out portrait with a white sticker outline and soft shadow, card-sized."""
    cutout = remove(Image.open(PHOTO).convert("RGB"), alpha_matting=True)
    cutout = cutout.crop(cutout.getchannel("A").getbbox())

    # Fill the card width; the head sits ~20% down and the body runs off the bottom.
    scale = (W * 0.96) / cutout.width
    size = (round(cutout.width * scale), round(cutout.height * scale))
    cutout = cutout.resize(size, Image.LANCZOS)
    alpha = cutout.getchannel("A").point(lambda v: 0 if v < 24 else v)

    face = sketch(cutout.convert("L"))
    left = (W - size[0]) // 2
    top = round(H * 0.2)

    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # Sticker border: grow the mask by ~12px with a blur + threshold for round,
    # clean edges, then a hair of feathering so it doesn't alias on the card.
    full = Image.new("L", (W, H), 0)
    full.paste(alpha, (left, top))
    border = full.filter(ImageFilter.GaussianBlur(px(12))).point(lambda v: 255 if v > 18 else 0)
    border = border.filter(ImageFilter.GaussianBlur(px(0.7)))

    # Shift the shadow down without wrapping (ImageChops.offset would wrap the
    # bottom edge round to the top of the card).
    shadow = Image.new("L", (W, H), 0)
    soft = border.filter(ImageFilter.GaussianBlur(px(12))).point(lambda v: round(v * 0.1))
    shadow.paste(soft, (0, px(5)))
    layer.paste(Image.new("RGBA", (W, H), (0, 0, 0, 255)), (0, 0), shadow)
    layer.paste(Image.new("RGBA", (W, H), (253, 253, 253, 255)), (0, 0), border)

    tile = Image.merge("RGBA", (face, face, face, alpha))
    layer.alpha_composite(tile, (left, top))
    return layer


# ── Faces ────────────────────────────────────────────────────────────────────


def build_front(mask: Image.Image) -> Image.Image:
    card = card_background()
    card.alpha_composite(portrait_layer())
    # Faint watermark, top-left, clear of the slot (x 403–621).
    mark = silhouette(mask, px(150), (0, 0, 0), opacity=0.13)
    card.alpha_composite(mark, (px(74), px(46)))
    # Handle at slot height: large and dark enough to read on a ~200px-wide card.
    draw = ImageDraw.Draw(card)
    draw.text((W - px(70), px(83)), HANDLE, font=font(52), fill=(58, 58, 58, 255), anchor="rm")
    return card


def build_back(mask: Image.Image) -> Image.Image:
    card = card_background()
    mark = silhouette(mask, px(400), (14, 14, 14))
    card.alpha_composite(mark, ((W - mark.width) // 2, px(420)))
    draw = ImageDraw.Draw(card)
    draw.text((W // 2, px(880)), NAME, font=font(84, bold=True), fill=(18, 18, 18, 255), anchor="mm")
    draw.text((W // 2, px(965)), ROLE, font=font(40), fill=(70, 70, 70, 255), anchor="mm")
    draw.text((W // 2, H - px(130)), HANDLE, font=font(48), fill=(80, 80, 80, 255), anchor="mm")
    return card


def build_band(mask: Image.Image) -> Image.Image:
    """One strap tile: 576 along x 192 across, white logo on transparent.

    `paintStrap` turns the image 90° clockwise as it lays it down the strap, so
    the logo is pre-turned 90° counter-clockwise to hang upright. The strap
    canvas is 192px across whatever size this is, so it stays at 1x.
    """
    band = Image.new("RGBA", (576, 192), (0, 0, 0, 0))
    mark = silhouette(mask, 112, (245, 245, 245)).rotate(90, expand=True)
    band.alpha_composite(mark, ((576 - mark.width) // 2, (192 - mark.height) // 2))
    return band


def main() -> None:
    mask = logo_mask()
    build_front(mask).convert("RGB").save(PUBLIC / "card-front.jpg", quality=90, optimize=True)
    build_back(mask).convert("RGB").save(PUBLIC / "card-back.jpg", quality=90, optimize=True)
    build_band(mask).save(PUBLIC / "band.png", optimize=True)
    print("wrote card-front.jpg, card-back.jpg, band.png to", PUBLIC)


if __name__ == "__main__":
    main()
