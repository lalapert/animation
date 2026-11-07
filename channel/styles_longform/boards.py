# Style boards for the owner: one overview + one board per style (store and lab, 16:9 and 9:16). JPGs in out/.
from PIL import Image, ImageDraw, ImageFont
import glob
F = sorted(glob.glob('/usr/share/fonts/**/DejaVuSans-Bold.ttf', recursive=True))[0]
font = lambda n: ImageFont.truetype(F, n)
NAMES = {'A': 'A  Anime series HD', 'B': 'B  Painted film', 'C': 'C  Flat graphic', 'D': 'D  Paper diorama'}
BG = (14, 10, 30)
for k in 'ABCD':                                 # full-size JPGs of every frame
    for sc in ['store', 'lab']:
        for fr in ['wide', 'tall']:
            Image.open(f'out/{sc}_{k}_{fr}.png').convert('RGB').save(f'out/{sc}_{k}_{fr}.jpg', quality=90)
# overview: the store in all four styles
W, H = 1280, 720
ov = Image.new('RGB', (W * 2 + 60, H * 2 + 230), BG); d = ImageDraw.Draw(ov)
d.text((30, 30), 'Long-form style study: same set, four looks', font=font(46), fill=(240, 232, 255))
for i, k in enumerate('ABCD'):
    x, y = 20 + (i % 2) * (W + 20), 110 + (i // 2) * (H + 60)
    ov.paste(Image.open(f'out/store_{k}_wide.png').convert('RGB').resize((W, H), Image.LANCZOS), (x, y))
    d.text((x + 6, y + H + 10), NAMES[k], font=font(34), fill=(255, 200, 120))
ov.save('out/overview.jpg', quality=90)
# one board per style
for k in 'ABCD':
    ww, wh, tw, th = 1600, 900, 506, 900
    b = Image.new('RGB', (ww + tw + 60, wh * 2 + 190), BG); d = ImageDraw.Draw(b)
    d.text((30, 24), NAMES[k], font=font(56), fill=(255, 200, 120))
    d.text((32, 96), '16:9 long-form frame  /  9:16 Shorts frame from the same set', font=font(28), fill=(200, 190, 230))
    for j, sc in enumerate(['store', 'lab']):
        y = 150 + j * (wh + 20)
        b.paste(Image.open(f'out/{sc}_{k}_wide.png').convert('RGB').resize((ww, wh), Image.LANCZOS), (20, y))
        b.paste(Image.open(f'out/{sc}_{k}_tall.png').convert('RGB').resize((tw, th), Image.LANCZOS), (ww + 40, y))
    b.save(f'out/board_{k}.jpg', quality=88)
print('ok')
