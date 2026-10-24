"""PWA checks against the running server: installable, service worker caches everything, works offline, Enter submits login."""
import os, sys
from playwright.sync_api import sync_playwright
BASE = os.environ.get('BASE', 'http://127.0.0.1:3000/index.html')
ok = True
def check(c, m):
    global ok
    print(('PASS ' if c else 'FAIL ') + m); ok = ok and c
with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={'width': 412, 'height': 900})
    pg = ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(BASE + '#/login'); pg.wait_for_function("navigator.serviceWorker.controller !== null || true")
    pg.wait_for_function("navigator.serviceWorker.ready.then(() => true)", timeout=10000)
    pg.wait_for_timeout(1500)
    cdp = ctx.new_cdp_session(pg)
    inst = cdp.send('Page.getInstallabilityErrors')['installabilityErrors']
    check(not inst, f'installable as an app {inst if inst else ""}')
    man = cdp.send('Page.getAppManifest')
    check(not man.get('errors'), 'manifest parses without errors')
    cached = pg.evaluate("caches.open('quest-demo-v1.0.0').then(c => c.keys()).then(k => k.length)")
    check(cached >= 16, f'service worker precached {cached} files')
    pg.reload(); pg.wait_for_timeout(800)
    check(pg.evaluate("!!navigator.serviceWorker.controller"), 'page controlled by service worker')
    ctx.set_offline(True)
    pg.reload(); pg.wait_for_timeout(1000)
    check(pg.evaluate("document.querySelectorAll('#lg-email').length") == 1, 'login screen renders offline')
    pg.fill('#lg-email', 'client@quest.demo'); pg.press('#lg-pw', 'Enter'); pg.wait_for_timeout(1500)
    check(pg.evaluate("location.hash") == '#/u/home', 'Enter key signs in (offline)')
    check(pg.evaluate("document.fonts.check('16px \"Pretendard Variable\"')"), 'bundled font loaded offline')
    ctx.set_offline(False)
    check(not [e for e in errs if 'Content Security Policy' in e or 'Refused' in e], 'no CSP violations')
    b.close()
sys.exit(0 if ok else 1)
