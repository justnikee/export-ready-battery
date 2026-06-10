-- Migration: Widen hash/previous_hash columns in passport_events
-- Genesis anchors are stored as "GENESIS:<uuid(36)>:<serial(~21)>" = ~66 chars,
-- which overflows the original VARCHAR(64). VARCHAR(128) gives ample headroom.
-- SHA-256 hex hashes remain 64 chars and are unaffected.

ALTER TABLE passport_events
    ALTER COLUMN hash TYPE VARCHAR(128),
    ALTER COLUMN previous_hash TYPE VARCHAR(128);
