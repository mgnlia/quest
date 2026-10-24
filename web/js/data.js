/* Quest demo — seed data (all fictional) */
'use strict';
const SEED_VERSION = 3;

const CATS = {
  struct:   { ko:'구조 해석', en:'Structural analysis', icon:'target' },
  thermal:  { ko:'열·유동 해석', en:'Thermal & CFD', icon:'bolt' },
  embedded: { ko:'임베디드 SW', en:'Embedded software', icon:'cpu' },
  data:     { ko:'시험 데이터 분석', en:'Test data analysis', icon:'chart' },
  machining:{ ko:'정밀가공', en:'Precision machining', icon:'box' },
  system:   { ko:'체계종합 분해', en:'System decomposition', icon:'tree' }
};
const TOKENS = {
  iso9001: { ko:'ISO 9001 인증', en:'ISO 9001 certified' },
  iso17025:{ ko:'ISO/IEC 17025 시험기관', en:'ISO/IEC 17025 lab' },
  ansys:   { ko:'상용 FEA 라이선스', en:'Commercial FEA license' },
  cfd:     { ko:'상용 CFD 라이선스', en:'Commercial CFD license' },
  aero5:   { ko:'항공 구조해석 5건+', en:'5+ aerospace FEA jobs' },
  can12:   { ko:'CAN 통신 개발 10건+', en:'10+ CAN bus projects' },
  misra:   { ko:'MISRA-C 준수 이력', en:'MISRA-C track record' },
  cmm:     { ko:'3차원 측정기 보유', en:'Owns a CMM' },
  axis5:   { ko:'5축 가공기 보유', en:'Owns 5-axis mill' },
  secure:  { ko:'보안서약 완료', en:'Security pledge signed' },
  stats:   { ko:'통계 분석 10건+', en:'10+ stats projects' },
  comp:    { ko:'복합재 해석 경험', en:'Composites experience' }
};

function mkRecords(id, evs){ return evs.map((e, i) => ({ ev: e[0], ts: e[1], tx: txHash(id + i), block: 45182300 - (evs.length - i) * 4321 - (hash32(id) % 900) })); }
const EV = {
  post:{ ko:'퀘스트 명세 게시', en:'Quest spec posted' },
  contract:{ ko:'계약 체결', en:'Contract signed' },
  escrow:{ ko:'대금 예치 확인', en:'Escrow deposit confirmed' },
  qa:{ ko:'질의응답 로그 봉인', en:'Q&A log sealed' },
  deliver:{ ko:'납품물 제출', en:'Deliverables submitted' },
  verdict:{ ko:'AI 예비 판정 패키지 기록', en:'AI pre-review package recorded' },
  accept:{ ko:'검수 확정', en:'Acceptance confirmed' },
  pay:{ ko:'수행사 지급', en:'Supplier paid' },
  ship:{ ko:'블라인드 배송 인계', en:'Blind shipment handed over' },
  objection:{ ko:'이의 제기 접수', en:'Objection filed' },
  resolve:{ ko:'재검수 결과 확정', en:'Re-review decision recorded' },
  reveal:{ ko:'신원 공개 요청', en:'Identity reveal requested' }
};

function makeSeed(){
  const d = n => NOW + n * DAY;
  const h = n => NOW + n * 3600000;

  const quests = [
    {
      id:'Q-2026-0412', cat:'struct', status:'review', budget:20000000, deadline:d(-2), created:d(-26), exposure:18,
      title:{ ko:'알루미늄 프레임 정하중·피로 해석', en:'Static & fatigue analysis of an aluminum frame' },
      goal:{ ko:'정하중과 피로 조건에서 프레임이 안전계수 1.5 이상임을 입증하는 해석 보고서', en:'An analysis report proving the frame keeps a safety factor of 1.5+ under static and fatigue loads' },
      provided:{ ko:'형상 파일(치수 일반화), 하중 조건 3종, 재질 6061-T6', en:'Geometry file (dimensions generalized), 3 load cases, 6061-T6 material' },
      iface:{ ko:'볼트 패턴 M6 4점, 최대 질량 1.2kg, 결과 형식 CSV', en:'M6 × 4 bolt pattern, max mass 1.2 kg, results as CSV' },
      delivery:{ ko:'해석 보고서 PDF, 결과 파일, 모델 파일', en:'Report PDF, result files, model file' },
      quals:['ansys','aero5','secure'],
      disclosure:{ ko:'게시: 목표·자격만 / 계약 후: 제공 정보 전체', en:'Posted: goal & qualifications only / After contract: all inputs' },
      criteria:[
        { ko:'안전계수 1.5 이상 입증', en:'Safety factor ≥ 1.5 demonstrated' },
        { ko:'메시 수렴성 보고', en:'Mesh convergence reported' },
        { ko:'피로 수명 계산서 포함', en:'Fatigue life calculation included' },
        { ko:'지정 형식(CSV) 결과 파일', en:'Results in the required CSV format' }
      ],
      proposals:[
        { id:'P-1', alias:'A7F2', rating:4.9, jobs:23, price:20000000, days:21, tokens:['ansys','aero5','secure','iso9001'], msg:{ ko:'유사 항공 브래킷 해석을 7건 수행했습니다. 피로는 S-N 곡선 기반으로 진행하고 중간 결과를 10일 차에 공유드리겠습니다.', en:'We have done 7 similar aerospace bracket analyses. Fatigue will follow an S-N approach, with an interim update on day 10.' } }
      ],
      selected:'P-1', progress:100,
      chat:[
        { from:'sys', text:{ ko:'계약이 체결되었습니다. 이 대화는 AI 중재를 거치며 식별 정보는 자동으로 가려집니다.', en:'Contract signed. This chat is AI-mediated and identifying details are masked automatically.' }, ts:d(-20) },
        { from:'them', text:{ ko:'하중 조건 3번의 적용 위치가 상판 전체인지 볼트 체결부 주변인지 확인 부탁드립니다.', en:'Could you confirm whether load case 3 applies to the whole top plate or only around the bolted joints?' }, ts:d(-19) },
        { from:'me', text:{ ko:'볼트 체결부 주변 반경 15mm 영역입니다. 첨부한 하중 조건 표 2행을 봐 주세요.', en:'Only a 15 mm radius around the bolted joints. See row 2 of the load table.' }, ts:d(-19) },
        { from:'them', text:{ ko:'확인했습니다. 10일 차에 중간 결과 공유드리겠습니다.', en:'Got it. I will share interim results on day 10.' }, ts:d(-19) }
      ],
      deliverables:[
        { name:'frame_analysis_report_v2.pdf', size:'8.4 MB', ext:'pdf' },
        { name:'results_static_fatigue.csv', size:'1.1 MB', ext:'csv' },
        { name:'model_frame_generalized.step', size:'23.7 MB', ext:'step' }
      ],
      deliveredAt:d(-2),
      verdict:{ state:'pass', agree:4, total:4, windowEnds:d(5), criteria:[
        { r:{ ko:'최소 안전계수 1.72 (하중 조건 2, 볼트 체결부)', en:'Min. safety factor 1.72 (load case 2, bolted joint)' }, a:true, b:true },
        { r:{ ko:'메시 3단계, 최대 응력 편차 1.8%', en:'3 mesh levels, peak stress deviation 1.8%' }, a:true, b:true },
        { r:{ ko:'10⁶ 사이클 기준 피로 수명 계산서 12쪽', en:'12-page fatigue calc at 10⁶ cycles' }, a:true, b:true },
        { r:{ ko:'CSV 3개 파일, 지정 열 구조 일치', en:'3 CSV files, column layout matches spec' }, a:true, b:true }
      ]},
      escrow:{ status:'deposited', vaccount:'562-910-03-418227' },
      records: mkRecords('Q-2026-0412', [[EV.post, d(-26)], [EV.contract, d(-21)], [EV.escrow, d(-21)], [EV.qa, d(-19)], [EV.deliver, d(-2)], [EV.verdict, d(-2)]])
    },
    {
      id:'Q-2026-0415', cat:'embedded', status:'open', budget:25000000, deadline:d(34), created:d(-3), exposure:22,
      title:{ ko:'모터 드라이버 펌웨어 개발 (CAN 통신)', en:'Motor driver firmware (CAN bus)' },
      goal:{ ko:'주어진 모터 사양과 CAN 메시지 표를 만족하는 드라이버 펌웨어', en:'Driver firmware meeting the given motor spec and CAN message table' },
      provided:{ ko:'모터 사양서, CAN 메시지 표, 테스트 케이스 40개', en:'Motor spec, CAN message table, 40 test cases' },
      iface:{ ko:'CAN 2.0B 500kbps, 메시지 ID 0x180~0x1FF', en:'CAN 2.0B at 500 kbps, IDs 0x180–0x1FF' },
      delivery:{ ko:'소스코드, 바이너리, 테스트 리포트', en:'Source, binary, test report' },
      quals:['can12','misra','secure'],
      disclosure:{ ko:'게시: 목표·자격만 / 계약 후: 테스트 케이스 전체', en:'Posted: goal & qualifications / After contract: full test suite' },
      criteria:[
        { ko:'테스트 케이스 40개 통과율 100%', en:'100% pass rate on 40 test cases' },
        { ko:'정적 분석 경고 0건', en:'Zero static-analysis warnings' },
        { ko:'MISRA-C 필수 규칙 위반 0건', en:'Zero MISRA-C mandatory violations' }
      ],
      proposals:[
        { id:'P-1', alias:'B3K9', rating:4.9, jobs:31, price:24500000, days:26, tokens:['can12','misra','secure','iso9001'], best:true, msg:{ ko:'동일 계열 BLDC 드라이버 펌웨어를 4건 납품했습니다. HIL 장비로 40개 케이스를 모두 자동화해 리포트 드리겠습니다.', en:'We have shipped four drivers for the same BLDC family. All 40 cases will be automated on our HIL rig with a full report.' } },
        { id:'P-2', alias:'F71C', rating:4.7, jobs:12, price:22000000, days:30, tokens:['can12','secure'], msg:{ ko:'가격을 우선 고려하신다면 저희가 적합합니다. MISRA 검사는 오픈소스 도구로 진행합니다.', en:'If price matters most, we are a good fit. MISRA checks run on open-source tooling.' } },
        { id:'P-3', alias:'M2D4', rating:4.8, jobs:19, price:26000000, days:21, tokens:['can12','misra','secure'], msg:{ ko:'가장 빠른 일정으로 가능합니다. 주 2회 진행 보고를 드립니다.', en:'Fastest timeline on offer, with progress reports twice a week.' } }
      ],
      selected:null, progress:0, chat:[], deliverables:[], verdict:null, escrow:{ status:'none' },
      records: mkRecords('Q-2026-0415', [[EV.post, d(-3)]])
    },
    {
      id:'Q-2026-0409', cat:'data', status:'progress', budget:10000000, deadline:d(9), created:d(-18), exposure:12,
      title:{ ko:'제어 시험 로그 통계 분석', en:'Statistical analysis of control test logs' },
      goal:{ ko:'시험 로그에서 정착 시간과 오버슈트를 재현 오차 1% 이내로 산출', en:'Derive settling time and overshoot from test logs within 1% reproduction error' },
      provided:{ ko:'시험 로그 CSV 24개(식별자 제거), 분석 지표 정의서', en:'24 test-log CSVs (identifiers removed), metric definitions' },
      iface:{ ko:'결과는 지정 템플릿 XLSX', en:'Results in the provided XLSX template' },
      delivery:{ ko:'분석 보고서, 스크립트, 결과 XLSX', en:'Report, scripts, result XLSX' },
      quals:['stats','secure'],
      disclosure:{ ko:'게시: 목표만 / 계약 후: 로그 전체', en:'Posted: goal only / After contract: all logs' },
      criteria:[
        { ko:'지정 통계량 재현 오차 1% 이내', en:'Reproduction error within 1%' },
        { ko:'분석 스크립트 재실행 가능', en:'Scripts re-run cleanly' },
        { ko:'지정 템플릿 형식 준수', en:'Template format followed' }
      ],
      proposals:[{ id:'P-1', alias:'C5E1', rating:4.8, jobs:17, price:9500000, days:20, tokens:['stats','secure'], msg:{ ko:'파이썬 기반으로 재현 가능한 노트북과 함께 드립니다.', en:'Delivered with reproducible Python notebooks.' } }],
      selected:'P-1', progress:60,
      chat:[
        { from:'sys', text:{ ko:'계약이 체결되었습니다. 이 대화는 AI 중재를 거치며 식별 정보는 자동으로 가려집니다.', en:'Contract signed. This chat is AI-mediated and identifying details are masked automatically.' }, ts:d(-12) },
        { from:'them', text:{ ko:'로그 17번 파일의 샘플링 주기가 다른 파일과 다릅니다(1kHz → 500Hz). 의도된 것인지요?', en:'Log file 17 is sampled at 500 Hz instead of 1 kHz like the others. Is that intentional?' }, ts:d(-6) },
        { from:'me', text:{ ko:'네, 17번은 다른 장비로 측정했습니다. 리샘플링해서 같이 분석해 주세요.', en:'Yes, file 17 came from a different rig. Please resample and include it.' }, ts:d(-6) },
        { from:'them', text:{ ko:'알겠습니다. 이번 주 금요일에 중간 결과 공유드리겠습니다.', en:'Understood. Interim results this Friday.' }, ts:d(-6) }
      ],
      deliverables:[], verdict:null, escrow:{ status:'deposited', vaccount:'562-910-03-418109' },
      records: mkRecords('Q-2026-0409', [[EV.post, d(-18)], [EV.contract, d(-12)], [EV.escrow, d(-12)]])
    },
    {
      id:'Q-2026-0398', cat:'machining', status:'done', budget:12000000, deadline:d(-9), created:d(-40), exposure:15,
      title:{ ko:'프레임 부품 정밀가공 (6061-T6, 20세트)', en:'Precision-machined frame parts (6061-T6, 20 sets)' },
      goal:{ ko:'도면 공차 이내 부품 20세트 가공 및 블라인드 배송', en:'Machine 20 sets within drawing tolerances and ship blind' },
      provided:{ ko:'가공 도면(표제란 제거), 수량, 공차', en:'Machining drawings (title block removed), quantity, tolerances' },
      iface:{ ko:'IF-A 볼트 패턴 준수', en:'Conforms to IF-A bolt pattern' },
      delivery:{ ko:'실물 20세트, 3차원 측정 성적서', en:'20 physical sets, CMM report' },
      quals:['cmm','axis5','iso9001'],
      disclosure:{ ko:'게시: 목표·수량 / 계약 후: 도면', en:'Posted: goal & quantity / After contract: drawings' },
      criteria:[{ ko:'3차원 측정 성적서 공차 이내', en:'CMM report within tolerance' }, { ko:'블라인드 배송 완료', en:'Blind delivery completed' }],
      proposals:[{ id:'P-1', alias:'H9P3', rating:4.9, jobs:44, price:12000000, days:14, tokens:['cmm','axis5','iso9001'], msg:{ ko:'5축 가공으로 1회 셋업에 처리합니다.', en:'Single setup on a 5-axis mill.' } }],
      selected:'P-1', progress:100, chat:[], deliverables:[{ name:'CMM_report_20sets.pdf', size:'3.2 MB', ext:'pdf' }],
      verdict:{ state:'pass', agree:2, total:2, windowEnds:d(-12), criteria:[{ r:{ ko:'전 치수 공차 이내 (최대 편차 0.012mm)', en:'All dimensions in tolerance (max dev. 0.012 mm)' }, a:true, b:true }, { r:{ ko:'수령 확인 완료', en:'Receipt confirmed' }, a:true, b:true }] },
      escrow:{ status:'released' }, shipping:true,
      records: mkRecords('Q-2026-0398', [[EV.post, d(-40)], [EV.contract, d(-33)], [EV.escrow, d(-33)], [EV.ship, d(-20)], [EV.deliver, d(-19)], [EV.verdict, d(-19)], [EV.accept, d(-12)], [EV.pay, d(-12)]])
    },
    {
      id:'Q-2026-0381', cat:'thermal', status:'done', budget:18000000, deadline:d(-30), created:d(-64), exposure:21,
      title:{ ko:'배터리 팩 냉각판 열 해석', en:'Thermal analysis of a battery cooling plate' },
      goal:{ ko:'셀 최고 온도 45℃ 이하 유지 여부 검증', en:'Verify max cell temperature stays under 45 °C' },
      provided:{ ko:'냉각판 형상, 발열량 표, 유량 조건', en:'Plate geometry, heat-load table, flow conditions' },
      iface:{ ko:'입출구 압력 강하 15kPa 이하', en:'Inlet–outlet pressure drop ≤ 15 kPa' },
      delivery:{ ko:'해석 보고서, 결과 파일', en:'Report, result files' },
      quals:['cfd','secure'],
      disclosure:{ ko:'게시: 목표만 / 계약 후: 형상', en:'Posted: goal only / After contract: geometry' },
      criteria:[{ ko:'셀 최고 온도 45℃ 이하 입증', en:'Max cell temp ≤ 45 °C shown' }, { ko:'압력 강하 15kPa 이하', en:'Pressure drop ≤ 15 kPa' }],
      proposals:[{ id:'P-1', alias:'E2T8', rating:4.7, jobs:15, price:18000000, days:24, tokens:['cfd','secure'], msg:{ ko:'공액 열전달 해석으로 진행합니다.', en:'Conjugate heat transfer approach.' } }],
      selected:'P-1', progress:100, chat:[], deliverables:[{ name:'cooling_plate_cfd.pdf', size:'11.8 MB', ext:'pdf' }],
      verdict:{ state:'pass', agree:2, total:2, windowEnds:d(-33), criteria:[{ r:{ ko:'최고 온도 42.6℃', en:'Max temp 42.6 °C' }, a:true, b:true }, { r:{ ko:'압력 강하 11.4kPa', en:'Pressure drop 11.4 kPa' }, a:true, b:true }] },
      escrow:{ status:'released' },
      records: mkRecords('Q-2026-0381', [[EV.post, d(-64)], [EV.contract, d(-58)], [EV.escrow, d(-58)], [EV.deliver, d(-38)], [EV.verdict, d(-38)], [EV.accept, d(-33)], [EV.pay, d(-33)]])
    }
  ];

  const market = [
    { id:'Q-2026-0431', cat:'struct', budget:15000000, deadline:d(12), created:h(-5), client:'Y5H3', match:94, quals:['ansys','comp','secure'],
      title:{ ko:'드론 암 탄소복합재 구조 해석', en:'Carbon-composite drone arm structural analysis' },
      goal:{ ko:'적층 순서별 굽힘 강성과 파손 지수(Tsai-Wu) 비교 보고서', en:'Compare bending stiffness and Tsai-Wu failure index across layups' },
      criteria:[{ ko:'적층 3안 비교표', en:'Comparison of 3 layups' }, { ko:'파손 지수 1.0 미만 입증', en:'Failure index < 1.0 shown' }, { ko:'결과 CSV 제출', en:'CSV results' }], bids:4 },
    { id:'Q-2026-0419', cat:'thermal', budget:22000000, deadline:d(18), created:h(-20), client:'W4N6', match:88, quals:['cfd','secure'],
      title:{ ko:'냉각 유로 CFD 해석 및 최적화', en:'Coolant channel CFD and optimization' },
      goal:{ ko:'압력 강하를 20% 줄이는 유로 형상 제안', en:'Propose a channel layout that cuts pressure drop by 20%' },
      criteria:[{ ko:'기준 대비 압력 강하 20% 감소', en:'20% lower pressure drop vs. baseline' }, { ko:'최고 온도 상승 2℃ 이내', en:'Max temp rise within 2 °C' }], bids:6 },
    { id:'Q-2026-0428', cat:'embedded', budget:9000000, deadline:d(21), created:d(-1), client:'R8J1', match:61, quals:['misra','secure'],
      title:{ ko:'PLC 제어 로직 테스트 자동화', en:'PLC control-logic test automation' },
      goal:{ ko:'기존 래더 로직에 대한 회귀 테스트 스위트 구축', en:'Build a regression suite for existing ladder logic' },
      criteria:[{ ko:'테스트 커버리지 90% 이상', en:'90%+ test coverage' }], bids:2 },
    { id:'Q-2026-0426', cat:'data', budget:7000000, deadline:d(10), created:d(-2), client:'T3V5', match:72, quals:['stats'],
      title:{ ko:'진동 시험 데이터 FFT 분석', en:'FFT analysis of vibration test data' },
      goal:{ ko:'공진 주파수 대역과 감쇠비 산출', en:'Identify resonance bands and damping ratios' },
      criteria:[{ ko:'지정 통계량 재현 오차 2% 이내', en:'Reproduction error within 2%' }], bids:3 },
    { id:'Q-2026-0433', cat:'machining', budget:6500000, deadline:d(15), created:h(-2), client:'N6G2', match:40, quals:['axis5','cmm'],
      title:{ ko:'브래킷 5축 가공 30개', en:'30 brackets on a 5-axis mill' },
      goal:{ ko:'도면 공차 이내 30개 가공 및 블라인드 배송', en:'Machine 30 parts to tolerance and ship blind' },
      criteria:[{ ko:'3차원 측정 성적서', en:'CMM report' }], bids:1 }
  ];

  const supplier = {
    alias:'D8R2', rating:4.8, jobs:27, tokens:['iso9001','ansys','cfd','aero5','secure'],
    pendingTokens:[],
    proposals:[ { quest:'Q-2026-0419', price:21000000, days:24, ts:h(-6), status:'pending' } ],
    jobs:[
      { id:'Q-2026-0421', cat:'thermal', client:'P5X3', amount:16000000, deadline:d(6), status:'progress', progress:70,
        title:{ ko:'모터 하우징 열 해석', en:'Motor housing thermal analysis' },
        criteria:[{ ko:'권선 최고 온도 130℃ 이하 입증', en:'Winding max temp ≤ 130 °C shown' }, { ko:'메시 수렴성 보고', en:'Mesh convergence reported' }, { ko:'결과 CSV 제출', en:'CSV results submitted' }], delivered:[] },
      { id:'Q-2026-0402', cat:'struct', client:'L1C7', amount:13500000, deadline:d(-3), status:'review', progress:100,
        title:{ ko:'로봇 링크 경량화 위상 최적화', en:'Topology optimization of a robot link' },
        criteria:[{ ko:'질량 15% 감소', en:'15% mass reduction' }, { ko:'강성 저하 5% 이내', en:'Stiffness loss within 5%' }], delivered:[{ name:'link_topopt_report.pdf', size:'6.1 MB', ext:'pdf' }] }
    ],
    earnings:[8.2, 11.5, 9.8, 14.1, 12.6, 16.0].map(v => v * 1e6),
    settled:42300000, pendingPay:13500000
  };

  const wallet = {
    balance:31500000,
    txs:[
      { t:{ ko:'Q-2026-0412 대금 예치', en:'Escrow for Q-2026-0412' }, amt:-20000000, ts:d(-21), kind:'escrow' },
      { t:{ ko:'Q-2026-0409 대금 예치', en:'Escrow for Q-2026-0409' }, amt:-9500000, ts:d(-12), kind:'escrow' },
      { t:{ ko:'가상계좌 입금', en:'Virtual account top-up' }, amt:50000000, ts:d(-22), kind:'in' },
      { t:{ ko:'Q-2026-0398 지급 확정', en:'Q-2026-0398 released' }, amt:-12000000, ts:d(-12), kind:'release' },
      { t:{ ko:'Q-2026-0381 지급 확정', en:'Q-2026-0381 released' }, amt:-18000000, ts:d(-33), kind:'release' }
    ],
    invoices:[
      { no:'2026-0918-0412', q:'Q-2026-0412', amt:20000000, ts:d(-21), st:{ ko:'발행 예정 (검수 확정 시)', en:'Issued on acceptance' } },
      { no:'2026-0908-0398', q:'Q-2026-0398', amt:12000000, ts:d(-12), st:{ ko:'발행 완료', en:'Issued' } },
      { no:'2026-0818-0381', q:'Q-2026-0381', amt:18000000, ts:d(-33), st:{ ko:'발행 완료', en:'Issued' } }
    ],
    monthly:[18, 0, 12, 30, 9.5, 45].map(v => v * 1e6)
  };

  const notifs = [
    { id:'N-1', aud:'client', ts:h(-3), read:false, icon:'spark', tone:'good', go:'/u/quest/Q-2026-0412?tab=review',
      t:{ ko:'Q-2026-0412 AI 예비 판정: 4개 기준 모두 통과', en:'Q-2026-0412 AI pre-review: all 4 criteria passed' }, s:{ ko:'이의기간이 끝나면 자동으로 검수가 확정됩니다.', en:'Acceptance is confirmed automatically when the objection window closes.' } },
    { id:'N-2', aud:'client', ts:h(-9), read:false, icon:'users', tone:'accent', go:'/u/quest/Q-2026-0415?tab=bids',
      t:{ ko:'Q-2026-0415에 제안 3건이 도착했습니다', en:'3 bids arrived on Q-2026-0415' }, s:{ ko:'자격 조건을 모두 충족한 수행사 2곳 포함', en:'2 of them meet every qualification' } },
    { id:'N-3', aud:'client', ts:d(-6), read:true, icon:'msg', tone:'info', go:'/u/quest/Q-2026-0409?tab=chat',
      t:{ ko:'Q-2026-0409 새 메시지', en:'New message on Q-2026-0409' }, s:{ ko:'수행사 C5E1: 로그 17번 파일의 샘플링 주기가…', en:'Supplier C5E1: Log file 17 is sampled at…' } },
    { id:'N-4', aud:'client', ts:d(-12), read:true, icon:'chain', tone:'violet', go:'/u/quest/Q-2026-0398?tab=records',
      t:{ ko:'Q-2026-0398 지급 기록이 체인에 남았습니다', en:'Q-2026-0398 payout anchored on-chain' }, s:{ ko:'Base 블록에 해시 8건 기록', en:'8 hashes recorded on Base' } },
    { id:'N-5', aud:'supplier', ts:h(-2), read:false, icon:'target', tone:'good', go:'/u/market/Q-2026-0431',
      t:{ ko:'자격 94% 일치하는 새 퀘스트', en:'New quest, 94% qualification match' }, s:{ ko:'드론 암 탄소복합재 구조 해석 · 1,500만 원', en:'Carbon-composite drone arm analysis · ₩15M' } },
    { id:'N-6', aud:'supplier', ts:d(-1), read:false, icon:'clock', tone:'warn', go:'/u/job/Q-2026-0421',
      t:{ ko:'Q-2026-0421 납품 기한 D-6', en:'Q-2026-0421 due in 6 days' }, s:{ ko:'제출 전 자가 점검을 먼저 돌려 보세요.', en:'Run the pre-submission self-check first.' } },
    { id:'N-7', aud:'supplier', ts:d(-3), read:true, icon:'gavel', tone:'info', go:'/u/job/Q-2026-0402',
      t:{ ko:'Q-2026-0402 검수 진행 중', en:'Q-2026-0402 is in review' }, s:{ ko:'AI 예비 판정 2/2 통과, 이의기간 D-4', en:'AI pre-review 2/2 passed, objection window D-4' } }
  ];

  const admin = {
    reviews:[
      { id:'R-1041', quest:'Q-2026-0377', kind:'objection', by:'client', status:'open', due:d(3), amount:25000000, sup:'B3K9', cli:'J7M4',
        title:{ ko:'펌웨어 테스트 통과율 이의', en:'Objection on firmware test pass rate' },
        reason:{ ko:'발주사: "테스트 케이스 37번이 실기에서 간헐적으로 실패합니다. 통과율 100% 판정에 동의할 수 없습니다."', en:'Client: "Test case 37 fails intermittently on hardware. We do not accept the 100% pass verdict."' },
        crit:[ { t:{ ko:'테스트 케이스 40개 통과율 100%', en:'100% pass on 40 test cases' }, a:true, b:true, note:{ ko:'HIL 로그 기준 40/40 통과. 실기 로그는 제출되지 않음', en:'40/40 on HIL logs. No hardware log submitted' } }, { t:{ ko:'정적 분석 경고 0건', en:'Zero static-analysis warnings' }, a:true, b:true } ] },
      { id:'R-1039', quest:'Q-2026-0391', kind:'disagree', by:'ai', status:'open', due:d(6), amount:14000000, sup:'E2T8', cli:'W4N6',
        title:{ ko:'AI 모델 간 판정 불일치', en:'AI models disagree' },
        reason:{ ko:'교차 검토 모델이 "메시 수렴성 보고가 2단계뿐"이라며 불통과로 판정했습니다.', en:'The cross-check model failed "mesh convergence" because only 2 mesh levels were reported.' },
        crit:[ { t:{ ko:'최고 온도 85℃ 이하 입증', en:'Max temp ≤ 85 °C shown' }, a:true, b:true }, { t:{ ko:'메시 수렴성 보고', en:'Mesh convergence reported' }, a:true, b:false, note:{ ko:'명세는 단계 수를 정하지 않음. 관행상 3단계', en:'Spec does not set a level count; 3 is customary' } } ] },
      { id:'R-1033', quest:'Q-2026-0366', kind:'objection', by:'supplier', status:'resolved', due:d(-4), amount:9000000, sup:'C5E1', cli:'T3V5', resolution:{ ko:'통과 유지 (수행사 주장 인정)', en:'Pass upheld (supplier claim accepted)' },
        title:{ ko:'수행사 이의: 추가 자료 요구', en:'Supplier objection: extra data request' },
        reason:{ ko:'수행사: "검수 목적 외 원본 스크립트 제출을 요구받았습니다."', en:'Supplier: "We were asked for original scripts beyond the review scope."' },
        crit:[ { t:{ ko:'지정 통계량 재현 오차 1% 이내', en:'Reproduction error within 1%' }, a:true, b:true } ] }
    ],
    kyb:[
      { id:'K-3107', alias:'V6L8', real:'(주)한결정밀 (데모)', biz:'214-86-*****', type:{ ko:'정밀가공', en:'Precision machining' }, ts:h(-4), status:'pending', tokens:['cmm','axis5','iso9001'],
        checks:{ nts:'ok', owner:'ok', sanction:'ok', cert:'todo', equip:'todo' } },
      { id:'K-3106', alias:'S3Q1', real:'에이치솔루션랩 (데모)', biz:'608-81-*****', type:{ ko:'임베디드 SW', en:'Embedded software' }, ts:h(-11), status:'pending', tokens:['can12','misra'],
        checks:{ nts:'ok', owner:'warn', sanction:'ok', cert:'todo', equip:'na' } },
      { id:'K-3104', alias:'G9T4', real:'(주)다온해석 (데모)', biz:'120-87-*****', type:{ ko:'구조 해석', en:'Structural analysis' }, ts:d(-1), status:'pending', tokens:['ansys','aero5'],
        checks:{ nts:'ok', owner:'ok', sanction:'ok', cert:'todo', equip:'na' } },
      { id:'K-3101', alias:'Z1B7', real:'테크노바이옴 (데모)', biz:'301-86-*****', type:{ ko:'시험 데이터 분석', en:'Test data analysis' }, ts:d(-2), status:'approved', tokens:['stats'],
        checks:{ nts:'ok', owner:'ok', sanction:'ok', cert:'ok', equip:'na' } }
    ],
    alerts:[
      { id:'C-551', kind:'export', sev:'high', quest:'Q-2026-0435', ts:h(-1), status:'open',
        title:{ ko:'이중용도 통제번호 후보 탐지 (9A012 무인항공기)', en:'Dual-use control number candidate (9A012 UAV)' },
        detail:{ ko:'명세의 "비행 제어 컴퓨터", "탑재 중량 25kg" 표현이 9A012 후보로 분류되었습니다. 발주사는 해당 없음으로 선언했습니다.', en:'Spec phrases "flight control computer" and "25 kg payload" matched 9A012. The client declared "not applicable".' } },
      { id:'C-549', kind:'selfdeal', sev:'high', quest:'Q-2026-0430', ts:h(-6), status:'open',
        title:{ ko:'자전거래 의심: 동일 세무대리인', en:'Possible self-dealing: shared tax agent' },
        detail:{ ko:'발주사 R8J1과 제안 수행사 F71C의 세무대리인과 정산 계좌 지점이 같습니다. 매칭이 자동 차단되었습니다.', en:'Client R8J1 and bidder F71C share a tax agent and bank branch. Matching was blocked automatically.' } },
      { id:'C-547', kind:'sanction', sev:'mid', quest:null, ts:d(-1), status:'open',
        title:{ ko:'제재 목록 유사 일치 (82%)', en:'Sanctions list fuzzy match (82%)' },
        detail:{ ko:'가입 신청 기업 대표자 영문 표기가 EU 통합 목록 인물과 82% 유사합니다. 생년월일은 불일치합니다.', en:'An applicant\'s CEO romanized name is an 82% match to an EU consolidated-list entry. Date of birth does not match.' } },
      { id:'C-544', kind:'pricing', sev:'low', quest:'Q-2026-0428', ts:d(-2), status:'open',
        title:{ ko:'제안가 편차 이상 (중앙값 대비 −48%)', en:'Bid outlier (−48% vs. median)' },
        detail:{ ko:'한 제안이 같은 유형 중앙값보다 48% 낮습니다. 품질 위험 안내가 필요할 수 있습니다.', en:'One bid is 48% below the category median. A quality-risk notice may be needed.' } }
    ],
    payouts:[
      { id:'P-8812', quest:'Q-2026-0398', sup:'H9P3', amt:10200000, due:d(-12), status:'paid' },
      { id:'P-8815', quest:'Q-2026-0386', sup:'A7F2', amt:15300000, due:d(0), status:'ready' },
      { id:'P-8816', quest:'Q-2026-0393', sup:'M2D4', amt:8500000, due:d(1), status:'ready' },
      { id:'P-8817', quest:'Q-2026-0377', sup:'B3K9', amt:21250000, due:d(3), status:'held' },
      { id:'P-8818', quest:'Q-2026-0371', sup:'E2T8', amt:6800000, due:d(2), status:'ready' }
    ],
    batches:[0,1,2,3,4,5].map(i => ({ id:'B-' + (2291 - i), ts:NOW - i * 6 * 3600000 - 1800000, count:[42, 38, 51, 29, 47, 33][i], root:'0x' + hexOf('root' + i, 64), tx:txHash('batch' + i), block:45182290 - i * 10800, cost:[0.009, 0.008, 0.011, 0.007, 0.010, 0.008][i] })),
    members:[
      ['client','K2Q9','(주)가온로보틱스 (데모)','active', 182000000, 4.9], ['supplier','A7F2','(주)세움엔지니어링 (데모)','active', 214000000, 4.9],
      ['supplier','B3K9','임베드웍스 (데모)','active', 351000000, 4.9], ['client','J7M4','(주)누리항공 (데모)','active', 96000000, 4.7],
      ['supplier','H9P3','(주)정원정밀 (데모)','active', 402000000, 4.9], ['client','W4N6','에너셀 (데모)','active', 120000000, 4.8],
      ['supplier','C5E1','데이터포지 (데모)','active', 88000000, 4.8], ['client','R8J1','(주)모션큐브 (데모)','review', 9000000, 0],
      ['supplier','F71C','코드브릿지 (데모)','review', 31000000, 4.7], ['client','T3V5','(주)바른시험 (데모)','active', 27000000, 4.6],
      ['supplier','E2T8','써멀랩 (데모)','active', 143000000, 4.7], ['supplier','M2D4','(주)펌텍 (데모)','active', 99000000, 4.8]
    ].map((m, i) => ({ id:'M-' + (1100 + i), type:m[0], alias:m[1], real:m[2], status:m[3], gmv:m[4], rating:m[5], joined:NOW - (40 + i * 23) * DAY })),
    ai:{ primary:'sonnet', hard:'opus', cross:true, agreeMin:90, runs:3, swap:true, humanOnDisagree:true, zdr:true, optouts:3 },
    audit:[],
    pendingAnchors:7
  };

  return {
    v:SEED_VERSION, lang:null, theme:'system', session:null,
    me:{ clientAlias:'K2Q9', real:'(주)가온로보틱스 (데모)', email:'client@quest.demo' },
    quests, market, supplier, wallet, notifs, admin,
    chainHeight:45182331
  };
}
