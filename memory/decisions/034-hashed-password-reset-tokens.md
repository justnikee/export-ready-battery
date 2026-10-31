# ADR 034 — Hash password-reset tokens at rest

Date: 2026-10-31. Status: accepted for draft review.

Store a SHA-256 digest of each random password-reset token in the database and compare the digest at redemption. The email carries the plaintext token; a database copy alone cannot redeem it. Normalize email input on registration, login, resend, forgot-password, and OAuth lookup so case or surrounding whitespace does not split one account into different lookup behavior. Keep forgot-password responses non-enumerating.

This changes no schema. Reset links issued before deployment were stored as plaintext and will no longer redeem; users can request a fresh link. The existing one-hour expiry bounds the transition window.
