-- Down Migration: Drop conversations table

DROP TABLE IF EXISTS conversations CASCADE;

DROP FUNCTION IF EXISTS update_conversations_updated_at();
