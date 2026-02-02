-- Create the blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL, -- Markdown/MDX content
  cover_image TEXT,
  author TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  seo_title TEXT,
  seo_description TEXT,
  reading_time_minutes INTEGER,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_status_published_at_idx ON blog_posts (status, published_at);
CREATE INDEX IF NOT EXISTS blog_posts_tags_idx ON blog_posts USING GIN (tags);

-- Enable RLS (Row Level Security)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read published posts
-- Note: We use DO block to handle policy existence check which isn't directly supported by CREATE POLICY IF NOT EXISTS in all postgres versions easily, 
-- but for standard migrations 'CREATE POLICY' usually throws if exists. 
-- We'll use simple CREATE and assume down migration cleans up, or ignore error if safer.
-- PostgreSQL doesn't support IF NOT EXISTS for policies directly in standard syntax easily without do block.
-- We will just attempt to create it.
CREATE POLICY "Public can view published posts"
ON blog_posts FOR SELECT
USING ( status = 'published' );
