from pathlib import Path
from fontTools.ttLib import TTFont
root=Path(__file__).resolve().parents[1]
for source in (root/'public/fonts').glob('*.ttf'):
    font=TTFont(source);font.flavor='woff2';font.save(source.with_suffix('.woff2'))
css=root/'src/style.css'
css.write_text(css.read_text(encoding='utf-8').replace(".ttf') format('truetype')",".woff2') format('woff2')"),encoding='utf-8')
