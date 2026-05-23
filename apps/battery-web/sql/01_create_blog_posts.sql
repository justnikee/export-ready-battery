-- Create the blog_posts table
create table if not exists blog_posts (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null, -- Markdown/MDX content
  cover_image text,
  author text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  tags text[] default '{}',
  category text,
  seo_title text,
  seo_description text,
  reading_time_minutes integer,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for performance
create index if not exists blog_posts_slug_idx on blog_posts (slug);
create index if not exists blog_posts_status_published_at_idx on blog_posts (status, published_at);
create index if not exists blog_posts_tags_idx on blog_posts using gin (tags);

-- Optional: Enable RLS (Row Level Security)
alter table blog_posts enable row level security;

-- Policy: Public can read published posts
create policy "Public can view published posts"
on blog_posts for select
using ( status = 'published' );

-- Policy: Service role (admin) can do anything
-- Note: Supabase service_role key bypasses RLS, but if accessing via authenticated user (non-service role), 
-- you'd need a specific policy. For this app, we assume Admin actions use service_role or 
-- we add a policy for authenticated admin users if applicable. 
-- For now, we will rely on code-level checks for writes using Server Actions with Service Role.
