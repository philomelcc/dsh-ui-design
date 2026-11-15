"""把 Hero 标题的字形提取成 SVG path，供「描线填色入场」使用。

做法与库里 demo 一致：每个字一条 path（fill:none + stroke 做描线），
再用 <use> + clipPath 做逐字填色。坐标已烘焙进 path d（不靠 transform），
这样 <use> 和 clipPath 在同一坐标系里，对齐简单。

用法：python tools/extract-title-paths.py > site/title-paths.js
"""
import json
import sys

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.misc.transform import Transform

FONT = "C:/Windows/Fonts/msyhbd.ttc"  # 微软雅黑 Bold，和页面 sans 风格一致
TEXT = "前端设计，AI 和人共用同一套"
EM = 100.0  # 1em = 100 单位，viewBox 高度用 100
BASELINE = 78.0  # 基线在 viewBox 里的 y

font = TTFont(FONT, fontNumber=0)
units = font["head"].unitsPerEm
scale = EM / units
cmap = font.getBestCmap()
glyph_set = font.getGlyphSet()

cursor = 0.0
glyphs = []
for ch in TEXT:
    gname = cmap.get(ord(ch))
    if not gname:
        print("缺字形: " + ch, file=sys.stderr)
        continue
    glyph = glyph_set[gname]
    advance = glyph.width * scale

    # 包围盒（字体坐标 → 屏幕坐标）
    bounds_pen = BoundsPen(glyph_set)
    glyph.draw(bounds_pen)
    if bounds_pen.bounds:
        x0, y0, x1, y1 = bounds_pen.bounds
        gx0 = x0 * scale + cursor
        gx1 = x1 * scale + cursor
        gy0 = BASELINE - y1 * scale
        gy1 = BASELINE - y0 * scale
    else:
        gx0 = gx1 = cursor
        gy0 = gy1 = BASELINE

    # path：直接烘焙坐标（x 右移、y 翻转），避免 use/clipPath 坐标系错位
    pen = SVGPathPen(glyph_set)
    transform_pen = TransformPen(pen, Transform(scale, 0, 0, -scale, cursor, BASELINE))
    glyph.draw(transform_pen)

    glyphs.append(
        {
            "ch": ch,
            "d": pen.getCommands(),
            "x": round(gx0, 2),
            "y": round(gy0, 2),
            "w": round(gx1 - gx0, 2),
            "h": round(gy1 - gy0, 2),
            "adv": round(advance, 2),
        }
    )
    cursor += advance

payload = {
    "text": TEXT,
    "width": round(cursor, 2),
    "height": EM,
    "baseline": BASELINE,
    "glyphs": glyphs,
}
out_path = sys.argv[1] if len(sys.argv) > 1 else "site/title-paths.js"
with open(out_path, "w", encoding="utf-8", newline="\n") as fh:
    fh.write("window.__HERO_TITLE = " + json.dumps(payload, ensure_ascii=False) + ";\n")
print("已写出 %s（%d 字，viewBox 0 0 %s %s）" % (out_path, len(glyphs), payload["width"], EM))
