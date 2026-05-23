-- Fix: Grant anon role access to the public schema and blog_posts table
-- This resolves the "permission denied for schema public" error (code 42501)
-- that occurs when the Next.js build tries to prerender /blog using the anon key.

-- Grant schema usage to anon role
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT on blog_posts to anon (needed for public blog reading)
GRANT SELECT ON TABLE public.blog_posts TO anon;

-- Also grant to authenticated role for logged-in users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON TABLE public.blog_posts TO authenticated;
