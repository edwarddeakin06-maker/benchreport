from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
FRAME_DIR = ROOT / "assets" / "demo-frames"
OUTPUT = ROOT / "assets" / "benchreport-demo.gif"
FRAME_NAMES = ["01-start.png", "02-loaded.png", "03-failed.png", "04-report.png"]
DURATIONS_MS = [2200, 2700, 3200, 3600]


def prepare(path: Path) -> Image.Image:
    with Image.open(path) as image:
        width = 900
        height = round(image.height * width / image.width)
        resized = image.convert("RGB").resize((width, height), Image.Resampling.LANCZOS)
        return resized.quantize(colors=128, method=Image.Quantize.MEDIANCUT)


frames = [prepare(FRAME_DIR / name) for name in FRAME_NAMES]
frames[0].save(
    OUTPUT,
    save_all=True,
    append_images=frames[1:],
    duration=DURATIONS_MS,
    loop=0,
    optimize=True,
    disposal=2,
)
print(f"Created {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")
