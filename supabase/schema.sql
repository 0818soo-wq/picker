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
  created_at timestamptz not null default now()
);

create index entries_group_type_idx on public.entries (group_type);
create index entries_is_winner_idx on public.entries (is_winner);

alter table public.entries enable row level security;

-- 모든 접근은 서버(Secret/Service Role Key)를 통해서만 이루어집니다.
-- 익명 클라이언트에게는 어떤 정책도 부여하지 않아 RLS가 기본적으로 모든 접근을 차단합니다.
