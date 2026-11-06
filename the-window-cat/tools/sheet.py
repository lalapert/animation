"""Tile frames into one contact sheet with their time under each.
  .venv/bin/python tools/sheet.py out/review/sheet.jpg out/review/t_*.jpg [--cols 4] [--w 360]
"""
import os, sys
from PIL import Image, ImageDraw

args = sys.argv[1:]
cols, w = 4, 360
if "--cols" in args: i = args.index("--cols"); cols = int(args[i + 1]); del args[i:i + 2]
if "--w" in args: i = args.index("--w"); w = int(args[i + 1]); del args[i:i + 2]
out, files = args[0], sorted(args[1:])
ims = [Image.open(f).convert("RGB") for f in files]
h = int(ims[0].height * w / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (w + 8) + 8, rows * (h + 30) + 8), (40, 38, 36))
d = ImageDraw.Draw(sheet)
for k, (f, im) in enumerate(zip(files, ims)):
    x, y = 8 + (k % cols) * (w + 8), 8 + (k // cols) * (h + 30)
    sheet.paste(im.resize((w, h), Image.LANCZOS), (x, y))
    d.text((x + 4, y + h + 6), os.path.basename(f).replace("t_", "t=").replace(".jpg", "s"), fill=(230, 225, 215))
sheet.save(out, quality=88)
print(out, sheet.size)
