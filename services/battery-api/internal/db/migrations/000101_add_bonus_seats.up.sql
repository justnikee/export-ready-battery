-- Migration 101: Add bonus_seats to tenants — supports the "Extra Team Seat"
-- add-on pack (PRICING_AND_PACKAGING_STRATEGY.md §4 "Overage & Add-On Packs").
-- A tenant's effective seat limit = models.GetSeatLimit(plan_type) + bonus_seats.
-- Unlike the plan-tier's 30-day feature window, bonus seats are a permanent
-- wallet-style credit (consistent with how quota_balance already behaves) —
-- they don't expire on their own.

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS bonus_seats integer NOT NULL DEFAULT 0;
