"""Compose editable vector artwork from the project's existing camera icons."""
from pathlib import Path
import base64,json,html
root=Path(__file__).resolve().parents[1]
brand=root/'public/brand';brand.mkdir(exist_ok=True)
paths='<path d="M10 42V10H42V19M22 23H54V55H22Z"/><path d="M31 48V31H47M31 39H43"/>'
for theme,color in [('dark','#d7ed83'),('light','#435a28')]:
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="{color}" stroke-width="3.5" stroke-linejoin="miter" stroke-linecap="square"><title>XerFilm GR — Offset Frames</title>{paths}</svg>'
 (brand/f'xerfilm-gr-{theme}.svg').write_text(svg)
(brand/'favicon.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="18" fill="#151714"/><g transform="translate(8 8)" fill="none" stroke="#d7ed83" stroke-width="4" stroke-linejoin="miter" stroke-linecap="square">{paths}</g></svg>')
films=json.loads((root/'src/films.json').read_text())
def icon(id,x,y,size,angle=0,opacity=1):
 data=base64.b64encode((root/f'public/films/{id}.png').read_bytes()).decode()
 return f'<g transform="translate({x} {y}) rotate({angle} {size/2} {size/2})" opacity="{opacity}"><image href="data:image/png;base64,{data}" width="{size}" height="{size}" style="image-rendering:pixelated"/></g>'
def txt(x,y,text,size=20,color='#e8ecdf',weight=400,extra=''):
 return f'<text x="{x}" y="{y}" fill="{color}" font-size="{size}" font-weight="{weight}" font-family="Arial,Helvetica,sans-serif" {extra}>{html.escape(text)}</text>'
labels={'zh':('胶片列表','返回','启用 / 停用'),'en':('FILM LIST','Back','Enable / Disable'),'ja':('フィルム一覧','戻る','有効 / 無効')}
for lang,(title,back,toggle) in labels.items():
 s=['<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1120" viewBox="0 0 1600 1120"><title>XerFilm GR — Film List</title><defs><filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="26" stdDeviation="26" flood-color="#000" flood-opacity=".5"/></filter></defs>', '<rect width="1600" height="1120" rx="28" fill="#171a15"/>']
 # Sprockets suggest a contact sheet without imitating a camera photograph.
 for y in [26,1072]:
  for x in range(38,1570,68):s.append(f'<rect x="{x}" y="{y}" width="26" height="15" rx="2" fill="#2c3227"/>')
 s += [f'<g transform="translate(54 70) scale(.65)" fill="none" stroke="#d7ed83" stroke-width="3.5" stroke-linecap="square">{paths}</g>',txt(122,110,'XERFILM GR',26,'#d7ed83',600, 'letter-spacing="4"'),txt(64,146,'FILM CHARACTER, INSIDE YOUR GR.',13,'#a0aa91',400,'letter-spacing="2"'),txt(1528,110,'V1',20,'#d7ed83',400,'text-anchor="end"')]
 # Rear layer: actual installed icons, loosely scattered, with deliberate margins.
 for vals in [(736,64,236,152,-18,.9),(729,1358,156,156,15,.9),(740,123,790,124,24,.7),(724,1290,788,156,-20,.8),(727,1212,895,108,12,.65)]:s.append(icon(*vals))
 s.append('<g transform="translate(260 210) rotate(-4 515 355)" filter="url(#shadow)"><rect width="1040" height="714" rx="18" fill="#242a22" stroke="#555e4b" stroke-width="2"/><rect x="16" y="16" width="1008" height="682" rx="6" fill="#191f18"/>')
 s += [txt(42,62,title,29,'#eef2e3',500),txt(994,59,'17 / 27',15,'#a1ab92',400,'text-anchor="end"'),'<path d="M35 83H1005" stroke="#6a7460"/>',txt(43,121,'REALA ACE',22,'#d7ed83',500)]
 for i,f in enumerate(films[:12]):
  col=i%4;row=i//4;x=38+col*242;y=144+row*161;active=i==6;disabled=i==0
  s.append(f'<rect x="{x}" y="{y}" width="230" height="149" rx="1" fill="{("#e5e619" if active else "#2c3328")}" stroke="{("#f2f29c" if active else "#4a5542")}" stroke-width="{3 if active else 1}"/>')
  if disabled:s.append('<g opacity=".25">')
  s.append(icon(f['icon'],x+69,y+24,92))
  if disabled:s.append('</g>')
  else:
   s.append(f'<path d="M{x+187} {y+24}l6 6 12-14" fill="none" stroke="{("#283118" if active else "#d7ed83")}" stroke-width="4"/>')
 s += ['<path d="M35 644H1005" stroke="#6a7460"/>',txt(42,680,'MENU',13,'#b6bfa8'),txt(108,680,back,18,'#e9edde'),txt(1000,680,'OK  '+toggle,18,'#e9edde',400,'text-anchor="end"'),'</g>']
 # Foreground layers; shapes remain true, native 40-pixel glyphs are never redrawn.
 for vals in [(736,20,530,170,-15,1),(741,1390,480,148,21,1),(738,1030,930,128,-12,1),(731,284,944,136,15,1),(739,1388,925,110,28,.9),(725,82,956,114,-10,.95)]:s.append(icon(*vals))
 s += [txt(760,1036,'17 FAMILIES  /  27 LOOKS',16,'#a5af97',400,'text-anchor="middle" letter-spacing="3"'),'</svg>']
 (brand/f'xerfilm-gr-showcase-{lang}.svg').write_text(''.join(s))
(brand/'README.md').write_text('''# XerFilm GR / Offset Frames\n\nThe mark combines two offset film frames and a geometric F for Film. It is an editable vector, distinct from the personal-site monogram. Dark and light marks, favicon, and three localized project illustrations are included.\n\nProject illustrations combine a recreated film-list interface with the existing 40×40 packaging icons. They are illustrations, not camera photographs or rendered film-effect samples.\n''')
print('Created two vector marks, favicon, and three localized native-icon compositions.')
