"""End-to-end flow tests for the Quest demo. Drives the real UI in Chromium at phone size.
Every scenario must pass and the page must log zero console errors."""
import os, sys, time, traceback
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'http://127.0.0.1:8765/index.html')
RESULTS, ERRORS = [], []

def ev(pg, js): return pg.evaluate(f"() => {{ return {js}; }}")
def go(pg, route): pg.evaluate(f"() => {{ location.hash = '{route}'; }}"); pg.wait_for_timeout(250)
def tap(pg, sel, nth=0): pg.locator(sel).nth(nth).click(); pg.wait_for_timeout(180)
def ok_modal(pg): pg.locator('#m-ok').click(); pg.wait_for_timeout(300)
def wait_for(pg, js, timeout=8000):
    t = time.time()
    while time.time() - t < timeout / 1000:
        if ev(pg, js): return True
        pg.wait_for_timeout(120)
    raise AssertionError('timeout waiting for: ' + js)
def check(cond, msg):
    if not cond: raise AssertionError(msg)

def login_user(pg, who='client'):
    go(pg, '/login'); pg.wait_for_timeout(150)
    tap(pg, f'[data-act="pick-acct"][data-v="{who}"]')
    tap(pg, '#lg-btn'); wait_for(pg, "location.hash === '#/u/home'")
def login_admin(pg):
    go(pg, '/login?role=admin'); tap(pg, '[data-act="otp-fill"]'); tap(pg, '#ad-btn'); wait_for(pg, "location.hash === '#/a/dashboard'")
def logout(pg): pg.evaluate("() => { App.state.session = null; App.save(); location.hash = '/login'; }"); pg.wait_for_timeout(250)

def t01_login_validation(pg):
    go(pg, '/login'); pg.fill('#lg-email', 'not-an-email'); tap(pg, '#lg-btn')
    check(ev(pg, "document.querySelector('.toast') !== null"), 'invalid email shows a toast')
    check(ev(pg, "location.hash") == '#/login', 'stays on login')
    go(pg, '/login?role=admin'); tap(pg, '#ad-btn')
    check(ev(pg, "location.hash") == '#/login?role=admin', 'admin needs OTP')
    for i, d in enumerate('999999'): pg.locator('#otp input').nth(i).fill(d)
    tap(pg, '#ad-btn'); check(ev(pg, "location.hash") == '#/login?role=admin', 'wrong OTP rejected')
    login_admin(pg); check(ev(pg, "App.state.session.role") == 'admin', 'admin session'); logout(pg)
    login_user(pg, 'supplier'); check(ev(pg, "App.state.session.mode") == 'supplier', 'supplier session'); logout(pg)

def t02_pick_bid_and_escrow(pg):
    login_user(pg)
    bal0 = ev(pg, "App.state.wallet.balance")
    go(pg, '/u/quest/Q-2026-0415?tab=bids'); tap(pg, '[data-act="bid-pick"][data-p="P-1"]')
    tap(pg, '[data-act="bid-contract"]'); check(ev(pg, "!!document.querySelector('#c-agree')"), 'contract sheet still open without consent')
    pg.check('#c-agree'); tap(pg, '[data-act="bid-contract"]'); tap(pg, '[data-act="pay-go"]')
    wait_for(pg, "!!document.querySelector('#layer .success-burst')", 9000)
    q = "App.state.quests.find(q=>q.id==='Q-2026-0415')"
    check(ev(pg, q + ".status") == 'progress', 'quest moved to progress')
    check(ev(pg, q + ".escrow.status") == 'deposited', 'escrow deposited')
    check(ev(pg, "App.state.wallet.balance") == bal0 - 24500000, 'wallet debited 24.5M')
    check(ev(pg, q + ".records.length") == 3, 'contract + escrow anchored')
    tap(pg, '[data-act="layer-close-go"]'); check('Q-2026-0415' in ev(pg, "location.hash"), 'back on quest')

def t03_chat_masking(pg):
    login_user(pg); go(pg, '/u/quest/Q-2026-0409?tab=chat')
    n0 = ev(pg, "App.state.quests.find(q=>q.id==='Q-2026-0409').chat.length")
    pg.fill('#chat-in', '저희 (주)가온로보틱스 담당자 연락처는 010-2917-4432, dy.kim@gaon.co.kr 입니다. 일정 확인 부탁드립니다')
    tap(pg, '.composer button')
    last = "App.state.quests.find(q=>q.id==='Q-2026-0409').chat"
    check(ev(pg, last + ".slice(-1)[0].masked") == 3, 'company, phone and email masked')
    check(ev(pg, "document.querySelectorAll('.msg.me mark').length") >= 3, 'masked marks rendered')
    wait_for(pg, last + f".length === {n0 + 2}", 5000)
    check(ev(pg, last + ".slice(-1)[0].from") == 'them', 'supplier replied')

def t04_objection_then_admin_decides(pg):
    login_user(pg); go(pg, '/u/quest/Q-2026-0412?tab=review'); tap(pg, '[data-act="obj-open"]')
    tap(pg, '[data-act="obj-submit"]'); check(ev(pg, "!!document.querySelector('#obj-t')"), 'needs a criterion')
    pg.locator('input[name="obj-c"]').nth(0).check(); pg.fill('#obj-t', '하중 조건 3의 경계조건이 명세와 다르게 적용되었습니다.')
    tap(pg, '[data-act="obj-attach"]'); tap(pg, '[data-act="obj-submit"]')
    wait_for(pg, "App.state.quests.find(q=>q.id==='Q-2026-0412').status === 'dispute'")
    rid = ev(pg, "App.state.quests.find(q=>q.id==='Q-2026-0412').reviewId")
    check(ev(pg, f"App.state.admin.reviews.some(r=>r.id==='{rid}' && r.status==='open')"), 'review lands in admin queue')
    logout(pg); login_admin(pg); go(pg, '/a/reviews')
    check(ev(pg, f"document.body.innerText.includes('{rid}')"), 'admin list shows new review')
    go(pg, f'/a/review/{rid}'); tap(pg, '[data-act="rv-rerun"]'); wait_for(pg, "App.ui.rerun && App.ui.rerun.running === false", 4000)
    tap(pg, '[data-act="rv-decide"]'); check(ev(pg, "!!document.querySelector('#rv-memo')"), 'memo required')
    pg.fill('#rv-memo', '경계조건은 명세 범위 안에서 적용되었고 안전계수 기준을 충족함')
    tap(pg, '[data-act="rv-decide"]'); ok_modal(pg)
    wait_for(pg, f"App.state.admin.reviews.find(r=>r.id==='{rid}').status === 'resolved'")
    logout(pg); login_user(pg)
    check(ev(pg, "App.state.quests.find(q=>q.id==='Q-2026-0412').status") == 'done', 'user sees quest accepted after admin decision')
    check(ev(pg, "App.state.notifs.some(n=>n.aud==='client' && n.t.ko.includes('재검수 결과'))"), 'user notified of the decision')

def t05_accept_and_release(pg):
    login_user(pg); pg.evaluate("() => { const q=App.state.quests.find(q=>q.id==='Q-2026-0412'); q.status='review'; App.save(); }")
    go(pg, '/u/quest/Q-2026-0412?tab=review'); tap(pg, '[data-act="accept"]'); ok_modal(pg)
    check(ev(pg, "App.state.quests.find(q=>q.id==='Q-2026-0412').status") == 'done', 'accepted')
    check(ev(pg, "App.state.admin.payouts.some(p=>p.quest==='Q-2026-0412' && p.status==='ready')"), 'payout queued for admin')
    check(ev(pg, "App.state.wallet.invoices.find(i=>i.q==='Q-2026-0412').st.ko") == '발행 완료', 'invoice issued')

def t06_create_quest_wizard(pg):
    login_user(pg); go(pg, '/u/new?step=1'); tap(pg, '[data-act="nq-cat"][data-v="thermal"]')
    check(ev(pg, "App.ui.draft.cat") == 'thermal', 'category chosen')
    tap(pg, '.cta-bar .btn-primary'); wait_for(pg, "location.hash.includes('step=2')")
    pg.fill('#nq-title', '배터리 모듈 냉각판 열 해석'); tap(pg, '[data-act="nq-days"][data-v="30"]')
    pg.locator('input[type=range]').evaluate("(el) => { el.value = 21000000; el.dispatchEvent(new Event('input', {bubbles:true})); }")
    check(ev(pg, "App.ui.draft.budget") == 21000000, 'budget slider works')
    tap(pg, '[data-act="nq-next2"]'); wait_for(pg, "location.hash.includes('step=3')")
    check(ev(pg, "document.querySelector('[data-act=nq-scan]').disabled"), 'scan disabled without files')
    tap(pg, '[data-act="nq-sample"]'); tap(pg, '[data-act="nq-scan"]'); wait_for(pg, "App.ui.draft.scanned === true", 6000)
    check(ev(pg, "draftScore(App.ui.draft)") == 78, 'initial exposure score 78')
    tap(pg, '[data-act="nq-guess"]'); wait_for(pg, "App.ui.draft.guess !== null", 4000)
    check(ev(pg, "App.ui.draft.guess.ok") is False, 'AI guess succeeds before fixing')
    tap(pg, '[data-act="nq-autofix"]'); check(ev(pg, "draftScore(App.ui.draft)") <= 30, 'autofix brings score <= 30')
    tap(pg, '[data-act="nq-guess"]'); wait_for(pg, "App.ui.draft.guess !== null", 4000)
    check(ev(pg, "App.ui.draft.guess.ok") is True, 'AI guess fails after fixing')
    tap(pg, '[data-act="nq-next3"]'); wait_for(pg, "location.hash.includes('step=4')")
    tap(pg, '[data-act="nq-post"]'); check(ev(pg, "location.hash").endswith('step=4'), 'declaration required')
    pg.check('#nq-declare'); tap(pg, '[data-act="nq-post"]'); wait_for(pg, "location.hash.includes('step=5')", 4000)
    qid = ev(pg, "App.ui.posted")
    check(ev(pg, f"App.state.quests.find(q=>q.id==='{qid}').status") == 'open', 'posted quest is open')
    check(ev(pg, f"App.state.quests.find(q=>q.id==='{qid}').budget") == 21000000, 'budget kept')
    wait_for(pg, f"App.state.quests.find(q=>q.id==='{qid}').proposals.length >= 1", 10000)
    check(ev(pg, "document.querySelector('.toast') !== null"), 'new bid toast shown')

def t07_supplier_bid_and_delivery(pg):
    login_user(pg, 'supplier'); go(pg, '/u/market/Q-2026-0431'); tap(pg, '[data-act="bid-open"]')
    pg.fill('#bid-msg', '복합재 드론 암 해석을 6건 수행했습니다. 연락은 010-1111-2222로 주세요.')
    pg.locator('#bid-msg').dispatch_event('input')
    check(ev(pg, "document.querySelector('#bid-mask').innerText.length") > 0, 'mask warning shown before sending')
    tap(pg, '[data-act="bid-send"]'); wait_for(pg, "App.state.supplier.proposals.some(p=>p.quest==='Q-2026-0431')")
    go(pg, '/u/job/Q-2026-0421'); check(ev(pg, "document.querySelector('[data-act=job-submit]').disabled"), 'submit disabled before self-check')
    tap(pg, '[data-act="job-add"]'); tap(pg, '[data-act="job-check"]'); wait_for(pg, "App.ui.selfcheck && App.ui.selfcheck.done", 4000)
    check(ev(pg, "App.ui.selfcheck.res.filter(Boolean).length") == 2, 'self-check finds one gap')
    tap(pg, '[data-act="job-fix"]'); tap(pg, '[data-act="job-check"]'); wait_for(pg, "App.ui.selfcheck && App.ui.selfcheck.done", 4000)
    check(ev(pg, "App.ui.selfcheck.res.every(Boolean)"), 'self-check passes after fix')
    tap(pg, '[data-act="job-submit"]'); ok_modal(pg)
    check(ev(pg, "App.state.supplier.jobs.find(j=>j.id==='Q-2026-0421').status") == 'review', 'job in review')

def t08_credential_request_approved_by_admin(pg):
    login_user(pg, 'supplier'); tap(pg, '[data-act="tok-add"]')
    pg.locator('input[name="tok"][value="iso17025"]').check(); tap(pg, '[data-act="tok-file"]'); tap(pg, '[data-act="tok-send"]')
    wait_for(pg, "App.state.supplier.pendingTokens.includes('iso17025')")
    kid = ev(pg, "App.state.admin.kyb.find(k=>k.fromSupplier).id")
    logout(pg); login_admin(pg); go(pg, f'/a/kyb/{kid}')
    check(ev(pg, "document.querySelector('[data-act=kyb-approve]').disabled"), 'approve locked until checks done')
    tap(pg, '[data-act="kyb-run"][data-c="cert"]'); wait_for(pg, f"App.state.admin.kyb.find(k=>k.id==='{kid}').checks.cert === 'ok'", 4000)
    tap(pg, '[data-act="kyb-approve"]'); wait_for(pg, f"App.state.admin.kyb.find(k=>k.id==='{kid}').status === 'approved'", 4000)
    logout(pg); login_user(pg, 'supplier')
    check(ev(pg, "App.state.supplier.tokens.includes('iso17025')"), 'supplier received the token')
    check(ev(pg, "document.body.innerText.includes('17025')"), 'token visible on supplier home')

def t09_admin_operations(pg):
    login_admin(pg)
    go(pg, '/a/dashboard?r=7'); check(ev(pg, "document.querySelectorAll('.kpi').length") == 5, '5 KPIs')
    check(ev(pg, "document.querySelectorAll('#ch-gmv polyline').length") == 2, 'GMV line has 2 series')
    f0 = ev(pg, "document.querySelectorAll('#feed .feed-item').length"); pg.wait_for_timeout(3900)
    check(ev(pg, "document.querySelectorAll('#feed .feed-item').length") >= min(8, f0 + 1), 'live feed ticks')
    go(pg, '/a/compliance'); tap(pg, '[data-act="al-open"][data-id="C-551"]'); tap(pg, '[data-act="al-do"]')
    wait_for(pg, "App.state.admin.alerts.find(a=>a.id==='C-551').status === 'done'")
    go(pg, '/a/ledger'); tap(pg, '[data-act="po-pay"][data-id="P-8815"]'); ok_modal(pg)
    check(ev(pg, "App.state.admin.payouts.find(p=>p.id==='P-8815').status") == 'paid', 'payout executed')
    go(pg, '/a/chain'); p0 = ev(pg, "App.state.admin.batches.length"); tap(pg, '[data-act="anchor"]'); wait_for(pg, f"App.state.admin.batches.length === {p0 + 1}", 4000)
    check(ev(pg, "App.state.admin.pendingAnchors") == 0, 'queue drained')
    tap(pg, '[data-act="cv-go"]'); wait_for(pg, "App.ui.chainVerify !== null && App.ui.chainVerify !== undefined", 3000)
    check(ev(pg, "App.ui.chainVerify.ok") is True, 'valid hash verifies')
    tap(pg, '[data-act="cv-bad"]'); tap(pg, '[data-act="cv-go"]'); wait_for(pg, "App.ui.chainVerify", 3000)
    check(ev(pg, "App.ui.chainVerify.ok") is False, 'tampered hash rejected')
    go(pg, '/a/members'); tap(pg, '[data-act="mem-open"]'); tap(pg, '[data-act="mem-reveal"]')
    check(ev(pg, "!!document.querySelector('#rv-why')"), 'reason required to reveal')
    pg.select_option('#rv-why', index=1); tap(pg, '[data-act="mem-reveal"]')
    check(ev(pg, "Object.keys(App.ui.revealed||{}).length") == 1, 'name revealed')
    check(ev(pg, "App.state.admin.audit.some(a=>a.t.ko.includes('실명 열람'))"), 'reveal written to audit log')
    go(pg, '/a/ai'); pg.locator('[data-in="ai-slider"][data-k="agreeMin"]').evaluate("(el) => { el.value = 95; el.dispatchEvent(new Event('input', {bubbles:true})); }")
    tap(pg, '[data-act="ai-save"]'); wait_for(pg, "App.state.admin.audit.some(a=>a.t.ko.includes('일치율 95%'))", 3000)
    pg.set_viewport_size({'width': 412, 'height': 900}); go(pg, '/a/reviews'); tap(pg, '[data-act="drawer"]')
    check(ev(pg, "document.querySelector('.a-side').classList.contains('open')"), 'mobile drawer opens')
    check(ev(pg, "window.__questBack()") is True and not ev(pg, "document.querySelector('.a-side').classList.contains('open')"), 'back closes drawer')

def t10_services(pg):
    login_user(pg)
    go(pg, '/u/service/exposure'); s0 = int(ev(pg, "document.querySelector('#ex-score').innerText"))
    tap(pg, '[data-act="expo-fix"]'); s1 = int(ev(pg, "document.querySelector('#ex-score').innerText"))
    check(s0 > 60 and s1 < 10, f'exposure demo {s0} -> {s1}')
    go(pg, '/u/service/decompose'); tap(pg, '[data-act="dec-run"]'); wait_for(pg, "!!document.querySelector('[data-act=dec-create]')", 6000)
    n0 = ev(pg, "App.state.quests.length"); tap(pg, '[data-act="dec-create"]'); wait_for(pg, f"App.state.quests.length === {n0 + 6}", 4000)
    check(ev(pg, "location.hash").endswith('f=draft'), 'lands on drafts filter')
    go(pg, '/u/service/aireview'); tap(pg, '[data-act="air-run"]'); wait_for(pg, "!!document.querySelector('#svc-demo .verdict')", 6000)
    go(pg, '/u/service/certificate?q=Q-2026-0409'); tap(pg, '[data-act="cert-issue"]'); wait_for(pg, "App.ui.certIssued && App.ui.certIssued['Q-2026-0409']", 3000)
    go(pg, '/u/service/shipping'); tap(pg, '[data-act="ship-next"]'); check(ev(pg, "App.ui.shipStage") == 2, 'shipping advances')
    go(pg, '/u/service/records'); tap(pg, '[data-act="rec-check"]', 2); wait_for(pg, "App.ui.recCheck", 3000)
    check(ev(pg, "App.ui.recCheck.ok") is False, 'edited file fails verification')
    go(pg, '/u/quest/Q-2026-0409?tab=records'); tap(pg, '[data-act="rec-verify"]'); wait_for(pg, "Object.keys(App.ui.verified||{}).length === 1", 3000)

def t11_language_theme_mode_back(pg):
    login_user(pg); go(pg, '/u/me')
    tap(pg, '[data-act="lang"][data-v="en"]'); check(ev(pg, "document.body.innerText.includes('Settings')"), 'English UI')
    check(ev(pg, "document.documentElement.lang") == 'en', 'html lang en')
    tap(pg, '[data-act="theme"][data-v="dark"]'); check(ev(pg, "document.documentElement.getAttribute('data-theme')") == 'dark', 'dark theme applied')
    tap(pg, '[data-act="mode"][data-v="supplier"]'); wait_for(pg, "location.hash === '#/u/home'")
    check(ev(pg, "document.getElementById('app').className") == 'mode-supplier', 'supplier accent applied')
    check(ev(pg, "document.body.innerText.includes('Upcoming payout')"), 'supplier home in English')
    go(pg, '/u/job/Q-2026-0402'); check(ev(pg, "window.__questBack()") is True, 'back handled on nested page')
    go(pg, '/u/home'); check(ev(pg, "window.__questBack()") is False, 'back on home exits app')
    tap(pg, '[data-go="/u/notifications"]'); tap(pg, '[data-act="n-all"]')
    check(ev(pg, "App.state.notifs.filter(n=>n.aud==='supplier'&&!n.read).length") == 0, 'mark all read')

def t12_persistence_and_reset(pg):
    login_user(pg); pg.evaluate("() => { App.state.wallet.balance = 123; App.save(); }")
    pg.reload(); pg.wait_for_timeout(500)
    check(ev(pg, "App.state.wallet.balance") == 123, 'state persists across reload')
    go(pg, '/u/me'); tap(pg, '[data-act="reset"]'); ok_modal(pg)
    check(ev(pg, "App.state.wallet.balance") == 31500000, 'reset restores seed')
    check(ev(pg, "App.state.session && App.state.session.role") == 'user', 'reset keeps you signed in')

TESTS = [t01_login_validation, t02_pick_bid_and_escrow, t03_chat_masking, t04_objection_then_admin_decides, t05_accept_and_release, t06_create_quest_wizard,
         t07_supplier_bid_and_delivery, t08_credential_request_approved_by_admin, t09_admin_operations, t10_services, t11_language_theme_mode_back, t12_persistence_and_reset]

def main():
    os.makedirs('test-output', exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for lang in ['ko', 'en']:
            for t in TESTS:
                ctx = b.new_context(viewport={'width': 412, 'height': 900} if t is not t09_admin_operations else {'width': 1280, 'height': 900}, locale='ko-KR' if lang == 'ko' else 'en-US', has_touch=False)
                pg = ctx.new_page(); errs = []
                pg.on('pageerror', lambda e: errs.append(str(e)))
                pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
                pg.goto(BASE + '#/login'); pg.wait_for_timeout(300)
                pg.evaluate(f"() => {{ localStorage.clear(); App.reset(); App.state.lang='{lang}'; App.state.session=null; App.save(); }}"); pg.reload(); pg.wait_for_timeout(300)
                name = f'{lang}:{t.__name__}'
                try:
                    t(pg)
                    if errs: raise AssertionError('console errors: ' + ' | '.join(errs[:3]))
                    RESULTS.append((name, 'PASS', ''))
                except Exception as e:
                    RESULTS.append((name, 'FAIL', str(e).splitlines()[0][:200])); pg.screenshot(path=f'test-output/fail-{lang}-{t.__name__}.png')
                ctx.close()
        b.close()
    for n, s, m in RESULTS: print(f'{s}  {n}  {m}')
    fails = sum(1 for r in RESULTS if r[1] == 'FAIL')
    print(f'\n{len(RESULTS) - fails}/{len(RESULTS)} passed')
    return 1 if fails else 0

if __name__ == '__main__':
    sys.exit(main())
