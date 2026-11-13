"""Contact sheet of the tape window only (crops y 514..1336 of each 1080x1920 still), time under each.
  .venv/bin/python tools/winsheet.py out/sheet.jpg out/review/t_*.jpg [--cols 4] [--w 360]
"""
import os, sys
from PIL import Image, ImageDraw

args = sys.argv[1:]
cols, w = 4, 360
if "--cols" in args: i = args.index("--cols"); cols = int(args[i + 1]); del args[i:i + 2]
if "--w" in args: i = args.index("--w"); w = int(args[i + 1]); del args[i:i + 2]
out, files = args[0], sorted(args[1:])
ims = [Image.open(f).convert("RGB").crop((0, 514, 1080, 1336)) for f in files]
h = int(ims[0].height * w / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (w + 6) + 6, rows * (h + 24) + 6), (40, 38, 36))
d = ImageDraw.Draw(sheet)
for k, (f, im) in enumerate(zip(files, ims)):
    x, y = 6 + (k % cols) * (w + 6), 6 + (k // cols) * (h + 24)
    sheet.paste(im.resize((w, h), Image.LANCZOS), (x, y))
    d.text((x + 4, y + h + 4), os.path.basename(f).replace("t_", "t=").replace(".jpg", "s").replace(".png", "s"), fill=(230, 225, 215))
sheet.save(out, quality=88)
print(out, sheet.size)
