-- Down Migration: Drop messages table

DROP TRIGGER IF EXISTS trigger_update_conversation_message_stats ON messages;
DROP FUNCTION IF EXISTS update_conversation_message_stats();

DROP TRIGGER IF EXISTS trigger_update_messages_updated_at ON messages;
DROP FUNCTION IF EXISTS update_messages_updated_at();

DROP TABLE IF EXISTS messages CASCADE;
