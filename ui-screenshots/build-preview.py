"""Contact sheet of browser screenshots; originals are preserved."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).parent
pages = [
    ("home", "01 / Главная"),
    ("catalog", "02 / Каталог"),
    ("teacher-dashboard", "03 / Кабинет преподавателя"),
    ("group", "04 / Группа"),
    ("student-profile", "05 / Профиль студента"),
    ("organizer", "06 / Организатор"),
    ("moderator", "07 / Модератор"),
]
font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 23)
canvas = Image.new("RGB", (1360, 2192), "#edf0f4")
draw = ImageDraw.Draw(canvas)
for index, (name, label) in enumerate(pages):
    x = 32 + (index % 2) * 664
    y = 24 + (index // 2) * 542
    draw.text((x, y), label, font=font, fill="#192b3a")
    source = Image.open(root / f"{name}-1440.jpg")
    crop = source.crop((0, 0, source.width, min(1040, source.height)))
    crop.thumbnail((632, 470), Image.Resampling.LANCZOS)
    draw.rectangle((x-1, y+41, x+633, y+513), fill="white", outline="#d3dae3")
    canvas.paste(crop, (x, y+42))
canvas.save(root / "overview.jpg", quality=92)
