create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.post_categories (
  post_id uuid not null references public.posts (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (post_id, category_id)
);

create table if not exists public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

alter table public.posts add column if not exists noindex boolean not null default false;
alter table public.posts drop column if exists category;
alter table public.posts drop column if exists tags;

alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.post_categories enable row level security;
alter table public.post_tags enable row level security;

create policy "Public can read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "Authenticated can manage categories"
  on public.categories for all
  to authenticated
  using (true) with check (true);

create policy "Public can read tags"
  on public.tags for select
  to anon, authenticated
  using (true);

create policy "Authenticated can manage tags"
  on public.tags for all
  to authenticated
  using (true) with check (true);

create policy "Public can read post_categories"
  on public.post_categories for select
  to anon, authenticated
  using (true);

create policy "Authenticated can manage post_categories"
  on public.post_categories for all
  to authenticated
  using (true) with check (true);

create policy "Public can read post_tags"
  on public.post_tags for select
  to anon, authenticated
  using (true);

create policy "Authenticated can manage post_tags"
  on public.post_tags for all
  to authenticated
  using (true) with check (true);

-- Storage bucket for blog cover images
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

create policy "Public can view blog images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'blog-images');

create policy "Authenticated can upload blog images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog-images');

create policy "Authenticated can update blog images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog-images');

create policy "Authenticated can delete blog images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog-images');
