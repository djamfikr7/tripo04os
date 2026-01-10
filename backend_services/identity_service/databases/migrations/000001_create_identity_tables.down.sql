-- Drop all tables in reverse order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS driver_earnings CASCADE;
DROP TABLE IF EXISTS driver_documents CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS phone_verification_tokens CASCADE;
DROP TABLE IF EXISTS email_verification_tokens CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
DROP TRIGGER IF EXISTS update_driver_documents_updated_at ON driver_documents;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();
