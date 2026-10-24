/* Quest demo — user app, part 2: create wizard, services, wallet, me, notifications, supplier mode */
'use strict';

/* ================= create quest wizard ================= */
const CAT_TPL = {
  struct:{ budget:15000000, quals:['ansys','secure'], title:{ ko:'브래킷 정하중 해석', en:'Static analysis of a mounting bracket' }, goal:{ ko:'주어진 하중 조건에서 브래킷의 안전계수를 입증하는 해석 보고서', en:'An analysis report proving the bracket\'s safety factor under the given loads' },
    crit:[{ ko:'안전계수 1.5 이상 입증', en:'Safety factor ≥ 1.5 demonstrated', on:1 }, { ko:'메시 수렴성 보고', en:'Mesh convergence reported', on:1 }, { ko:'결과 CSV 제출', en:'Results as CSV', on:1 }, { ko:'피로 수명 계산서 포함', en:'Fatigue life calculation', on:0 }] },
  thermal:{ budget:18000000, quals:['cfd','secure'], title:{ ko:'냉각판 열 해석', en:'Cooling plate thermal analysis' }, goal:{ ko:'발열 조건에서 최고 온도가 기준 이하임을 검증', en:'Verify max temperature stays under the limit' },
    crit:[{ ko:'최고 온도 기준 이하 입증', en:'Max temperature under limit', on:1 }, { ko:'압력 강하 기준 이하', en:'Pressure drop under limit', on:1 }, { ko:'메시 수렴성 보고', en:'Mesh convergence reported', on:0 }] },
  embedded:{ budget:20000000, quals:['misra','secure'], title:{ ko:'센서 인터페이스 펌웨어', en:'Sensor interface firmware' }, goal:{ ko:'제공 사양을 만족하는 펌웨어와 테스트 리포트', en:'Firmware meeting the spec, with a test report' },
    crit:[{ ko:'테스트 통과율 100%', en:'100% test pass rate', on:1 }, { ko:'정적 분석 경고 0건', en:'Zero static-analysis warnings', on:1 }, { ko:'MISRA-C 필수 규칙 위반 0건', en:'Zero MISRA-C mandatory violations', on:0 }] },
  data:{ budget:8000000, quals:['stats','secure'], title:{ ko:'시험 로그 통계 분석', en:'Test log statistical analysis' }, goal:{ ko:'지정 통계량을 재현 오차 1% 이내로 산출', en:'Compute the given metrics within 1% reproduction error' },
    crit:[{ ko:'재현 오차 1% 이내', en:'Reproduction error within 1%', on:1 }, { ko:'스크립트 재실행 가능', en:'Scripts re-run cleanly', on:1 }, { ko:'템플릿 형식 준수', en:'Template format followed', on:1 }] },
  machining:{ budget:7000000, quals:['cmm','iso9001'], title:{ ko:'알루미늄 브래킷 가공 20개', en:'20 machined aluminum brackets' }, goal:{ ko:'도면 공차 이내 가공과 블라인드 배송', en:'Machine to tolerance and ship blind' },
    crit:[{ ko:'3차원 측정 성적서 공차 이내', en:'CMM report within tolerance', on:1 }, { ko:'블라인드 배송 완료', en:'Blind delivery completed', on:1 }] }
};
const FINDINGS = [
  { id:'f1', layer:1, w:18, t:{ ko:'도면 표제란의 회사 로고와 상호', en:'Company logo and name in the title block' }, where:{ ko:'frame_v3.step · 표제란', en:'frame_v3.step · title block' }, from:'(주)가온로보틱스 로고', to:{ ko:'삭제', en:'removed' }, acts:['del', 'later', 'keep'] },
  { id:'f2', layer:1, w:14, t:{ ko:'담당자 이름과 휴대전화', en:'Engineer name and mobile number' }, where:{ ko:'요구사항.pdf · 2쪽', en:'requirements.pdf · p.2' }, from:'김도윤 책임 010-2917-4432', to:{ ko:'[담당자]', en:'[contact]' }, acts:['del', 'keep'] },
  { id:'f3', layer:1, w:10, t:{ ko:'사내 도면번호', en:'Internal drawing number' }, where:{ ko:'frame_v3.step · 속성', en:'frame_v3.step · properties' }, from:'GR-LFT-0032', to:{ ko:'DWG-001', en:'DWG-001' }, acts:['gen', 'del', 'keep'] },
  { id:'f4', layer:2, w:9, t:{ ko:'프로젝트 코드네임', en:'Project codename' }, where:{ ko:'요구사항.pdf · 1쪽 머리글', en:'requirements.pdf · p.1 header' }, from:'Project Maple', to:{ ko:'삭제', en:'removed' }, acts:['del', 'keep'] },
  { id:'f5', layer:2, w:8, t:{ ko:'특이한 치수 조합', en:'Distinctive dimension combo' }, where:{ ko:'하중조건.xlsx · B4:B9', en:'loads.xlsx · B4:B9' }, from:'PCD 120mm · 400×300mm', to:{ ko:'PCD 100~140mm 범위', en:'PCD within 100–140 mm' }, acts:['gen', 'later', 'keep'] },
  { id:'f6', layer:2, w:7, t:{ ko:'사내 약어', en:'Internal acronym' }, where:{ ko:'요구사항.pdf · 3쪽', en:'requirements.pdf · p.3' }, from:'GR-AMR 3세대', to:{ ko:'물류 로봇 차세대 모델', en:'next-gen logistics robot' }, acts:['gen', 'keep'] },
  { id:'f7', layer:3, w:12, t:{ ko:'목표 성능과 출시 시점을 합치면 제품이 추정됨', en:'Target specs + launch date reveal the product' }, where:{ ko:'요구사항.pdf · 1~2쪽', en:'requirements.pdf · pp.1–2' }, from:'적재 50kg · 2027년 2분기 양산', to:{ ko:'적재 40~60kg · 일정은 계약 후 공개', en:'40–60 kg payload · schedule after contract' }, acts:['gen', 'later', 'keep'] }
];
const ACT_LABEL = { del:{ ko:'삭제', en:'Remove' }, gen:{ ko:'일반화', en:'Generalize' }, later:{ ko:'계약 후 공개', en:'After contract' }, keep:{ ko:'유지', en:'Keep' } };
const ACT_CUT = { del:1, gen:.8, later:1, keep:0 };
function newDraft(cat, from){
  const t = CAT_TPL[cat] || CAT_TPL.struct;
  return { cat, title: from ? L(from.title) : L(t.title), goal: from ? L(from.goal) : L(t.goal), criteria: (from ? from.criteria.map(c => Object.assign({ on:1 }, c)) : t.crit.map(c => Object.assign({}, c))), budget: from ? from.budget : t.budget, days:21, quals: (from ? from.quals : t.quals).slice(), files:[], scanned:false, scanning:false, res:{}, guess:null, disclosure:'standard', declare:false };
}
function draftScore(d){ return Math.round(FINDINGS.reduce((a, f) => a + f.w * (1 - (ACT_CUT[d.res[f.id]] || 0)), 0)); }
route('/u/new', (p, qs) => {
  if (mode() === 'supplier') return App.go('/u/market', true);
  const step = +(qs.step || 1);
  const d = App.ui.draft || (App.ui.draft = newDraft('struct'));
  const bar = `<div class="wizard-steps">${[1,2,3,4].map(i => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>`;
  const titles = [tt('어떤 일을 맡기시나요?', 'What kind of work?'), tt('퀘스트 명세를 적어 주세요', 'Write the quest spec'), tt('자료를 올리고 노출을 점검해요', 'Upload files and check exposure'), tt('공개 범위를 정하고 게시해요', 'Set disclosure and post')];
  let html = '', after = '';
  if (step === 1){
    html = `<div class="stack mt16">${Object.keys(CATS).map(k => `<button class="select-card ${d.cat === k && k !== 'system' ? 'on' : ''}" data-act="nq-cat" data-v="${k}"><span class="ic">${ic(CATS[k].icon)}</span><div style="flex:1"><div class="h4">${L(CATS[k])}</div><div class="caption mt4">${({ struct:tt('정하중·피로·진동 해석, 안전계수 입증', 'Static, fatigue, vibration; safety factor'), thermal:tt('열전달, 냉각 유로, 압력 강하', 'Heat transfer, coolant channels, pressure drop'), embedded:tt('펌웨어, 드라이버, 테스트 자동화', 'Firmware, drivers, test automation'), data:tt('시험 로그 분석, 통계량 재현', 'Test logs, reproducible metrics'), machining:tt('시제품 가공, 측정 성적서, 블라인드 배송', 'Prototype parts, CMM reports, blind shipping'), system:tt('큰 시스템을 여러 퀘스트로 나누기', 'Split a system into several quests') })[k]}</div></div>${k === 'system' ? ic('chev', 'chev') : ''}</button>`).join('')}</div>`;
    after = `<div class="cta-bar"><button class="btn btn-primary" data-go="/u/new?step=2">${tt('다음', 'Next')}</button></div>`;
  }
  if (step === 2){
    html = `<div class="stack mt16">
      <div class="field"><label for="nq-title">${tt('퀘스트 이름', 'Quest title')}</label><input class="input" id="nq-title" value="${esc(d.title)}" data-in="nq-f" data-k="title"></div>
      <div class="field"><label for="nq-goal">${tt('목표', 'Goal')}</label><textarea class="textarea" id="nq-goal" data-in="nq-f" data-k="goal">${esc(d.goal)}</textarea><div class="caption">${tt('회사명, 제품명, 출시 일정은 적지 마세요. 다음 단계에서 AI가 한 번 더 점검합니다.', 'Leave out company, product names and launch dates. AI checks again next step.')}</div></div>
      <div class="field"><label>${tt('검수 기준', 'Acceptance criteria')} <span class="caption">· ${tt('숫자로 판정할 수 있게', 'make them measurable')}</span></label><div class="stack">${d.criteria.map((c, i) => `<label class="check"><input type="checkbox" ${c.on ? 'checked' : ''} data-ch="nq-crit" data-i="${i}"> <span>${esc(L(c))}</span></label>`).join('')}</div></div>
      <div class="field"><label>${tt('예산', 'Budget')}</label><div class="hstack between"><b class="h3 tnum" id="nq-bv">${won(d.budget)}</b><span class="caption" id="nq-bu">${isKo() ? '' : usd(d.budget)}</span></div><input type="range" min="3000000" max="50000000" step="500000" value="${d.budget}" data-in="nq-budget" aria-label="${tt('예산', 'Budget')}"><div class="hstack between caption"><span>${won(3000000)}</span><span>${tt('유사 과업 중앙값', 'Similar-job median')} ${won(({ struct:16000000, thermal:18000000, embedded:22000000, data:9000000, machining:7500000 })[d.cat] || 15000000)}</span><span>${won(50000000)}</span></div></div>
      <div class="field"><label>${tt('기한', 'Deadline')}</label><div class="hstack wrap">${[14, 21, 30, 45].map(n => `<button class="chip ${d.days === n ? 'on' : ''}" data-act="nq-days" data-v="${n}">${tt(`${n}일`, `${n} days`)}</button>`).join('')}</div></div>
      <div class="field"><label>${tt('자격 조건', 'Qualifications')} <span class="caption">· ${tt('신원 대신 자격만 확인해요', 'checked instead of identity')}</span></label><div class="hstack wrap">${Object.keys(TOKENS).map(k => `<button class="chip ${d.quals.includes(k) ? 'on' : ''}" data-act="nq-qual" data-v="${k}">${L(TOKENS[k])}</button>`).join('')}</div></div>
    </div>`;
    after = `<div class="cta-bar"><button class="btn btn-gray" data-go="/u/new?step=1">${tt('이전', 'Back')}</button><button class="btn btn-primary" style="flex:2" data-act="nq-next2">${tt('다음', 'Next')}</button></div>`;
  }
  if (step === 3){
    const score = draftScore(d), rl = riskLabel(score);
    html = `<div class="mt16">
      <input type="file" id="nq-file" multiple hidden data-ch="nq-files">
      ${d.files.length ? d.files.map((f, i) => fileRow(f, `<button class="icon-btn" data-act="nq-rmfile" data-i="${i}" aria-label="${tt('삭제', 'Remove')}">${ic('x')}</button>`)).join('') : ''}
      <div class="grid2 mt8"><button class="dropzone" data-act="nq-pick">${ic('upload')}<div>${tt('파일 선택', 'Choose files')}</div></button><button class="dropzone" data-act="nq-sample">${ic('file')}<div>${tt('샘플 자료로 채우기', 'Use sample files')}</div></button></div>
      ${!d.scanned && !d.scanning ? `<button class="btn btn-soft btn-block mt16" data-act="nq-scan" ${d.files.length ? '' : 'disabled'}>${ic('scan')}${tt('노출 점검 시작', 'Run exposure check')}</button><div class="caption center mt8">${tt('회사를 짐작하게 하는 단서를 세 층으로 찾아 점수로 보여줍니다.', 'Finds clues that point to your company, in three layers, and scores them.')}</div>` : ''}
      ${d.scanning ? `<div class="scan mt16"><div class="beam"></div>${Array.from({ length: 9 }, (_, i) => `<div class="line ${[1, 4, 6].includes(i) ? 'hit' : ''}" style="width:${60 + (i * 37) % 40}%"></div>`).join('')}</div><div class="hstack mt12" style="gap:8px"><span class="spinner"></span><span class="body-s" id="scan-msg">${tt('직접 식별자를 찾는 중…', 'Looking for direct identifiers…')}</span></div>` : ''}
      ${d.scanned ? `
        <div class="card mt16 center">
          <div class="gauge">${gaugeSvg(score)}<div class="val"><b style="color:${rl.c}">${score}</b><span style="color:${rl.c}">${tt('노출', 'Exposure')} ${rl.t}</span></div></div>
          <div class="caption mt8">${tt('30 이하면 안심하고 게시할 수 있어요', 'At 30 or below it is safe to post')}</div>
          <div class="hstack mt12" style="justify-content:center"><button class="btn btn-gray btn-s" data-act="nq-autofix">${ic('spark')}${tt('권장대로 모두 처리', 'Apply all suggestions')}</button><button class="btn btn-line btn-s" data-act="nq-guess">${ic('target')}${tt('AI 추정 테스트', 'AI guess test')}</button></div>
          ${d.guess ? `<div class="ai-shield" style="text-align:left;${d.guess.ok ? '' : 'background:var(--bad-soft);color:var(--bad)'}">${ic(d.guess.ok ? 'shield' : 'alert')}<span>${d.guess.ok ? tt('AI가 3번 추정했지만 발주사를 맞히지 못했습니다.', 'AI tried 3 times and could not identify you.') : tt(`AI가 3번 중 2번 "국내 물류 로봇 제조사"로 좁혔습니다 (확률 ${d.guess.p}%).`, `AI narrowed you down to "a Korean logistics-robot maker" in 2 of 3 tries (${d.guess.p}%).`)}</span></div>` : ''}
        </div>
        <div class="section-head mt20"><h2 class="h4">${tt(`찾은 단서 ${FINDINGS.length}건`, `${FINDINGS.length} clues found`)}</h2><span class="caption">${tt(`처리 ${Object.keys(d.res).length}/${FINDINGS.length}`, `${Object.keys(d.res).length}/${FINDINGS.length} handled`)}</span></div>
        ${FINDINGS.map(f => { const a = d.res[f.id]; return `<div class="finding ${a && a !== 'keep' ? 'resolved' : ''}">
          <div class="fh"><span class="layer l${f.layer}">${[tt('직접', 'Direct'), tt('간접', 'Indirect'), tt('문맥', 'Context')][f.layer - 1]}</span><div style="flex:1;min-width:0"><div class="ft">${L(f.t)}</div><div class="fs">${L(f.where)}</div></div><span class="wt">+${f.w}</span></div>
          <div class="ex"><s>${esc(f.from)}</s> → <ins>${esc(L(f.to))}</ins></div>
          <div class="acts">${f.acts.map(k => `<button class="${a === k ? 'on' : ''}" data-act="nq-res" data-f="${f.id}" data-v="${k}">${L(ACT_LABEL[k])}</button>`).join('')}</div>
        </div>`; }).join('')}
        <div class="caption mt12">${tt('노출 점검은 식별 비용을 높일 뿐 완전한 익명을 보장하지는 않습니다. 유지하기로 한 단서는 기록에 남습니다.', 'The check raises the cost of identifying you; it does not guarantee anonymity. Clues you keep are logged.')}</div>` : ''}
    </div>`;
    after = `<div class="cta-bar"><button class="btn btn-gray" data-go="/u/new?step=2">${tt('이전', 'Back')}</button><button class="btn btn-primary" style="flex:2" data-act="nq-next3" ${d.scanned ? '' : 'disabled'}>${tt('다음', 'Next')}</button></div>`;
  }
  if (step === 4){
    const opts = [['min', tt('최소 공개', 'Minimal'), tt('게시: 목표만 / 자격 조건은 매칭 후', 'Posted: goal only / qualifications after matching')], ['standard', tt('표준 (권장)', 'Standard (recommended)'), tt('게시: 목표·자격 / 계약 후: 제공 정보 전체', 'Posted: goal & qualifications / After contract: all inputs')], ['wide', tt('넓게 공개', 'Broad'), tt('게시: 명세 요약까지 / 제안이 빨리 모이지만 노출 증가', 'Posted: spec summary too / faster bids, more exposure')]];
    html = `<div class="stack mt16">${opts.map(o => `<button class="select-card ${d.disclosure === o[0] ? 'on' : ''}" data-act="nq-disc" data-v="${o[0]}"><span class="ic">${ic(o[0] === 'min' ? 'lock' : o[0] === 'standard' ? 'shield' : 'eye')}</span><div><div class="h4">${o[1]}</div><div class="caption mt4">${o[2]}</div></div></button>`).join('')}</div>
      <h2 class="h4 mt24" style="margin-bottom:8px">${tt('게시 전 확인', 'Before you post')}</h2>
      <div class="card"><dl class="kv">
        <dt>${tt('유형', 'Type')}</dt><dd>${catLabel(d.cat)}</dd>
        <dt>${tt('이름', 'Title')}</dt><dd>${esc(d.title)}</dd>
        <dt>${tt('검수 기준', 'Criteria')}</dt><dd>${d.criteria.filter(c => c.on).length}${tt('개', '')}</dd>
        <dt>${tt('예산', 'Budget')}</dt><dd>${won(d.budget)}</dd>
        <dt>${tt('기한', 'Deadline')}</dt><dd>${tt(`${d.days}일 후`, `in ${d.days} days`)}</dd>
        <dt>${tt('노출 점수', 'Exposure')}</dt><dd style="color:${riskLabel(draftScore(d)).c}">${draftScore(d)}</dd>
        <dt>${tt('게시 비용', 'Posting fee')}</dt><dd>${tt('무료', 'Free')}</dd>
      </dl></div>
      <label class="check mt16"><input type="checkbox" id="nq-declare" ${d.declare ? 'checked' : ''} data-ch="nq-declare"> <span>${tt('이 과업은 전략물자·방위산업기술·국가핵심기술에 해당하지 않으며, 결과물이 해외로 전송되지 않습니다.', 'This work is not a strategic item, defense technology or national core technology, and results will not leave Korea.')}</span></label>
      <div class="caption mt8">${tt('해당할 수 있다면 게시 전에 전문판정을 안내해 드립니다.', 'If it might apply, we will route you to an official classification first.')}</div>`;
    after = `<div class="cta-bar"><button class="btn btn-gray" data-go="/u/new?step=3">${tt('이전', 'Back')}</button><button class="btn btn-primary" style="flex:2" data-act="nq-post">${tt('퀘스트 게시', 'Post quest')}</button></div>`;
  }
  if (step === 5){
    const q = App.ui.posted ? findQuest(App.ui.posted) : null;
    html = `<div class="center" style="padding-top:40px"><div class="success-burst"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
      <h1 class="h2 mt20">${tt('퀘스트를 게시했습니다', 'Your quest is live')}</h1>
      <p class="body-s mt8">${q ? q.id : ''} · ${tt('자격을 갖춘 수행사에게 알림을 보냈어요.<br>제안이 도착하면 바로 알려드릴게요.', 'Qualified suppliers were notified.<br>We will tell you as soon as bids arrive.')}</p>
      <div class="card outline mt24" style="text-align:left"><div class="hstack"><span class="ico-box violet">${ic('chain')}</span><div><div class="h4">${tt('명세 해시를 기록했습니다', 'Spec hash anchored')}</div><div class="hash">${q ? shortHash(q.records[0].tx) : ''}</div></div></div></div></div>`;
    after = `<div class="cta-bar"><button class="btn btn-gray" data-go="/u/home">${tt('홈으로', 'Home')}</button><button class="btn btn-primary" style="flex:2" data-go="/u/quest/${q ? q.id : ''}?tab=bids">${tt('퀘스트 보기', 'View quest')}</button></div>`;
    return { noTabs:true, top: topbar({ title: '' }), html, after };
  }
  return { noTabs:true, top: topbar({ back:'/u/home', title: tt('새 퀘스트', 'New quest'), sub: `${step} / 4` }), html: `${bar}<h1 class="h2 mt16">${titles[step - 1]}</h1>${html}`, after };
});
ACT['nq-cat'] = el => { if (el.dataset.v === 'system'){ App.go('/u/service/decompose'); return; } App.ui.draft = newDraft(el.dataset.v); haptic(); App.refresh(); };
ACT['nq-f'] = el => { App.ui.draft[el.dataset.k] = el.value; };
ACT['nq-crit'] = el => { App.ui.draft.criteria[+el.dataset.i].on = el.checked ? 1 : 0; };
ACT['nq-budget'] = el => { App.ui.draft.budget = +el.value; $('#nq-bv').textContent = won(+el.value); const u = $('#nq-bu'); if (u) u.textContent = isKo() ? '' : usd(+el.value); };
ACT['nq-days'] = el => { App.ui.draft.days = +el.dataset.v; haptic(); App.refresh(); };
ACT['nq-qual'] = el => { const d = App.ui.draft, k = el.dataset.v; d.quals = d.quals.includes(k) ? d.quals.filter(x => x !== k) : d.quals.concat(k); haptic(); App.refresh(); };
ACT['nq-next2'] = () => { const d = App.ui.draft; if (!d.title.trim()) return toast(tt('퀘스트 이름을 적어 주세요.', 'Add a title.'), 'warn'); if (!d.criteria.some(c => c.on)) return toast(tt('검수 기준을 하나 이상 골라 주세요.', 'Pick at least one criterion.'), 'warn'); App.go('/u/new?step=3'); };
ACT['nq-pick'] = () => { const i = $('#nq-file'); if (i) i.click(); };
ACT['nq-files'] = el => { const d = App.ui.draft; Array.from(el.files || []).forEach(f => { const ext = (f.name.split('.').pop() || 'bin').toLowerCase().slice(0, 4); d.files.push({ name:f.name, size:(f.size / 1048576).toFixed(1) + ' MB', ext:['pdf','step','xlsx','csv','zip'].includes(ext) ? ext : 'bin' }); }); d.scanned = false; d.res = {}; d.guess = null; App.refresh(); };
ACT['nq-sample'] = () => { const d = App.ui.draft; d.files = [{ name:tt('요구사항.pdf', 'requirements.pdf'), size:'2.4 MB', ext:'pdf' }, { name:'frame_v3.step', size:'18.9 MB', ext:'step' }, { name:tt('하중조건.xlsx', 'loads.xlsx'), size:'86 KB', ext:'xlsx' }]; d.scanned = false; d.res = {}; d.guess = null; haptic(); App.refresh(); };
ACT['nq-rmfile'] = el => { const d = App.ui.draft; d.files.splice(+el.dataset.i, 1); d.scanned = false; d.res = {}; App.refresh(); };
ACT['nq-scan'] = async () => {
  const d = App.ui.draft; d.scanning = true; App.refresh();
  const msgs = [tt('간접 식별자를 찾는 중…', 'Looking for indirect identifiers…'), tt('문맥으로 발주사를 추정해 보는 중…', 'Trying to infer the client from context…'), tt('처리 방법을 제안하는 중…', 'Drafting suggestions…')];
  for (const m of msgs){ await sleep(750); const e = $('#scan-msg'); if (!e) return; e.textContent = m; }
  await sleep(600);
  d.scanning = false; d.scanned = true; haptic('success'); App.refresh();
};
ACT['nq-res'] = el => { const d = App.ui.draft; d.res[el.dataset.f] = el.dataset.v; d.guess = null; haptic(); App.refresh(); };
ACT['nq-autofix'] = () => { const d = App.ui.draft; FINDINGS.forEach(f => d.res[f.id] = f.acts[0]); d.guess = null; toast(tt('권장 처리를 모두 적용했습니다.', 'All suggestions applied.'), 'ok'); App.refresh(); };
ACT['nq-guess'] = async btn => { await withLoading(btn, 1300); const d = App.ui.draft, s = draftScore(d); d.guess = { ok: s <= 30, p: 40 + Math.round(s * .4) }; App.refresh(); };
ACT['nq-next3'] = async () => {
  const s = draftScore(App.ui.draft);
  if (s > 30){ const ok = await confirmBox({ title: tt('노출 점수가 높습니다', 'Exposure is high'), body: tt(`현재 ${s}점입니다. 이대로 진행하면 남긴 단서로 인한 노출은 발주사 책임으로 기록됩니다.`, `Current score is ${s}. If you continue, exposure from the clues you kept is logged as your decision.`), ok: tt('그래도 진행', 'Continue anyway'), cancel: tt('더 처리하기', 'Fix more') }); if (!ok) return; }
  App.go('/u/new?step=4');
};
ACT['nq-disc'] = el => { App.ui.draft.disclosure = el.dataset.v; haptic(); App.refresh(); };
ACT['nq-declare'] = el => { App.ui.draft.declare = el.checked; };
ACT['nq-post'] = async btn => {
  const d = App.ui.draft;
  if (!d.declare) return toast(tt('수출통제 해당 여부 선언이 필요합니다.', 'Please confirm the export-control declaration.'), 'warn');
  await withLoading(btn, 1100);
  const n = 436 + App.state.quests.filter(q => q.fromDemo).length;
  const id = 'Q-2026-0' + n;
  const disc = { min:{ ko:'게시: 목표만 / 자격 조건은 매칭 후', en:'Posted: goal only / qualifications after matching' }, standard:{ ko:'게시: 목표·자격만 / 계약 후: 제공 정보 전체', en:'Posted: goal & qualifications / After contract: all inputs' }, wide:{ ko:'게시: 명세 요약까지', en:'Posted: spec summary' } }[d.disclosure];
  const q = { id, fromDemo:true, cat:d.cat, status:'open', budget:d.budget, deadline:Date.now() + d.days * DAY, created:Date.now(), exposure:draftScore(d),
    title:{ ko:d.title, en:d.title }, goal:{ ko:d.goal, en:d.goal }, provided:{ ko:d.files.map(f => f.name).join(', ') || '—', en:d.files.map(f => f.name).join(', ') || '—' },
    iface:{ ko:'계약 후 공개', en:'Shared after contract' }, delivery:{ ko:'보고서, 결과 파일', en:'Report, result files' }, quals:d.quals.slice(), disclosure:disc,
    criteria:d.criteria.filter(c => c.on).map(c => ({ ko:c.ko, en:c.en })), proposals:[], selected:null, progress:0, chat:[], deliverables:[], verdict:null, escrow:{ status:'none' }, records:[] };
  addChain(q, EV.post);
  App.state.quests.unshift(q); App.ui.posted = id; App.ui.draft = null; App.save();
  scheduleBids(id);
  App.go('/u/new?step=5', true);
};
function scheduleBids(id){
  const bids = [
    { alias:'V6L8', rating:4.8, jobs:14, days:19, k:.93, msg:{ ko:'유사 과업을 다수 수행했습니다. 중간 보고를 1회 드립니다.', en:'We have done many similar jobs and will send one interim report.' } },
    { alias:'G9T4', rating:4.9, jobs:22, days:24, k:.98, best:true, msg:{ ko:'검수 기준 전 항목을 자체 점검한 뒤 납품합니다.', en:'We self-check every criterion before delivery.' } }
  ];
  bids.forEach((b, i) => setTimeout(() => {
    const q = findQuest(id); if (!q || q.status !== 'open') return;
    q.proposals.push({ id:'P-' + (q.proposals.length + 1), alias:b.alias, rating:b.rating, jobs:b.jobs, price:Math.round(q.budget * b.k / 100000) * 100000, days:b.days, tokens:q.quals.concat(i ? ['iso9001'] : []).slice(0, 4), best:!!b.best, msg:b.msg });
    addNotif({ aud:'client', icon:'users', tone:'accent', go:`/u/quest/${id}?tab=bids`, t:{ ko:`${id}에 새 제안이 도착했습니다`, en:`New bid on ${id}` }, s:{ ko:`수행사 ${b.alias} · ${won(q.budget * b.k)}`, en:`Supplier ${b.alias}` } });
    App.save();
    if (App.state.session && App.state.session.role === 'user' && mode() === 'client'){ toast(tt(`${id}에 새 제안이 도착했습니다`, `New bid on ${id}`), 'ok'); if (currentPath().includes(id) || currentPath().startsWith('/u/home') || currentPath().startsWith('/u/quests')) App.refresh(); }
  }, 7000 + i * 9000));
}

/* ================= services ================= */
const SERVICES = [
  { id:'exposure', icon:'eyeoff', tone:'accent', name:{ ko:'노출 점검', en:'Exposure check' }, tag:{ ko:'올린 자료에서 회사를 짐작하게 하는 단서를 찾아 가립니다', en:'Finds and hides clues in your files that point to your company' },
    stat:[{ ko:'평균 노출 점수', en:'Avg. exposure score' }, '78 → 19'],
    how:[[{ ko:'자료 올리기', en:'Upload files' }, { ko:'요구사항, 도면, 데이터를 올립니다', en:'Requirements, drawings, data' }], [{ ko:'세 층으로 탐지', en:'Three-layer scan' }, { ko:'직접·간접·문맥 식별자를 찾습니다', en:'Direct, indirect and contextual identifiers' }], [{ ko:'처리 제안', en:'Suggestions' }, { ko:'삭제, 일반화, 계약 후 공개 중에서 고릅니다', en:'Remove, generalize, or share after contract' }], [{ ko:'AI 추정 테스트', en:'AI guess test' }, { ko:'AI가 발주사를 맞혀 보게 해서 실제 노출을 확인합니다', en:'AI tries to guess who you are to measure real exposure' }]],
    gets:[{ ko:'처리 전후 노출 점수', en:'Before/after exposure score' }, { ko:'단서별 처리 기록', en:'Per-clue decision log' }, { ko:'카나리 변형 (수신자별 미세 변형으로 유출원 추적)', en:'Canary variants to trace leaks per recipient' }],
    price:[[{ ko:'모든 퀘스트', en:'Every quest' }, { ko:'무료', en:'Free' }]],
    faq:[[{ ko:'완전한 익명이 보장되나요?', en:'Is anonymity guaranteed?' }, { ko:'아니요. 문체나 규격 조합만으로도 추정이 가능하다는 연구가 있어 "식별 비용을 높인다"까지만 약속합니다. 대신 AI 추정 테스트로 실제 노출을 확인할 수 있습니다.', en:'No. Research shows writing style or spec combinations can still reveal identity, so we promise to raise the cost of identification, not eliminate it. The AI guess test shows your real exposure.' }], [{ ko:'점검에 쓰인 자료는 학습에 쓰이나요?', en:'Is my data used for training?' }, { ko:'쓰이지 않습니다. 기본 모델은 무보존 계약이 적용됩니다.', en:'No. The default model runs under a zero-data-retention agreement.' }]] },
  { id:'decompose', icon:'tree', tone:'violet', name:{ ko:'퀘스트 분해', en:'Quest decomposition' }, tag:{ ko:'큰 시스템을 어느 수행사도 전체를 모르게 여러 퀘스트로 나눕니다', en:'Splits a system into quests so no supplier sees the whole' },
    stat:[{ ko:'체계종합 기업용', en:'For system integrators' }, 'IRD / ICD'],
    how:[[{ ko:'시스템 요구사항 입력', en:'Enter system requirements' }, { ko:'구성 요소 목록과 요구사항을 넣습니다', en:'Components and requirements' }], [{ ko:'의존 관계 그래프', en:'Dependency graph' }, { ko:'접점마다 인터페이스 문서 초안을 만듭니다', en:'Interface documents drafted per boundary' }], [{ ko:'전체 추정 난이도', en:'Whole-product guessability' }, { ko:'퀘스트 하나만 보고 최종 제품을 맞힐 수 있는지 시험합니다', en:'Tests if one quest reveals the final product' }], [{ ko:'분할·병합 제안', en:'Split or merge' }, { ko:'추정되는 퀘스트는 쪼개거나 치수를 범위로 바꿉니다', en:'Guessable quests get split or generalized' }]],
    gets:[{ ko:'퀘스트별 명세 초안', en:'Draft spec per quest' }, { ko:'잠긴 접점 조건 (변경 시 관련 수행사 전원 통지)', en:'Locked interfaces (changes notify all affected suppliers)' }, { ko:'동일 수행사 매칭 차단 규칙', en:'Same-supplier blocking rules' }],
    price:[[{ ko:'체계종합 구독', en:'Integrator plan' }, { ko:'연 3,000만 원', en:'₩30M / year' }], [{ ko:'단건 이용', en:'One-off' }, { ko:'별도 문의', en:'Contact us' }]],
    faq:[[{ ko:'통합 책임은 누가 지나요?', en:'Who owns integration?' }, { ko:'발주사가 집니다. 플랫폼은 각 퀘스트의 검수 판정과, 접점 불일치 시 책임 퀘스트를 가리는 절차를 맡습니다.', en:'The client does. Quest owns per-quest acceptance and the procedure to assign fault when interfaces mismatch.' }]] },
  { id:'credential', icon:'badge', tone:'good', name:{ ko:'익명 자격 증명', en:'Anonymous credentials' }, tag:{ ko:'회사명 없이 "이 조건을 충족함"만 보여줍니다', en:'Shows "meets this requirement" without the company name' },
    stat:[{ ko:'검증된 자격 토큰', en:'Verified tokens' }, '12'],
    how:[[{ ko:'사업자 확인', en:'Business check' }, { ko:'국세청 조회로 진위와 휴폐업을 확인합니다', en:'Registration and status via the tax authority' }], [{ ko:'원본 검증', en:'Verify originals' }, { ko:'인증서는 발급 기관, 라이선스는 벤더에 확인합니다', en:'Certificates with issuers, licenses with vendors' }], [{ ko:'토큰 발급', en:'Issue tokens' }, { ko:'검증된 항목만 토큰이 됩니다', en:'Only verified items become tokens' }], [{ ko:'평판은 가명에', en:'Pseudonymous reputation' }, { ko:'사업자 단위로 묶여 세탁할 수 없습니다', en:'Bound to the business, so it cannot be reset' }]],
    gets:[{ ko:'발주사는 충족 여부만 확인', en:'Clients only see pass/fail' }, { ko:'분기별 자동 재검증', en:'Quarterly re-verification' }],
    price:[[{ ko:'수행사 가입', en:'Supplier sign-up' }, { ko:'무료', en:'Free' }]],
    faq:[[{ ko:'새 계정을 만들어 나쁜 평판을 지울 수 있나요?', en:'Can a supplier reset a bad reputation?' }, { ko:'없습니다. 평판은 사업자등록번호와 실소유자 단위로 묶입니다.', en:'No. Reputation is bound to the business number and beneficial owner.' }]] },
  { id:'aireview', icon:'spark', tone:'info', name:{ ko:'AI 예비 판정', en:'AI pre-review' }, tag:{ ko:'두 회사의 AI가 따로 판정하고, 확정은 사람이 합니다', en:'Two vendors\' models judge independently; people make it final' },
    stat:[{ ko:'AI-인간 판정 일치율', en:'AI-human agreement' }, '94%'],
    how:[[{ ko:'스냅샷 고정', en:'Pinned snapshot' }, { ko:'모델 버전, 프롬프트, 입력 해시를 기록합니다', en:'Model version, prompt and input hash are logged' }], [{ ko:'이종 모델 패널', en:'Cross-vendor panel' }, { ko:'서로 다른 회사의 모델이 독립 판정합니다', en:'Models from different vendors judge separately' }], [{ ko:'위치 바꿔 재판정', en:'Order swap' }, { ko:'순서 편향을 걸러냅니다', en:'Filters position bias' }], [{ ko:'7일 이의기간', en:'7-day objection window' }, { ko:'이의가 있으면 전문가가 같은 입력으로 다시 돌립니다', en:'On objection, an expert reruns the same inputs' }]],
    gets:[{ ko:'기준별 판정과 근거', en:'Verdict and evidence per criterion' }, { ko:'판정 재현 패키지', en:'Reproduction package' }],
    price:[[{ ko:'모든 거래', en:'Every deal' }, { ko:'거래 차액에 포함', en:'Included in the spread' }], [{ ko:'빠른 인간 재검수', en:'Priority human review' }, { ko:'건당 원가 기준', en:'At cost' }]],
    faq:[[{ ko:'AI 판정이 틀리면요?', en:'What if the AI is wrong?' }, { ko:'AI는 확정하지 않습니다. 검수 확정은 이의기간이 지나거나 인간 재검수가 끝난 시점이고, 검수 오류의 책임은 플랫폼이 집니다.', en:'AI never finalizes. Acceptance happens after the objection window or human review, and Quest is responsible for review errors.' }]] },
  { id:'certificate', icon:'cert', tone:'good', name:{ ko:'비밀관리 증명', en:'Secrecy proof' }, tag:{ ko:'무엇을 언제 누구에게 어느 등급으로 공개했는지 문서로 발급합니다', en:'A document of what you disclosed, when, to whom, at what level' },
    stat:[{ ko:'영업비밀 소송 패소 사유 1위', en:'#1 reason trade-secret suits fail' }, { ko:'비밀관리성', en:'Secrecy management' }],
    how:[[{ ko:'공개 기록', en:'Disclosure log' }, { ko:'모든 공개에 등급, 시각, 수신자 동의가 남습니다', en:'Every disclosure has a level, timestamp and consent' }], [{ ko:'문서 발급', en:'Issue document' }, { ko:'기록을 정리해 증명서로 만듭니다', en:'The log is compiled into a certificate' }], [{ ko:'원본증명 병행', en:'Official timestamp' }, { ko:'핵심 산출물은 특허청 원본증명서비스에도 등록합니다', en:'Key files are also registered with the KIPO timestamp service' }]],
    gets:[{ ko:'공개 이력표', en:'Disclosure table' }, { ko:'수신자별 비밀유지 동의 기록', en:'NDA consent per recipient' }, { ko:'체인 해시와 원본증명 번호', en:'On-chain hashes and timestamp IDs' }],
    price:[[{ ko:'발급', en:'Issuance' }, { ko:'건당 5만 원 (데모 가정)', en:'₩50K each (demo assumption)' }]],
    faq:[[{ ko:'소송에서 이기게 해 주나요?', en:'Will it win a lawsuit?' }, { ko:'그렇게 약속하지 않습니다. "비밀로 관리했다는 기록"을 남기는 것이고, 법적 효력은 사안마다 다릅니다.', en:'We do not promise that. It records that you managed the secret; legal weight varies by case.' }]] },
  { id:'shipping', icon:'truck', tone:'warn', name:{ ko:'블라인드 배송', en:'Blind shipping' }, tag:{ ko:'중계 거점에서 송장을 바꿔 서로의 주소와 상호를 모르게 배송합니다', en:'Relabeled at a relay hub so neither side sees the other\'s address' },
    stat:[{ ko:'중계 거점', en:'Relay hubs' }, { ko:'대전 · 시흥', en:'Daejeon · Siheung' }],
    how:[[{ ko:'수행사 출고', en:'Supplier ships' }, { ko:'받는 곳은 Quest 중계 거점', en:'Addressed to a Quest hub' }], [{ ko:'거점 입고·검수', en:'Hub intake' }, { ko:'외관과 수량을 사진으로 기록합니다', en:'Appearance and count are photographed' }], [{ ko:'송장 교체', en:'Relabel' }, { ko:'보내는 곳을 Quest로 바꿉니다', en:'Sender becomes Quest' }], [{ ko:'발주사 수령', en:'Client receives' }, { ko:'수령 확인이 검수 기준에 반영됩니다', en:'Receipt counts toward acceptance' }]],
    gets:[{ ko:'양쪽에 서로의 주소 비공개', en:'Addresses hidden from both' }, { ko:'입고 사진과 수량 기록', en:'Intake photos and counts' }],
    price:[[{ ko:'배송', en:'Shipping' }, { ko:'원가 + 거점 운영비', en:'Cost + hub fee' }]],
    faq:[[{ ko:'제품 사고가 나면요?', en:'What if a product causes harm?' }, { ko:'제조물책임법상 피해자에게는 제조사 정보를 고지합니다. 약관에 익명성의 예외로 적혀 있습니다.', en:'Under product liability law we disclose the manufacturer to the injured party. This exception is in the terms.' }]] },
  { id:'records', icon:'chain', tone:'violet', name:{ ko:'기록·검증', en:'Records & verification' }, tag:{ ko:'플랫폼이 나중에 기록을 고치지 않았다는 것을 밖에서 확인할 수 있습니다', en:'Anyone can verify Quest never edited a record afterwards' },
    stat:[{ ko:'해시 1건 기록 비용', en:'Cost per hash' }, '< $0.01'],
    how:[[{ ko:'해시 만들기', en:'Hash' }, { ko:'명세, 계약, 납품물, 판정을 해시로 바꿉니다', en:'Specs, contracts, files and verdicts become hashes' }], [{ ko:'묶어서 기록', en:'Batch' }, { ko:'머클 루트로 묶어 Base에 남깁니다', en:'A Merkle root is written to Base' }], [{ ko:'누구나 검증', en:'Verify' }, { ko:'원본 해시와 체인 기록을 비교합니다', en:'Compare the file hash with the chain record' }]],
    gets:[{ ko:'위변조 검증 가능한 기록', en:'Tamper-evident records' }, { ko:'지갑·코인 필요 없음', en:'No wallet or crypto needed' }],
    price:[[{ ko:'모든 거래', en:'Every deal' }, { ko:'무료', en:'Free' }]],
    faq:[[{ ko:'영업비밀이 체인에 올라가나요?', en:'Do trade secrets go on-chain?' }, { ko:'아니요. 해시만 올라가며 해시로는 원래 내용을 알 수 없습니다.', en:'No. Only hashes, which cannot be reversed into content.' }]] }
];
route('/u/services', () => ({
  top: topbar({ back:'/u/home', title: tt('보호 서비스', 'Protection services') }),
  html: `<p class="body-s mt4">${tt('익명 거래를 가능하게 하는 일곱 가지 장치입니다. 각 서비스에서 직접 해 볼 수 있어요.', 'Seven building blocks behind anonymous deals. Each one has a live demo.')}</p>
    <div class="svc-list mt16">${SERVICES.map(s => `<button class="svc-tile" data-go="/u/service/${s.id}"><span class="ico-box ${s.tone}">${ic(s.icon)}</span><div><div class="t">${L(s.name)}</div><div class="s mt4">${L(s.tag)}</div></div></button>`).join('')}</div>`
}));
route('/u/service/:id', (p, qs) => {
  const s = SERVICES.find(x => x.id === p.id); if (!s) return App.go('/u/services', true);
  const demo = SVC_DEMO[s.id] ? SVC_DEMO[s.id](qs) : { html:'' };
  return {
    noTabs:true,
    top: topbar({ back:'/u/services', title: L(s.name) }),
    html: `
      <div class="svc-hero mt4"><span class="ico-box ${s.tone}">${ic(s.icon)}</span><h1 class="h2 mt12">${L(s.name)}</h1><p class="body-s mt8">${L(s.tag)}</p>
        <div class="hstack mt16" style="gap:8px"><span class="tag">${L(s.stat[0])}</span><b class="tnum">${L(s.stat[1])}</b></div></div>
      <section class="section"><div class="section-head"><h2 class="h3">${tt('직접 해 보기', 'Try it')}</h2><span class="tag">${tt('데모', 'Demo')}</span></div><div id="svc-demo">${demo.html}</div></section>
      <section class="section"><h2 class="h3" style="margin-bottom:12px">${tt('이렇게 작동합니다', 'How it works')}</h2><ol class="howto card">${s.how.map(h => `<li><div><b>${L(h[0])}</b><span>${L(h[1])}</span></div></li>`).join('')}</ol></section>
      <section class="section"><h2 class="h3" style="margin-bottom:12px">${tt('받는 것', 'What you get')}</h2><div class="card stack">${s.gets.map(g => `<div class="hstack" style="align-items:flex-start;gap:10px"><span class="ok-ic" style="flex:none">${ic('check')}</span><span style="font-size:14.5px">${L(g)}</span></div>`).join('')}</div></section>
      <section class="section"><h2 class="h3" style="margin-bottom:4px">${tt('요금', 'Pricing')}</h2><div class="card" style="padding-top:4px;padding-bottom:4px">${s.price.map(r => `<div class="price-row"><span>${L(r[0])}</span><b>${L(r[1])}</b></div>`).join('')}</div></section>
      <section class="section"><h2 class="h3" style="margin-bottom:12px">${tt('자주 묻는 질문', 'FAQ')}</h2>${s.faq.map(f => `<details class="acc"><summary>${L(f[0])}${ic('down')}</summary><div class="ans">${L(f[1])}</div></details>`).join('')}</section>`,
    after: mode() === 'client' ? `<div class="cta-bar"><button class="btn btn-primary" data-act="svc-start" data-v="${s.id}">${s.id === 'decompose' ? tt('시스템 분해로 퀘스트 만들기', 'Build quests by decomposition') : tt('이 보호를 적용해 퀘스트 만들기', 'Create a quest with this protection')}</button></div>` : '',
    mount: demo.mount
  };
});
ACT['svc-start'] = el => { if (el.dataset.v === 'decompose'){ window.scrollTo({ top: $('#svc-demo').offsetTop - 70, behavior:'smooth' }); return; } App.ui.draft = newDraft('struct'); App.go('/u/new?step=1'); };

/* ---- service demos ---- */
const SVC_DEMO = {};
const EXPO_SAMPLE_KO = '프로젝트명: Project Maple (GR-AMR 3세대)\n담당: 김도윤 책임 010-2917-4432, dy.kim@gaon-robotics.co.kr\n요구: (주)가온로보틱스 리프트 모듈, 도면번호 GR-LFT-0032\n조건: PCD 120mm 볼트 4점, 적재 50kg, 2027년 2분기 양산';
const EXPO_SAMPLE_EN = 'Project: Project Maple (GR-AMR gen 3)\nContact: Doyun Kim, 010-2917-4432, dy.kim@gaon-robotics.co.kr\nNeed: Gaon Robotics Inc. lift module, drawing GR-LFT-0032\nSpec: PCD 120mm, 4 bolts, 50 kg payload, mass production Q2 2027';
const EXPO_RULES = [
  { re:/[\w.+-]+@[\w-]+\.[\w.]+/g, w:14, l:1, fix:{ ko:'[이메일]', en:'[email]' } },
  { re:/0\d{1,2}-\d{3,4}-\d{4}/g, w:12, l:1, fix:{ ko:'[연락처]', en:'[phone]' } },
  { re:/\(주\)\s?[가-힣]+|[A-Z][a-z]+ Robotics Inc\./g, w:18, l:1, fix:{ ko:'[발주사]', en:'[client]' } },
  { re:/[가-힣]{3}\s?(책임|선임|수석|팀장)|Doyun Kim/g, w:10, l:1, fix:{ ko:'[담당자]', en:'[contact]' } },
  { re:/\b[A-Z]{2,}-[A-Z]{2,}-\d{2,}\b/g, w:9, l:1, fix:{ ko:'DWG-001', en:'DWG-001' } },
  { re:/Project [A-Z][a-z]+/g, w:9, l:2, fix:{ ko:'[프로젝트]', en:'[project]' } },
  { re:/GR-AMR( 3세대| gen 3)?/g, w:7, l:2, fix:{ ko:'차세대 물류 로봇', en:'next-gen logistics robot' } },
  { re:/PCD \d+mm/g, w:6, l:2, fix:{ ko:'PCD 100~140mm', en:'PCD 100–140mm' } },
  { re:/20\d\d년 \d분기 양산|mass production Q\d 20\d\d/g, w:10, l:3, fix:{ ko:'일정은 계약 후 공개', en:'schedule after contract' } }
];
function expoAnalyze(text){
  let score = 0; const hits = [];
  EXPO_RULES.forEach(r => { const m = text.match(r.re); if (m){ score += r.w * Math.min(m.length, 2); hits.push(r); } });
  let html = esc(text);
  EXPO_RULES.forEach(r => { html = html.replace(new RegExp(r.re.source, 'g'), s => `<span class="hl ${r.l === 1 ? 'l1' : ''}">${s}</span>`); });
  return { score: Math.min(100, score), html, hits };
}
SVC_DEMO.exposure = () => {
  const text = App.ui.expoText ?? (isKo() ? EXPO_SAMPLE_KO : EXPO_SAMPLE_EN);
  const a = expoAnalyze(text), rl = riskLabel(a.score);
  return { html: `<div class="card">
    <div class="field"><label for="ex-in">${tt('검사할 문장 (수정해 보세요)', 'Text to check (edit it)')}</label><textarea class="textarea" id="ex-in" data-in="expo-in" style="min-height:120px">${esc(text)}</textarea></div>
    <div class="hstack mt16" style="gap:16px;align-items:center"><div class="gauge" style="width:120px;height:70px;margin:0"><svg viewBox="0 0 180 104" style="width:120px;height:70px">${gaugeSvg(a.score).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></div><div><div class="caption">${tt('노출 점수', 'Exposure score')}</div><div class="big-num" id="ex-score" style="color:${rl.c};font-size:28px">${a.score}</div><div class="caption" style="color:${rl.c};font-weight:700">${rl.t} · ${tt(`단서 ${a.hits.length}종`, `${a.hits.length} clue types`)}</div></div></div>
    <div class="preview-text mt12" id="ex-out">${a.html}</div>
    <div class="hstack mt12"><button class="btn btn-primary btn-m" style="flex:1" data-act="expo-fix">${ic('spark')}${tt('권장대로 가리기', 'Mask as suggested')}</button><button class="btn btn-gray btn-m" data-act="expo-reset">${ic('refresh')}</button></div>
  </div>` };
};
ACT['expo-in'] = el => { App.ui.expoText = el.value; clearTimeout(App.ui.exT); App.ui.exT = setTimeout(() => { const pos = el.selectionStart; App.refresh(); const n = $('#ex-in'); if (n){ n.focus(); n.setSelectionRange(pos, pos); } }, 350); };
ACT['expo-fix'] = () => { let t = App.ui.expoText ?? (isKo() ? EXPO_SAMPLE_KO : EXPO_SAMPLE_EN); EXPO_RULES.forEach(r => { t = t.replace(new RegExp(r.re.source, 'g'), L(r.fix)); }); App.ui.expoText = t; haptic('success'); App.refresh(); toast(tt('식별 단서를 권장 방식으로 처리했습니다.', 'Clues handled as suggested.'), 'ok'); };
ACT['expo-reset'] = () => { App.ui.expoText = null; App.refresh(); };

const DECOMP = {
  lift:{ name:{ ko:'실내 물류 로봇용 50kg 리프트 모듈', en:'50 kg lift module for an indoor logistics robot' }, nodes:[
    ['Q1', { ko:'프레임 구조 설계', en:'Frame design' }, 'A', 22], ['Q2', { ko:'구조·피로 해석', en:'Structural & fatigue analysis' }, 'A', 14], ['Q3', { ko:'모터 드라이버 펌웨어', en:'Motor driver firmware' }, 'B', 18],
    ['Q4', { ko:'제어 시험 데이터 분석', en:'Control test data analysis' }, 'B', 11], ['Q5', { ko:'프레임 부품 정밀가공', en:'Frame part machining' }, 'A', 9], ['Q6', { ko:'조립·기능시험', en:'Assembly & function test' }, 'C', 26]] },
  gimbal:{ name:{ ko:'산업용 드론 3축 짐벌', en:'3-axis gimbal for an industrial drone' }, nodes:[
    ['Q1', { ko:'짐벌 암 경량 설계', en:'Lightweight gimbal arms' }, 'A', 19], ['Q2', { ko:'진동 모드 해석', en:'Vibration mode analysis' }, 'A', 12], ['Q3', { ko:'BLDC 제어 펌웨어', en:'BLDC control firmware' }, 'B', 21],
    ['Q4', { ko:'IMU 데이터 필터 튜닝', en:'IMU filter tuning' }, 'B', 15], ['Q5', { ko:'암 부품 가공', en:'Arm machining' }, 'A', 8], ['Q6', { ko:'조립·흔들림 시험', en:'Assembly & stabilization test' }, 'C', 24]] }
};
SVC_DEMO.decompose = () => {
  const k = App.ui.decKey || 'lift', st = App.ui.decStage || 0, D = DECOMP[k];
  const shown = D.nodes.slice(0, st);
  return { html: `<div class="card">
    <div class="label">${tt('시스템 선택', 'Pick a system')}</div>
    <div class="seg mt8"><button class="${k === 'lift' ? 'on' : ''}" data-act="dec-key" data-v="lift">${tt('리프트 모듈', 'Lift module')}</button><button class="${k === 'gimbal' ? 'on' : ''}" data-act="dec-key" data-v="gimbal">${tt('드론 짐벌', 'Drone gimbal')}</button></div>
    ${st === 0 ? `<button class="btn btn-primary btn-block mt16" data-act="dec-run">${ic('tree')}${tt('AI로 분해하기', 'Decompose with AI')}</button>` : `
    <div class="tree mt16"><div class="root">${L(D.name)}</div><div class="branches">${shown.map((n, i) => `<div class="qnode" style="animation-delay:${i * 40}ms"><b>${n[0]} ${L(n[1])}</b><span class="if if-${n[2].toLowerCase()}">${tt('접점', 'IF')}-${n[2]}</span><div class="caption mt4">${tt('추정 난이도', 'Guessability')} ${n[3]}</div><div class="bar mt4" style="height:5px"><i style="width:${n[3] * 3}%;background:${n[3] > 20 ? 'var(--warn)' : 'var(--good)'}"></i></div></div>`).join('')}</div></div>
    ${st >= 6 ? `<div class="ai-shield" style="background:var(--warn-soft);color:var(--warn)">${ic('alert')}${tt('Q1과 Q3을 한 수행사가 맡으면 "50kg을 드는 전동 기구"까지 좁혀집니다. 동일 수행사 매칭을 차단했습니다.', 'If one supplier got Q1 and Q3, they could infer "a motorized 50 kg lifter". Same-supplier matching is blocked.')}</div>
      <div class="caption mt12">${tt('접점 조건은 인터페이스 통제 문서(ICD) 형식으로 잠기고, 수행사에게는 "지켜야 할 규격"만 전달됩니다.', 'Interfaces are locked as ICDs; suppliers only see the spec they must meet, not why.')}</div>
      <button class="btn btn-primary btn-block mt16" data-act="dec-create">${tt('6개 퀘스트 초안 만들기', 'Create 6 draft quests')}</button>` : `<div class="hstack mt12" style="gap:8px"><span class="spinner"></span><span class="body-s">${tt('의존 관계와 접점을 분석하는 중…', 'Mapping dependencies and interfaces…')}</span></div>`}`}
  </div>`, mount(){ if (st > 0 && st < 6) App.later(420, () => { App.ui.decStage = st + 1; App.refresh(); }); } };
};
ACT['dec-key'] = el => { App.ui.decKey = el.dataset.v; App.ui.decStage = 0; App.refresh(); };
ACT['dec-run'] = () => { App.ui.decStage = 1; haptic(); App.refresh(); };
ACT['dec-create'] = async btn => {
  if (mode() !== 'client') return toast(tt('발주사 모드에서 만들 수 있어요.', 'Switch to client mode to create quests.'), 'warn');
  await withLoading(btn, 900);
  const D = DECOMP[App.ui.decKey || 'lift'];
  D.nodes.slice().reverse().forEach((n, i) => {
    const id = 'Q-2026-D' + String(hash32(n[0] + D.name.en + Date.now()) % 900 + 100);
    App.state.quests.unshift({ id, fromDemo:true, cat: n[2] === 'B' ? 'embedded' : n[0] === 'Q5' ? 'machining' : 'struct', status:'draft', budget:[15, 20, 25, 10, 12, 8][5 - i] * 1e6, deadline:Date.now() + 30 * DAY, created:Date.now(), exposure:n[3],
      title:{ ko:`${n[0]} ${n[1].ko}`, en:`${n[0]} ${n[1].en}` }, goal:{ ko:`${L(D.name)}의 하위 과업`, en:`Sub-task of ${D.name.en}` }, provided:{ ko:'계약 후 공개', en:'After contract' }, iface:{ ko:`접점 IF-${n[2]} (잠김)`, en:`Interface IF-${n[2]} (locked)` }, delivery:{ ko:'명세에 따름', en:'Per spec' }, quals:['secure'], disclosure:{ ko:'게시: 목표만', en:'Posted: goal only' }, criteria:[{ ko:`접점 IF-${n[2]} 규격 충족`, en:`Meets IF-${n[2]}` }], proposals:[], selected:null, progress:0, chat:[], deliverables:[], verdict:null, escrow:{ status:'none' }, records:[] });
  });
  App.save(); App.ui.decStage = 0; toast(tt('초안 6개를 만들었습니다. 내 퀘스트의 "작성 중"에서 확인하세요.', '6 drafts created. See "Drafts" in My quests.'), 'ok'); App.go('/u/quests?f=draft');
};
SVC_DEMO.credential = () => {
  const v = App.ui.credView || 'client';
  const toks = ['iso9001', 'ansys', 'aero5', 'secure'];
  return { html: `<div class="card"><div class="seg"><button class="${v === 'client' ? 'on' : ''}" data-act="cred-view" data-v="client">${tt('발주사가 보는 화면', 'What clients see')}</button><button class="${v === 'platform' ? 'on' : ''}" data-act="cred-view" data-v="platform">${tt('플랫폼이 보관한 원본', 'What Quest holds')}</button></div>
    ${v === 'client' ? `<div class="hstack mt16">${veil('D8R2', 'l')}<div><div class="h4">${tt('수행사', 'Supplier')} D8R2</div><div class="caption">★ 4.8 · ${tt('완료 27건', '27 jobs')}</div></div></div><div class="hstack wrap mt12">${toks.map(k => tokenChip(k)).join('')}</div><div class="caption mt12">${tt('회사명, 소재지, 규모, 고객명은 보이지 않습니다.', 'No name, location, size or past clients.')}</div>` :
    `<div class="check-list mt8">${[[tt('사업자등록', 'Business registration'), '(주)세움해석 (데모) · 305-86-*****', tt('국세청 조회 · 계속사업자', 'Tax authority · active')], [tt('ISO 9001 인증서', 'ISO 9001 certificate'), 'KR-QMS-2291-*** ', tt('발급 기관 조회 완료', 'Verified with issuer')], [tt('FEA 소프트웨어 라이선스', 'FEA software license'), 'Lic. #88-*****-2', tt('벤더 확인 완료', 'Vendor confirmed')], [tt('수행 이력 5건', '5 past jobs'), tt('고객명 가림', 'Clients masked'), tt('계약서 사본 확인', 'Contracts checked')]].map(r => `<div class="ci"><span class="ok-ic">${ic('check')}</span><div class="grow"><div style="font-weight:650">${r[0]}</div><div class="s"><span class="masked">${esc(r[1])}</span> · ${r[2]}</div></div></div>`).join('')}</div><div class="caption mt8">${tt('원본은 플랫폼만 보관하고 분기마다 다시 확인합니다.', 'Originals stay with Quest and are re-checked each quarter.')}</div>`}
  </div>` };
};
ACT['cred-view'] = el => { App.ui.credView = el.dataset.v; haptic(); App.refresh(); };
SVC_DEMO.aireview = () => {
  const st = App.ui.airStage || 0;
  const steps = [tt('모델 스냅샷 고정', 'Pin model snapshots'), tt('Claude Opus 5 판정', 'Claude Opus 5 verdict'), tt('OpenAI 교차 판정', 'OpenAI cross-check'), tt('입력 순서 바꿔 재판정', 'Order-swapped rerun'), tt('결과 비교', 'Compare')];
  const crit = [{ ko:'안전계수 1.5 이상', en:'Safety factor ≥ 1.5' }, { ko:'메시 수렴성 보고', en:'Mesh convergence' }, { ko:'결과 CSV 형식', en:'CSV format' }];
  const v = { state:'pass', agree:3, total:3, criteria:[{ r:{ ko:'최소 1.64', en:'Min 1.64' }, a:true, b:true }, { r:{ ko:'3단계, 편차 2.1%', en:'3 levels, 2.1% dev.' }, a:true, b:true }, { r:{ ko:'열 구조 일치', en:'Columns match' }, a:true, b:true }] };
  return { html: `<div class="card">${fileRow({ name:'bracket_report_sample.pdf', size:'4.2 MB', ext:'pdf' })}
    ${st === 0 ? `<button class="btn btn-primary btn-block mt16" data-act="air-run">${ic('spark')}${tt('예비 판정 돌려 보기', 'Run a pre-check')}</button>` :
    `<div class="stack mt16">${steps.map((s, i) => `<div class="hstack" style="gap:10px">${i < st ? `<span class="ok-ic">${ic('check')}</span>` : i === st ? '<span class="spinner"></span>' : `<span class="wait-ic">${ic('clock')}</span>`}<span style="font-size:14px;${i > st ? 'color:var(--muted)' : ''}">${s}</span></div>`).join('')}</div>
    ${st >= 5 ? `<div class="mt16">${verdictPanel(v, crit)}</div><button class="btn btn-gray btn-block mt12" data-act="air-reset">${tt('다시 해 보기', 'Run again')}</button>` : ''}`}
  </div>`, mount(){ if (st > 0 && st < 5) App.later(600, () => { App.ui.airStage = st + 1; App.refresh(); }); } };
};
ACT['air-run'] = () => { App.ui.airStage = 1; App.refresh(); };
ACT['air-reset'] = () => { App.ui.airStage = 0; App.refresh(); };
SVC_DEMO.certificate = qs => {
  const qs2 = App.state.quests.filter(q => q.selected);
  const qid = qs.q || App.ui.certQ || (qs2[0] && qs2[0].id);
  const q = findQuest(qid) || qs2[0];
  if (!q) return { html: `<div class="card">${emptyState('cert', tt('계약한 퀘스트가 있어야 발급할 수 있어요', 'You need a contracted quest first'))}</div>` };
  const sup = supplierOf(q), issued = (App.ui.certIssued || {})[q.id];
  const rows = [[q.created, tt('전체 공개', 'Public'), tt('목표·자격 조건', 'Goal & qualifications'), tt('비공개 수신자 다수', 'Anonymous bidders')], [q.records.find(r => r.ev.en === EV.contract.en)?.ts || q.created + 3 * DAY, tt('계약 후', 'Post-contract'), tt('제공 정보 전체', 'All inputs'), `${tt('수행사', 'Supplier')} ${sup.alias}`]];
  return { html: `<div class="card">
    <div class="field"><label for="cert-q">${tt('퀘스트', 'Quest')}</label><select class="select" id="cert-q" data-ch="cert-q">${qs2.map(x => `<option value="${x.id}" ${x.id === q.id ? 'selected' : ''}>${x.id} · ${esc(L(x.title))}</option>`).join('')}</select></div>
    <div class="cert mt16"><div class="seal">QUEST<br>${tt('비밀관리', 'SECRECY')}<br>${tt('증명', 'PROOF')}</div>
      <div class="caption">${tt('비밀관리 증명서', 'Secrecy management certificate')}</div><div class="h3 mt4" style="max-width:70%">${esc(L(q.title))}</div>
      <div class="caption mt4">${q.id} · ${tt('발급번호', 'No.')} SP-${hexOf(q.id, 6).toUpperCase()}</div>
      <div class="tbl-wrap mt16" style="margin:0"><table class="tbl" style="min-width:0;font-size:12.5px"><thead><tr><th>${tt('일시', 'Date')}</th><th>${tt('등급', 'Level')}</th><th>${tt('공개 범위', 'Scope')}</th><th>${tt('수신자·동의', 'Recipient')}</th></tr></thead><tbody>${rows.map(r => `<tr><td class="tnum">${fmtDate(r[0], 'full')}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]} <span style="color:var(--good)">✓NDA</span></td></tr>`).join('')}</tbody></table></div>
      <div class="hash">${tt('기록 해시', 'Record hash')} ${shortHash(txHash(q.id + 'cert'))}</div>
    </div>
    ${issued ? `<div class="ai-shield">${ic('check')}${tt('발급했습니다. 체인에 발급 기록이 남았습니다.', 'Issued. The issuance was anchored on-chain.')}</div><button class="btn btn-gray btn-block mt12" data-act="cert-share" data-id="${q.id}">${ic('send')}${tt('증명서 공유', 'Share certificate')}</button>` : `<button class="btn btn-primary btn-block mt16" data-act="cert-issue" data-id="${q.id}">${tt('증명서 발급', 'Issue certificate')}</button>`}
  </div>` };
};
ACT['cert-q'] = el => { App.ui.certQ = el.value; App.go('/u/service/certificate?q=' + el.value, true); };
ACT['cert-issue'] = async btn => { const q = findQuest(btn.dataset.id); await withLoading(btn, 1000); App.ui.certIssued = Object.assign(App.ui.certIssued || {}, { [q.id]: true }); addChain(q, { ko:'비밀관리 증명서 발급', en:'Secrecy certificate issued' }); App.save(); toast(tt('증명서를 발급했습니다.', 'Certificate issued.'), 'ok'); App.refresh(); };
ACT['cert-share'] = el => shareText(`Quest secrecy certificate SP-${hexOf(el.dataset.id, 6).toUpperCase()} (${el.dataset.id})`);
SVC_DEMO.shipping = () => {
  const st = App.ui.shipStage ?? 1;
  const S = [[tt('수행사 출고', 'Supplier shipped'), tt('받는 곳: Quest 대전 거점', 'To: Quest Daejeon hub'), 'box'], [tt('거점 입고·검수', 'Hub intake'), tt('외관 사진 6장, 수량 20/20', '6 photos, 20/20 units'), 'scan'], [tt('송장 교체', 'Relabeled'), tt('보내는 곳: Quest', 'From: Quest'), 'swap'], [tt('발주사 배송 중', 'Out for delivery'), tt('도착 예정 내일 오전', 'Arrives tomorrow AM'), 'truck'], [tt('수령 확인', 'Received'), tt('검수 기준 "블라인드 배송 완료" 충족', 'Meets "blind delivery completed"'), 'check']];
  return { html: `<div class="card">
    <div class="hstack between"><div><div class="caption">${tt('운송장', 'Tracking')}</div><b class="tnum">QB-${hexOf('ship', 8).toUpperCase()}</b></div><span class="pill st-progress">${S[Math.min(st, 4)][0]}</span></div>
    <div class="grid2 mt16"><div class="card outline tight"><div class="caption">${tt('수행사 화면', 'Supplier sees')}</div><div style="font-weight:650;font-size:13.5px" class="mt4">${tt('받는 곳: Quest 중계 거점', 'To: Quest relay hub')}</div></div><div class="card outline tight" style="margin-top:0"><div class="caption">${tt('발주사 화면', 'Client sees')}</div><div style="font-weight:650;font-size:13.5px" class="mt4">${tt('보낸 곳: Quest', 'From: Quest')}</div></div></div>
    <div class="tl mt20">${S.map((s, i) => `<div class="tl-item ${i <= st ? '' : 'muted-dot'}"><div class="t" style="${i > st ? 'color:var(--muted)' : ''}">${s[0]}</div><div class="s">${i <= st ? s[1] : tt('대기', 'Pending')}</div></div>`).join('')}</div>
    <button class="btn ${st >= 4 ? 'btn-gray' : 'btn-primary'} btn-block mt16" data-act="ship-next">${st >= 4 ? tt('처음부터 다시', 'Restart') : tt('다음 단계 진행', 'Advance shipment')}</button>
  </div>` };
};
ACT['ship-next'] = () => { const s = App.ui.shipStage ?? 1; App.ui.shipStage = s >= 4 ? 0 : s + 1; haptic(); App.refresh(); };
SVC_DEMO.records = () => {
  const B = App.state.admin.batches, r = App.ui.recCheck;
  return { html: `<div class="card">
    <div class="h4">${tt('최근 앵커링', 'Recent anchors')}</div>
    <div class="stack mt12">${B.slice(0, 3).map(b => `<div class="hstack between"><div><div style="font-weight:650;font-size:14px">${b.id} · ${tt(`해시 ${b.count}건`, `${b.count} hashes`)}</div><div class="caption">${ago(b.ts)} · ${tt('블록', 'Block')} #${num(b.block)}</div></div><span class="hash" style="margin:0">${shortHash(b.root)}</span></div>`).join('')}</div>
    <div class="divider"></div>
    <div class="h4">${tt('파일로 검증하기', 'Verify a file')}</div>
    <div class="caption mt4">${tt('납품물을 고르면 해시를 계산해 체인 기록과 비교합니다.', 'Pick a deliverable; we hash it and compare with the chain.')}</div>
    <div class="stack mt12">${['frame_analysis_report_v2.pdf', 'results_static_fatigue.csv', 'frame_analysis_report_v2 (edited).pdf'].map(f => `<button class="file" style="width:100%;text-align:left" data-act="rec-check" data-f="${f}"><span class="ext ${f.endsWith('csv') ? 'csv' : 'pdf'}">${f.endsWith('csv') ? 'CSV' : 'PDF'}</span><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f}</div></div>${r && r.f === f ? (r.ok ? `<span class="ok-ic">${ic('check')}</span>` : `<span class="no-ic">${ic('x')}</span>`) : ic('chev', 'chev')}</button>`).join('')}</div>
    ${r ? `<div class="ai-shield" style="${r.ok ? '' : 'background:var(--bad-soft);color:var(--bad)'}">${ic(r.ok ? 'shield' : 'alert')}<span>${r.ok ? tt(`일치합니다. ${fmtDate(Date.now() - 2 * DAY, 'full')}에 기록된 원본과 같은 파일입니다.`, `Match. Identical to the original anchored on ${fmtDate(Date.now() - 2 * DAY, 'full')}.`) : tt('일치하지 않습니다. 기록 이후 내용이 바뀐 파일입니다.', 'No match. This file changed after it was recorded.')}</span></div>` : ''}
  </div>` };
};
ACT['rec-check'] = async el => { el.insertAdjacentHTML('beforeend', '<span class="spinner" style="width:18px;height:18px"></span>'); await sleep(900); App.ui.recCheck = { f:el.dataset.f, ok:!el.dataset.f.includes('edited') }; App.refresh(); };

/* ================= wallet ================= */
route('/u/wallet', () => mode() === 'supplier' ? U.supWallet() : U.wallet());
U.wallet = () => {
  const W = App.state.wallet, qs = App.state.quests;
  const held = qs.filter(q => q.escrow && q.escrow.status === 'deposited');
  const heldSum = held.reduce((a, q) => a + priceOf(q), 0);
  return {
    top: topbar({ title: tt('지갑', 'Wallet'), right: bellBtn() }),
    html: `
      <div class="card mt4">
        <div class="caption">${tt('사용 가능 잔액', 'Available balance')}</div>
        <div class="big-num mt4">${won(W.balance)}</div>${wonHint(W.balance)}
        <div class="grid2 mt16"><button class="btn btn-primary btn-m" data-act="w-topup">${tt('충전', 'Top up')}</button><button class="btn btn-gray btn-m" data-act="w-withdraw">${tt('출금', 'Withdraw')}</button></div>
      </div>
      <div class="card mt12"><div class="hstack between"><div class="h4">${tt('예치 중', 'In escrow')}</div><b class="tnum">${won(heldSum)}</b></div>
        <div class="stack mt12">${held.map(q => `<button class="hstack between" style="width:100%;text-align:left" data-go="/u/quest/${q.id}"><div style="min-width:0"><div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(L(q.title))}</div><div class="caption">${q.id} · ${L(STATUS[q.status])}</div></div><b class="tnum" style="font-size:14px">${won(priceOf(q))}</b></button>`).join('') || `<div class="caption">${tt('예치 중인 대금이 없습니다', 'Nothing in escrow')}</div>`}</div>
        <div class="caption mt12">${tt('검수가 확정되면 수행사에게 지급됩니다. 결제 수단은 가상계좌로 고정되어 1천만 원 거래도 수수료가 약 600원입니다.', 'Released to the supplier on acceptance. Virtual accounts keep fees near ₩600 even on ₩10M deals.')}</div>
      </div>
      <section class="section"><div class="section-head"><h2 class="h3">${tt('월별 발주액', 'Monthly spend')}</h2></div><div class="card"><div class="chart" id="w-chart"></div></div></section>
      <section class="section"><div class="section-head"><h2 class="h3">${tt('거래 내역', 'Activity')}</h2></div>
        <div class="group">${W.txs.map(t => `<div class="row"><span class="ico-box ${t.kind === 'in' ? 'good' : t.kind === 'escrow' ? 'accent' : ''}">${ic(t.kind === 'in' ? 'dn' : t.kind === 'escrow' ? 'lock' : 'check')}</span><div class="grow"><div class="t" style="font-size:14px">${esc(L(t.t))}</div><div class="s">${fmtDate(t.ts, 'dt')}</div></div><b class="tnum" style="font-size:14.5px;${t.kind === 'in' ? 'color:var(--good)' : t.kind === 'release' ? 'color:var(--muted)' : ''}">${t.kind === 'in' ? '+' : t.kind === 'escrow' ? '−' : ''}${won(Math.abs(t.amt))}</b></div>`).join('')}</div>
      </section>
      <section class="section"><div class="section-head"><h2 class="h3">${tt('세금계산서', 'Tax invoices')}</h2></div>
        <div class="group">${W.invoices.map(i => `<div class="row"><span class="ico-box">${ic('doc')}</span><div class="grow"><div class="t" style="font-size:14px">${i.no}</div><div class="s">${i.q} · ${L(i.st)}</div></div><b class="tnum" style="font-size:14px">${won(i.amt)}</b></div>`).join('')}</div>
        <div class="caption mt8">${tt('모든 세금계산서는 Quest 명의로 발행되어 수행사 정보가 서류에 드러나지 않습니다.', 'Every invoice is issued by Quest, so supplier details never appear on your paperwork.')}</div>
      </section>`,
    mount(){ barChart($('#w-chart'), { labels: monthLabels(6), values: W.monthly, color:'var(--s1)', colors: W.monthly.map((v, i) => i === 5 ? 'var(--s1)' : 'color-mix(in srgb, var(--s1) 45%, transparent)'), fmt: v => shortWon(v), tick: v => shortWon(v), pl: 54, showVals:true, label: tt('월별 발주액', 'Monthly spend') }); }
  };
};
ACT['w-topup'] = () => {
  openSheet(`<div class="sh-title">${tt('가상계좌로 충전', 'Top up by virtual account')}</div><div class="sh-sub">${tt('아래 계좌로 입금하면 자동으로 잔액에 반영됩니다.', 'Transfers to this account are credited automatically.')}</div>
    <div class="card outline mt16"><div class="caption">${tt('제휴은행 (데모)', 'Partner bank (demo)')}</div><div class="hstack between mt4"><b class="tnum" style="font-size:18px">562-910-03-400118</b><button class="btn btn-gray btn-s" data-act="copy" data-text="562-910-03-400118">${ic('copy')}${tt('복사', 'Copy')}</button></div></div>
    <button class="btn btn-primary btn-block mt16" data-act="w-sim">${tt('데모: 1,000만 원 입금하기', 'Demo: deposit ₩10M')}</button>`);
};
ACT['w-sim'] = async btn => { await withLoading(btn, 1000); const W = App.state.wallet; W.balance += 10000000; W.txs.unshift({ t:{ ko:'가상계좌 입금', en:'Virtual account top-up' }, amt:10000000, ts:Date.now(), kind:'in' }); App.save(); closeLayer(true); toast(tt('1,000만 원이 충전되었습니다.', '₩10M added.'), 'ok'); App.refresh(); };
ACT['w-withdraw'] = () => toast(tt('데모에서는 출금이 비활성화되어 있습니다.', 'Withdrawals are disabled in the demo.'));

/* ================= notifications ================= */
route('/u/notifications', () => {
  const list = App.state.notifs.filter(n => n.aud === mode());
  return {
    noTabs:true,
    top: topbar({ back:'/u/home', title: tt('알림', 'Notifications'), right: list.some(n => !n.read) ? `<button class="link-btn" style="padding:0 12px" data-act="n-all">${tt('모두 읽음', 'Mark all read')}</button>` : '' }),
    html: `<div class="group mt4">${list.map(n => `<button class="noti ${n.read ? '' : 'unread'}" data-act="n-open" data-id="${n.id}"><span class="ico-box ${n.tone || ''}">${ic(n.icon || 'bell')}</span><div style="flex:1;min-width:0"><div class="t">${esc(L(n.t))}</div><div class="s">${esc(L(n.s))}</div><div class="tm">${ago(n.ts)}</div></div></button>`).join('') || emptyState('bell', tt('알림이 없어요', 'No notifications'))}</div>`
  };
});
ACT['n-open'] = el => { const n = App.state.notifs.find(x => x.id === el.dataset.id); if (!n) return; n.read = true; App.save(); if (n.go) App.go(n.go); else App.refresh(); };
ACT['n-all'] = () => { App.state.notifs.forEach(n => { if (n.aud === mode()) n.read = true; }); App.save(); App.refresh(); };

/* ================= me ================= */
route('/u/me', () => {
  const S = App.state, sup = mode() === 'supplier', alias = sup ? S.supplier.alias : S.me.clientAlias;
  return {
    top: topbar({ title: 'MY', right: bellBtn() }),
    html: `
      <div class="profile">${veil(alias, 'xl')}<div><div class="n">${sup ? tt('수행사', 'Supplier') : tt('발주사', 'Client')} ${alias}</div><div class="s">${sup ? 'supplier@quest.demo' : S.me.email}</div><div class="hstack wrap mt8" style="gap:6px">${[tt('사업자 확인', 'Business verified'), tt('실소유자 확인', 'Owner verified'), tt('제재 스크리닝', 'Sanctions clear')].map(t => `<span class="token">${ic('check')}${t}</span>`).join('')}</div></div></div>
      <div class="card outline hstack" style="gap:10px"><span class="ico-box">${ic('lock')}</span><div style="flex:1"><div class="h4">${tt('실명은 플랫폼만 보관합니다', 'Only Quest holds your real name')}</div><div class="caption mt4"><span class="masked">${esc(S.me.real)}</span> · ${tt('거래 상대에게 보이지 않아요', 'never shown to counterparties')}</div></div></div>
      <section class="section"><h2 class="h4" style="margin-bottom:8px">${tt('이용 모드', 'Mode')}</h2>
        <div class="mode-switch"><button class="client ${!sup ? 'on' : ''}" data-act="mode" data-v="client"><b>${tt('발주사', 'Client')}</b><span>${tt('일을 맡기기', 'Post work')}</span></button><button class="supplier ${sup ? 'on' : ''}" data-act="mode" data-v="supplier"><b>${tt('수행사', 'Supplier')}</b><span>${tt('일을 수행하기', 'Do work')}</span></button></div></section>
      <section class="section"><div class="group">
        <button class="row" data-go="/u/services"><span class="ico-box accent">${ic('spark')}</span><div class="grow"><div class="t">${tt('보호 서비스', 'Protection services')}</div></div>${ic('chev', 'chev')}</button>
        <button class="row" data-go="/u/service/certificate"><span class="ico-box good">${ic('cert')}</span><div class="grow"><div class="t">${tt('비밀관리 증명서', 'Secrecy certificates')}</div></div>${ic('chev', 'chev')}</button>
        <button class="row" data-go="/u/notifications"><span class="ico-box info">${ic('bell')}</span><div class="grow"><div class="t">${tt('알림', 'Notifications')}</div></div>${unread() ? `<span class="pill plain st-dispute">${unread()}</span>` : ''}${ic('chev', 'chev')}</button>
      </div></section>
      <section class="section"><h2 class="h4" style="margin-bottom:8px">${tt('설정', 'Settings')}</h2><div class="group">
        <div class="row"><span class="ico-box">${ic('globe')}</span><div class="grow"><div class="t">${tt('언어', 'Language')}</div></div>${langSeg()}</div>
        <div class="row"><span class="ico-box">${ic('moon')}</span><div class="grow"><div class="t">${tt('화면 테마', 'Theme')}</div></div><div class="lang-seg">${[['system', tt('자동', 'Auto')], ['light', tt('라이트', 'Light')], ['dark', tt('다크', 'Dark')]].map(t => `<button data-act="theme" data-v="${t[0]}" class="${(S.theme || 'system') === t[0] ? 'on' : ''}">${t[1]}</button>`).join('')}</div></div>
        <label class="row" style="cursor:pointer"><span class="ico-box">${ic('cpu')}</span><div class="grow"><div class="t">${tt('AI 분석 끄기', 'Opt out of AI analysis')}</div><div class="s">${tt('방산·공공·금융 고객용. 모든 판정을 사람이 합니다', 'For defense, public and finance clients. People review everything')}</div></div><span class="switch"><input type="checkbox" data-ch="optout" ${S.me.optout ? 'checked' : ''}><span></span></span></label>
        <label class="row" style="cursor:pointer"><span class="ico-box">${ic('bell')}</span><div class="grow"><div class="t">${tt('푸시 알림', 'Push notifications')}</div></div><span class="switch"><input type="checkbox" data-ch="push" ${S.me.push !== false ? 'checked' : ''}><span></span></span></label>
      </div></section>
      <section class="section"><h2 class="h4" style="margin-bottom:8px">${tt('데모', 'Demo')}</h2><div class="group">
        <button class="row" data-act="to-admin"><span class="ico-box violet">${ic('settings')}</span><div class="grow"><div class="t">${tt('관리자 콘솔로 전환', 'Switch to admin console')}</div><div class="s">${tt('로그아웃 후 관리자 로그인 화면으로 이동', 'Signs out and opens admin sign-in')}</div></div>${ic('chev', 'chev')}</button>
        <button class="row" data-act="reset"><span class="ico-box warn">${ic('refresh')}</span><div class="grow"><div class="t">${tt('데모 데이터 초기화', 'Reset demo data')}</div></div></button>
        <button class="row" data-act="logout"><span class="ico-box bad">${ic('logout')}</span><div class="grow"><div class="t" style="color:var(--bad)">${tt('로그아웃', 'Sign out')}</div></div></button>
      </div></section>
      <p class="caption center mt24">Quest Demo 1.0.0 · ${tt('가상의 데모 앱', 'Fictional demo app')}</p>`
  };
});
ACT['mode'] = el => { if (App.state.session.mode === el.dataset.v) return; App.state.session.mode = el.dataset.v; App.save(); haptic('success'); toast(el.dataset.v === 'supplier' ? tt('수행사 모드로 전환했습니다', 'Switched to supplier mode') : tt('발주사 모드로 전환했습니다', 'Switched to client mode'), 'ok'); App.go('/u/home'); };
ACT['theme'] = el => { App.state.theme = el.dataset.v; App.save(); applyTheme(); App.refresh(); };
ACT['optout'] = el => { App.state.me.optout = el.checked; App.save(); toast(el.checked ? tt('AI 분석을 껐습니다. 검수는 사람이 진행합니다.', 'AI analysis off. Reviews are done by people.') : tt('AI 분석을 다시 켰습니다.', 'AI analysis back on.'), 'ok'); };
ACT['push'] = el => { App.state.me.push = el.checked; App.save(); };
ACT['logout'] = async () => { const ok = await confirmBox({ title: tt('로그아웃할까요?', 'Sign out?'), ok: tt('로그아웃', 'Sign out') }); if (!ok) return; App.state.session = null; App.save(); App.go('/login', true); };
ACT['to-admin'] = () => { App.state.session = null; App.save(); App.go('/login?role=admin', true); };
ACT['reset'] = async () => { const ok = await confirmBox({ title: tt('데모 데이터를 초기화할까요?', 'Reset demo data?'), body: tt('만든 퀘스트, 대화, 판정 기록이 처음 상태로 돌아갑니다.', 'Quests, chats and decisions you created go back to the starting state.'), ok: tt('초기화', 'Reset'), danger:true }); if (!ok) return; const s = App.state.session; App.reset(); App.state.session = s; App.ui = { navCount: App.ui.navCount }; App.save(); toast(tt('초기화했습니다.', 'Reset done.'), 'ok'); App.go('/u/home', true); App.refresh(); };

/* ================= supplier mode ================= */
function matchRing(p){ const c = p >= 80 ? 'var(--good)' : p >= 60 ? 'var(--warn)' : 'var(--muted)'; const r = 16, L2 = 2 * Math.PI * r; return `<svg viewBox="0 0 40 40" width="44" height="44" aria-label="${p}%"><circle cx="20" cy="20" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="4"/><circle cx="20" cy="20" r="${r}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${L2 * p / 100} ${L2}" transform="rotate(-90 20 20)"/><text x="20" y="24" text-anchor="middle" font-size="11" font-weight="800" fill="var(--ink)">${p}</text></svg>`; }
function mcard(m){
  const S = App.state.supplier, proposed = S.proposals.some(x => x.quest === m.id);
  return `<button class="qcard" data-go="/u/market/${m.id}"><div class="top"><span class="code">${m.id} · ${catLabel(m.cat)}</span>${proposed ? `<span class="pill st-review">${tt('제안함', 'Bid sent')}</span>` : `<span class="pill st-open">${tt('모집 중', 'Open')}</span>`}</div>
    <div class="hstack mt8" style="align-items:flex-start;gap:12px"><div style="flex:1;min-width:0"><div class="ttl" style="margin-top:0">${esc(L(m.title))}</div></div>${matchRing(m.match)}</div>
    <div class="meta"><b>${won(m.budget)}</b><span class="sep"></span><span class="hstack" style="gap:6px">${veil(m.client, 's')}<span style="font-size:12.5px">${tt('발주사', 'Client')} ${m.client}</span></span></div>
    <div class="foot"><span class="lock">${ic('lock')}${tt('상세 자료는 계약 후 공개', 'Details after contract')}</span><span class="lock">${ic('users')}${tt(`제안 ${m.bids}`, `${m.bids} bids`)}</span><span class="dday calm">${dday(m.deadline)}</span></div></button>`;
}
U.supHome = () => {
  const S = App.state.supplier, M = App.state.market;
  const act = S.jobs.filter(j => j.status !== 'done');
  const labels = monthLabels(6);
  return {
    top: topbar({ left: `<div class="hstack" style="padding-left:8px"><span style="width:28px;height:28px;display:block">${LOGO}</span></div>`, title: 'Quest', sub: tt('수행사 모드', 'Supplier mode'), right: bellBtn() }),
    html: `
      <div class="mt8"><div class="h2">${tt(`안녕하세요, 수행사 ${S.alias}님`, `Hi, supplier ${S.alias}`)}</div><div class="body-s mt4">${tt(`자격이 맞는 새 퀘스트가 ${M.filter(m => m.match >= 80).length}건 있어요`, `${M.filter(m => m.match >= 80).length} new quests match your qualifications`)}</div></div>
      <div class="hero-card mt16"><svg class="pattern" viewBox="0 0 40 40">${veilPattern('sup')}</svg>
        <div class="lbl">${tt('정산 예정', 'Upcoming payout')}</div><div class="big-num">${won(S.pendingPay)}</div>${!isKo() ? `<div style="font-size:13px;opacity:.8">${usd(S.pendingPay)}</div>` : ''}
        <div class="sub"><div><span>${tt('진행 작업', 'Active jobs')}</span><b>${act.length}</b></div><div><span>${tt('평점', 'Rating')}</span><b>★ ${S.rating}</b></div><div><span>${tt('누적 정산', 'Paid to date')}</span><b>${won(S.settled)}</b></div></div></div>
      <section class="section"><div class="section-head"><h2 class="h3">${tt('내 자격 토큰', 'My credential tokens')}</h2><button class="more" data-act="tok-add">${tt('자격 추가', 'Add')}${ic('plus')}</button></div>
        <div class="hstack wrap">${S.tokens.map(k => tokenChip(k)).join('')}${S.pendingTokens.map(k => `<span class="token" style="opacity:.75">${ic('clock')}${L(TOKENS[k])} · ${tt('심사 중', 'In review')}</span>`).join('')}</div>
        <div class="caption mt8">${tt('발주사에게는 회사명 없이 이 토큰만 보입니다.', 'Clients see only these tokens, never your company name.')}</div></section>
      <section class="section"><div class="section-head"><h2 class="h3">${tt('추천 퀘스트', 'Recommended')}</h2><button class="more" data-go="/u/market">${tt('전체', 'All')}${ic('chev')}</button></div>${M.slice().sort((a, b) => b.match - a.match).slice(0, 2).map(mcard).join('')}</section>
      <section class="section"><div class="section-head"><h2 class="h3">${tt('진행 중인 작업', 'Active jobs')}</h2><button class="more" data-go="/u/jobs">${tt('전체', 'All')}${ic('chev')}</button></div>${act.map(jcard).join('') || emptyState('list', tt('진행 중인 작업이 없어요', 'No active jobs'))}</section>
      <section class="section"><div class="card"><div class="caption">${tt('최근 6개월 수입', 'Earnings, last 6 months')}</div><div class="h3 mt4 tnum">${won(S.earnings.reduce((a, b) => a + b, 0))}</div>
        <div class="spark-bars mt16">${S.earnings.map((v, i) => `<div class="${i === 5 ? 'cur' : ''}" style="height:${v / Math.max(...S.earnings) * 100}%"></div>`).join('')}</div><div class="spark-labels">${labels.map(l => `<span>${l}</span>`).join('')}</div></div></section>`
  };
};
ACT['tok-add'] = () => {
  const S = App.state.supplier, avail = Object.keys(TOKENS).filter(k => !S.tokens.includes(k) && !S.pendingTokens.includes(k));
  openSheet(`<div class="sh-title">${tt('자격 추가 신청', 'Add a credential')}</div><div class="sh-sub">${tt('증빙 원본은 플랫폼만 확인하고, 통과하면 토큰으로 발급됩니다.', 'Only Quest sees the originals; approved items become tokens.')}</div>
    <div class="stack mt16">${avail.map(k => `<label class="check"><input type="radio" name="tok" value="${k}"> <span>${L(TOKENS[k])}</span></label>`).join('')}</div>
    <button class="dropzone mt16" data-act="tok-file">${ic('upload')}<div>${tt('증빙 파일 올리기', 'Upload evidence')}</div></button><div id="tok-f" class="mt8"></div>
    <button class="btn btn-primary btn-block mt16" data-act="tok-send">${tt('심사 요청', 'Request review')}</button>`);
};
ACT['tok-file'] = () => { $('#tok-f').innerHTML = fileRow({ name:tt('인증서_사본.pdf', 'certificate_copy.pdf'), size:'1.3 MB', ext:'pdf' }); };
ACT['tok-send'] = async btn => {
  const sel = $('input[name="tok"]:checked'); if (!sel) return toast(tt('자격을 골라 주세요.', 'Pick a credential.'), 'warn');
  if (!$('#tok-f').innerHTML) return toast(tt('증빙 파일을 올려 주세요.', 'Upload evidence.'), 'warn');
  await withLoading(btn, 800);
  const S = App.state.supplier; S.pendingTokens.push(sel.value);
  App.state.admin.kyb.unshift({ id:'K-' + (3108 + App.state.admin.kyb.length), alias:S.alias, real:'(주)세움해석 (데모)', biz:'305-86-*****', type:{ ko:'자격 추가 · ' + TOKENS[sel.value].ko, en:'Credential add · ' + TOKENS[sel.value].en }, ts:Date.now(), status:'pending', tokens:[sel.value], checks:{ nts:'ok', owner:'ok', sanction:'ok', cert:'todo', equip:'na' }, fromSupplier:true });
  App.save(); closeLayer(true); toast(tt('심사를 요청했습니다. 관리자 콘솔의 사업자 심사에 올라갑니다.', 'Submitted. It now appears in the admin verification queue.'), 'ok'); App.refresh();
};
route('/u/market', (p, qs) => {
  const f = qs.f || 'all';
  const list = App.state.market.filter(m => f === 'all' || m.cat === f).sort((a, b) => b.match - a.match);
  const cats = ['all'].concat(Object.keys(CATS).filter(k => k !== 'system'));
  return { top: topbar({ title: tt('퀘스트 탐색', 'Explore quests'), right: bellBtn() }),
    html: `<div class="chips mt4">${cats.map(k => `<button class="chip ${f === k ? 'on' : ''}" data-go="/u/market?f=${k}">${k === 'all' ? tt('전체', 'All') : catLabel(k)}</button>`).join('')}</div>
      <div class="ai-shield">${ic('target')}${tt('내 자격 토큰과 일치하는 정도순으로 보여드려요.', 'Sorted by how well your tokens match.')}</div>
      <div class="mt12">${list.map(mcard).join('') || emptyState('search', tt('이 분야의 모집 중인 퀘스트가 없어요', 'No open quests here'))}</div>` };
});
route('/u/market/:id', p => {
  const m = App.state.market.find(x => x.id === p.id), S = App.state.supplier;
  if (!m) return App.go('/u/market', true);
  const mine = S.proposals.find(x => x.quest === m.id);
  const covered = m.quals.filter(k => S.tokens.includes(k)).length;
  return { noTabs:true, top: topbar({ back:'/u/market', title: m.id, sub: catLabel(m.cat) }),
    html: `<div class="hstack mt4">${mine ? `<span class="pill st-review">${tt('제안함 · 검토 대기', 'Bid sent · pending')}</span>` : `<span class="pill st-open">${tt('모집 중', 'Open')}</span>`}<span class="tag">${tt(`제안 ${m.bids}건`, `${m.bids} bids`)}</span></div>
      <h1 class="h2 mt8">${esc(L(m.title))}</h1>
      <div class="hstack mt12" style="align-items:baseline;gap:10px"><span class="big-num" style="font-size:26px">${won(m.budget)}</span>${wonHint(m.budget)}</div>
      <div class="caption mt4">${tt('마감', 'Due')} ${fmtDate(m.deadline)} · <b class="dday">${dday(m.deadline)}</b></div>
      <div class="card mt16 hstack" style="gap:12px">${veil(m.client, 'l')}<div style="flex:1"><div class="h4">${tt('발주사', 'Client')} ${m.client}</div><div class="caption mt4">${tt('반복 발주 5회 · 평균 검수 4.2일 · 지급 지연 0건', '5 repeat orders · 4.2-day avg. review · 0 late payments')}</div></div></div>
      <h2 class="h4 mt20" style="margin-bottom:8px">${tt('목표', 'Goal')}</h2><div class="card body-s" style="color:var(--ink)">${esc(L(m.goal))}</div>
      <h2 class="h4 mt20" style="margin-bottom:8px">${tt('검수 기준', 'Acceptance criteria')}</h2><div class="card"><ul style="margin:0;padding-left:18px;font-size:14.5px">${m.criteria.map(c => `<li>${esc(L(c))}</li>`).join('')}</ul></div>
      <h2 class="h4 mt20" style="margin-bottom:8px">${tt('자격 조건', 'Qualifications')} <span class="caption">${covered}/${m.quals.length} ${tt('충족', 'met')}</span></h2><div class="hstack wrap">${m.quals.map(k => tokenChip(k, S.tokens.includes(k))).join('')}</div>
      <h2 class="h4 mt20" style="margin-bottom:8px">${tt('계약 후 공개', 'Shared after contract')}</h2>
      <div class="group">${[tt('제공 정보 (형상, 하중 조건 등)', 'Inputs (geometry, loads, etc.)'), tt('접점 조건 상세', 'Interface details'), tt('발주사 질의응답 채널', 'Client Q&A channel')].map(t => `<div class="row"><span class="ico-box">${ic('lock')}</span><div class="grow"><div class="t" style="font-size:14px">${t}</div></div></div>`).join('')}</div>`,
    after: `<div class="cta-bar">${mine ? `<button class="btn btn-gray" data-act="bid-withdraw" data-id="${m.id}">${tt('제안 철회', 'Withdraw bid')}</button>` : `<button class="btn btn-primary" data-act="bid-open" data-id="${m.id}">${tt('제안하기', 'Place a bid')}</button>`}</div>` };
});
ACT['bid-open'] = el => {
  const m = App.state.market.find(x => x.id === el.dataset.id);
  App.ui.bid = { price: Math.round(m.budget * .95 / 100000) * 100000, days:21 };
  openSheet(`<div class="sh-title">${tt('제안하기', 'Place a bid')}</div><div class="sh-sub">${tt('발주사에게는 회사명 없이 금액, 기간, 자격 토큰, 메시지만 전달됩니다.', 'The client sees price, timeline, tokens and your message, never your name.')}</div>
    <div class="field mt16"><label>${tt('제안 금액', 'Price')}</label><div class="hstack between"><b class="h3 tnum" id="bid-v">${won(App.ui.bid.price)}</b><span class="caption">${tt('예산', 'Budget')} ${won(m.budget)}</span></div><input type="range" min="${m.budget * .6}" max="${m.budget * 1.2}" step="100000" value="${App.ui.bid.price}" data-in="bid-price" aria-label="${tt('제안 금액', 'Price')}"><div class="caption">${tt('유사 과업 낙찰가 중앙값', 'Similar-job median')} ${won(m.budget * .92)}</div></div>
    <div class="field mt16"><label>${tt('수행 기간', 'Timeline')}</label><div class="hstack wrap">${[14, 21, 28].map(n => `<button class="chip ${n === 21 ? 'on' : ''}" data-act="bid-days" data-v="${n}">${tt(`${n}일`, `${n} days`)}</button>`).join('')}</div></div>
    <div class="field mt16"><label for="bid-msg">${tt('메시지', 'Message')}</label><textarea class="textarea" id="bid-msg" data-in="bid-msg-in" placeholder="${tt('수행 방법과 경험을 적어 주세요. 회사명·연락처는 가려집니다.', 'Describe approach and experience. Names and contacts are masked.')}"></textarea><div class="caption" id="bid-mask"></div></div>
    <button class="btn btn-primary btn-block mt16" data-act="bid-send" data-id="${m.id}">${tt('제안 보내기', 'Send bid')}</button>`);
};
ACT['bid-price'] = el => { App.ui.bid.price = +el.value; $('#bid-v').textContent = won(+el.value); };
ACT['bid-days'] = el => { App.ui.bid.days = +el.dataset.v; $$('#layer .chip').forEach(c => c.classList.toggle('on', c === el)); };
ACT['bid-msg-in'] = el => { const m = maskText(el.value); $('#bid-mask').innerHTML = m.count ? `<span style="color:var(--warn)">${tt(`식별 정보 ${m.count}건이 보내기 전에 가려집니다`, `${m.count} identifier(s) will be masked before sending`)}</span>` : ''; };
ACT['bid-send'] = async btn => {
  const msg = ($('#bid-msg').value || '').trim(); if (msg.length < 10) return toast(tt('메시지를 10자 이상 적어 주세요.', 'Write at least 10 characters.'), 'warn');
  await withLoading(btn, 900);
  const m = App.state.market.find(x => x.id === btn.dataset.id);
  App.state.supplier.proposals.push({ quest:m.id, price:App.ui.bid.price, days:App.ui.bid.days, ts:Date.now(), status:'pending' }); m.bids++;
  App.save(); closeLayer(true); toast(tt('제안을 보냈습니다. 발주사가 선택하면 알려드릴게요.', 'Bid sent. We will tell you if the client picks you.'), 'ok'); App.refresh();
};
ACT['bid-withdraw'] = async el => { const ok = await confirmBox({ title: tt('제안을 철회할까요?', 'Withdraw your bid?'), ok: tt('철회', 'Withdraw'), danger:true }); if (!ok) return; const S = App.state.supplier; S.proposals = S.proposals.filter(x => x.quest !== el.dataset.id); const m = App.state.market.find(x => x.id === el.dataset.id); m.bids = Math.max(0, m.bids - 1); App.save(); App.refresh(); };

function jcard(j){ return `<button class="qcard" data-go="/u/job/${j.id}"><div class="top"><span class="code">${j.id} · ${catLabel(j.cat)}</span>${statusPill(j.status)}</div><div class="ttl">${esc(L(j.title))}</div><div class="meta"><b>${won(j.amount)}</b><span class="sep"></span><span class="hstack" style="gap:6px">${veil(j.client, 's')}<span style="font-size:12.5px">${tt('발주사', 'Client')} ${j.client}</span></span></div>${j.status === 'progress' ? `<div class="bar mt12"><i style="width:${j.progress}%"></i></div>` : ''}<div class="foot"><span class="lock">${ic('shield')}${tt('익명 거래', 'Anonymous deal')}</span><span class="dday ${j.status === 'progress' ? '' : 'calm'}">${j.status === 'progress' ? dday(j.deadline) : j.status === 'review' ? tt('검수 중', 'In review') : tt('완료', 'Done')}</span></div></button>`; }
route('/u/jobs', (p, qs) => {
  const f = qs.f || 'progress', J = App.state.supplier.jobs;
  return { top: topbar({ title: tt('내 작업', 'My jobs'), right: bellBtn() }),
    html: `<div class="seg mt4">${[['progress', tt('진행 중', 'Active')], ['review', tt('검수 중', 'In review')], ['done', tt('완료', 'Done')]].map(x => `<button class="${f === x[0] ? 'on' : ''}" data-go="/u/jobs?f=${x[0]}">${x[1]} ${J.filter(j => j.status === x[0]).length}</button>`).join('')}</div>
      <div class="mt16">${J.filter(j => j.status === f).map(jcard).join('') || emptyState('list', tt('해당하는 작업이 없어요', 'Nothing here'))}</div>` };
});
route('/u/job/:id', p => {
  const j = App.state.supplier.jobs.find(x => x.id === p.id); if (!j) return App.go('/u/jobs', true);
  const chk = App.ui.selfcheck && App.ui.selfcheck.id === j.id ? App.ui.selfcheck : null;
  return { noTabs:true, top: topbar({ back:'/u/jobs', title: j.id, sub: catLabel(j.cat) }),
    html: `<div class="hstack mt4">${statusPill(j.status)}</div><h1 class="h2 mt8">${esc(L(j.title))}</h1>
      <div class="hstack mt12" style="align-items:baseline;gap:10px"><span class="big-num" style="font-size:26px">${won(j.amount)}</span>${wonHint(j.amount)}</div>
      <div class="caption mt4">${tt('납품 기한', 'Due')} ${fmtDate(j.deadline)} · <b class="dday">${dday(j.deadline)}</b> · ${tt('대금 예치 완료', 'Escrow funded')}</div>
      ${j.status === 'progress' ? `<div class="card mt16"><div class="hstack between"><div class="h4">${tt('진행률', 'Progress')}</div><b class="tnum">${j.progress}%</b></div><div class="bar mt12"><i style="width:${j.progress}%"></i></div></div>` : ''}
      <h2 class="h4 mt20" style="margin-bottom:8px">${tt('검수 기준', 'Acceptance criteria')}</h2>
      <div class="card" style="padding:4px 0">${j.criteria.map((c, i) => { const r = chk && chk.done ? chk.res[i] : null; return `<div class="crit" style="grid-template-columns:1fr auto;${i === 0 ? 'border-top:0' : ''}"><span>${esc(L(c))}</span>${r == null ? `<span class="wait-ic">${ic('clock')}</span>` : `<span class="${r ? 'ok-ic' : 'no-ic'}">${ic(r ? 'check' : 'x')}</span>`}${r === false ? `<span class="r" style="color:var(--bad)">${tt('보고서에서 메시 3단계 비교표를 찾지 못했습니다.', 'No 3-level mesh comparison found in the report.')}</span>` : ''}</div>`; }).join('')}</div>
      <h2 class="h4 mt20" style="margin-bottom:8px">${tt('납품물', 'Deliverables')}</h2>
      ${j.delivered.length ? j.delivered.map(f => fileRow(f)).join('') : `<div class="card">${emptyState('upload', tt('아직 올린 파일이 없어요', 'No files yet'))}</div>`}
      ${j.status === 'progress' ? `<div class="grid2 mt12"><button class="dropzone" data-act="job-add" data-id="${j.id}">${ic('upload')}<div>${tt('납품 파일 추가', 'Add files')}</div></button><button class="dropzone" data-act="job-check" data-id="${j.id}" ${j.delivered.length ? '' : 'disabled style="opacity:.5"'}>${ic('spark')}<div>${tt('제출 전 자가 점검', 'Pre-submit self-check')}</div></button></div>
        ${chk && chk.running ? `<div class="hstack mt12" style="gap:8px"><span class="spinner"></span><span class="body-s">${tt('검수 기준과 대조하는 중…', 'Checking against criteria…')}</span></div>` : ''}
        ${chk && chk.done ? `<div class="ai-shield" style="${chk.res.every(Boolean) ? '' : 'background:var(--warn-soft);color:var(--warn)'}">${ic(chk.res.every(Boolean) ? 'check' : 'alert')}<span>${chk.res.every(Boolean) ? tt('모든 기준을 충족합니다. 제출해도 좋아요.', 'All criteria met. Ready to submit.') : tt(`${chk.res.filter(Boolean).length}/${chk.res.length} 충족. 부족한 항목을 보완하면 이의 가능성이 줄어요.`, `${chk.res.filter(Boolean).length}/${chk.res.length} met. Fixing the gap lowers objection risk.`)}</span></div>${chk.res.every(Boolean) ? '' : `<button class="btn btn-soft btn-block mt8" data-act="job-fix" data-id="${j.id}">${ic('plus')}${tt('메시 수렴성 보고서 추가', 'Add mesh convergence report')}</button>`}` : ''}` : ''}
      ${j.status === 'review' ? `<div class="card outline mt16 hstack" style="gap:12px"><span class="ico-box good">${ic('spark')}</span><div style="flex:1"><div class="h4">${tt('AI 예비 판정 통과 · 이의기간 D-4', 'AI pre-check passed · objection window D-4')}</div><div class="caption mt4">${tt('기간이 끝나면 자동으로 지급됩니다. 세금계산서는 플랫폼 앞으로 발행합니다.', 'Payout is automatic when the window closes. You invoice Quest, not the client.')}</div></div></div>` : ''}`,
    after: j.status === 'progress' ? `<div class="cta-bar"><button class="btn btn-primary" data-act="job-submit" data-id="${j.id}" ${chk && chk.done ? '' : 'disabled'}>${tt('납품 제출', 'Submit delivery')}</button></div>` : '' };
});
ACT['job-add'] = el => { const j = App.state.supplier.jobs.find(x => x.id === el.dataset.id); if (j.delivered.length) return toast(tt('이미 파일을 올렸어요.', 'Files already added.')); j.delivered.push({ name:'housing_thermal_report.pdf', size:'7.9 MB', ext:'pdf' }, { name:'winding_temps.csv', size:'640 KB', ext:'csv' }); App.ui.selfcheck = null; App.save(); haptic(); App.refresh(); };
ACT['job-check'] = async el => { const j = App.state.supplier.jobs.find(x => x.id === el.dataset.id); if (!j.delivered.length) return; const fixed = j.delivered.some(f => f.name.includes('mesh')); App.ui.selfcheck = { id:j.id, running:true }; App.refresh(); await sleep(1500); App.ui.selfcheck = { id:j.id, done:true, res: j.criteria.map((c, i) => i === 1 ? fixed : true) }; App.refresh(); };
ACT['job-fix'] = el => { const j = App.state.supplier.jobs.find(x => x.id === el.dataset.id); j.delivered.push({ name:'mesh_convergence_3levels.pdf', size:'1.2 MB', ext:'pdf' }); App.ui.selfcheck = null; App.save(); toast(tt('보고서를 추가했습니다. 다시 점검해 보세요.', 'Report added. Run the check again.'), 'ok'); App.refresh(); };
ACT['job-submit'] = async el => {
  const j = App.state.supplier.jobs.find(x => x.id === el.dataset.id);
  const ok = await confirmBox({ title: tt('납품을 제출할까요?', 'Submit delivery?'), body: tt('제출하면 AI 예비 판정이 시작되고 7일 이의기간이 열립니다.', 'Submitting starts the AI pre-check and opens the 7-day objection window.'), ok: tt('제출', 'Submit') });
  if (!ok) return;
  j.status = 'review'; j.progress = 100; App.state.supplier.pendingPay += j.amount;
  addNotif({ aud:'supplier', icon:'spark', tone:'good', go:`/u/job/${j.id}`, t:{ ko:`${j.id} 납품이 접수되었습니다`, en:`${j.id} delivery received` }, s:{ ko:'AI 예비 판정이 진행 중입니다.', en:'AI pre-check is running.' } });
  App.save(); toast(tt('납품을 제출했습니다.', 'Delivery submitted.'), 'ok'); App.refresh();
};

/* ================= supplier wallet ================= */
U.supWallet = () => {
  const S = App.state.supplier;
  return { top: topbar({ title: tt('정산', 'Payouts'), right: bellBtn() }),
    html: `<div class="grid2 mt4"><div class="card"><div class="caption">${tt('정산 예정', 'Upcoming')}</div><div class="h2 tnum mt4">${won(S.pendingPay)}</div></div><div class="card" style="margin-top:0"><div class="caption">${tt('누적 정산', 'Paid to date')}</div><div class="h2 tnum mt4">${won(S.settled)}</div></div></div>
      <section class="section"><div class="section-head"><h2 class="h3">${tt('월별 수입', 'Monthly earnings')}</h2></div><div class="card"><div class="chart" id="sw-chart"></div></div></section>
      <section class="section"><div class="section-head"><h2 class="h3">${tt('정산 내역', 'Payout history')}</h2></div>
        <div class="group">${[['Q-2026-0402', 13500000, tt('검수 확정 후 지급', 'Pays on acceptance'), 'clock'], ['Q-2026-0388', 11200000, tt('지급 완료', 'Paid'), 'check'], ['Q-2026-0371', 16300000, tt('지급 완료', 'Paid'), 'check'], ['Q-2026-0355', 14800000, tt('지급 완료', 'Paid'), 'check']].map(r => `<div class="row"><span class="ico-box ${r[3] === 'check' ? 'good' : 'warn'}">${ic(r[3])}</span><div class="grow"><div class="t" style="font-size:14px">${r[0]}</div><div class="s">${r[2]}</div></div><b class="tnum" style="font-size:14.5px">${won(r[1])}</b></div>`).join('')}</div>
        <div class="caption mt8">${tt('세금계산서는 Quest 앞으로 발행합니다. 발주사 정보는 서류에 나오지 않습니다.', 'You invoice Quest. Client details never appear on your paperwork.')}</div></section>`,
    mount(){ barChart($('#sw-chart'), { labels: monthLabels(6), values: S.earnings, colors: S.earnings.map((v, i) => i === 5 ? 'var(--s3)' : 'color-mix(in srgb, var(--s3) 45%, transparent)'), fmt: v => shortWon(v), tick: v => shortWon(v), pl: 54, showVals:true, label: tt('월별 수입', 'Monthly earnings') }); } };
};
