DROP POLICY IF EXISTS "Public can view published posts" ON blog_posts;
DROP INDEX IF EXISTS blog_posts_tags_idx;
DROP INDEX IF EXISTS blog_posts_status_published_at_idx;
DROP INDEX IF EXISTS blog_posts_slug_idx;
DROP TABLE IF EXISTS blog_posts;
