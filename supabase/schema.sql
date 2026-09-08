-- Supabase 프로젝트의 SQL Editor에서 실행하세요.
-- 기존 테이블이 있다면 삭제 후 새로 만듭니다 (테스트 데이터는 사라집니다).

create extension if not exists "pgcrypto";

drop table if exists public.entries;

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  group_type text not null check (group_type in ('draw', 'no_draw')),
  department text not null,
  name text not null,
  content text not null,
  is_winner boolean not null default false,
  won_at timestamptz,
  -- 몇 등에 당첨됐는지 (5=5등 ... 1=1등). 당첨 전에는 null입니다.
  prize_rank integer check (prize_rank between 1 and 5),
  created_at timestamptz not null default now()
);

create index entries_group_type_idx on public.entries (group_type);
create index entries_is_winner_idx on public.entries (is_winner);
create index entries_prize_rank_idx on public.entries (prize_rank);

alter table public.entries enable row level security;

-- 모든 접근은 서버(Secret/Service Role Key)를 통해서만 이루어집니다.
-- 익명 클라이언트에게는 어떤 정책도 부여하지 않아 RLS가 기본적으로 모든 접근을 차단합니다.

-- "과거당첨기록보기"용 누적 기록 테이블입니다. entries 테이블은 리셋(초기화) 버튼을
-- 누르면 is_winner/won_at/prize_rank가 모두 지워지므로, 리셋 이후에도 남아있어야 할
-- 당첨 이력은 이 테이블에 별도로 쌓습니다. 이미 entries 테이블이 있는 기존 환경에서도
-- 안전하게 실행할 수 있도록 create table if not exists로 작성했습니다.
create table if not exists public.winner_history (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  name text not null,
  prize_rank integer not null check (prize_rank between 1 and 5),
  won_at timestamptz not null default now()
);

create index if not exists winner_history_won_at_idx on public.winner_history (won_at);

alter table public.winner_history enable row level security;
-- entries와 동일하게, 익명 클라이언트용 정책을 두지 않아 서버(Service Role)만 접근 가능합니다.

-- "접수중단하기" 토글용 설정 테이블입니다. 항상 id=1인 행 하나만 존재합니다.
create table if not exists public.app_settings (
  id integer primary key default 1,
  entries_open boolean not null default true,
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (id, entries_open)
values (1, true)
on conflict (id) do nothing;

alter table public.app_settings enable row level security;
-- entries와 동일하게, 익명 클라이언트용 정책을 두지 않아 서버(Service Role)만 접근 가능합니다.
-- 접수 화면(공개)에서의 조회는 /api/entries/status 서버 라우트가 Service Role로 대신 조회해 전달합니다.
