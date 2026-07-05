-- Migration 099: Re-add tier column to tenants table for compatibility.
--

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS tier varchar(50) DEFAULT 'free';
