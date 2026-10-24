"""Smoke test: visit every route as user (client/supplier) and admin, in KO and EN, collect console errors."""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'http://127.0.0.1:8765/index.html')
USER_ROUTES = ['/u/home', '/u/quests', '/u/quests?f=done', '/u/quest/Q-2026-0412', '/u/quest/Q-2026-0412?tab=overview', '/u/quest/Q-2026-0412?tab=chat',
               '/u/quest/Q-2026-0412?tab=records', '/u/quest/Q-2026-0415?tab=bids', '/u/quest/Q-2026-0409?tab=review', '/u/quest/Q-2026-0398?tab=review',
               '/u/new?step=1', '/u/new?step=2', '/u/new?step=3', '/u/new?step=4', '/u/services', '/u/wallet', '/u/me', '/u/notifications'] + \
              [f'/u/service/{s}' for s in ['exposure', 'decompose', 'credential', 'aireview', 'certificate', 'shipping', 'records']]
SUP_ROUTES = ['/u/home', '/u/market', '/u/market/Q-2026-0431', '/u/jobs', '/u/job/Q-2026-0421', '/u/jobs?f=review', '/u/wallet', '/u/me', '/u/notifications']
ADMIN_ROUTES = ['/a/dashboard', '/a/dashboard?r=7', '/a/dashboard?r=90', '/a/reviews', '/a/review/R-1041', '/a/review/R-1039', '/a/kyb', '/a/kyb/K-3107',
                '/a/compliance', '/a/ledger', '/a/chain', '/a/members', '/a/ai']

def run():
    errs = []
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for lang in ['ko', 'en']:
            for role, routes, sess in [('client', USER_ROUTES, {'role': 'user', 'mode': 'client'}), ('supplier', SUP_ROUTES, {'role': 'user', 'mode': 'supplier'}), ('admin', ADMIN_ROUTES, {'role': 'admin'})]:
                ctx = b.new_context(viewport={'width': 412, 'height': 900}, locale='ko-KR' if lang == 'ko' else 'en-US')
                pg = ctx.new_page()
                pg.on('pageerror', lambda e, r=role: errs.append(f'[{lang}/{r}] pageerror {e}'))
                pg.on('console', lambda m, r=role: errs.append(f'[{lang}/{r}] console {m.text}') if m.type == 'error' else None)
                pg.goto(BASE + '#/login'); pg.wait_for_timeout(300)
                pg.evaluate(f"() => {{ App.state.lang='{lang}'; App.state.session={json.dumps(sess)}; App.save(); }}")
                for r in routes:
                    pg.evaluate(f"() => {{ location.hash = '{r}'; }}"); pg.wait_for_timeout(250)
                    txt = pg.evaluate("() => document.getElementById('app').innerText.length")
                    if txt < 40: errs.append(f'[{lang}/{role}] {r} rendered almost nothing ({txt} chars)')
                    ov = pg.evaluate("() => document.documentElement.scrollWidth > window.innerWidth + 1")
                    if ov: errs.append(f'[{lang}/{role}] {r} horizontal overflow {pg.evaluate("document.documentElement.scrollWidth")}')
                ctx.close()
        b.close()
    print('\n'.join(errs) if errs else 'NO ERRORS')
    return 1 if errs else 0

if __name__ == '__main__':
    sys.exit(run())
