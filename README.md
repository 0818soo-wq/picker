# picker — 조직 전환 추첨 이벤트

접수(서술형 의견 작성)와 실시간 추첨(슬롯머신 릴 애니메이션 + 캐릭터 영상)으로 구성된 사내 이벤트 웹앱입니다.

## 구성

- `/entry/leader` — **지역단장** 접수 페이지 (추첨 대상) — 지역단장들에게 공유하는 링크
- `/entry/staff` — **본사 파트장** 접수 페이지 (추첨 제외) — 본사 파트장들에게 공유하는 링크
- `/draw` — 관리자용 추첨 페이지 (비밀번호로 보호) — 행사 진행자가 화면에 띄우는 페이지
- `/admin-login` — `/draw` 접근을 위한 비밀번호 입력 페이지

두 접수 페이지는 같은 양식(소속/이름 + 서술형 의견)을 쓰지만, `/entry/staff`로 접수한 인원은 추첨 대상에서 자동으로 제외됩니다. 데이터(접수 내용)는 [Supabase](https://supabase.com) Postgres 테이블에 저장되고, 앱은 [Vercel](https://vercel.com)에 배포합니다.

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

## 3. 영상 자산

`public/videos/intro.mp4`, `public/videos/win.mp4` 두 파일을 준비해 넣으면 추첨 화면에서 자동 재생됩니다. 자세한 내용은 [`public/videos/README.md`](./public/videos/README.md) 참고. 파일이 없어도 앱은 정상 동작하며 해당 단계를 건너뜁니다.

## 4. 로컬 실행

```bash
npm install
npm run dev
```

- [http://localhost:3000/entry/leader](http://localhost:3000/entry/leader) — 지역단장 접수 (추첨 대상)
- [http://localhost:3000/entry/staff](http://localhost:3000/entry/staff) — 본사 파트장 접수 (추첨 제외)
- [http://localhost:3000/draw](http://localhost:3000/draw) — 추첨 페이지 (비밀번호 입력 필요)

## 5. Vercel 배포

1. 이 저장소를 [Vercel](https://vercel.com/new)에서 Import 합니다.
2. Project Settings > Environment Variables에 위 4개 환경변수를 등록합니다.
3. Deploy 하면 아래 두 링크를 각 대상에게 공유할 수 있습니다.
   - `https://<프로젝트명>.vercel.app/entry/leader`
   - `https://<프로젝트명>.vercel.app/entry/staff`

## 진행 순서 (행사 당일)

1. 지역단장들에게 `/entry/leader`, 본사 파트장들에게 `/entry/staff` 링크를 각각 공유해 접수를 받습니다.
2. 진행자는 `/admin-login`에서 비밀번호를 입력해 `/draw`에 접속합니다.
3. **추첨 시작** 버튼을 누르면:
   - 인트로 영상 재생 → 슬롯머신 릴이 지역단장 접수 내용을 빠르게 돌다가 서버에서 무작위로 선택된 당첨자에서 멈춤 → 당첨자 소속/이름/작성 내용 표시 + 축하 영상 재생
   - 본사 파트장(`/entry/staff`) 접수자는 추첨 대상에 포함되지 않습니다.
4. **다음 추첨**을 누르면 이전 당첨자는 자동으로 제외되고 다음 라운드를 진행할 수 있습니다.
5. 리허설 후에는 idle 화면 하단의 **당첨 기록 초기화**로 테스트 당첨 기록을 지울 수 있습니다 (행사 중에는 사용하지 마세요).

## 기술 스택

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres)
- Framer Motion (슬롯머신 릴 애니메이션)
