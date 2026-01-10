-- Drop triggers
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_scheduled_orders_updated_at ON scheduled_orders;

-- Drop function
DROP FUNCTION IF EXISTS update_order_updated_at();

-- Drop tables in reverse order
DROP TABLE IF EXISTS scheduled_orders CASCADE;
DROP TABLE IF EXISTS order_events CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
