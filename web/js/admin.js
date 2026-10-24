/* Quest demo — admin console */
'use strict';
const A = {};
function adm(){ return App.state.admin; }
function audit(ko, en){ adm().audit.unshift({ ts:Date.now(), t:{ ko, en } }); }
function toggleDrawer(open){
  App.ui.drawer = open;
  const s = $('.a-side'), sc = $('.a-scrim');
  if (s) s.classList.toggle('open', !!open); if (sc) sc.classList.toggle('show', !!open);
}
ACT['drawer'] = () => toggleDrawer(!App.ui.drawer);
ACT['drawer-close'] = () => toggleDrawer(false);

function AdminLayout(out, path){
  const S = adm();
  const cnt = {
    reviews: S.reviews.filter(r => r.status === 'open').length,
    kyb: S.kyb.filter(k => k.status === 'pending').length,
    alerts: S.alerts.filter(a => a.status === 'open').length,
    payouts: S.payouts.filter(p => p.status === 'ready').length
  };
  const N = (p, icn, label, c, soft) => `<a href="#${p}" data-go="${p}" class="${path === p || path.startsWith(p + '/') || (p === '/a/reviews' && path.startsWith('/a/review/')) ? 'on' : ''}">${ic(icn)}<span>${label}</span>${c ? `<span class="cnt ${soft ? 'soft' : ''}">${c}</span>` : ''}</a>`;
  App.ui.drawer = false;
  return `<div class="admin">
    <aside class="a-side" aria-label="${tt('관리자 메뉴', 'Admin menu')}">
      <div class="a-brand">${LOGO}<div>Quest Ops<small>${tt('운영 콘솔 · 데모', 'Operations · demo')}</small></div></div>
      <nav class="a-nav">
        <div class="grp">${tt('개요', 'Overview')}</div>
        ${N('/a/dashboard', 'chart', tt('대시보드', 'Dashboard'))}
        <div class="grp">${tt('운영', 'Operations')}</div>
        ${N('/a/reviews', 'gavel', tt('검수·분쟁', 'Reviews & disputes'), cnt.reviews)}
        ${N('/a/kyb', 'badge', tt('사업자·자격 심사', 'Business verification'), cnt.kyb)}
        ${N('/a/compliance', 'flag', tt('컴플라이언스', 'Compliance'), cnt.alerts)}
        <div class="grp">${tt('자금·기록', 'Money & records')}</div>
        ${N('/a/ledger', 'money', tt('예치·정산', 'Escrow & payouts'), cnt.payouts, true)}
        ${N('/a/chain', 'chain', tt('블록체인 기록', 'On-chain records'), S.pendingAnchors, true)}
        <div class="grp">${tt('관리', 'Admin')}</div>
        ${N('/a/members', 'users', tt('회원', 'Members'))}
        ${N('/a/ai', 'cpu', tt('AI 판정 설정', 'AI review settings'))}
      </nav>
      <div class="a-me">${veil('ops-lead', 's')}<div style="flex:1;min-width:0"><div class="t">ops.lead</div><div class="s">${tt('운영 리드', 'Ops lead')}</div></div><button class="icon-btn" style="color:var(--admin-side-ink)" data-act="a-logout" aria-label="${tt('로그아웃', 'Sign out')}">${ic('logout')}</button></div>
    </aside>
    <div class="a-scrim" data-act="drawer-close"></div>
    <div class="a-main">
      <header class="a-top"><button class="icon-btn a-menu-btn" data-act="drawer" aria-label="${tt('메뉴', 'Menu')}">${ic('menu')}</button><div class="title"><b>${out.title || ''}</b>${out.sub ? `<span>${out.sub}</span>` : ''}</div>${langSeg()}</header>
      <main class="a-content">${out.html}</main>
    </div>
  </div>`;
}
ACT['a-logout'] = async () => { const ok = await confirmBox({ title: tt('콘솔에서 로그아웃할까요?', 'Sign out of the console?'), ok: tt('로그아웃', 'Sign out') }); if (!ok) return; audit('콘솔 로그아웃', 'Console sign-out'); App.state.session = null; App.save(); App.go('/login?role=admin', true); };

/* ---------- dashboard ---------- */
function metrics(range){
  const r = rng('metrics' + range);
  const n = range === 90 ? 13 : range;
  const base = range === 90 ? 95 : 14;
  const cur = [], prev = [];
  for (let i = 0; i < n; i++){ const trend = 1 + i / n * .35; cur.push(Math.round(base * trend * (0.75 + r() * .5))); prev.push(Math.round(base * .82 * (0.75 + r() * .5))); }
  const labels = [];
  for (let i = n - 1; i >= 0; i--){ const d = new Date(NOW - i * (range === 90 ? 7 : 1) * DAY); labels.push(isKo() ? `${d.getMonth() + 1}/${d.getDate()}` : d.toLocaleDateString('en-US', { month:'numeric', day:'numeric' })); }
  const gmv = cur.reduce((a, b) => a + b, 0) * 1e6, pgmv = prev.reduce((a, b) => a + b, 0) * 1e6;
  return { labels, cur, prev, gmv, pgmv, net: gmv * .157, pnet: pgmv * .151, active: 38 + Math.round(r() * 8), dispute: +(1.4 + r() * .9).toFixed(1), agree: +(92.5 + r() * 3).toFixed(1),
    cats:[['struct', .31], ['thermal', .18], ['embedded', .24], ['data', .09], ['machining', .18]].map(c => [c[0], Math.round(gmv * c[1] / 1e6)]) };
}
function delta(a, b, invert){ const d = (a - b) / b * 100; const up = d >= 0; const good = invert ? !up : up; return `<span class="d ${Math.abs(d) < .5 ? 'flat' : good ? 'up' : 'down'}">${ic(up ? 'up' : 'dn')}${Math.abs(d).toFixed(1)}%</span>`; }
route('/a/dashboard', (p, qs) => {
  const range = +(qs.r || 30), M = metrics(range), S = adm();
  const att = [
    ['/a/reviews', 'gavel', 'warn', tt('검수·분쟁 대기', 'Reviews waiting'), S.reviews.filter(r => r.status === 'open').length, tt('하도급법 10일 기한', '10-day legal deadline')],
    ['/a/kyb', 'badge', 'info', tt('사업자·자격 심사', 'Verifications'), S.kyb.filter(k => k.status === 'pending').length, tt('평균 처리 1.6일', 'Avg. 1.6 days')],
    ['/a/compliance', 'flag', 'bad', tt('컴플라이언스 경보', 'Compliance alerts'), S.alerts.filter(a => a.status === 'open').length, tt('고위험 2건', '2 high severity')],
    ['/a/ledger', 'money', 'good', tt('지급 대기', 'Payouts ready'), S.payouts.filter(x => x.status === 'ready').length, won(S.payouts.filter(x => x.status === 'ready').reduce((a, x) => a + x.amt, 0))]
  ];
  return {
    title: tt('대시보드', 'Dashboard'), sub: tt(`최근 ${range}일 · 실시간 갱신`, `Last ${range} days · live`),
    html: `
      <div class="hstack between wrap" style="gap:10px"><div class="range" role="group">${[7, 30, 90].map(r => `<button class="${range === r ? 'on' : ''}" data-go="/a/dashboard?r=${r}">${tt(`${r}일`, `${r}d`)}</button>`).join('')}</div><span class="env"><span class="pulse-dot"></span>${tt('데모 운영 환경', 'Demo environment')}</span></div>
      <div class="kpis mt12">
        <div class="kpi"><div class="l">${tt('거래액 (GMV)', 'GMV')}</div><div class="v">${won(M.gmv)}</div>${delta(M.gmv, M.pgmv)}</div>
        <div class="kpi"><div class="l">${tt('순매출 (차액+구독)', 'Net revenue')}</div><div class="v">${won(M.net)}</div>${delta(M.net, M.pnet)}</div>
        <div class="kpi"><div class="l">${tt('활성 퀘스트', 'Active quests')}</div><div class="v">${M.active}</div>${delta(M.active, M.active - 4)}</div>
        <div class="kpi"><div class="l">${tt('분쟁률', 'Dispute rate')}</div><div class="v">${M.dispute}%</div>${delta(M.dispute, 2.3, true)}</div>
        <div class="kpi"><div class="l">${tt('AI-인간 판정 일치', 'AI–human agreement')}</div><div class="v">${M.agree}%</div>${delta(M.agree, 91.2)}</div>
      </div>
      <div class="a-grid two">
        <div class="panel"><div class="panel-h"><h2 class="h4">${tt('거래액 추이', 'GMV trend')}</h2><span class="caption">${tt('단위: 만 원', 'KRW millions')}</span></div><div class="chart" id="ch-gmv"></div></div>
        <div class="panel"><div class="panel-h"><h2 class="h4">${tt('확인이 필요한 일', 'Needs attention')}</h2></div>
          <div class="stack">${att.map(a => `<button class="hstack" style="width:100%;text-align:left;gap:12px" data-go="${a[0]}"><span class="ico-box ${a[2]}">${ic(a[1])}</span><div style="flex:1;min-width:0"><div style="font-weight:650;font-size:14px">${a[3]}</div><div class="caption">${a[5]}</div></div><b class="tnum" style="font-size:20px">${a[4]}</b>${ic('chev', 'chev')}</button>`).join('')}</div></div>
      </div>
      <div class="a-grid half">
        <div class="panel"><div class="panel-h"><h2 class="h4">${tt('유형별 거래액', 'GMV by work type')}</h2></div><div class="chart" id="ch-cat"></div></div>
        <div class="panel"><div class="panel-h"><h2 class="h4">${tt('퀘스트 전환 단계', 'Quest funnel')}</h2><span class="caption">${tt(`최근 ${range}일`, `Last ${range}d`)}</span></div>
          <div class="funnel">${[[tt('게시', 'Posted'), 142], [tt('제안 받음', 'Got bids'), 121], [tt('계약', 'Contracted'), 68], [tt('납품', 'Delivered'), 51], [tt('검수 확정', 'Accepted'), 47]].map((f, i, arr) => `<div class="fr"><span class="lb">${f[0]}</span><div><div class="b" style="width:${f[1] / arr[0][1] * 100}%;opacity:${1 - i * .12}"></div></div><span class="n">${Math.round(f[1] * range / 30)}</span></div>`).join('')}</div>
          <div class="caption mt12">${tt('게시→계약 전환 47.9% · 납품→확정 92.2%', 'Posted→contract 47.9% · delivered→accepted 92.2%')}</div></div>
      </div>
      <div class="a-grid two">
        <div class="panel"><div class="panel-h"><h2 class="h4"><span class="pulse-dot"></span>${tt('실시간 활동', 'Live activity')}</h2><button class="link-btn" data-act="feed-pause">${App.ui.feedPaused ? tt('재개', 'Resume') : tt('일시정지', 'Pause')}</button></div><div id="feed">${(App.ui.feed || seedFeed()).map(feedItem).join('')}</div></div>
        <div class="panel"><div class="panel-h"><h2 class="h4">${tt('AI 판정 품질', 'AI review quality')}</h2></div>
          <dl class="kv"><dt>${tt('모델 간 일치율', 'Model agreement')}</dt><dd>96.1%</dd><dt>${tt('위치 스왑 후 동일 판정', 'Same after order swap')}</dt><dd>98.4%</dd><dt>${tt('인간 재검수로 뒤집힌 비율', 'Overturned by humans')}</dt><dd>5.9%</dd><dt>${tt('이의 제기율', 'Objection rate')}</dt><dd>11.3%</dd><dt>${tt('건당 AI 비용', 'AI cost per deal')}</dt><dd>${won(39200)}</dd></dl>
          <div class="caption mt12">${tt('경보 기준: 이의율 25% 초과, 뒤집힘 20% 초과, 불일치 15% 초과', 'Alert thresholds: objections >25%, overturned >20%, disagreement >15%')}</div></div>
      </div>`,
    mount(){
      lineChart($('#ch-gmv'), { labels: M.labels, series:[{ name: tt('이번 기간', 'This period'), values: M.cur, color:'var(--s1)' }, { name: tt('이전 기간', 'Previous'), values: M.prev, color:'var(--muted)', dash:true }], fmt: v => shortWon(v * 1e6), tick: v => isKo() ? shortWon(v * 1e6).replace('만', '') : v, h: 240, label: tt('거래액 추이', 'GMV trend') });
      barChart($('#ch-cat'), { labels: M.cats.map(c => catLabel(c[0]).replace(/ .*/, '').replace(/·.*/, '')), values: M.cats.map(c => c[1] * 1e6), color:'var(--s1)', fmt: v => shortWon(v), tick: v => shortWon(v), pl: 54, showVals:true, h: 230, label: tt('유형별 거래액', 'GMV by type') });
      App.every(3600, () => { if (!App.ui.feedPaused) pushFeed(); });
    }
  };
});
const FEED_T = [
  ['plus', 'accent', () => ({ ko:`새 퀘스트 게시 · ${pick(['구조 해석', '임베디드 SW', '열·유동 해석', '정밀가공'])} · ${won(pick([7, 12, 15, 22, 28]) * 1e6)}`, en:`New quest posted · ${pick(['Structural', 'Embedded', 'Thermal', 'Machining'])} · ₩${pick([7, 12, 15, 22, 28])}M` })],
  ['users', 'info', () => { const a = randAlias(); return { ko:`수행사 ${a} 제안 제출`, en:`Supplier ${a} placed a bid` }; }],
  ['eyeoff', 'violet', () => { const s = 50 + Math.floor(Math.random() * 30), e = 12 + Math.floor(Math.random() * 15); return { ko:`노출 점검 완료 · ${s} → ${e}`, en:`Exposure check done · ${s} → ${e}` }; }],
  ['spark', 'good', () => ({ ko:'AI 예비 판정 통과 (2/2 모델 일치)', en:'AI pre-check passed (2/2 models agree)' })],
  ['money', 'good', () => ({ ko:`가상계좌 입금 확인 ${won(pick([9.5, 14, 19, 24.5]) * 1e6)}`, en:`Escrow deposit confirmed ₩${pick([9.5, 14, 19, 24.5])}M` })],
  ['chain', 'violet', () => ({ ko:`해시 ${30 + Math.floor(Math.random() * 20)}건 대기열 추가`, en:`${30 + Math.floor(Math.random() * 20)} hashes queued for anchoring` })],
  ['shield', 'warn', () => ({ ko:'채팅에서 식별 정보 2건 가림', en:'2 identifiers masked in chat' })]
];
function pick(a){ return a[Math.floor(Math.random() * a.length)]; }
function randAlias(){ const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ', d = '0123456789'; return pick(c.split('')) + pick(d.split('')) + pick(c.split('')) + pick(d.split('')); }
function seedFeed(){ const r = rng('feed'); const out = []; for (let i = 0; i < 6; i++){ const t = FEED_T[Math.floor(r() * FEED_T.length)]; out.push({ icon:t[0], tone:t[1], t:t[2](), ts:Date.now() - (i + 1) * 97000 }); } App.ui.feed = out; return out; }
function feedItem(f){ return `<div class="feed-item"><span class="ico-box ${f.tone}">${ic(f.icon)}</span><div style="flex:1;min-width:0"><div>${esc(L(f.t))}</div><div class="tm">${ago(f.ts)}</div></div></div>`; }
function pushFeed(){ const t = pick(FEED_T); const f = { icon:t[0], tone:t[1], t:t[2](), ts:Date.now() }; App.ui.feed = [f].concat(App.ui.feed || []).slice(0, 8); const box = $('#feed'); if (!box) return; box.insertAdjacentHTML('afterbegin', feedItem(f)); while (box.children.length > 8) box.lastElementChild.remove(); }
ACT['feed-pause'] = el => { App.ui.feedPaused = !App.ui.feedPaused; el.textContent = App.ui.feedPaused ? tt('재개', 'Resume') : tt('일시정지', 'Pause'); };

/* ---------- reviews ---------- */
function slaCls(ts){ const d = (ts - Date.now()) / DAY; return d < 2 ? 'hot' : d < 5 ? 'mid' : 'cool'; }
route('/a/reviews', (p, qs) => {
  const f = qs.f || 'open', R = adm().reviews.filter(r => f === 'open' ? r.status !== 'resolved' : r.status === 'resolved');
  return { title: tt('검수·분쟁', 'Reviews & disputes'), sub: tt('AI 예비 판정에 대한 이의와 모델 불일치', 'Objections and model disagreements'),
    html: `<div class="range">${[['open', tt('처리 대기', 'Open')], ['resolved', tt('처리 완료', 'Resolved')]].map(x => `<button class="${f === x[0] ? 'on' : ''}" data-go="/a/reviews?f=${x[0]}">${x[1]}</button>`).join('')}</div>
      <div class="a-list mt12">${R.map(r => `<button class="a-item sev-${r.status === 'resolved' ? 'ok' : slaCls(r.due) === 'hot' ? 'high' : slaCls(r.due) === 'mid' ? 'mid' : 'low'}" data-go="/a/review/${r.id}">
        <span class="ico-box ${r.kind === 'disagree' ? 'violet' : 'warn'}">${ic(r.kind === 'disagree' ? 'cpu' : 'gavel')}</span>
        <div class="grow"><div class="t">${esc(L(r.title))}</div><div class="s">${r.id} · ${r.quest} · ${won(r.amount)} · ${r.kind === 'disagree' ? tt('모델 불일치', 'Model disagreement') : r.by === 'client' ? tt('발주사 이의', 'Client objection') : tt('수행사 이의', 'Supplier objection')}${r.fromDemo ? ` · <b style="color:var(--accent-ink)">${tt('방금 앱에서 접수', 'just filed in the app')}</b>` : ''}</div></div>
        ${r.status === 'resolved' ? `<span class="pill st-done">${tt('완료', 'Done')}</span>` : `<span class="sla ${slaCls(r.due)}">${dday(r.due)}</span>`}</button>`).join('') || `<div class="panel">${emptyState('check', tt('대기 중인 건이 없습니다', 'Nothing waiting'))}</div>`}</div>` };
});
route('/a/review/:id', p => {
  const r = adm().reviews.find(x => x.id === p.id); if (!r) return App.go('/a/reviews', true);
  const rr = App.ui.rerun && App.ui.rerun.id === r.id ? App.ui.rerun : null;
  return { title: `${r.id} · ${r.quest}`, sub: L(r.title),
    html: `<button class="back-link" data-go="/a/reviews">${ic('back')}${tt('목록', 'Back to list')}</button>
      <div class="a-grid two" style="margin-top:0">
        <div>
          <div class="panel"><div class="hstack between wrap"><div class="hstack">${r.status === 'resolved' ? `<span class="pill st-done">${tt('처리 완료', 'Resolved')}</span>` : `<span class="pill st-review">${tt('처리 대기', 'Open')}</span>`}<span class="sla ${slaCls(r.due)}">${tt('기한', 'Due')} ${dday(r.due)}</span></div><span class="caption">${tt('하도급법 검사 결과 통지 10일', '10-day statutory notice')}</span></div>
            <div class="h3 mt12">${esc(L(r.title))}</div>
            <div class="grid2 mt12"><div class="hstack">${veil(r.cli, 's')}<div><div class="caption">${tt('발주사', 'Client')}</div><b>${r.cli}</b></div></div><div class="hstack">${veil(r.sup, 's')}<div><div class="caption">${tt('수행사', 'Supplier')}</div><b>${r.sup}</b></div></div></div>
            <div class="msg mt12" style="max-width:none;background:var(--surface-2);border-radius:12px">${esc(L(r.reason))}</div>
          </div>
          <div class="panel mt12"><div class="panel-h"><h2 class="h4">${tt('기준별 AI 판정', 'AI verdict per criterion')}</h2><span class="caption">Claude · OpenAI</span></div>
            ${r.crit.map(c => `<div class="crit" style="padding-left:0;padding-right:0;${c.a !== c.b ? 'background:color-mix(in srgb,var(--warn-soft) 60%,transparent);border-radius:10px;padding:12px' : ''}"><span style="font-weight:600">${esc(L(c.t))}</span><span class="${c.a ? 'ok-ic' : 'no-ic'}">${ic(c.a ? 'check' : 'x')}</span><span class="${c.b ? 'ok-ic' : 'no-ic'}">${ic(c.b ? 'check' : 'x')}</span>${c.note ? `<span class="r">${esc(L(c.note))}</span>` : ''}</div>`).join('')}
            <div class="divider"></div>
            <div class="hstack between wrap"><div><div class="caption">${tt('판정 재현 패키지', 'Reproduction package')}</div><span class="hash">${shortHash(txHash(r.id))}</span></div><button class="btn btn-line btn-s" data-act="rv-rerun" data-id="${r.id}">${ic('refresh')}${tt('같은 입력으로 재실행', 'Rerun same inputs')}</button></div>
            ${rr ? (rr.running ? `<div class="hstack mt12"><span class="spinner"></span><span class="body-s">${tt('고정된 스냅샷으로 3회 재실행 중…', 'Rerunning 3× on pinned snapshots…')}</span></div>` : `<div class="ai-shield mt12">${ic('check')}${tt('재실행 3회 모두 원래 판정과 같습니다. 스냅샷 claude-opus-5 / 교차 검토 모델, 입력 해시 일치.', 'All 3 reruns match the original verdict. Pinned snapshots, input hash matches.')}</div>`) : ''}
          </div>
        </div>
        <div class="panel">
          <h2 class="h4">${tt('결정', 'Decision')}</h2>
          ${r.status === 'resolved' ? `<div class="ai-shield">${ic('check')}${esc(L(r.resolution))}</div>` : `
          <div class="stack mt12">${[['pass', tt('통과 유지', 'Uphold pass'), tt('AI 판정을 인정하고 검수를 확정합니다', 'Accept the AI verdict and confirm acceptance')], ['rework', tt('재작업 요청', 'Request rework'), tt('수행사에게 보완을 요청합니다. 기한이 연장됩니다', 'Ask the supplier to fix; deadline extends')], ['panel', tt('전문가 패널 회부', 'Send to expert panel'), tt('원인이 여러 퀘스트에 걸친 경우', 'When the cause spans several quests')]].map((o, i) => `<label class="select-card ${(App.ui.rvDec || 'pass') === o[0] ? 'on' : ''}" style="cursor:pointer"><input type="radio" name="rv" value="${o[0]}" ${(App.ui.rvDec || 'pass') === o[0] ? 'checked' : ''} data-ch="rv-dec" hidden><span class="ic">${ic(['check', 'refresh', 'users'][i])}</span><div><div class="h4">${o[1]}</div><div class="caption mt4">${o[2]}</div></div></label>`).join('')}</div>
          <div class="field mt12"><label for="rv-memo">${tt('판정 사유 (양측에 통지)', 'Rationale (sent to both parties)')}</label><textarea class="textarea" id="rv-memo" placeholder="${tt('예: 명세상 실기 시험은 검수 기준이 아니며 HIL 로그 기준 40/40 통과를 확인함', 'e.g. Hardware testing is not in the criteria; HIL logs show 40/40 pass')}"></textarea></div>
          <button class="btn btn-primary btn-block mt12" data-act="rv-decide" data-id="${r.id}">${tt('결정 확정하고 통지', 'Confirm and notify')}</button>
          <div class="caption mt8">${tt('결정과 사유는 체인에 기록되고, 불복 시 대한상사중재원 신속절차로 이어집니다.', 'The decision is anchored on-chain; appeals go to KCAB expedited arbitration.')}</div>`}
        </div>
      </div>` };
});
ACT['rv-dec'] = el => { App.ui.rvDec = el.value; $$('.panel .select-card').forEach(c => c.classList.toggle('on', c.querySelector('input').checked)); };
ACT['rv-rerun'] = async el => { App.ui.rerun = { id:el.dataset.id, running:true }; App.refresh(); await sleep(1600); App.ui.rerun = { id:el.dataset.id, running:false }; App.refresh(); };
ACT['rv-decide'] = async btn => {
  const r = adm().reviews.find(x => x.id === btn.dataset.id), dec = App.ui.rvDec || 'pass', memo = ($('#rv-memo').value || '').trim();
  if (memo.length < 5) return toast(tt('판정 사유를 적어 주세요 (5자 이상).', 'Write a rationale (5+ characters).'), 'warn');
  const ok = await confirmBox({ title: tt('결정을 확정할까요?', 'Confirm this decision?'), body: tt('양측에 통지되고 체인에 기록됩니다.', 'Both parties will be notified and it will be anchored.'), ok: tt('확정', 'Confirm') }); if (!ok) return;
  const label = { pass:{ ko:'통과 유지', en:'Pass upheld' }, rework:{ ko:'재작업 요청', en:'Rework requested' }, panel:{ ko:'전문가 패널 회부', en:'Sent to expert panel' } }[dec];
  r.status = dec === 'panel' ? 'open' : 'resolved'; r.resolution = { ko:`${label.ko} · ${memo}`, en:`${label.en} · ${memo}` };
  if (dec === 'panel'){ r.title = { ko:'[패널] ' + L(r.title), en:'[Panel] ' + r.title.en }; }
  const q = App.state.quests.find(x => x.id === r.quest);
  if (q && dec !== 'panel'){
    addChain(q, EV.resolve);
    if (dec === 'pass'){ q.status = 'done'; q.escrow.status = 'released'; q.resolution = { ko:`재검수 결과 통과 유지: ${memo}`, en:`Re-review upheld the pass: ${memo}` }; addChain(q, EV.pay); }
    else { q.status = 'progress'; q.progress = 80; q.reworkNote = { ko:`재검수 결과 재작업 요청: ${memo}`, en:`Re-review requested rework: ${memo}` }; q.deadline = Date.now() + 7 * DAY; }
    addNotif({ aud:'client', icon:'gavel', tone: dec === 'pass' ? 'good' : 'warn', go:`/u/quest/${q.id}?tab=review`, t:{ ko:`${q.id} 재검수 결과: ${label.ko}`, en:`${q.id} re-review: ${label.en}` }, s:{ ko:memo, en:memo } });
  }
  const po = adm().payouts.find(x => x.quest === r.quest && x.status === 'held'); if (po && dec === 'pass') po.status = 'ready';
  audit(`${r.id} 결정: ${label.ko}`, `${r.id} decision: ${label.en}`);
  App.ui.rvDec = null; App.save(); toast(tt('결정을 통지했습니다.', 'Decision sent.'), 'ok'); App.refresh();
};

/* ---------- KYB ---------- */
const CHK = { nts:{ ko:'사업자등록 진위·휴폐업', en:'Registration & status' }, owner:{ ko:'대표자·실소유자', en:'CEO & beneficial owner' }, sanction:{ ko:'제재 목록 대조', en:'Sanctions screening' }, cert:{ ko:'인증서 발급기관 조회', en:'Certificate issuer check' }, equip:{ ko:'설비 보유 확인', en:'Equipment check' } };
const CHK_SRC = { nts:{ ko:'국세청 조회 API', en:'Tax authority API' }, owner:{ ko:'기업 신용정보 API', en:'Credit bureau API' }, sanction:{ ko:'국내·OFAC·EU·UN 목록', en:'KR, OFAC, EU, UN lists' }, cert:{ ko:'발급 기관 대조', en:'Issuer lookup' }, equip:{ ko:'영상 확인', en:'Video walkthrough' } };
route('/a/kyb', (p, qs) => {
  const f = qs.f || 'pending', K = adm().kyb.filter(k => f === 'pending' ? k.status === 'pending' : k.status !== 'pending');
  return { title: tt('사업자·자격 심사', 'Business verification'), sub: tt('수행사 가입과 자격 토큰 발급', 'Supplier onboarding and credential tokens'),
    html: `<div class="range">${[['pending', tt('심사 대기', 'Pending')], ['done', tt('처리 완료', 'Done')]].map(x => `<button class="${f === x[0] ? 'on' : ''}" data-go="/a/kyb?f=${x[0]}">${x[1]}</button>`).join('')}</div>
      <div class="a-list mt12">${K.map(k => { const todo = Object.values(k.checks).filter(v => v === 'todo' || v === 'warn').length; return `<button class="a-item sev-${k.status === 'approved' ? 'ok' : k.status === 'rejected' ? 'high' : todo ? 'mid' : 'low'}" data-go="/a/kyb/${k.id}">${veil(k.alias)}<div class="grow"><div class="t">${tt('수행사', 'Supplier')} ${k.alias} · ${esc(L(k.type))}</div><div class="s">${k.id} · ${ago(k.ts)} · ${tt(`남은 확인 ${todo}건`, `${todo} checks left`)}${k.fromSupplier ? ` · <b style="color:var(--accent-ink)">${tt('방금 앱에서 신청', 'just applied in the app')}</b>` : ''}</div></div>${k.status === 'pending' ? `<span class="pill st-review">${tt('대기', 'Pending')}</span>` : k.status === 'approved' ? `<span class="pill st-done">${tt('승인', 'Approved')}</span>` : `<span class="pill st-dispute">${tt('반려', 'Rejected')}</span>`}</button>`; }).join('') || `<div class="panel">${emptyState('check', tt('대기 중인 심사가 없습니다', 'No pending verifications'))}</div>`}</div>` };
});
route('/a/kyb/:id', p => {
  const k = adm().kyb.find(x => x.id === p.id); if (!k) return App.go('/a/kyb', true);
  const ready = !Object.values(k.checks).some(v => v === 'todo' || v === 'warn');
  const stIcon = v => v === 'ok' ? `<span class="ok-ic">${ic('check')}</span>` : v === 'warn' ? `<span class="no-ic" style="background:var(--warn-soft);color:var(--warn)">${ic('alert')}</span>` : v === 'na' ? `<span class="wait-ic">–</span>` : `<span class="wait-ic">${ic('clock')}</span>`;
  return { title: `${k.id} · ${tt('수행사', 'Supplier')} ${k.alias}`, sub: L(k.type),
    html: `<button class="back-link" data-go="/a/kyb">${ic('back')}${tt('목록', 'Back to list')}</button>
      <div class="a-grid two" style="margin-top:0">
        <div class="panel"><div class="hstack">${veil(k.alias, 'l')}<div style="flex:1"><div class="h3">${tt('수행사', 'Supplier')} ${k.alias}</div><div class="caption">${tt('실명', 'Legal name')} <span class="masked">${esc(k.real)}</span> · ${k.biz}</div></div></div>
          <h2 class="h4 mt20">${tt('확인 항목', 'Checks')}</h2>
          <div class="check-list mt8">${Object.keys(k.checks).map(c => { const v = k.checks[c]; return `<div class="ci">${stIcon(v)}<div class="grow"><div style="font-weight:650">${L(CHK[c])}</div><div class="s">${L(CHK_SRC[c])}${v === 'warn' ? ' · ' + tt('실소유자 지분 정보 불일치 (25% 기준)', 'Ownership data mismatch (25% rule)') : ''}</div></div>${v === 'todo' || v === 'warn' ? `<button class="btn btn-line btn-s" data-act="kyb-run" data-id="${k.id}" data-c="${c}">${v === 'warn' ? tt('추가 확인', 'Re-check') : tt('확인 실행', 'Run')}</button>` : ''}</div>`; }).join('')}</div>
        </div>
        <div class="panel"><h2 class="h4">${tt('발급할 자격 토큰', 'Tokens to issue')}</h2><div class="hstack wrap mt12">${k.tokens.map(t => tokenChip(t, k.status === 'approved' ? true : undefined)).join('')}</div>
          <div class="caption mt12">${tt('승인하면 이 토큰만 발주사에게 보이고, 원본은 플랫폼이 보관합니다.', 'On approval only these tokens are shown to clients; originals stay with Quest.')}</div>
          ${k.status === 'pending' ? `<button class="btn btn-primary btn-block mt16" data-act="kyb-approve" data-id="${k.id}" ${ready ? '' : 'disabled'}>${tt('승인하고 토큰 발급', 'Approve and issue tokens')}</button>${ready ? '' : `<div class="caption mt8">${tt('남은 확인을 먼저 끝내 주세요.', 'Finish the remaining checks first.')}</div>`}<button class="btn btn-danger btn-block mt8" data-act="kyb-reject" data-id="${k.id}">${tt('반려', 'Reject')}</button>` : `<div class="ai-shield">${ic('check')}${k.status === 'approved' ? tt('승인 완료', 'Approved') : tt('반려됨', 'Rejected')}</div>`}
        </div>
      </div>` };
});
ACT['kyb-run'] = async el => { el.classList.add('loading'); await sleep(1100); const k = adm().kyb.find(x => x.id === el.dataset.id); k.checks[el.dataset.c] = 'ok'; audit(`${k.id} ${CHK[el.dataset.c].ko} 확인`, `${k.id} ${CHK[el.dataset.c].en} checked`); App.save(); toast(tt('확인 완료: 이상 없음', 'Check passed'), 'ok'); App.refresh(); };
ACT['kyb-approve'] = async el => {
  const k = adm().kyb.find(x => x.id === el.dataset.id); await withLoading(el, 800);
  k.status = 'approved'; audit(`${k.id} 승인, 토큰 ${k.tokens.length}개 발급`, `${k.id} approved, ${k.tokens.length} token(s) issued`);
  if (k.fromSupplier){ const S = App.state.supplier; k.tokens.forEach(t => { if (!S.tokens.includes(t)) S.tokens.push(t); }); S.pendingTokens = S.pendingTokens.filter(t => !k.tokens.includes(t)); addNotif({ aud:'supplier', icon:'badge', tone:'good', go:'/u/home', t:{ ko:'자격 토큰이 발급되었습니다', en:'Credential token issued' }, s:{ ko:k.tokens.map(t => TOKENS[t].ko).join(', '), en:k.tokens.map(t => TOKENS[t].en).join(', ') } }); }
  App.save(); toast(tt('승인했습니다. 토큰을 발급했습니다.', 'Approved. Tokens issued.'), 'ok'); App.refresh();
};
ACT['kyb-reject'] = async el => { const ok = await confirmBox({ title: tt('반려할까요?', 'Reject?'), body: tt('신청자에게 사유가 통지됩니다.', 'The applicant will be notified.'), ok: tt('반려', 'Reject'), danger:true }); if (!ok) return; const k = adm().kyb.find(x => x.id === el.dataset.id); k.status = 'rejected'; if (k.fromSupplier){ const S = App.state.supplier; S.pendingTokens = S.pendingTokens.filter(t => !k.tokens.includes(t)); } audit(`${k.id} 반려`, `${k.id} rejected`); App.save(); App.refresh(); };

/* ---------- compliance ---------- */
const ALERT_ACTS = {
  export:[[{ ko:'게시 보류 + 전문판정 안내', en:'Hold posting + route to official classification' }, 'hold'], [{ ko:'오탐 처리', en:'Mark false positive' }, 'fp']],
  selfdeal:[[{ ko:'매칭 차단 유지 + 조사', en:'Keep blocked + investigate' }, 'block'], [{ ko:'오탐 처리', en:'Mark false positive' }, 'fp']],
  sanction:[[{ ko:'추가 서류 요청', en:'Request documents' }, 'docs'], [{ ko:'오탐 처리 (생년월일 불일치)', en:'False positive (DOB mismatch)' }, 'fp']],
  pricing:[[{ ko:'발주사에 품질 위험 안내', en:'Send quality-risk notice' }, 'notice'], [{ ko:'무시', en:'Dismiss' }, 'fp']]
};
const ALERT_ICON = { export:['globe', 'bad'], selfdeal:['swap', 'bad'], sanction:['shield', 'warn'], pricing:['chart', 'info'] };
route('/a/compliance', (p, qs) => {
  const f = qs.f || 'open', AL = adm().alerts.filter(a => f === 'open' ? a.status === 'open' : a.status !== 'open');
  return { title: tt('컴플라이언스', 'Compliance'), sub: tt('수출통제, 자전거래, 제재, 가격 이상', 'Export control, self-dealing, sanctions, pricing'),
    html: `<div class="range">${[['open', tt('미처리', 'Open')], ['done', tt('처리됨', 'Handled')]].map(x => `<button class="${f === x[0] ? 'on' : ''}" data-go="/a/compliance?f=${x[0]}">${x[1]}</button>`).join('')}</div>
      <div class="a-list mt12">${AL.map(a => `<button class="a-item sev-${a.status !== 'open' ? 'ok' : a.sev}" data-act="al-open" data-id="${a.id}"><span class="ico-box ${ALERT_ICON[a.kind][1]}">${ic(ALERT_ICON[a.kind][0])}</span><div class="grow"><div class="t">${esc(L(a.title))}</div><div class="s">${a.id}${a.quest ? ' · ' + a.quest : ''} · ${ago(a.ts)}${a.status !== 'open' ? ' · ' + esc(L(a.action)) : ''}</div></div><span class="pill ${a.sev === 'high' ? 'st-dispute' : a.sev === 'mid' ? 'st-review' : 'st-open'}">${a.sev === 'high' ? tt('높음', 'High') : a.sev === 'mid' ? tt('중간', 'Medium') : tt('낮음', 'Low')}</span></button>`).join('') || `<div class="panel">${emptyState('shield', tt('미처리 경보가 없습니다', 'No open alerts'))}</div>`}</div>
      <div class="panel mt16"><div class="h4">${tt('자동 규칙', 'Automated rules')}</div><div class="check-list mt8">${[[tt('이중용도 통제번호 후보 탐지', 'Dual-use control number detection'), '9A012 · 2B007 · 2B001 · 1A002'], [tt('자전거래 교차 대조', 'Self-dealing cross-match'), tt('사업자번호·실소유자·세무대리인·계좌·기기', 'Business no., owner, tax agent, account, device')], [tt('제재 목록 대조', 'Sanctions screening'), 'KR · OFAC SDN · EU · UN'], [tt('담합 방지', 'Collusion guard'), tt('낙찰 전후 개별 제안가 비공개', 'Individual bids never disclosed')]].map(r => `<div class="ci"><span class="ok-ic">${ic('check')}</span><div class="grow"><div style="font-weight:650">${r[0]}</div><div class="s">${r[1]}</div></div><span class="pill st-done">${tt('작동 중', 'On')}</span></div>`).join('')}</div></div>` };
});
ACT['al-open'] = el => {
  const a = adm().alerts.find(x => x.id === el.dataset.id);
  openSheet(`<div class="hstack"><span class="ico-box ${ALERT_ICON[a.kind][1]}">${ic(ALERT_ICON[a.kind][0])}</span><div><div class="caption">${a.id}${a.quest ? ' · ' + a.quest : ''}</div><div class="sh-title" style="font-size:18px">${esc(L(a.title))}</div></div></div>
    <div class="sh-sub mt12">${esc(L(a.detail))}</div>
    ${a.status === 'open' ? `<div class="stack mt20">${ALERT_ACTS[a.kind].map((x, i) => `<button class="btn ${i === 0 ? 'btn-primary' : 'btn-gray'} btn-block" data-act="al-do" data-id="${a.id}" data-i="${i}">${L(x[0])}</button>`).join('')}</div>` : `<div class="ai-shield">${ic('check')}${esc(L(a.action))}</div>`}`);
};
ACT['al-do'] = async el => {
  const a = adm().alerts.find(x => x.id === el.dataset.id), act = ALERT_ACTS[a.kind][+el.dataset.i];
  await withLoading(el, 700); a.status = 'done'; a.action = act[0];
  audit(`${a.id} ${act[0].ko}`, `${a.id} ${act[0].en}`); App.save(); closeLayer(true); toast(tt('처리했습니다. 감사 로그에 남았습니다.', 'Handled and logged.'), 'ok'); App.refresh();
};

/* ---------- ledger ---------- */
route('/a/ledger', () => {
  const S = adm(), P = S.payouts;
  const held = App.state.quests.filter(q => q.escrow && q.escrow.status === 'deposited').reduce((a, q) => a + priceOf(q), 0) + 812000000;
  const ready = P.filter(x => x.status === 'ready');
  const deals = [['Q-2026-0412', 20000000, 17000000], ['Q-2026-0409', 9500000, 8075000], ['Q-2026-0398', 12000000, 9600000], ['Q-2026-0381', 18000000, 15300000]];
  return { title: tt('예치·정산', 'Escrow & payouts'), sub: tt('제휴 은행 에스크로 · 가상계좌', 'Partner-bank escrow · virtual accounts'),
    html: `<div class="kpis"><div class="kpi"><div class="l">${tt('예치 잔액', 'Escrow balance')}</div><div class="v">${won(held)}</div><span class="d flat">${tt('제휴 은행 보관', 'Held at partner bank')}</span></div><div class="kpi"><div class="l">${tt('지급 대기', 'Ready to pay')}</div><div class="v">${won(ready.reduce((a, x) => a + x.amt, 0))}</div><span class="d flat">${tt(`${ready.length}건`, `${ready.length} payouts`)}</span></div><div class="kpi"><div class="l">${tt('이번 달 결제 비용', 'Payment fees this month')}</div><div class="v">${won(41400)}</div><span class="d up">${ic('dn')}${tt('카드 대비 −99.9%', '−99.9% vs. card')}</span></div></div>
      <div class="panel mt14" style="margin-top:14px"><div class="panel-h"><h2 class="h4">${tt('수행사 지급', 'Supplier payouts')}</h2>${ready.length ? `<button class="btn btn-primary btn-s" data-act="po-all">${tt(`대기 ${ready.length}건 일괄 지급`, `Pay all ${ready.length}`)}</button>` : ''}</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>ID</th><th>${tt('퀘스트', 'Quest')}</th><th>${tt('수행사', 'Supplier')}</th><th class="n">${tt('금액', 'Amount')}</th><th>${tt('예정일', 'Due')}</th><th>${tt('상태', 'Status')}</th><th></th></tr></thead><tbody>
        ${P.map(x => `<tr><td class="tnum">${x.id}</td><td>${x.quest}</td><td><span class="hstack" style="gap:6px">${veil(x.sup, 's')}${x.sup}</span></td><td class="n">${won(x.amt, 'full')}</td><td class="tnum">${fmtDate(x.due)}</td><td>${x.status === 'paid' ? `<span class="pill st-done">${tt('지급 완료', 'Paid')}</span>` : x.status === 'held' ? `<span class="pill st-dispute">${tt('분쟁 보류', 'Held')}</span>` : `<span class="pill st-review">${tt('지급 대기', 'Ready')}</span>`}</td><td>${x.status === 'ready' ? `<button class="btn btn-line btn-s" data-act="po-pay" data-id="${x.id}">${tt('지급', 'Pay')}</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="panel" style="margin-top:14px"><div class="panel-h"><h2 class="h4">${tt('거래별 차액', 'Spread per deal')}</h2><span class="caption">${tt('재판매 구조 · 플랫폼이 계약 당사자', 'Resale model · Quest is the counterparty')}</span></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${tt('퀘스트', 'Quest')}</th><th class="n">${tt('발주가', 'Client price')}</th><th class="n">${tt('수행가', 'Supplier price')}</th><th class="n">${tt('차액', 'Spread')}</th><th class="n">%</th></tr></thead><tbody>${deals.map(d => `<tr><td>${d[0]}</td><td class="n">${won(d[1], 'full')}</td><td class="n">${won(d[2], 'full')}</td><td class="n"><b>${won(d[1] - d[2], 'full')}</b></td><td class="n">${((d[1] - d[2]) / d[1] * 100).toFixed(1)}</td></tr>`).join('')}</tbody></table></div>
        <div class="caption mt8">${tt('세금계산서는 발주사↔플랫폼, 플랫폼↔수행사 두 장으로 발행되어 서로 드러나지 않습니다.', 'Two invoices (client↔Quest, Quest↔supplier) keep the parties hidden from each other.')}</div></div>` };
});
async function payOne(x){ x.status = 'paid'; S_chain(1); audit(`${x.id} 지급 실행 ${x.amt.toLocaleString()}원`, `${x.id} paid ₩${x.amt.toLocaleString()}`); }
function S_chain(n){ adm().pendingAnchors = (adm().pendingAnchors || 0) + n; }
ACT['po-pay'] = async el => { const x = adm().payouts.find(p => p.id === el.dataset.id); const ok = await confirmBox({ title: tt('지급을 실행할까요?', 'Execute payout?'), body: tt(`수행사 ${x.sup}에게 ${won(x.amt, 'full')}을 지급합니다.`, `Pay ${won(x.amt, 'full')} to supplier ${x.sup}.`), ok: tt('지급', 'Pay') }); if (!ok) return; await payOne(x); App.save(); toast(tt('지급했습니다.', 'Paid.'), 'ok'); App.refresh(); };
ACT['po-all'] = async el => { const R = adm().payouts.filter(p => p.status === 'ready'); const ok = await confirmBox({ title: tt(`${R.length}건을 일괄 지급할까요?`, `Pay ${R.length} payouts?`), body: won(R.reduce((a, x) => a + x.amt, 0), 'full'), ok: tt('일괄 지급', 'Pay all') }); if (!ok) return; await withLoading(el, 1000); for (const x of R) await payOne(x); App.save(); toast(tt('일괄 지급했습니다.', 'All paid.'), 'ok'); App.refresh(); };

/* ---------- chain ---------- */
route('/a/chain', () => {
  const S = adm(), vr = App.ui.chainVerify;
  const monthCost = S.batches.reduce((a, b) => a + b.cost, 0) * 20;
  return { title: tt('블록체인 기록', 'On-chain records'), sub: tt('Base 메인넷 · 머클 루트 배치', 'Base mainnet · Merkle-root batches'),
    html: `<div class="kpis"><div class="kpi"><div class="l">${tt('앵커링 대기', 'Waiting to anchor')}</div><div class="v">${tt(`${S.pendingAnchors}건`, S.pendingAnchors)}</div><span class="d flat">${tt('6시간마다 자동', 'Auto every 6 h')}</span></div><div class="kpi"><div class="l">${tt('최근 배치', 'Last batch')}</div><div class="v" style="font-size:20px">${S.batches[0].id}</div><span class="d flat">${ago(S.batches[0].ts)}</span></div><div class="kpi"><div class="l">${tt('이번 달 기록 비용', 'Anchoring cost this month')}</div><div class="v">$${monthCost.toFixed(2)}</div><span class="d flat">${tt('해시 1건 < $0.0001', '< $0.0001 per hash')}</span></div></div>
      <div class="a-grid two">
        <div class="panel"><div class="panel-h"><h2 class="h4">${tt('배치 기록', 'Batches')}</h2><button class="btn btn-primary btn-s" data-act="anchor" ${S.pendingAnchors ? '' : 'disabled'}>${ic('chain')}${tt('지금 앵커링', 'Anchor now')}</button></div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${tt('배치', 'Batch')}</th><th class="n">${tt('해시 수', 'Hashes')}</th><th>${tt('머클 루트', 'Merkle root')}</th><th class="n">${tt('블록', 'Block')}</th><th class="n">${tt('비용', 'Cost')}</th><th>${tt('시각', 'Time')}</th></tr></thead><tbody>${S.batches.map(b => `<tr class="click" data-act="copy" data-text="${b.root}"><td><b>${b.id}</b></td><td class="n">${b.count}</td><td><span class="hash" style="margin:0">${shortHash(b.root)}</span></td><td class="n">#${num(b.block)}</td><td class="n">$${b.cost.toFixed(3)}</td><td class="tnum">${ago(b.ts)}</td></tr>`).join('')}</tbody></table></div></div>
        <div class="panel"><h2 class="h4">${tt('해시 검증', 'Verify a hash')}</h2><div class="caption mt4">${tt('문서 해시나 트랜잭션 해시를 넣어 체인 기록과 대조합니다.', 'Paste a document or transaction hash to check it against the chain.')}</div>
          <div class="field mt12"><input class="input" id="cv-in" style="font-family:ui-monospace,Menlo,monospace;font-size:13px" value="${esc(App.ui.cvIn || txHash('Q-2026-04124'))}" aria-label="hash"></div>
          <div class="hstack mt8"><button class="btn btn-primary btn-m" style="flex:1" data-act="cv-go">${tt('검증', 'Verify')}</button><button class="btn btn-gray btn-m" data-act="cv-bad">${tt('변조 예시', 'Tampered example')}</button></div>
          ${vr ? `<div class="ai-shield" style="${vr.ok ? '' : 'background:var(--bad-soft);color:var(--bad)'}">${ic(vr.ok ? 'check' : 'alert')}<span>${vr.ok ? tt(`일치. 배치 ${S.batches[1].id} · 블록 #${num(S.batches[1].block)}에 포함된 기록입니다.`, `Match. Included in batch ${S.batches[1].id}, block #${num(S.batches[1].block)}.`) : tt('어떤 배치에도 없습니다. 기록 이후 바뀌었거나 기록되지 않은 값입니다.', 'Not found in any batch. It changed after recording or was never recorded.')}</span></div>` : ''}
          <div class="divider"></div><div class="caption">${tt('법적 지위: 위변조 여부를 확인하는 보조 기록입니다. 핵심 산출물은 특허청 원본증명서비스에 병행 등록합니다.', 'Legal status: a supporting tamper-evidence record. Key files are also registered with the KIPO timestamp service.')}</div></div>
      </div>` };
});
ACT['anchor'] = async el => { await withLoading(el, 1400); const S = adm(); const n = S.pendingAnchors; S.batches.unshift({ id:'B-' + (parseInt(S.batches[0].id.slice(2)) + 1), ts:Date.now(), count:n, root:'0x' + hexOf('root' + Date.now(), 64), tx:txHash('b' + Date.now()), block:App.state.chainHeight += 3, cost:+(0.004 + n * 0.00005).toFixed(4) }); S.pendingAnchors = 0; audit(`해시 ${n}건 앵커링`, `Anchored ${n} hashes`); App.save(); toast(tt(`해시 ${n}건을 Base에 기록했습니다.`, `Anchored ${n} hashes on Base.`), 'ok'); App.refresh(); };
ACT['cv-go'] = async el => { const v = ($('#cv-in').value || '').trim(); App.ui.cvIn = v; await withLoading(el, 900); App.ui.chainVerify = { ok: /^0x[0-9a-f]{64}$/.test(v) && !App.ui.cvTampered }; App.ui.cvTampered = false; App.refresh(); };
ACT['cv-bad'] = () => { const v = txHash('Q-2026-04124'); App.ui.cvIn = v.slice(0, -4) + 'beef'; App.ui.cvTampered = true; App.ui.chainVerify = null; App.refresh(); };

/* ---------- members ---------- */
route('/a/members', (p, qs) => {
  const f = qs.f || 'all', s = (App.ui.memQ || '').toLowerCase(), rev = App.ui.revealed || {};
  const M = adm().members.filter(m => f === 'all' || (f === 'review' ? m.status === 'review' : m.type === f)).filter(m => !s || (m.alias + (rev[m.id] ? m.real : '')).toLowerCase().includes(s));
  return { title: tt('회원', 'Members'), sub: tt('가명으로 표시 · 실명 열람은 사유와 함께 기록', 'Shown by pseudonym · real-name views are logged'),
    html: `<div class="hstack wrap between" style="gap:10px"><div class="range">${[['all', tt('전체', 'All')], ['client', tt('발주사', 'Clients')], ['supplier', tt('수행사', 'Suppliers')], ['review', tt('검토 중', 'In review')]].map(x => `<button class="${f === x[0] ? 'on' : ''}" data-go="/a/members?f=${x[0]}">${x[1]}</button>`).join('')}</div>
      <input class="input" style="max-width:260px;min-height:40px;padding:8px 12px" id="mem-q" placeholder="${tt('가명 검색', 'Search alias')}" value="${esc(App.ui.memQ || '')}" data-in="mem-q"></div>
      <div class="panel" style="margin-top:12px"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${tt('가명', 'Alias')}</th><th>${tt('구분', 'Type')}</th><th>${tt('실명', 'Legal name')}</th><th>${tt('상태', 'Status')}</th><th class="n">${tt('누적 거래액', 'Lifetime GMV')}</th><th class="n">${tt('평점', 'Rating')}</th><th>${tt('가입', 'Joined')}</th></tr></thead><tbody>
      ${M.map(m => `<tr class="click" data-act="mem-open" data-id="${m.id}"><td><span class="hstack" style="gap:8px">${veil(m.alias, 's')}<b>${m.alias}</b></span></td><td>${m.type === 'client' ? tt('발주사', 'Client') : tt('수행사', 'Supplier')}</td><td>${rev[m.id] ? esc(m.real) : `<span class="masked">${esc(m.real)}</span>`}</td><td>${m.status === 'active' ? `<span class="pill st-done">${tt('정상', 'Active')}</span>` : `<span class="pill st-review">${tt('검토 중', 'Review')}</span>`}</td><td class="n">${won(m.gmv)}</td><td class="n">${m.rating ? '★ ' + m.rating : '–'}</td><td class="tnum">${fmtDate(m.joined, 'full')}</td></tr>`).join('')}</tbody></table></div>${M.length ? '' : emptyState('search', tt('검색 결과가 없습니다', 'No results'))}</div>` ,
    mount(){ const i = $('#mem-q'); if (i && App.ui.memFocus){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); App.ui.memFocus = false; } } };
});
ACT['mem-q'] = el => { App.ui.memQ = el.value; App.ui.memFocus = true; clearTimeout(App.ui.memT); App.ui.memT = setTimeout(() => App.refresh(), 200); };
ACT['mem-open'] = el => {
  const m = adm().members.find(x => x.id === el.dataset.id), rev = (App.ui.revealed || {})[m.id];
  openSheet(`<div class="hstack">${veil(m.alias, 'l')}<div><div class="sh-title">${m.alias}</div><div class="caption">${m.type === 'client' ? tt('발주사', 'Client') : tt('수행사', 'Supplier')} · ${m.id}</div></div></div>
    <dl class="kv mt16"><dt>${tt('실명', 'Legal name')}</dt><dd>${rev ? esc(m.real) : `<span class="masked">${esc(m.real)}</span>`}</dd><dt>${tt('누적 거래액', 'Lifetime GMV')}</dt><dd>${won(m.gmv)}</dd><dt>${tt('평점', 'Rating')}</dt><dd>${m.rating || '–'}</dd><dt>${tt('가입', 'Joined')}</dt><dd>${fmtDate(m.joined, 'full')}</dd></dl>
    ${rev ? `<div class="audit mt16">${ic('info')}${tt('열람 기록이 감사 로그에 남았습니다.', 'This view was written to the audit log.')}</div>` : `<div class="field mt20"><label for="rv-why">${tt('실명 열람 사유', 'Reason to view real name')}</label><select class="select" id="rv-why"><option value="">${tt('사유 선택', 'Choose a reason')}</option><option>${tt('분쟁 처리', 'Dispute handling')}</option><option>${tt('수사기관 요청', 'Law-enforcement request')}</option><option>${tt('제조물 사고 고지', 'Product-liability notice')}</option><option>${tt('세무 처리', 'Tax processing')}</option></select></div><button class="btn btn-dark btn-block mt12" data-act="mem-reveal" data-id="${m.id}">${ic('eye')}${tt('실명 열람', 'Reveal real name')}</button>`}`);
};
ACT['mem-reveal'] = el => { const why = $('#rv-why').value; if (!why) return toast(tt('열람 사유를 선택해 주세요.', 'Choose a reason.'), 'warn'); const m = adm().members.find(x => x.id === el.dataset.id); App.ui.revealed = Object.assign(App.ui.revealed || {}, { [m.id]: true }); audit(`${m.alias} 실명 열람 (사유: ${why})`, `Viewed ${m.alias} legal name (reason: ${why})`); App.save(); closeLayer(true); toast(tt('실명을 표시했습니다. 감사 로그에 기록되었습니다.', 'Name shown and logged.'), 'ok'); App.refresh(); };

/* ---------- AI settings + audit ---------- */
route('/a/ai', () => {
  const C = adm().ai;
  const model = (id, name, sub, badge) => `<label class="model-card" style="cursor:pointer"><span class="ico-box ${C.primary === id || C.hard === id ? 'accent' : ''}">${ic('cpu')}</span><div class="grow"><div class="t">${name} ${badge ? `<span class="tag">${badge}</span>` : ''}</div><div class="s">${sub}</div></div></label>`;
  return { title: tt('AI 판정 설정', 'AI review settings'), sub: tt('모델 라우팅과 판정 기준', 'Model routing and thresholds'),
    html: `<div class="a-grid half" style="margin-top:0">
      <div class="panel"><h2 class="h4">${tt('모델 라우팅', 'Model routing')}</h2><div class="mt12">
        ${model('sonnet', 'Claude Sonnet 5', tt('기본 판정 · 무보존(ZDR) 계약', 'Default · zero-data-retention'), tt('기본', 'Default'))}
        ${model('opus', 'Claude Opus 5', tt('고난도 과업 · 무보존(ZDR) 계약', 'Hard cases · zero-data-retention'), tt('고난도', 'Hard'))}
        <label class="model-card" style="cursor:pointer"><span class="ico-box ${C.cross ? 'good' : ''}">${ic('swap')}</span><div class="grow"><div class="t">${tt('OpenAI 교차 검토', 'OpenAI cross-check')}</div><div class="s">${tt('국내 저장 선택 가능 · 독립 판정', 'KR data residency · independent verdict')}</div></div><span class="switch"><input type="checkbox" data-ch="ai-set" data-k="cross" ${C.cross ? 'checked' : ''}><span></span></span></label>
        <label class="model-card" style="cursor:pointer;opacity:.75"><span class="ico-box">${ic('lock')}</span><div class="grow"><div class="t">Claude Fable 5.1</div><div class="s">${tt('30일 보존 의무 · 발주사 동의 과업에만', '30-day retention required · only with client consent')}</div></div><span class="tag">${tt('제한', 'Restricted')}</span></label>
      </div></div>
      <div class="panel"><h2 class="h4">${tt('판정 기준', 'Thresholds')}</h2>
        <div class="field mt12"><label>${tt('예비 판정을 내는 최소 모델 일치율', 'Min. model agreement to issue a verdict')}</label><div class="slider-row"><input type="range" min="70" max="100" step="5" value="${C.agreeMin}" data-in="ai-slider" data-k="agreeMin"><b id="v-agreeMin">${C.agreeMin}%</b></div></div>
        <div class="field mt12"><label>${tt('같은 입력 반복 실행 횟수 (다수결)', 'Repeat runs per input (majority vote)')}</label><div class="slider-row"><input type="range" min="1" max="7" step="2" value="${C.runs}" data-in="ai-slider" data-k="runs"><b id="v-runs">${C.runs}${tt('회', '×')}</b></div></div>
        <div class="check-list mt8">
          ${[['swap', tt('비교 판정은 순서를 바꿔 두 번 실행', 'Run comparisons twice with order swapped')], ['humanOnDisagree', tt('모델 불일치 시 사람에게 넘기기', 'Send disagreements to a human')], ['zdr', tt('무보존 계약 모델만 허용', 'Allow ZDR models only')]].map(x => `<label class="ci" style="cursor:pointer"><div class="grow"><div style="font-weight:600">${x[1]}</div></div><span class="switch"><input type="checkbox" data-ch="ai-set" data-k="${x[0]}" ${C[x[0]] ? 'checked' : ''}><span></span></span></label>`).join('')}
        </div>
        <div class="caption mt8">${tt(`AI 분석 옵트아웃 고객 ${C.optouts}곳 (방산·공공·금융)`, `${C.optouts} customers opted out of AI (defense, public, finance)`)}</div>
        <button class="btn btn-primary btn-block mt16" data-act="ai-save">${tt('변경 사항 저장', 'Save changes')}</button></div>
    </div>
    <div class="panel" style="margin-top:14px"><div class="panel-h"><h2 class="h4">${tt('감사 로그', 'Audit log')}</h2><span class="caption">${tt('최근 20건', 'Latest 20')}</span></div>
      ${adm().audit.slice(0, 20).map(a => `<div class="feed-item" style="animation:none"><span class="ico-box">${ic('doc')}</span><div style="flex:1"><div>${esc(L(a.t))}</div><div class="tm">${fmtDate(a.ts, 'dt')} · ops.lead</div></div></div>`).join('') || emptyState('doc', tt('아직 기록이 없습니다', 'No entries yet'))}</div>` };
});
ACT['ai-set'] = el => { adm().ai[el.dataset.k] = el.checked; App.ui.aiDirty = true; };
ACT['ai-slider'] = el => { adm().ai[el.dataset.k] = +el.value; $('#v-' + el.dataset.k).textContent = el.dataset.k === 'runs' ? el.value + tt('회', '×') : el.value + '%'; App.ui.aiDirty = true; };
ACT['ai-save'] = async el => { await withLoading(el, 700); const C = adm().ai; audit(`AI 설정 변경: 일치율 ${C.agreeMin}%, 반복 ${C.runs}회, 교차 검토 ${C.cross ? '켬' : '끔'}`, `AI settings: agreement ${C.agreeMin}%, runs ${C.runs}, cross-check ${C.cross ? 'on' : 'off'}`); App.save(); toast(tt('저장했습니다. 다음 판정부터 적용됩니다.', 'Saved. Applies from the next review.'), 'ok'); App.refresh(); };
