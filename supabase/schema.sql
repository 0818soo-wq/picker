-- Supabase 프로젝트의 SQL Editor에서 실행하세요.

create extension if not exists "pgcrypto";

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  name text not null,
  photo_path text not null,
  photo_url text not null,
  is_winner boolean not null default false,
  won_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists entries_is_winner_idx on public.entries (is_winner);

alter table public.entries enable row level security;

-- 모든 접근은 서버(Service Role Key)를 통해서만 이루어집니다.
-- 익명 클라이언트에게는 어떤 정책도 부여하지 않아 RLS가 기본적으로 모든 접근을 차단합니다.

-- Storage: "entry-photos" 버킷을 아래와 같이 만드세요.
-- 1) Storage > Create bucket > 이름: entry-photos, Public bucket: 체크
-- 2) 버킷 정책은 기본값으로 두어도 됩니다. 업로드는 서버(Service Role Key)에서만 수행됩니다.
