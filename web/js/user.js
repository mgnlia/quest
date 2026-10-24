/* Quest demo — user app, part 1: layout, login, home, quests, quest detail */
'use strict';
const U = {};

/* ---------- layout ---------- */
function topbar(o){
  o = o || {};
  const left = o.back ? `<button class="icon-btn" data-act="back" data-fallback="${o.back === true ? '' : o.back}" aria-label="${tt('뒤로', 'Back')}">${ic('back')}</button>` : (o.left || '');
  return `<header class="topbar">${left}<div class="title">${o.title || ''}${o.sub ? `<small>${o.sub}</small>` : ''}</div>${o.right || ''}</header>`;
}
function mode(){ return (App.state.session && App.state.session.mode) || 'client'; }
function unread(){ return App.state.notifs.filter(n => n.aud === mode() && !n.read).length; }
function bellBtn(){ const n = unread(); return `<button class="icon-btn" data-go="/u/notifications" aria-label="${tt('알림', 'Notifications')}">${ic('bell')}${n ? `<span class="dot-badge">${n}</span>` : ''}</button>`; }
function UserLayout(out, path){
  const cta = out.after && /cta-bar|composer/.test(out.after);
  return `<div class="shell">${out.top || ''}<main class="page${out.noTabs ? ' no-tabs' : ''}${cta ? ' has-cta' : ''}">${out.html}</main>${out.noTabs ? '' : tabbar(path)}${out.after || ''}</div>`;
}
function tabbar(path){
  const on = p => path === p || path.startsWith(p + '/') ? ' on' : '';
  const T = (p, icn, label) => `<a class="tab${on(p)}" data-go="${p}" href="#${p}">${ic(icn)}<span>${label}</span></a>`;
  if (mode() === 'supplier'){
    return `<nav class="tabbar" aria-label="${tt('주 메뉴', 'Main')}">${T('/u/home', 'home', tt('홈', 'Home'))}${T('/u/market', 'search', tt('탐색', 'Explore'))}${T('/u/jobs', 'list', tt('내 작업', 'My jobs'))}${T('/u/wallet', 'wallet', tt('정산', 'Payouts'))}${T('/u/me', 'user', 'MY')}</nav>`;
  }
  return `<nav class="tabbar" aria-label="${tt('주 메뉴', 'Main')}">${T('/u/home', 'home', tt('홈', 'Home'))}${T('/u/quests', 'list', tt('퀘스트', 'Quests'))}<div class="tab-fab"><button data-go="/u/new" aria-label="${tt('새 퀘스트', 'New quest')}">${ic('plus')}</button></div>${T('/u/wallet', 'wallet', tt('지갑', 'Wallet'))}${T('/u/me', 'user', 'MY')}</nav>`;
}
function catLabel(c){ return L(CATS[c] || CATS.struct); }
function tokenChip(k, has){ return `<span class="token${has === false ? ' miss' : ''}">${ic(has === false ? 'x' : 'check')}${L(TOKENS[k])}</span>`; }
function priceOf(q){ const p = q.selected && q.proposals.find(x => x.id === q.selected); return p ? p.price : q.budget; }
function supplierOf(q){ return q.selected && q.proposals.find(x => x.id === q.selected); }
function findQuest(id){ return App.state.quests.find(q => q.id === id); }

/* ---------- login ---------- */
function langSeg(){ return `<div class="lang-seg" role="group" aria-label="Language"><button data-act="lang" data-v="ko" class="${isKo() ? 'on' : ''}">한국어</button><button data-act="lang" data-v="en" class="${!isKo() ? 'on' : ''}">EN</button></div>`; }
const V = {};
V.login = (p, q) => {
  if (q.role === 'admin') return V.adminLogin();
  const acct = App.ui.loginAcct || 'client';
  return { html: `
  <div class="login">
    <div class="hstack mt8"><div class="brand">${LOGO}<span>Quest</span></div><div class="lang-toggle">${langSeg()}</div></div>
    <div class="seg role-seg mt20" role="tablist"><button class="on" role="tab">${tt('사용자', 'User')}</button><button role="tab" data-go="/login?role=admin">${tt('관리자', 'Admin')}</button></div>
    <h1 class="headline">${tt('누가 맡겼는지는 가리고,<br><em>일은 정확하게.</em>', 'Keep who you are private.<br><em>Get the work done right.</em>')}</h1>
    <p class="lede">${tt('설계·해석·가공 일감을 익명으로 맡기고 받는 B2B 퀘스트 플랫폼', 'An anonymous B2B marketplace for engineering, analysis and machining work')}</p>
    <div class="login-visual" aria-hidden="true">
      <div class="node">${veil('K2Q9')}<span>${tt('발주사', 'Client')}</span></div>
      <div class="link"></div>
      <div class="node center"><div class="core">${ic('shield')}</div><span>Quest</span></div>
      <div class="link r"></div>
      <div class="node">${veil('D8R2')}<span>${tt('수행사', 'Supplier')}</span></div>
    </div>
    <div class="label">${tt('데모 계정 선택', 'Pick a demo account')}</div>
    <div class="demo-accts mt8">
      <button class="demo-acct ${acct === 'client' ? 'on' : ''}" data-act="pick-acct" data-v="client">${veil('K2Q9', 's')}<div><div class="t">${tt('발주사', 'Client')}</div><div class="s">client@quest.demo</div></div></button>
      <button class="demo-acct ${acct === 'supplier' ? 'on' : ''}" data-act="pick-acct" data-v="supplier">${veil('D8R2', 's')}<div><div class="t">${tt('수행사', 'Supplier')}</div><div class="s">supplier@quest.demo</div></div></button>
    </div>
    <form class="stack mt16" data-act-form="login" onsubmit="return false">
      <div class="field"><label for="lg-email">${tt('이메일', 'Email')}</label><input class="input" id="lg-email" type="email" autocomplete="username" value="${acct}@quest.demo"></div>
      <div class="field"><label for="lg-pw">${tt('비밀번호', 'Password')}</label><input class="input" id="lg-pw" type="password" autocomplete="current-password" value="demo1234"></div>
      <button class="btn btn-primary btn-block mt8" id="lg-btn" data-act="login">${tt('로그인', 'Sign in')}</button>
      <button class="link-btn center" style="align-self:center" data-act="signup">${tt('사업자 인증으로 가입하기', 'Sign up with business verification')}</button>
    </form>
    <p class="foot-note">${tt('가상의 데모 앱입니다. 실제 거래·결제는 일어나지 않습니다.', 'This is a fictional demo. No real transactions or payments take place.')}</p>
  </div>` };
};
V.adminLogin = () => ({ html: `
  <div class="login admin"><div class="inner">
    <div class="hstack mt8"><div class="brand" style="color:#fff">${LOGO}<span>Quest Ops</span></div><div class="lang-toggle">${langSeg()}</div></div>
    <h1 class="headline">${tt('운영 콘솔', 'Operations console')}</h1>
    <p class="lede">${tt('검수·분쟁, 사업자 심사, 컴플라이언스, 정산을 관리합니다.', 'Reviews and disputes, business verification, compliance and payouts.')}</p>
    <div class="admin-card">
      <div class="stack">
        <div class="field"><label for="ad-id">${tt('관리자 ID', 'Admin ID')}</label><input class="input" id="ad-id" value="ops.lead@quest.demo" autocomplete="username"></div>
        <div class="field"><label for="ad-pw">${tt('비밀번호', 'Password')}</label><input class="input" id="ad-pw" type="password" value="admin1234" autocomplete="current-password"></div>
        <div class="field"><label>${tt('2단계 인증 코드', 'Two-factor code')}</label>
          <div class="otp" id="otp">${[0,1,2,3,4,5].map(i => `<input inputmode="numeric" maxlength="1" aria-label="OTP ${i + 1}" data-in="otp" data-i="${i}">`).join('')}</div>
          <button class="link-btn mt4" style="color:#9EA8FF" data-act="otp-fill">${tt('데모 코드 채우기 (123456)', 'Fill demo code (123456)')}</button>
        </div>
        <button class="btn btn-primary btn-block mt8" id="ad-btn" data-act="admin-login">${tt('콘솔 접속', 'Enter console')}</button>
      </div>
    </div>
    <div class="shield-list">
      <div>${ic('check')}${tt('접속 기기와 IP가 감사 로그에 기록됩니다', 'Device and IP are written to the audit log')}</div>
      <div>${ic('check')}${tt('실명 열람은 사유 입력 후에만 가능합니다', 'Real names are revealed only with a stated reason')}</div>
      <div>${ic('check')}${tt('2단계 인증이 항상 필요합니다', 'Two-factor authentication is always required')}</div>
    </div>
    <button class="link-btn mt24" style="color:#A9B0CF;align-self:flex-start" data-go="/login">${ic('back')}${tt('사용자 로그인으로', 'Back to user sign-in')}</button>
    <p class="foot-note hint">${tt('가상의 데모 콘솔입니다.', 'Fictional demo console.')}</p>
  </div></div>` });
route('/login', V.login);

ACT['pick-acct'] = el => { App.ui.loginAcct = el.dataset.v; haptic(); const e = $('#lg-email'); if (e) e.value = el.dataset.v + '@quest.demo'; $$('.demo-acct').forEach(b => b.classList.toggle('on', b === el)); };
ACT['signup'] = () => toast(tt('데모에서는 가입 절차를 건너뜁니다. 데모 계정으로 로그인하세요.', 'Sign-up is skipped in the demo. Use a demo account.'));
ACT['login'] = async btn => {
  const email = ($('#lg-email').value || '').trim(), pw = $('#lg-pw').value || '';
  if (!/^\S+@\S+\.\S+$/.test(email)) return toast(tt('이메일 형식을 확인해 주세요.', 'Check the email format.'), 'warn');
  if (pw.length < 4) return toast(tt('비밀번호를 4자 이상 입력해 주세요.', 'Enter at least 4 characters.'), 'warn');
  await withLoading(btn, 750);
  App.state.session = { role:'user', mode: email.startsWith('supplier') ? 'supplier' : 'client', ts: Date.now() };
  App.save(); haptic('success'); App.go('/u/home', true);
};
ACT['otp-fill'] = () => { $$('#otp input').forEach((i, k) => i.value = '123456'[k]); };
ACT['otp'] = el => { el.value = el.value.replace(/\D/g, '').slice(0, 1); if (el.value){ const n = el.nextElementSibling; if (n) n.focus(); } };
ACT['admin-login'] = async btn => {
  const code = $$('#otp input').map(i => i.value).join('');
  if (code.length < 6) return toast(tt('2단계 인증 코드 6자리를 입력해 주세요.', 'Enter the 6-digit code.'), 'warn');
  if (code !== '123456') return toast(tt('코드가 맞지 않습니다. 데모 코드는 123456입니다.', 'Wrong code. The demo code is 123456.'), 'warn');
  await withLoading(btn, 900);
  App.state.session = { role:'admin', ts: Date.now() };
  App.state.admin.audit.unshift({ ts: Date.now(), t:{ ko:'콘솔 로그인 (2단계 인증 통과)', en:'Console sign-in (2FA passed)' } });
  App.save(); App.go('/a/dashboard', true);
};

/* ---------- home ---------- */
route('/u/home', () => mode() === 'supplier' ? U.supHome() : U.home());
U.home = () => {
  const S = App.state, qs = S.quests;
  const escrow = qs.filter(q => q.escrow && q.escrow.status === 'deposited').reduce((a, q) => a + priceOf(q), 0);
  const active = qs.filter(q => ['open', 'progress', 'review', 'dispute'].includes(q.status));
  const todos = [];
  qs.filter(q => q.status === 'review').forEach(q => todos.push({ go:`/u/quest/${q.id}?tab=review`, icon:'spark', tone:'good', t: tt(`${q.id} AI 예비 판정 결과 확인`, `Review AI pre-check for ${q.id}`), s: tt(`4개 기준 통과 · 이의기간 ${dday(q.verdict.windowEnds)}`, `All criteria passed · objection window ${dday(q.verdict.windowEnds)}`) }));
  qs.filter(q => q.status === 'open' && q.proposals.length).forEach(q => todos.push({ go:`/u/quest/${q.id}?tab=bids`, icon:'users', tone:'accent', t: tt(`제안 ${q.proposals.length}건 비교하기`, `Compare ${q.proposals.length} bids`), s: L(q.title) }));
  qs.filter(q => q.status === 'dispute').forEach(q => todos.push({ go:`/u/quest/${q.id}?tab=review`, icon:'gavel', tone:'warn', t: tt(`${q.id} 인간 재검수 진행 중`, `${q.id} under human re-review`), s: tt('결과가 나오면 알려드릴게요', 'We will notify you with the result') }));
  qs.filter(q => q.status === 'progress').forEach(q => todos.push({ go:`/u/quest/${q.id}?tab=chat`, icon:'msg', tone:'info', t: tt(`${q.id} 진행률 ${q.progress}%`, `${q.id} is ${q.progress}% done`), s: tt('수행사와 대화하기', 'Message the supplier') }));
  const mon = S.wallet.monthly, labels = monthLabels(6);
  return {
    top: topbar({ left: `<div class="hstack" style="padding-left:8px;gap:8px"><span style="width:28px;height:28px;display:block">${LOGO}</span></div>`, title: 'Quest', right: `<button class="icon-btn" data-go="/u/services" aria-label="${tt('서비스', 'Services')}">${ic('spark')}</button>${bellBtn()}` }),
    html: `
    <div class="mt8">
      <div class="h2">${tt(`안녕하세요, 발주사 ${S.me.clientAlias}님`, `Hi, client ${S.me.clientAlias}`)}</div>
      <div class="body-s mt4">${todos.length ? tt(`오늘 확인할 일이 ${todos.length}건 있어요`, `You have ${todos.length} things to check today`) : tt('오늘은 확인할 일이 없어요', 'Nothing needs you today')}</div>
    </div>
    <div class="hero-card mt16">
      <svg class="pattern" viewBox="0 0 40 40">${veilPattern('hero')}</svg>
      <div class="lbl">${tt('안전하게 예치 중인 대금', 'Held safely in escrow')}</div>
      <div class="big-num">${won(escrow)}</div>
      ${!isKo() ? `<div style="font-size:13px;opacity:.8">${usd(escrow)}</div>` : ''}
      <div class="sub"><div><span>${tt('진행 퀘스트', 'Active quests')}</span><b>${active.length}</b></div><div><span>${tt('지갑 잔액', 'Wallet')}</span><b>${won(S.wallet.balance)}</b></div><div><span>${tt('평균 노출 점수', 'Avg. exposure')}</span><b>${Math.round(qs.reduce((a, q) => a + q.exposure, 0) / qs.length)}</b></div></div>
    </div>
    <section class="section">
      <div class="section-head"><h2 class="h3">${tt('확인할 일', 'To do')}</h2></div>
      <div class="group">${todos.length ? todos.slice(0, 4).map(t => `<button class="todo" data-go="${t.go}"><span class="ico-box ${t.tone}">${ic(t.icon)}</span><div class="grow" style="flex:1;min-width:0"><div class="t">${t.t}</div><div class="s">${esc(t.s)}</div></div>${ic('chev', 'chev')}</button>`).join('') : emptyState('check', tt('모두 처리했어요', 'All caught up'))}</div>
    </section>
    <section class="section">
      <div class="section-head"><h2 class="h3">${tt('보호 서비스', 'Protection services')}</h2><button class="more" data-go="/u/services">${tt('전체', 'All')}${ic('chev')}</button></div>
      <div class="quick">
        ${[['exposure', 'eyeoff', 'accent', tt('노출 점검', 'Exposure check')], ['decompose', 'tree', 'violet', tt('퀘스트 분해', 'Decompose')], ['certificate', 'cert', 'good', tt('비밀관리 증명', 'Secrecy proof')], ['shipping', 'truck', 'warn', tt('블라인드 배송', 'Blind shipping')]].map(s => `<button data-go="/u/service/${s[0]}"><span class="ico-box ${s[2]}">${ic(s[1])}</span>${s[3]}</button>`).join('')}
      </div>
    </section>
    <section class="section">
      <div class="section-head"><h2 class="h3">${tt('진행 중인 퀘스트', 'Active quests')}</h2><button class="more" data-go="/u/quests">${tt('전체', 'All')}${ic('chev')}</button></div>
      ${active.slice(0, 3).map(qcard).join('') || emptyState('list', tt('진행 중인 퀘스트가 없어요', 'No active quests'))}
    </section>
    <section class="section">
      <div class="card">
        <div class="hstack between"><div><div class="caption">${tt('최근 6개월 발주액', 'Spend, last 6 months')}</div><div class="h3 mt4 tnum">${won(mon.reduce((a, b) => a + b, 0))}</div></div><span class="tag">${tt('월별', 'Monthly')}</span></div>
        <div class="spark-bars mt16">${mon.map((v, i) => `<div class="${i === mon.length - 1 ? 'cur' : ''}" style="height:${Math.max(4, v / Math.max(...mon) * 100)}%" title="${labels[i]} ${won(v)}"></div>`).join('')}</div>
        <div class="spark-labels">${labels.map(l => `<span>${l}</span>`).join('')}</div>
      </div>
    </section>
    <section class="section">
      <button class="card outline" style="width:100%;text-align:left;display:flex;gap:12px;align-items:center" data-go="/u/service/records">
        <span class="ico-box violet">${ic('chain')}</span>
        <div style="flex:1"><div class="h4">${tt('모든 기록은 체인에 해시로 남습니다', 'Every record is anchored on-chain')}</div><div class="caption mt4">${tt('Base 메인넷 · 마지막 앵커링', 'Base mainnet · last anchored')} ${ago(App.state.admin.batches[0].ts)}</div></div>
        <span class="pulse-dot"></span>
      </button>
    </section>`
  };
};
function veilPattern(seed){ const r = rng(seed); let s = ''; for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if (r() > .45){ s += `<rect x="${4 + x * 6.4}" y="${4 + y * 6.4}" width="6" height="6" rx="1.6" fill="#fff"/>`; if (x < 2) s += `<rect x="${4 + (4 - x) * 6.4}" y="${4 + y * 6.4}" width="6" height="6" rx="1.6" fill="#fff"/>`; } return s; }
function monthLabels(n){ const out = []; const d = new Date(NOW); for (let i = n - 1; i >= 0; i--){ const m = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(isKo() ? (m.getMonth() + 1) + '월' : m.toLocaleDateString('en-US', { month:'short' })); } return out; }

/* ---------- quest card & list ---------- */
function qcard(q){
  const sup = supplierOf(q);
  const right = q.status === 'done' ? `<span class="caption">${tt('완료', 'Done')} · ${fmtDate(q.deadline, 'full')}</span>` : `<span class="dday ${q.status === 'open' ? 'calm' : ''}">${dday(q.status === 'review' && q.verdict ? q.verdict.windowEnds : q.deadline)}</span>`;
  return `<button class="qcard" data-go="/u/quest/${q.id}">
    <div class="top"><span class="code">${q.id} · ${catLabel(q.cat)}</span>${statusPill(q.status)}</div>
    <div class="ttl">${esc(L(q.title))}</div>
    <div class="meta"><b>${won(priceOf(q))}</b><span class="sep"></span>${sup ? `<span class="hstack" style="gap:6px">${veil(sup.alias, 's')}<span style="font-size:12.5px">${tt('수행사', 'Supplier')} ${sup.alias}</span></span>` : `<span>${tt(`제안 ${q.proposals.length}건`, `${q.proposals.length} bids`)}</span>`}</div>
    ${q.status === 'progress' ? `<div class="bar mt12"><i style="width:${q.progress}%"></i></div>` : ''}
    <div class="foot"><span class="lock">${ic('eyeoff')}${tt('노출 점수', 'Exposure')} ${q.exposure}</span><span class="lock">${ic('chain')}${tt(`기록 ${q.records.length}`, `${q.records.length} record${q.records.length === 1 ? '' : 's'}`)}</span>${right}</div>
  </button>`;
}
route('/u/quests', (p, q) => {
  const f = q.f || 'all', s = (App.ui.qsearch || '').toLowerCase();
  const all = App.state.quests.filter(x => x.status !== 'draft' || true);
  const count = k => k === 'all' ? all.length : all.filter(x => x.status === k || (k === 'review' && x.status === 'dispute')).length;
  const list = all.filter(x => f === 'all' || x.status === f || (f === 'review' && x.status === 'dispute')).filter(x => !s || (L(x.title) + x.id).toLowerCase().includes(s));
  const F = [['all', tt('전체', 'All')], ['open', tt('제안 받는 중', 'Bidding')], ['progress', tt('수행 중', 'In progress')], ['review', tt('검수', 'Review')], ['done', tt('완료', 'Done')], ['draft', tt('작성 중', 'Drafts')]].filter(x => x[0] !== 'draft' || count('draft'));
  return {
    top: topbar({ title: tt('내 퀘스트', 'My quests'), right: `<button class="icon-btn" data-act="qsearch" aria-label="${tt('검색', 'Search')}">${ic('search')}</button>${bellBtn()}` }),
    html: `
      ${App.ui.qsearchOpen ? `<div class="input-wrap mt4"><input class="input" id="qs" placeholder="${tt('퀘스트 이름이나 번호', 'Quest name or number')}" value="${esc(App.ui.qsearch || '')}" data-in="qsearch-in"></div>` : ''}
      <div class="chips mt8">${F.map(x => `<button class="chip ${f === x[0] ? 'on' : ''}" data-go="/u/quests?f=${x[0]}">${x[1]} <span class="n">${count(x[0])}</span></button>`).join('')}</div>
      <div class="mt16" id="qlist">${list.map(qcard).join('') || emptyState('search', tt('조건에 맞는 퀘스트가 없어요', 'No quests match'), tt('필터를 바꾸거나 새 퀘스트를 만들어 보세요', 'Try another filter or create a quest'))}</div>`,
    mount(){ const i = $('#qs'); if (i && App.ui.qsearchFocus){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
  };
});
ACT['qsearch'] = () => { App.ui.qsearchOpen = !App.ui.qsearchOpen; if (!App.ui.qsearchOpen) App.ui.qsearch = ''; App.ui.qsearchFocus = App.ui.qsearchOpen; App.refresh(); };
ACT['qsearch-in'] = el => { App.ui.qsearch = el.value; App.ui.qsearchFocus = true; clearTimeout(App.ui.qsT); App.ui.qsT = setTimeout(() => App.refresh(), 180); };

/* ---------- quest detail ---------- */
const STEPS = [
  { ko:'게시', en:'Posted' }, { ko:'제안', en:'Bids' }, { ko:'계약·예치', en:'Contract' }, { ko:'수행', en:'Work' },
  { ko:'납품', en:'Delivery' }, { ko:'AI 판정', en:'AI check' }, { ko:'이의기간', en:'Objection' }, { ko:'확정', en:'Accepted' }
];
function centerStep(){ const box = $('.steps-h'), cur = $('.steps-h .sh.cur') || $$('.steps-h .sh.done').pop(); if (box && cur) box.scrollLeft = cur.offsetLeft - box.clientWidth / 2 + cur.offsetWidth / 2; }
function stepIndex(q){ return ({ draft:0, open:1, progress:3, review:6, dispute:6, hold:0, done:8 })[q.status] ?? 0; }
function stepper(q){
  const cur = stepIndex(q);
  return `<div class="steps-h" role="list">${STEPS.map((s, i) => `<div class="sh ${i < cur ? 'done' : i === cur ? 'cur' : ''}" role="listitem"><div class="d">${i < cur ? ic('check') : i + 1}</div>${L(s)}</div>`).join('')}</div>`;
}
route('/u/quest/:id', (p, qs) => {
  const q = findQuest(p.id);
  if (!q) return { top: topbar({ back:'/u/quests', title:'' }), html: emptyState('search', tt('퀘스트를 찾을 수 없어요', 'Quest not found')), noTabs:true };
  const tab = qs.tab || (q.status === 'open' ? 'bids' : q.status === 'review' || q.status === 'dispute' ? 'review' : 'overview');
  const T = [['overview', tt('개요', 'Overview')], ['bids', tt('제안', 'Bids'), q.proposals.length], ['chat', tt('대화', 'Chat')], ['review', tt('납품·검수', 'Delivery')], ['records', tt('기록', 'Records'), q.records.length]];
  let body = '', after = '';
  if (tab === 'overview') body = qOverview(q);
  if (tab === 'bids') body = qBids(q, qs.sort);
  if (tab === 'chat'){ const c = qChat(q); body = c.html; after = c.after; }
  if (tab === 'review'){ const r = qReview(q); body = r.html; after = r.after; }
  if (tab === 'records') body = qRecords(q);
  return {
    noTabs: true,
    top: topbar({ back:'/u/quests', title: q.id, sub: catLabel(q.cat), right: `<button class="icon-btn" data-act="q-menu" data-id="${q.id}" aria-label="${tt('더보기', 'More')}"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button>` }),
    html: `
      <div class="hstack mt4">${statusPill(q.status)}${q.revealed ? `<span class="pill plain st-done">${tt('신원 공개됨', 'Identities revealed')}</span>` : ''}</div>
      <h1 class="h2 mt8">${esc(L(q.title))}</h1>
      <div class="hstack mt12" style="align-items:baseline;gap:10px"><span class="big-num" style="font-size:26px">${won(priceOf(q))}</span>${wonHint(priceOf(q))}</div>
      <div class="caption mt4">${q.status === 'done' ? tt('완료된 퀘스트', 'Completed') : `${tt('마감', 'Due')} ${fmtDate(q.deadline)} · <b class="dday">${dday(q.deadline)}</b>`}</div>
      <div class="mt16">${stepper(q)}</div>
      <nav class="tabs mt12">${T.map(t => `<button class="${tab === t[0] ? 'on' : ''}" data-act="q-tab" data-id="${q.id}" data-tab="${t[0]}">${t[1]}${t[2] ? `<span class="n">${t[2]}</span>` : ''}</button>`).join('')}</nav>
      <div class="mt16" id="qbody">${body}</div>`,
    after,
    mount(){ centerStep(); if (tab === 'chat'){ const c = $('.chat'); if (c) window.scrollTo(0, document.body.scrollHeight); } }
  };
});
ACT['q-tab'] = el => { haptic(); App.ui.keepScroll = 0; App.go(`/u/quest/${el.dataset.id}?tab=${el.dataset.tab}`, true); };

function specRow(label, val){ return `<div class="row" style="align-items:flex-start"><div class="grow"><div class="caption">${label}</div><div class="mt4" style="font-size:14.5px;font-weight:550">${val}</div></div></div>`; }
function qOverview(q){
  const sup = supplierOf(q), rl = riskLabel(q.exposure);
  const locked = q.status === 'open';
  return `
    <div class="card hstack" style="gap:14px">
      <div style="width:84px;flex:none"><div class="gauge" style="width:84px;height:50px"><svg viewBox="0 0 180 104" style="width:84px;height:50px">${gaugeSvg(q.exposure).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></div></div>
      <div style="flex:1"><div class="h4">${tt('노출 점수', 'Exposure score')} <span class="tnum" style="color:${rl.c}">${q.exposure} · ${rl.t}</span></div><div class="caption mt4">${tt('AI가 이 명세만 보고 발주사를 추정하는 시도 3회가 모두 실패했습니다.', 'Three AI attempts to guess the client from this spec all failed.')}</div></div>
    </div>
    <h2 class="h4 mt20" style="margin-bottom:8px">${tt('퀘스트 명세', 'Quest spec')}</h2>
    <div class="group">
      ${specRow(tt('목표', 'Goal'), esc(L(q.goal)))}
      ${specRow(tt('제공 정보', 'Inputs provided') + (locked ? ` · <span style="color:var(--accent-ink)">${tt('계약 후 공개', 'shared after contract')}</span>` : ''), esc(L(q.provided)))}
      ${specRow(tt('접점 조건', 'Interface conditions'), esc(L(q.iface)))}
      ${specRow(tt('검수 기준', 'Acceptance criteria'), `<ul style="margin:0;padding-left:18px">${q.criteria.map(c => `<li>${esc(L(c))}</li>`).join('')}</ul>`)}
      ${specRow(tt('납품 형태', 'Delivery'), esc(L(q.delivery)))}
      ${specRow(tt('기한과 보상', 'Deadline & budget'), `${fmtDate(q.deadline, 'full')} · ${won(q.budget)} ${tt('(예산)', '(budget)')}`)}
      ${specRow(tt('자격 조건', 'Qualifications'), `<div class="hstack wrap mt4">${q.quals.map(k => tokenChip(k)).join('')}</div>`)}
      ${specRow(tt('공개 등급', 'Disclosure level'), esc(L(q.disclosure)))}
    </div>
    ${sup ? `<h2 class="h4 mt20" style="margin-bottom:8px">${tt('수행사', 'Supplier')}</h2>
    <div class="card">
      <div class="hstack" style="gap:12px">${veil(sup.alias, 'l')}<div style="flex:1"><div class="h4">${q.revealed ? esc(q.revealedName) : tt('수행사', 'Supplier') + ' ' + sup.alias}</div><div class="caption mt4">★ ${sup.rating} · ${tt(`완료 ${sup.jobs}건`, `${sup.jobs} jobs done`)}</div></div>${q.revealed ? '' : `<span class="tag">${ic('lock').replace('<svg', '<svg style="width:12px;height:12px;margin-right:3px"')}${tt('신원 비공개', 'Anonymous')}</span>`}</div>
      <div class="hstack wrap mt12">${sup.tokens.map(k => tokenChip(k)).join('')}</div>
      <div class="caption mt12">${tt('자격은 플랫폼이 원본을 확인한 뒤 토큰으로 발급했습니다. 회사명·소재지·규모는 보이지 않습니다.', 'Qualifications were verified from originals and issued as tokens. Name, location and size stay hidden.')}</div>
    </div>` : ''}
    <h2 class="h4 mt20" style="margin-bottom:8px">${tt('대금', 'Payment')}</h2>
    <div class="card">
      <dl class="kv">
        <dt>${tt('예치 상태', 'Escrow')}</dt><dd>${q.escrow.status === 'deposited' ? `<span style="color:var(--good)">${tt('예치 완료', 'Funded')}</span>` : q.escrow.status === 'released' ? tt('지급 완료', 'Released') : tt('계약 시 예치', 'Funded at contract')}</dd>
        <dt>${tt('지급 조건', 'Release')}</dt><dd>${tt('검수 확정 시', 'On acceptance')}</dd>
        <dt>${tt('세금계산서', 'Tax invoice')}</dt><dd>${tt('플랫폼 명의 발행', 'Issued by Quest')}</dd>
      </dl>
    </div>`;
}

/* ---- bids ---- */
function qBids(q, sort){
  if (!q.proposals.length) return `<div class="card">${emptyState('users', tt('아직 제안이 없어요', 'No bids yet'), tt('자격을 갖춘 수행사에게 알림이 발송되었습니다. 보통 24시간 안에 첫 제안이 도착합니다.', 'Qualified suppliers were notified. The first bid usually arrives within 24 hours.'))}<div class="skel" style="height:14px;width:60%;margin:0 auto 8px"></div><div class="skel" style="height:14px;width:40%;margin:0 auto 18px"></div></div>`;
  sort = sort || 'rec';
  let list = q.proposals.slice();
  if (sort === 'price') list.sort((a, b) => a.price - b.price);
  if (sort === 'days') list.sort((a, b) => a.days - b.days);
  if (sort === 'rec') list.sort((a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0) || b.rating - a.rating);
  const decided = !!q.selected;
  return `
    ${!decided ? `<div class="seg"><button class="${sort === 'rec' ? 'on' : ''}" data-act="bid-sort" data-id="${q.id}" data-v="rec">${tt('추천순', 'Recommended')}</button><button class="${sort === 'price' ? 'on' : ''}" data-act="bid-sort" data-id="${q.id}" data-v="price">${tt('가격순', 'Price')}</button><button class="${sort === 'days' ? 'on' : ''}" data-act="bid-sort" data-id="${q.id}" data-v="days">${tt('기간순', 'Timeline')}</button></div>
    <div class="ai-shield">${ic('shield')}${tt('제안자 이름·소재지는 가려져 있고, 자격 충족 여부만 보입니다.', 'Bidder names and locations are hidden. You only see which qualifications they meet.')}</div>` : ''}
    <div class="mt12">${list.map(pp => {
      const miss = q.quals.filter(k => !pp.tokens.includes(k));
      const chosen = q.selected === pp.id;
      return `<article class="prop ${pp.best && !decided ? 'best' : ''}" ${decided && !chosen ? 'style="opacity:.55"' : ''}>
        ${pp.best && !decided ? `<span class="ribbon">${tt('AI 추천 · 자격 전부 충족', 'AI pick · meets every qualification')}</span>` : ''}${chosen ? `<span class="ribbon">${tt('선택한 제안', 'Selected bid')}</span>` : ''}
        <div class="hd">${veil(pp.alias)}<div><div class="name">${tt('수행사', 'Supplier')} ${pp.alias}</div><div class="rating">${ic('star')}${pp.rating} · ${tt(`완료 ${pp.jobs}건`, `${pp.jobs} jobs`)}</div></div>
          <div class="price"><b>${won(pp.price)}</b><span>${tt(`${pp.days}일`, `${pp.days} days`)}</span></div></div>
        <div class="hstack wrap mt12">${q.quals.map(k => tokenChip(k, pp.tokens.includes(k))).join('')}</div>
        ${miss.length ? `<div class="caption mt8" style="color:var(--warn)">${tt(`자격 ${miss.length}개 미충족`, `${miss.length} qualification(s) missing`)}</div>` : ''}
        <div class="msg">${esc(L(pp.msg))}</div>
        ${!decided ? `<div class="hstack mt12"><button class="btn btn-line btn-m" style="flex:1" data-act="bid-ask" data-id="${q.id}" data-p="${pp.id}">${tt('질문하기', 'Ask')}</button><button class="btn btn-primary btn-m" style="flex:1.4" data-act="bid-pick" data-id="${q.id}" data-p="${pp.id}">${tt('이 제안 선택', 'Select this bid')}</button></div>` : ''}
      </article>`;
    }).join('')}</div>`;
}
ACT['bid-sort'] = el => App.go(`/u/quest/${el.dataset.id}?tab=bids&sort=${el.dataset.v}`, true);
ACT['bid-ask'] = el => {
  openSheet(`<div class="sh-title">${tt(`수행사 ${findQuest(el.dataset.id).proposals.find(x => x.id === el.dataset.p).alias}에게 질문`, 'Ask this bidder')}</div>
    <div class="sh-sub">${tt('계약 전 질문은 AI가 식별 정보를 가린 뒤 전달합니다.', 'Pre-contract questions are passed on after AI masks identifying details.')}</div>
    <textarea class="textarea mt16" id="ask-t" placeholder="${tt('예: HIL 장비 사양을 알려 주세요', 'e.g. What HIL rig do you use?')}"></textarea>
    <button class="btn btn-primary btn-block mt12" data-act="bid-ask-send">${tt('질문 보내기', 'Send question')}</button>`);
};
ACT['bid-ask-send'] = async btn => {
  const v = ($('#ask-t').value || '').trim(); if (!v) return toast(tt('질문을 입력해 주세요.', 'Type a question.'), 'warn');
  const m = maskText(v); await withLoading(btn, 700); closeLayer();
  toast(m.count ? tt(`식별 정보 ${m.count}건을 가리고 보냈습니다.`, `Sent with ${m.count} identifier(s) masked.`) : tt('질문을 보냈습니다.', 'Question sent.'), 'ok');
};
ACT['bid-pick'] = el => {
  const q = findQuest(el.dataset.id), pp = q.proposals.find(x => x.id === el.dataset.p);
  openSheet(`
    <div class="sh-title">${tt('계약 내용을 확인해 주세요', 'Review the contract')}</div>
    <div class="sh-sub">${tt('플랫폼이 양쪽 계약의 당사자가 되어 서로의 신원이 서류에 드러나지 않습니다.', 'Quest is party to both contracts, so neither side appears on the other\'s paperwork.')}</div>
    <div class="card outline mt16"><div class="hstack">${veil(pp.alias)}<div style="flex:1"><div class="h4">${tt('수행사', 'Supplier')} ${pp.alias}</div><div class="caption">★ ${pp.rating} · ${tt(`${pp.days}일`, `${pp.days} days`)}</div></div><b class="tnum" style="font-size:17px">${won(pp.price)}</b></div></div>
    <dl class="kv mt16">
      <dt>${tt('검수 기준', 'Criteria')}</dt><dd>${tt(`${q.criteria.length}개`, `${q.criteria.length}`)}</dd>
      <dt>${tt('검수 절차', 'Review flow')}</dt><dd>${tt('AI 예비 판정 → 7일 이의 → 인간 재검수', 'AI pre-check → 7-day objection → human review')}</dd>
      <dt>${tt('하도급 서면', 'Subcontract notice')}</dt><dd>${tt('자동 발급', 'Issued automatically')}</dd>
      <dt>${tt('신원 공개', 'Identity reveal')}</dt><dd>${tt('양측 동의 시에만', 'Only with mutual consent')}</dd>
    </dl>
    <label class="check mt16"><input type="checkbox" id="c-agree"> <span>${tt('표준 약관과 프로젝트별 비밀유지 조항에 동의합니다.', 'I agree to the standard terms and the project NDA.')}</span></label>
    <button class="btn btn-primary btn-block mt16" data-act="bid-contract" data-id="${q.id}" data-p="${pp.id}">${tt('전자서명하고 대금 예치로', 'Sign and go to escrow')}</button>`);
};
ACT['bid-contract'] = el => {
  if (!$('#c-agree').checked) return toast(tt('약관 동의가 필요합니다.', 'Please accept the terms.'), 'warn');
  const q = findQuest(el.dataset.id), pp = q.proposals.find(x => x.id === el.dataset.p), bal = App.state.wallet.balance, enough = bal >= pp.price;
  sheetBody(`
    <div class="sh-title">${tt('대금을 예치합니다', 'Fund the escrow')}</div>
    <div class="sh-sub">${tt('예치금은 검수가 확정될 때까지 제휴 은행 에스크로에 보관됩니다.', 'Funds stay in a partner-bank escrow until acceptance.')}</div>
    <div class="big-num mt16">${won(pp.price)}</div>${wonHint(pp.price)}
    <div class="stack mt16">
      <button class="select-card ${enough ? 'on' : ''}" data-act="pay-method" data-v="wallet" ${enough ? '' : 'disabled style="opacity:.5"'}><span class="ic">${ic('wallet')}</span><div><div class="h4">${tt('지갑 잔액으로 예치', 'Use wallet balance')}</div><div class="caption">${tt('보유', 'Available')} ${won(bal)}${enough ? '' : ' · ' + tt('잔액 부족', 'insufficient')}</div></div></button>
      <button class="select-card ${enough ? '' : 'on'}" data-act="pay-method" data-v="va"><span class="ic">${ic('building')}</span><div><div class="h4">${tt('가상계좌 발급', 'Issue a virtual account')}</div><div class="caption">${tt('건당 수수료 약 600원', 'About ₩600 per transfer')}</div></div></button>
    </div>
    <button class="btn btn-primary btn-block mt20" data-act="pay-go" data-id="${q.id}" data-p="${pp.id}">${tt('예치하기', 'Fund escrow')}</button>`);
  App.ui.payMethod = enough ? 'wallet' : 'va';
};
ACT['pay-method'] = el => { App.ui.payMethod = el.dataset.v; $$('#layer .select-card').forEach(b => b.classList.toggle('on', b === el)); haptic(); };
ACT['pay-go'] = async el => {
  const q = findQuest(el.dataset.id), pp = q.proposals.find(x => x.id === el.dataset.p);
  const va = '562-910-' + String(10 + Math.floor(Math.random() * 89)).padStart(2, '0') + '-' + String(Math.floor(100000 + Math.random() * 899999));
  const stepsHtml = (k, extra) => `<div class="sh-title">${tt('처리 중입니다', 'Processing')}</div>${extra || ''}<div class="stack mt16" id="pay-steps">${[tt('계약서 전자서명', 'E-signing the contract'), tt('하도급 서면 자동 발급', 'Issuing subcontract notice'), tt('예치 확인', 'Confirming escrow'), tt('체인에 계약 해시 기록', 'Anchoring contract hash')].map((s, i) => `<div class="hstack" style="gap:10px">${i < k ? `<span class="ok-ic">${ic('check')}</span>` : i === k ? '<span class="spinner" style="width:22px;height:22px"></span>' : `<span class="wait-ic">${ic('clock')}</span>`}<span style="font-size:14.5px;${i > k ? 'color:var(--muted)' : ''}">${s}</span></div>`).join('')}</div>`;
  if (App.ui.payMethod === 'va'){
    const vaBox = `<div class="card outline mt16"><div class="caption">${tt('제휴은행 가상계좌 (데모)', 'Partner bank virtual account (demo)')}</div><div class="hstack between mt4"><b class="tnum" style="font-size:18px">${va}</b><button class="btn btn-gray btn-s" data-act="copy" data-text="${va}">${ic('copy')}${tt('복사', 'Copy')}</button></div><div class="caption mt8">${tt('입금자명: Quest 에스크로 · 데모에서는 입금이 자동 확인됩니다.', 'Payee: Quest Escrow · deposits auto-confirm in the demo.')}</div></div><div class="hstack mt12" style="gap:8px"><span class="spinner"></span><span class="body-s">${tt('입금 확인 중…', 'Waiting for deposit…')}</span></div>`;
    sheetBody(`<div class="sh-title">${tt('가상계좌로 입금해 주세요', 'Transfer to this virtual account')}</div><div class="big-num mt12">${won(pp.price)}</div>${vaBox}`);
    await sleep(2600);
    if (!App.ui.layerOpen) return;
  }
  for (let k = 0; k <= 4; k++){ sheetBody(stepsHtml(k)); await sleep(k === 0 ? 500 : 650); if (!App.ui.layerOpen && k < 4) return; }
  q.selected = pp.id; q.status = 'progress'; q.progress = 5; q.escrow = { status:'deposited', vaccount: va };
  if (App.ui.payMethod === 'wallet') App.state.wallet.balance -= pp.price;
  App.state.wallet.txs.unshift({ t:{ ko:`${q.id} 대금 예치`, en:`Escrow for ${q.id}` }, amt:-pp.price, ts:Date.now(), kind:'escrow' });
  q.chat.push({ from:'sys', text:{ ko:'계약이 체결되었습니다. 이 대화는 AI 중재를 거치며 식별 정보는 자동으로 가려집니다.', en:'Contract signed. This chat is AI-mediated and identifying details are masked automatically.' }, ts:Date.now() });
  addChain(q, EV.contract); addChain(q, EV.escrow);
  addNotif({ aud:'client', icon:'check', tone:'good', go:`/u/quest/${q.id}?tab=overview`, t:{ ko:`${q.id} 계약과 예치가 완료되었습니다`, en:`${q.id} contract signed and funded` }, s:{ ko:`수행사 ${pp.alias}가 작업을 시작합니다.`, en:`Supplier ${pp.alias} is starting work.` } });
  App.save();
  sheetBody(`<div class="success-burst"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
    <div class="sh-title center mt16">${tt('계약과 예치가 끝났습니다', 'Contract signed and funded')}</div>
    <div class="sh-sub center">${tt(`수행사 ${pp.alias}에게 계약 후 공개 자료가 전달되었습니다.`, `Post-contract materials were released to supplier ${pp.alias}.`)}</div>
    <button class="btn btn-primary btn-block mt20" data-act="layer-close-go" data-go-to="/u/quest/${q.id}?tab=overview">${tt('퀘스트로 돌아가기', 'Back to quest')}</button>`);
  haptic('success');
};
ACT['layer-close-go'] = el => { closeLayer(true); App.go(el.dataset.goTo, true); App.refresh(); };

/* ---- chat with AI masking ---- */
const MASK_RULES = [
  { re:/[\w.+-]+@[\w-]+\.[\w.]+/g, k:'email' },
  { re:/0\d{1,2}[-\s.]?\d{3,4}[-\s.]?\d{4}/g, k:'phone' },
  { re:/\(주\)\s?[가-힣A-Za-z]+|주식회사\s?[가-힣A-Za-z]+|[가-힣]{2,}(로보틱스|정밀|엔지니어링|모빌리티|테크|산업)/g, k:'company' },
  { re:/\b[A-Z][A-Za-z]+ (Inc|Corp|Robotics|Motors|Industries)\.?/g, k:'company' },
  { re:/\b[A-Z]{2,}-[A-Z]{2,}-\d{2,}\b/g, k:'docno' },
  { re:/[Pp]roject\s[A-Z][a-z]+|프로젝트\s?[A-Z][A-Za-z]+/g, k:'codename' },
  { re:/https?:\/\/\S+/g, k:'url' }
];
function maskText(s){
  let count = 0, out = s;
  MASK_RULES.forEach(r => { out = out.replace(r.re, () => { count++; return '\u0000' + r.k + '\u0000'; }); });
  return { count, text: out };
}
function renderMasked(s){ return esc(s).replace(/\u0000(\w+)\u0000/g, (_, k) => `<mark>${tt('가림', 'masked')}</mark>`); }
function qChat(q){
  if (!q.selected) return { html: `<div class="card">${emptyState('lock', tt('계약 후 대화할 수 있어요', 'Chat opens after contract'), tt('계약 전 질문은 제안 카드의 "질문하기"를 이용하세요.', 'Before contract, use "Ask" on a bid card.'))}</div>`, after:'' };
  const sup = supplierOf(q);
  const msgs = q.chat.map(m => {
    if (m.from === 'sys') return `<div class="sys">${ic('shield')}<span>${esc(L(m.text))}</span></div>`;
    const text = typeof m.text === 'string' ? renderMasked(m.text) : esc(L(m.text));
    const note = m.masked ? `<div class="sys" style="margin-top:6px;${m.from === 'me' ? 'align-self:flex-end' : ''}">${ic('eyeoff')}<span>${tt(`AI 중재: 식별 정보 ${m.masked}건을 가리고 전달했습니다`, `AI mediator masked ${m.masked} identifier(s) before sending`)}</span></div>` : '';
    return `<div class="msg ${m.from === 'me' ? 'me' : 'them'}">${m.from === 'me' ? '' : `<div class="who">${veil(sup.alias, 's').replace('class="veil s"', 'class="veil" style="width:18px;height:18px;border-radius:5px"')}${tt('수행사', 'Supplier')} ${sup.alias}</div>`}${text}<div class="tm">${fmtDate(m.ts, 'dt')}</div></div>${note}`;
  }).join('');
  const closed = q.status === 'done';
  return {
    html: `<div class="chat" id="chat">${msgs}${App.ui.typing === q.id ? '<div class="typing"><i></i><i></i><i></i></div>' : ''}</div>`,
    after: closed ? '' : `<div class="composer"><textarea id="chat-in" rows="1" placeholder="${tt('메시지 입력 · 회사명·연락처는 자동으로 가려져요', 'Message · names and contacts are masked')}" aria-label="${tt('메시지', 'Message')}"></textarea><button data-act="chat-send" data-id="${q.id}" aria-label="${tt('보내기', 'Send')}">${ic('send')}</button></div>`
  };
}
const REPLIES = [
  { re:/일정|기한|언제|deadline|when|schedule/i, ko:'현재 일정대로 진행 중입니다. 마감 3일 전까지 초안을 먼저 공유드리겠습니다.', en:'We are on schedule and will share a draft three days before the deadline.' },
  { re:/파일|자료|도면|file|data|drawing/i, ko:'자료 확인했습니다. 추가로 필요한 항목이 있으면 목록으로 정리해 요청드리겠습니다.', en:'Received. If we need anything else we will send a list.' },
  { re:/비용|가격|금액|price|cost/i, ko:'범위 변경이 있으면 변경 요청으로 올려 주세요. 영향받는 기한과 금액을 함께 제안드리겠습니다.', en:'For scope changes, please file a change request and we will propose the impact on timeline and price.' },
  { re:/.*/, ko:'확인했습니다. 반영해서 진행하겠습니다.', en:'Noted. We will proceed accordingly.' }
];
ACT['chat-send'] = el => {
  const inp = $('#chat-in'); const v = (inp.value || '').trim(); if (!v) return;
  const q = findQuest(el.dataset.id), m = maskText(v);
  q.chat.push({ from:'me', text:m.text, ts:Date.now(), masked:m.count });
  App.save(); haptic(); inp.value = '';
  if (m.count) toast(tt(`식별 정보 ${m.count}건을 가렸습니다`, `${m.count} identifier(s) masked`), 'warn');
  App.ui.typing = q.id; App.refresh();
  const qid = q.id;
  setTimeout(() => {
    const r = REPLIES.find(x => x.re.test(v));
    const qq = findQuest(qid); qq.chat.push({ from:'them', text:{ ko:r.ko, en:r.en }, ts:Date.now() });
    App.ui.typing = null; App.save();
    if (parsePath(currentPath()).path === '/u/quest/' + qid && parsePath(currentPath()).q.tab === 'chat'){ App.refresh(); window.scrollTo(0, document.body.scrollHeight); }
  }, 1600);
};
document.addEventListener('keydown', e => { if (e.target && e.target.id === 'chat-in' && e.key === 'Enter' && !e.shiftKey && !e.isComposing){ e.preventDefault(); const b = $('.composer button'); if (b) b.click(); } });

/* ---- delivery & review ---- */
function fileRow(f, act){ return `<div class="file"><span class="ext ${f.ext}">${f.ext.toUpperCase()}</span><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.name)}</div><div class="caption">${f.size}</div></div>${act || ''}</div>`; }
function verdictPanel(v, criteria){
  const warn = v.state !== 'pass';
  return `<div class="verdict ${warn ? 'warn' : ''}">
    <div class="vh"><span class="ico-box ${warn ? 'warn' : 'good'}">${ic(warn ? 'alert' : 'spark')}</span><div style="flex:1"><div class="h4">${warn ? tt('AI 예비 판정: 확인 필요', 'AI pre-check: needs attention') : tt('AI 예비 판정: 통과', 'AI pre-check: passed')}</div><div class="caption mt4">${tt(`두 모델 독립 판정 · ${v.agree}/${v.total} 일치 · 위치 바꿔 재판정 완료`, `Two models judged independently · ${v.agree}/${v.total} agree · order-swapped rerun done`)}</div></div></div>
    <div class="models"><div><b>Claude Opus 5</b>${tt('기본 판정 · 무보존', 'Primary · zero retention')}</div><div><b>OpenAI</b>${tt('교차 검토 · 국내 저장', 'Cross-check · KR storage')}</div></div>
    ${criteria.map((c, i) => { const r = v.criteria[i] || {}; return `<div class="crit"><span>${esc(L(c))}</span><span class="${r.a ? 'ok-ic' : 'no-ic'}" title="Claude">${ic(r.a ? 'check' : 'x')}</span><span class="${r.b ? 'ok-ic' : 'no-ic'}" title="OpenAI">${ic(r.b ? 'check' : 'x')}</span>${r.r ? `<span class="r">${esc(L(r.r))}</span>` : ''}</div>`; }).join('')}
  </div>`;
}
function qReview(q){
  if (q.status === 'open') return { html: `<div class="card">${emptyState('box', tt('계약 후 납품이 시작됩니다', 'Delivery starts after contract'))}</div>`, after:'' };
  if (q.status === 'progress'){
    return { html: `<div class="card"><div class="hstack between"><div class="h4">${tt('진행률', 'Progress')}</div><b class="tnum">${q.progress}%</b></div><div class="bar mt12"><i style="width:${q.progress}%"></i></div>
      <div class="tl mt20">${[[tt('자료 수령 확인', 'Inputs received'), 1], [tt('중간 결과 공유', 'Interim results'), q.progress >= 50], [tt('최종 납품', 'Final delivery'), 0]].map(x => `<div class="tl-item ${x[1] ? '' : 'muted-dot'}"><div class="t">${x[0]}</div><div class="s">${x[1] ? tt('완료', 'Done') : tt('예정', 'Upcoming')}</div></div>`).join('')}</div></div>
      ${q.reworkNote ? `<div class="card outline mt12"><div class="h4" style="color:var(--warn)">${tt('재작업 요청 진행 중', 'Rework in progress')}</div><div class="body-s mt4">${esc(L(q.reworkNote))}</div></div>` : ''}
      <div class="ai-shield">${ic('info')}${tt('납품물이 올라오면 AI가 검수 기준대로 예비 판정을 하고 알려드립니다.', 'When files arrive, AI pre-checks them against your criteria and notifies you.')}</div>`, after:'' };
  }
  const files = q.deliverables.map(f => fileRow(f, `<button class="btn btn-gray btn-s" data-act="file-view" data-id="${q.id}" data-f="${esc(f.name)}">${tt('보기', 'View')}</button>`)).join('');
  let state = '', after = '';
  if (q.status === 'review'){
    state = `<div class="card outline mt12 hstack" style="gap:12px"><span class="ico-box warn">${ic('clock')}</span><div style="flex:1"><div class="h4">${tt('이의기간', 'Objection window')} <span class="dday">${dday(q.verdict.windowEnds)}</span></div><div class="caption mt4">${tt('기간 안에 이의가 없으면 검수가 자동 확정되고 대금이 지급됩니다.', 'If no objection is filed, acceptance is automatic and funds are released.')}</div></div></div>`;
    after = `<div class="cta-bar"><button class="btn btn-line" data-act="obj-open" data-id="${q.id}">${tt('이의 제기', 'Object')}</button><button class="btn btn-primary" style="flex:1.6" data-act="accept" data-id="${q.id}">${tt('검수 확정하고 지급', 'Accept and release')}</button></div>`;
  }
  if (q.status === 'dispute'){
    const r = App.state.admin.reviews.find(x => x.id === q.reviewId);
    state = `<div class="card mt12"><div class="h4">${tt('인간 재검수 진행 중', 'Human re-review in progress')}</div><div class="caption mt4">${tt('하도급법상 10일 안에 결과를 통지합니다.', 'The result is due within 10 days under subcontracting law.')} ${r ? `(${dday(r.due)})` : ''}</div>
      <div class="tl mt16">${[[tt('이의 접수', 'Objection received'), 1], [tt('전문 검수자 배정', 'Expert reviewer assigned'), 1], [tt('판정 재현 패키지로 재실행', 'Rerun from reproduction package'), 0], [tt('결과 통지', 'Decision sent'), 0]].map(x => `<div class="tl-item ${x[1] ? '' : 'muted-dot'}"><div class="t">${x[0]}</div></div>`).join('')}</div>
      <div class="caption mt12">${tt('데모 팁: 관리자로 로그인하면 이 건을 직접 판정할 수 있습니다.', 'Demo tip: sign in as admin to decide this case yourself.')}</div></div>`;
  }
  if (q.status === 'done'){
    state = `<div class="card outline mt12 hstack" style="gap:12px"><span class="ico-box good">${ic('check')}</span><div style="flex:1"><div class="h4">${tt('검수 확정 · 지급 완료', 'Accepted · paid')}</div><div class="caption mt4">${q.resolution ? esc(L(q.resolution)) : tt('세금계산서는 플랫폼 명의로 발행되었습니다.', 'The tax invoice was issued by Quest.')}</div></div></div>`;
  }
  return { html: `<h2 class="h4" style="margin-bottom:8px">${tt('납품물', 'Deliverables')}</h2>${files}
    <h2 class="h4 mt20" style="margin-bottom:8px">${tt('AI 예비 판정', 'AI pre-check')}</h2>${verdictPanel(q.verdict, q.criteria)}
    <div class="hash mt8">${ic('hash').replace('<svg', '<svg style="width:13px;height:13px"')}${tt('판정 재현 패키지', 'Reproduction package')} ${shortHash(txHash(q.id + 'verdict'))}</div>
    ${state}`, after };
}
ACT['file-view'] = el => {
  const q = findQuest(el.dataset.id);
  openSheet(`<div class="sh-title">${esc(el.dataset.f)}</div><div class="sh-sub">${tt('데모 미리보기 · 원본은 암호화되어 변경 불가 저장소에 보관됩니다.', 'Demo preview · originals are encrypted in write-once storage.')}</div>
    <div class="card outline mt16" style="padding:20px">
      <div class="h4">${esc(L(q.title))}</div><div class="caption mt4">${tt('요약', 'Summary')}</div>
      ${q.verdict.criteria.map(c => `<div class="hstack mt12" style="gap:8px;align-items:flex-start"><span class="ok-ic" style="flex:none">${ic('check')}</span><span class="body-s">${esc(L(c.r))}</span></div>`).join('')}
      <div class="skel mt20" style="height:120px"></div>
    </div>
    <div class="hash mt12">SHA-256 ${shortHash('0x' + hexOf(el.dataset.f, 64))}</div>
    <button class="btn btn-gray btn-block mt16" data-act="layer-close">${tt('닫기', 'Close')}</button>`);
};
ACT['accept'] = async el => {
  const q = findQuest(el.dataset.id), sup = supplierOf(q);
  const ok = await confirmBox({ title: tt('검수를 확정할까요?', 'Confirm acceptance?'), body: tt(`${won(priceOf(q))}이 수행사 ${sup.alias}에게 지급됩니다. 확정 후에는 되돌릴 수 없습니다.`, `${won(priceOf(q))} will be released to supplier ${sup.alias}. This cannot be undone.`), ok: tt('확정하고 지급', 'Accept and release') });
  if (!ok) return;
  q.status = 'done'; q.escrow.status = 'released';
  addChain(q, EV.accept); addChain(q, EV.pay);
  App.state.wallet.txs.unshift({ t:{ ko:`${q.id} 지급 확정`, en:`${q.id} released` }, amt:priceOf(q), ts:Date.now(), kind:'release' });
  const inv = App.state.wallet.invoices.find(i => i.q === q.id); if (inv) inv.st = { ko:'발행 완료', en:'Issued' };
  App.state.admin.payouts.unshift({ id:uid('P'), quest:q.id, sup:sup.alias, amt:Math.round(priceOf(q) * .85), due:Date.now(), status:'ready' });
  addNotif({ aud:'client', icon:'check', tone:'good', go:`/u/quest/${q.id}?tab=review`, t:{ ko:`${q.id} 검수 확정`, en:`${q.id} accepted` }, s:{ ko:'세금계산서가 플랫폼 명의로 발행되었습니다.', en:'The tax invoice was issued by Quest.' } });
  App.save(); toast(tt('검수를 확정했습니다. 대금 지급이 시작됩니다.', 'Accepted. Payment release has started.'), 'ok'); App.refresh();
};
ACT['obj-open'] = el => {
  const q = findQuest(el.dataset.id);
  App.ui.objReason = null;
  openSheet(`<div class="sh-title">${tt('이의를 제기합니다', 'File an objection')}</div>
    <div class="sh-sub">${tt('전문 검수자가 판정 재현 패키지로 같은 입력을 다시 돌려 확인합니다. 입증 책임을 수행사에게 넘기지 않습니다.', 'An expert reruns the same inputs from the reproduction package. The burden of proof is not shifted to the supplier.')}</div>
    <div class="label mt16">${tt('어떤 기준에 대한 이의인가요?', 'Which criterion?')}</div>
    <div class="stack mt8">${q.criteria.map((c, i) => `<label class="check"><input type="radio" name="obj-c" value="${i}"> <span>${esc(L(c))}</span></label>`).join('')}</div>
    <div class="field mt16"><label for="obj-t">${tt('사유', 'Reason')}</label><textarea class="textarea" id="obj-t" placeholder="${tt('예: 하중 조건 3의 경계조건이 명세와 다르게 적용되었습니다.', 'e.g. Boundary conditions for load case 3 differ from the spec.')}"></textarea></div>
    <button class="dropzone mt12" data-act="obj-attach">${ic('upload')}<div>${tt('증빙 파일 첨부 (선택)', 'Attach evidence (optional)')}</div></button>
    <div id="obj-files" class="mt8"></div>
    <button class="btn btn-primary btn-block mt16" data-act="obj-submit" data-id="${q.id}">${tt('이의 제기하기', 'Submit objection')}</button>`);
};
ACT['obj-attach'] = () => { $('#obj-files').innerHTML = fileRow({ name:'loadcase3_boundary_check.pdf', size:'640 KB', ext:'pdf' }); haptic(); };
ACT['obj-submit'] = async btn => {
  const q = findQuest(btn.dataset.id);
  const sel = $('input[name="obj-c"]:checked'); const t = ($('#obj-t').value || '').trim();
  if (!sel) return toast(tt('기준을 하나 골라 주세요.', 'Pick a criterion.'), 'warn');
  if (t.length < 5) return toast(tt('사유를 5자 이상 적어 주세요.', 'Describe the reason (5+ characters).'), 'warn');
  await withLoading(btn, 800);
  const ci = +sel.value; const sup = supplierOf(q);
  const rid = 'R-' + (1042 + App.state.admin.reviews.filter(r => r.fromDemo).length);
  App.state.admin.reviews.unshift({ id:rid, fromDemo:true, quest:q.id, kind:'objection', by:'client', status:'open', due:Date.now() + 10 * DAY, amount:priceOf(q), sup:sup.alias, cli:App.state.me.clientAlias,
    title:{ ko:`${L(q.criteria[ci])} 기준 이의`, en:`Objection on "${q.criteria[ci].en}"` }, reason:{ ko:'발주사: "' + t + '"', en:'Client: "' + t + '"' },
    crit: q.criteria.map((c, i) => ({ t:c, a:q.verdict.criteria[i].a, b:q.verdict.criteria[i].b, note: q.verdict.criteria[i].r })) });
  q.status = 'dispute'; q.reviewId = rid; addChain(q, EV.objection);
  addNotif({ aud:'client', icon:'gavel', tone:'warn', go:`/u/quest/${q.id}?tab=review`, t:{ ko:`${q.id} 이의가 접수되었습니다`, en:`Objection filed on ${q.id}` }, s:{ ko:'전문 검수자가 배정되었습니다.', en:'An expert reviewer has been assigned.' } });
  App.save(); closeLayer(true); toast(tt('이의를 접수했습니다. 10일 안에 결과를 알려드립니다.', 'Objection filed. You will hear back within 10 days.'), 'ok'); App.refresh();
};

/* ---- records ---- */
function qRecords(q){
  const verified = App.ui.verified || {};
  return `<div class="card hstack" style="gap:12px"><span class="ico-box violet">${ic('chain')}</span><div style="flex:1"><div class="h4">${tt(`기록 ${q.records.length}건 · Base 메인넷`, `${q.records.length} records · Base mainnet`)}</div><div class="caption mt4">${tt('내용은 올리지 않고 해시만 남깁니다. 원본은 암호화해 따로 보관합니다.', 'Only hashes go on-chain. Originals are encrypted and stored separately.')}</div></div></div>
    <div class="card mt12"><div class="tl">${q.records.slice().reverse().map((r, i) => { const key = q.id + r.tx; return `<div class="tl-item"><div class="t">${esc(L(r.ev))}</div><div class="s">${fmtDate(r.ts, 'dt')} · ${tt('블록', 'Block')} #${num(r.block)}</div>
      <div class="hstack wrap" style="gap:6px"><span class="hash ${verified[key] ? 'ok' : ''}">${verified[key] ? ic('check').replace('<svg', '<svg style="width:13px;height:13px"') : ''}${shortHash(r.tx)}</span><button class="link-btn mt4" data-act="rec-verify" data-k="${key}">${verified[key] ? tt('일치 확인됨', 'Verified') : tt('검증', 'Verify')}</button><button class="link-btn mt4" data-act="copy" data-text="${r.tx}">${tt('복사', 'Copy')}</button></div></div>`; }).join('')}</div></div>
    <div class="caption mt12">${tt('블록체인 기록은 위변조 여부를 확인할 수 있는 보조 기록입니다. 법적 증거력을 보장하지는 않습니다.', 'On-chain records help detect tampering. They are not a guarantee of legal evidentiary weight.')}</div>`;
}
ACT['rec-verify'] = async el => {
  el.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px"></span>';
  await sleep(900);
  App.ui.verified = App.ui.verified || {}; App.ui.verified[el.dataset.k] = true;
  toast(tt('원본 해시와 체인 기록이 일치합니다.', 'Original hash matches the on-chain record.'), 'ok'); App.refresh();
};

/* ---- quest menu: share, reveal, certificate ---- */
ACT['q-menu'] = el => {
  const q = findQuest(el.dataset.id);
  const canReveal = ['progress', 'review', 'done'].includes(q.status) && !q.revealed;
  openSheet(`<div class="sh-title">${q.id}</div>
    <div class="group mt16" style="box-shadow:none;border:1px solid var(--line)">
      <button class="row" data-act="q-share" data-id="${q.id}"><span class="ico-box">${ic('copy')}</span><div class="grow"><div class="t">${tt('퀘스트 링크 공유', 'Share quest link')}</div><div class="s">${tt('팀원에게만 보입니다', 'Visible to your team only')}</div></div></button>
      <button class="row" data-act="cert-open" data-id="${q.id}"><span class="ico-box good">${ic('cert')}</span><div class="grow"><div class="t">${tt('비밀관리 증명서 발급', 'Issue secrecy proof')}</div><div class="s">${tt('누구에게 언제 무엇을 공개했는지 기록', 'What was disclosed, to whom, and when')}</div></div></button>
      ${canReveal ? `<button class="row" data-act="reveal-open" data-id="${q.id}"><span class="ico-box warn">${ic('eye')}</span><div class="grow"><div class="t">${tt('신원 공개 요청', 'Request identity reveal')}</div><div class="s">${tt('양측 동의 시 · 거래액의 10%', 'Mutual consent · 10% of deal value')}</div></div></button>` : ''}
      <button class="row" data-act="q-dup" data-id="${q.id}"><span class="ico-box">${ic('plus')}</span><div class="grow"><div class="t">${tt('이 명세로 새 퀘스트', 'New quest from this spec')}</div></div></button>
    </div>`);
};
ACT['q-share'] = el => { closeLayer(); shareText(`Quest ${el.dataset.id} · https://quest.demo/q/${el.dataset.id}`); };
ACT['q-dup'] = el => { closeLayer(true); const q = findQuest(el.dataset.id); App.ui.draft = newDraft(q.cat, q); App.go('/u/new?step=2'); };
ACT['reveal-open'] = el => {
  const q = findQuest(el.dataset.id), fee = Math.round(priceOf(q) * .1);
  sheetBody(`<div class="sh-title">${tt('신원을 공개할까요?', 'Reveal identities?')}</div>
    <div class="sh-sub">${tt('상대방이 동의해야 공개됩니다. 거절해도 거래에는 영향이 없습니다. 공개 후 직접 거래는 자유이며, 공개 시점에 전환 수수료가 부과됩니다.', 'The other side must agree. Declining has no effect on the deal. After reveal you may work directly; a conversion fee applies at reveal.')}</div>
    <dl class="kv mt16"><dt>${tt('공개 전환 수수료', 'Conversion fee')}</dt><dd>${won(fee)}</dd><dt>${tt('산정 기준', 'Basis')}</dt><dd>${tt('거래액의 10%', '10% of deal value')}</dd></dl>
    <button class="btn btn-primary btn-block mt20" data-act="reveal-go" data-id="${q.id}">${tt('공개 요청 보내기', 'Send reveal request')}</button>`);
};
ACT['reveal-go'] = async btn => {
  const q = findQuest(btn.dataset.id);
  addChain(q, EV.reveal);
  sheetBody(`<div class="sh-title">${tt('상대방의 동의를 기다리고 있어요', 'Waiting for consent')}</div><div class="hstack mt16" style="gap:10px"><span class="spinner"></span><span class="body-s">${tt('수행사에게 요청을 보냈습니다', 'Request sent to the supplier')}</span></div>`);
  await sleep(2800); if (!App.ui.layerOpen) return;
  const names = { A7F2:'(주)세움엔지니어링 (데모)', B3K9:'임베드웍스 (데모)', C5E1:'데이터포지 (데모)', H9P3:'(주)정원정밀 (데모)', E2T8:'써멀랩 (데모)', F71C:'코드브릿지 (데모)', M2D4:'(주)펌텍 (데모)' };
  q.revealed = true; q.revealedName = names[supplierOf(q).alias] || tt('상대 회사 (데모)', 'Counterparty (demo)');
  App.save();
  sheetBody(`<div class="success-burst"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
    <div class="sh-title center mt16">${tt('상대방이 동의했습니다', 'The supplier agreed')}</div>
    <div class="card outline mt16 hstack">${veil(supplierOf(q).alias)}<div><div class="h4">${esc(q.revealedName)}</div><div class="caption">${tt('수행사', 'Supplier')} ${supplierOf(q).alias}</div></div></div>
    <button class="btn btn-primary btn-block mt16" data-act="layer-close-go" data-go-to="/u/quest/${q.id}?tab=overview">${tt('확인', 'Done')}</button>`);
};
ACT['cert-open'] = el => { closeLayer(true); App.go('/u/service/certificate?q=' + el.dataset.id); };
