# picker — '26.하 CSM전략회의 AI 당첨자 추첨 Agent

접수(서술형 의견 작성)와 실시간 다단계 추첨(슬롯머신 릴 애니메이션)으로 구성된 사내 이벤트 웹앱입니다.

## 구성

- `/entry/leader` — 접수 페이지 — 지역단장/파트장 구분 없이 모두에게 공유하는 하나의 링크 (`/entry/staff`, `/br`, `/of`로 접속해도 동일한 화면으로 연결됩니다)
- `/draw` — 관리자용 추첨 페이지 (비밀번호로 보호) — 행사 진행자가 화면에 띄우는 페이지
- `/admin-login` — `/draw` 접근을 위한 비밀번호 입력 페이지

접수 링크는 하나지만, 사번으로 조회한 실제 직책(명단 기준, [`src/lib/attendees.ts`](./src/lib/attendees.ts))에 따라 지역단장/사업단장만 자동으로 추첨 대상(draw)이 되고, 파트장을 포함한 그 외 직책은 의견 제출만 되고 추첨에서는 자동으로 제외(no_draw)됩니다. 데이터(접수 내용)는 [Supabase](https://supabase.com) Postgres 테이블에 저장되고, 앱은 [Vercel](https://vercel.com)에 배포합니다.

`/draw`는 5등부터 1등까지 순서대로 진행하는 다단계 추첨입니다. 각 등수의 상품 구성은 [`src/lib/prizeRounds.ts`](./src/lib/prizeRounds.ts)에서 관리합니다.

## 1. Supabase 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 만듭니다.
2. 프로젝트의 **SQL Editor**에서 [`supabase/schema.sql`](./supabase/schema.sql) 내용을 실행해 `entries` 테이블을 만듭니다. (이미 만든 적이 있다면 기존 테이블을 삭제하고 새 구조로 다시 만듭니다.)
3. **Project Settings > API Keys**에서 다음 값을 확인해 둡니다.
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - **Secret key** (`sb_secret_...`, 구버전 UI에서는 `service_role` 키) → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 비공개로 관리)

## 2. 환경변수

`.env.example`을 참고해 `.env.local`을 만드세요.

```bash
cp .env.example .env.local
```

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret(service_role) 키 (서버에서만 사용, 절대 클라이언트에 노출되지 않음) |
| `ADMIN_PASSCODE` | `/draw` 페이지 접근 비밀번호 |
| `ADMIN_SESSION_SECRET` | 관리자 로그인 세션 서명용 임의의 긴 문자열 (예: `openssl rand -hex 32`) |
| `ANTHROPIC_API_KEY` | (선택) 접수 내용이 행사 주제와 무관한지 AI로 판별하는 기능에 사용. 없어도 나머지 기능은 정상 동작 |

## 3. 등수별 상품 구성

`src/lib/prizeRounds.ts`에서 5등~1등의 상품명·인원수·상품 사진 경로를 관리합니다. 상품 사진을 받으면 `public/images/prizes/` 아래에 넣고 해당 등수의 `prizeImage` 값을 채우면 됩니다. 사진이 없으면 자동으로 기본 아이콘이 표시됩니다.

## 4. 로컬 실행

```bash
npm install
npm run dev
```

- [http://localhost:3000/entry/leader](http://localhost:3000/entry/leader) — 접수 (지역단장/파트장 공통 링크)
- [http://localhost:3000/draw](http://localhost:3000/draw) — 추첨 페이지 (비밀번호 입력 필요)

## 5. Vercel 배포

1. 이 저장소를 [Vercel](https://vercel.com/new)에서 Import 합니다.
2. Project Settings > Environment Variables에 위 환경변수들을 등록합니다.
3. Deploy 하면 아래 링크를 공유할 수 있습니다.
   - `https://<프로젝트명>.vercel.app/entry/leader` — 접수 (지역단장/파트장 공통)
   - `https://<프로젝트명>.vercel.app/draw`

## 진행 순서 (행사 당일)

1. 지역단장/본사 파트장 구분 없이 모두에게 `/entry/leader` 링크 하나만 공유해 접수를 받습니다. 추첨 대상 여부는 자동으로 판단됩니다.
2. 진행자는 `/admin-login`에서 비밀번호를 입력해 `/draw`에 접속합니다.
3. 대문화면에서 **추첨하기**를 누르면 5등부터 순서대로 상품 안내 → 추첨 애니메이션 → 발표 화면이 이어집니다. 발표 화면에서 **다음 추첨하러가기**를 누르면 다음 등수로 넘어가고, 1등까지 끝나면 **추첨 마치기**로 관리하기 화면으로 이동합니다.
4. 대문화면의 **관리하기**를 누르면 지금까지의 등수별 당첨자 현황을 한 번에 볼 수 있습니다. 당첨자 버튼을 누르면 그 사람이 작성한 카드 내용을 볼 수 있습니다.
5. 리허설 후에는 하단 메뉴의 관리자 화면에서 접수/당첨 기록을 초기화할 수 있습니다 (행사 중에는 사용하지 마세요).

## 기술 스택

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres)
- Framer Motion (슬롯머신 릴 애니메이션)
