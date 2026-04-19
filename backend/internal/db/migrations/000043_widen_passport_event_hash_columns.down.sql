ALTER TABLE passport_events
    ALTER COLUMN hash TYPE VARCHAR(64),
    ALTER COLUMN previous_hash TYPE VARCHAR(64);
