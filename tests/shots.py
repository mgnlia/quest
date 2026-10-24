"""Capture key screens at phone size and tile them into contact sheets."""
import json, sys, os
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

BASE = os.environ.get('BASE', 'http://127.0.0.1:8765/index.html')
OUT = sys.argv[1] if len(sys.argv) > 1 else 'test-output/shots'
LANG = sys.argv[2] if len(sys.argv) > 2 else 'ko'
THEME = sys.argv[3] if len(sys.argv) > 3 else 'light'
os.makedirs(OUT, exist_ok=True)
W, H = 412, 915

SCREENS = [
  ('login', None, '/login', None),
  ('admin-login', None, '/login?role=admin', None),
  ('home', {'role':'user','mode':'client'}, '/u/home', None),
  ('quests', {'role':'user','mode':'client'}, '/u/quests', None),
  ('quest-review', {'role':'user','mode':'client'}, '/u/quest/Q-2026-0412?tab=review', None),
  ('quest-bids', {'role':'user','mode':'client'}, '/u/quest/Q-2026-0415?tab=bids', None),
  ('quest-chat', {'role':'user','mode':'client'}, '/u/quest/Q-2026-0409?tab=chat', None),
  ('quest-records', {'role':'user','mode':'client'}, '/u/quest/Q-2026-0412?tab=records', None),
  ('new-step3', {'role':'user','mode':'client'}, '/u/new?step=3', "App.ui.draft=newDraft('struct');App.ui.draft.files=[{name:'요구사항.pdf',size:'2.4 MB',ext:'pdf'},{name:'frame_v3.step',size:'18.9 MB',ext:'step'}];App.ui.draft.scanned=true;App.ui.draft.res={f1:'del',f2:'del'};App.refresh();"),
  ('svc-exposure', {'role':'user','mode':'client'}, '/u/service/exposure', None),
  ('wallet', {'role':'user','mode':'client'}, '/u/wallet', None),
  ('me', {'role':'user','mode':'client'}, '/u/me', None),
  ('sup-home', {'role':'user','mode':'supplier'}, '/u/home', None),
  ('sup-market', {'role':'user','mode':'supplier'}, '/u/market/Q-2026-0431', None),
  ('admin-dash', {'role':'admin'}, '/a/dashboard', None),
  ('admin-review', {'role':'admin'}, '/a/review/R-1039', None),
]

def main():
    files = []
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, color_scheme='dark' if THEME == 'dark' else 'light')
        pg = ctx.new_page()
        pg.goto(BASE + '#/login'); pg.wait_for_timeout(400)
        for name, sess, route, js in SCREENS:
            pg.evaluate(f"() => {{ App.reset(); App.state.lang='{LANG}'; App.state.session={json.dumps(sess)}; App.save(); App.ui={{navCount:0}}; }}")
            pg.evaluate(f"() => {{ location.hash='{route}'; App.render(); }}"); pg.wait_for_timeout(500)
            if js: pg.evaluate(f"() => {{ {js} }}"); pg.wait_for_timeout(300)
            f = f'{OUT}/{LANG}-{THEME}-{name}.png'; pg.screenshot(path=f); files.append((name, f))
        b.close()
    # contact sheets of 4
    for i in range(0, len(files), 4):
        chunk = files[i:i+4]
        ims = [Image.open(f).resize((W, H)) for _, f in chunk]
        sheet = Image.new('RGB', (W * len(ims) + 12 * (len(ims) - 1), H + 30), 'white')
        d = ImageDraw.Draw(sheet)
        for k, (im, (n, _)) in enumerate(zip(ims, chunk)):
            x = k * (W + 12); sheet.paste(im, (x, 30)); d.text((x + 6, 8), n, fill='black')
        sheet.save(f'{OUT}/sheet-{LANG}-{THEME}-{i//4}.png')
    print('ok', len(files))

main()
