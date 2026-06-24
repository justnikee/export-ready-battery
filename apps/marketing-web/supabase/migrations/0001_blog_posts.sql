create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  cover_image text,
  category text,
  author text,
  author_id uuid references auth.users (id) on delete set null,
  tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  reading_time_minutes int,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Public can read published posts"
  on public.posts for select
  to anon, authenticated
  using (status = 'published');

create policy "Authenticated users can read all posts"
  on public.posts for select
  to authenticated
  using (true);

create policy "Authenticated users can insert posts"
  on public.posts for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update posts"
  on public.posts for update
  to authenticated
  using (true);

create policy "Authenticated users can delete posts"
  on public.posts for delete
  to authenticated
  using (true);
