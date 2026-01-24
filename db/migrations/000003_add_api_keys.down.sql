-- Rollback: Remove API keys tables
DROP TABLE IF EXISTS api_key_usage;
DROP TABLE IF EXISTS api_keys;
