# Quest Demo

익명 B2B 과업 거래 플랫폼 "퀘스트"(가칭)의 가상 데모 앱입니다. 발주사·수행사 앱과 관리자 콘솔을 한 앱에 담았고, 서버 없이 기기 안의 가상 데이터로 모든 기능이 실제처럼 반응합니다. 웹 앱(Railway 배포)과 안드로이드 APK 두 가지로 제공되며, 한국어/English, 라이트/다크 모드를 지원합니다.

A fictional demo of "Quest", an anonymous B2B work exchange. Client and supplier apps plus an admin console, all running on mock data. Ships as an installable web app (deployable to Railway with zero config) and as an Android APK. Korean/English, light/dark.

![screens](docs/screens.png)

## 데모 계정

| 역할 | 로그인 |
|---|---|
| 발주사 / 수행사 | 로그인 화면에서 계정 선택 후 "로그인" |
| 관리자 | "관리자" 탭 → "데모 코드 채우기"(2단계 인증 123456) |

MY → "데모 데이터 초기화"로 처음 상태로 돌아갑니다.

## 구성

```
web/        앱 본체 (HTML/CSS/JS, Pretendard 글꼴, PWA 매니페스트·서비스 워커, 외부 라이브러리 없음)
server.js   웹 앱 서버 (Node 18+) · railway.json: Railway 배포 설정 · relayer.js: 테스트넷 정산(viem, 선택)
android/    WebView 셸 (순수 Java), 매니페스트, 리소스, 아이콘
build.sh    Gradle 없는 빌드: aapt2 → javac → D8 → zipalign → apksigner
tests/      smoke.py(전 경로), e2e.py(흐름 12개 × 한/영), jvm/(JUnit + Robolectric)
```

## 웹 앱으로 실행

의존성 없는 Node 서버(`server.js`)가 `web/`을 제공합니다. 휴대폰에서 "홈 화면에 추가"하면 앱처럼 설치되고, 한 번 연 뒤에는 오프라인에서도 열립니다(PWA).

```bash
npm start            # http://localhost:3000  (PORT 환경변수로 변경)
```

### Railway에 배포

1. Railway에서 **New Project → Deploy from GitHub repo**로 이 저장소를 고릅니다.
2. 설정은 필요 없습니다. `package.json`을 보고 Node로 빌드하고, `railway.json`대로 `node server.js`를 실행하며 `/healthz`로 상태를 확인합니다. 포트는 Railway가 주는 `PORT`를 씁니다.
3. 서비스의 **Settings → Networking → Generate Domain**을 누르면 `https://….up.railway.app` 주소가 생깁니다.

이후 `main`에 푸시할 때마다 자동으로 다시 배포됩니다. 런타임 의존성은 viem 하나뿐이라 빌드는 금방 끝납니다.

서버가 하는 일: 파일을 시작할 때 메모리에 올려 두고 brotli/gzip 압축, ETag 캐시, 보안 헤더(CSP 등)를 붙여 응답합니다. 데이터는 각 사용자 브라우저에만 저장되므로 데이터베이스가 필요 없고, 환경변수는 테스트넷 정산을 켤 때만(`SETTLEMENT_PRIVATE_KEY`) 필요합니다.

## 테스트넷 정산 (Base Sepolia)

대금 예치와 지급 확정은 Base Sepolia 테스트넷(chain id 84532)의 `QuestSettlement` 컨트랙트에 실제 트랜잭션으로 기록할 수 있습니다. 앱의 "기록" 탭, 예치 완료 화면, 관리자 "블록체인 기록" 화면에 실제 해시와 BaseScan 링크(`https://sepolia.basescan.org/tx/…`)가 대기 → 확정 상태로 표시됩니다. 금액은 원화 숫자로만 남고 실제 자금은 오가지 않습니다. 서버에 키가 없거나 호출이 실패하면 지금처럼 가상 기록으로 동작합니다.

Escrow deposits and releases can be written as real transactions to the `QuestSettlement` contract on Base Sepolia. Without a key, or if a call fails, the app falls back to its mock records.

```
contracts/QuestSettlement.sol   deposit(questId, amountKrw, docHash) / release(questId, docHash), operator only
scripts/compile.mjs             solc-js 0.8.28 → contracts/QuestSettlement.json
scripts/deploy.mjs              deploys and writes the address to settlement.json (public, committed)
relayer.js                      server-side signer (viem), used by server.js
tests/settlement.test.mjs       npm test: relayer + contract against a local anvil chain
```

API (same origin): `GET /api/settle/config` · `POST /api/settle/deposit {questId, amount, docHash?}` · `POST /api/settle/release {questId, amount?, docHash?}` · `GET /api/settle/tx/:hash` · `GET /api/settle/:questId`. Writes are same-origin only, validated, and rate-limited per IP and globally. A release for a quest with no on-chain deposit (seed data) writes the deposit first when `amount` is given. Each browser uses its own key suffix (`Q-2026-0415.AB12CD`), so demo runs never collide on-chain.

설정:

1. 테스트넷 전용 지갑 키를 `.env`에 `SETTLEMENT_PRIVATE_KEY=0x…`로 둡니다(`.env`는 git에 올라가지 않습니다). 메인넷 자산이 있는 키는 쓰지 마세요.
2. 그 주소에 Base Sepolia 파우셋으로 테스트 ETH를 받은 뒤 `npm run deploy`를 실행하고, 갱신된 `settlement.json`을 커밋합니다.
3. Railway 서비스 Variables에 `SETTLEMENT_PRIVATE_KEY`를 넣습니다. 선택 변수: `SETTLEMENT_RPC_URL`(기본 `https://sepolia.base.org`), `SETTLEMENT_CONTRACT`(settlement.json 대신), `SETTLE_IP_WRITES`(IP당 10분 쓰기 횟수, 기본 12), `SETTLE_HOURLY_WRITES`(시간당 전체, 기본 120).

## APK 빌드

필요: JDK 17 이상, Android SDK의 `build-tools;34.0.0`, `platforms;android-34`.

```bash
export ANDROID_HOME=~/Android/Sdk   # 또는 SDK / BT / AJ 개별 지정
./build.sh                          # → dist/QuestDemo-1.0.0.apk
```

- D8/R8 8.13.23은 첫 빌드 때 `.tools/`로 자동으로 받습니다.
- 서명 키는 저장소에 없습니다. `keystore/questdemo.jks`가 없으면 데모 키를 새로 만듭니다. 이미 설치된 앱을 업데이트하려면 기존 키를 `keystore/questdemo.jks`에 두고 빌드하세요(비밀번호는 `KS_PASS` 환경변수, 기본값 `grinda-quest`).
- GitHub Actions(`.github/workflows/build.yml`)가 푸시마다 APK를 빌드해 아티팩트로 올립니다. 기존 키로 서명하려면 저장소 Secrets에 `KEYSTORE_B64`(키 파일 base64)와 `KS_PASS`를 넣으세요.

## 테스트

```bash
pip install playwright && python -m playwright install chromium
PORT=8765 npm start &
python3 tests/smoke.py      # 전 경로 한/영 렌더링, 콘솔 오류·가로 스크롤 검사
python3 tests/e2e.py        # 실제 탭·입력으로 흐름 12개 × 한/영
BASE=http://127.0.0.1:8765/index.html python3 tests/pwa.py   # 설치 가능 여부, 오프라인 동작
./build.sh && tests/jvm/run.sh   # 네이티브 셸 18개 (Maven 필요)
```

## 참고

- 회사명, 가명, 금액, 통계, 해시는 모두 가상 데이터입니다. 결제와 AI 호출은 일어나지 않습니다. 블록체인 기록은 위 테스트넷 정산을 켰을 때의 예치·지급 트랜잭션만 실제이고, 나머지 해시는 가상입니다.
- 글꼴 Pretendard는 SIL Open Font License 1.1을 따릅니다 (`web/fonts/Pretendard-LICENSE.txt`).
