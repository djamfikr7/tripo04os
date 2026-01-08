"""
AI Support Automation - Database Connection
Phase 1: Foundation
Innovation: AI-Powered Support Automation
"""

from sqlalchemy import create_engine, Engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, declarative_base
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import logging

from .config import get_settings, DATABASE_CONFIG, REDIS_CONFIG

logger = logging.getLogger(__name__)

# Database engines
engine: Engine = None
async_engine = None
async_session_factory = None

# Redis connection
redis_client = None


def init_database():
    """Initialize database connections"""
    global engine, async_engine, async_session_factory
    
    try:
        # Get database URL from settings
        settings = get_settings()
        database_url = settings.database_url
        
        # Create synchronous engine for migrations
        engine = create_engine(
            database_url,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
            pool_timeout=settings.database_pool_timeout,
            echo=settings.debug,
            **DATABASE_CONFIG
        )
        
        # Create async engine for application
        async_engine = create_async_engine(
            database_url,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
            pool_timeout=settings.database_pool_timeout,
            echo=settings.debug,
            **DATABASE_CONFIG
        )
        
        # Create async session factory
        async_session_factory = async_sessionmaker(
            async_engine,
            expire_on_commit=False,
            autocommit=False,
            autoflush=True,
        )
        
        logger.info("Database connections initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise


def init_redis():
    """Initialize Redis connection"""
    global redis_client
    
    try:
        import redis.asyncio as redis
        from .config import REDIS_CONFIG
        
        settings = get_settings()
        redis_client = redis.from_url(
            settings.redis_url,
            max_connections=settings.redis_max_connections,
            socket_timeout=settings.redis_socket_timeout,
            decode_responses=True,
            **REDIS_CONFIG
        )
        
        logger.info("Redis connection initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing Redis: {str(e)}")
        raise


async def close_database():
    """Close database connections"""
    global engine, async_engine
    
    try:
        if engine:
            engine.dispose()
            logger.info("Synchronous database connection closed")
        
        if async_engine:
            await async_engine.dispose()
            logger.info("Async database connection closed")
            
    except Exception as e:
        logger.error(f"Error closing database: {str(e)}")


async def close_redis():
    """Close Redis connection"""
    global redis_client
    
    try:
        if redis_client:
            await redis_client.close()
            logger.info("Redis connection closed")
            
    except Exception as e:
        logger.error(f"Error closing Redis: {str(e)}")


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Get database session context manager
    
    Yields:
        AsyncSession: Database session
    """
    async_session_factory_local = async_session_factory
    
    if async_session_factory_local is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    
    async with async_session_factory_local() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


def get_sync_db_session():
    """
    Get synchronous database session for migrations
    
    Returns:
        Session: Database session
    """
    if engine is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


async def get_redis():
    """
    Get Redis client
    
    Returns:
        Redis client
    """
    global redis_client
    
    if redis_client is None:
        raise RuntimeError("Redis not initialized. Call init_redis() first.")
    
    return redis_client


# Database connection pool monitoring
async def get_db_pool_status() -> dict:
    """
    Get database connection pool status
    
    Returns:
        Dictionary with pool statistics
    """
    if async_engine is None:
        return {"status": "not_initialized"}
    
    pool = async_engine.pool
    return {
        "status": "active",
        "size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "max_overflow": pool.max_overflow(),
    }


# Health check functions
async def check_database_health() -> dict:
    """
    Check database health
    
    Returns:
        Dictionary with health status
    """
    try:
        session = get_sync_db_session()
        session.execute("SELECT 1")
        session.close()
        
        return {
            "status": "healthy",
            "message": "Database connection successful",
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}",
        }


async def check_redis_health() -> dict:
    """
    Check Redis health
    
    Returns:
        Dictionary with health status
    """
    try:
        redis = await get_redis()
        await redis.ping()
        
        return {
            "status": "healthy",
            "message": "Redis connection successful",
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"Redis connection failed: {str(e)}",
        }


# Connection string builder
def build_database_url(
    host: str,
    port: int,
    database: str,
    username: str,
    password: str,
    ssl: bool = False
) -> str:
    """
    Build PostgreSQL database URL
    
    Args:
        host: Database host
        port: Database port
        database: Database name
        username: Database username
        password: Database password
        ssl: Use SSL connection
        
    Returns:
        Database connection URL
    """
    auth_part = f"{username}:{password}@" if username and password else ""
    ssl_part = "sslmode=require" if ssl else ""
    
    return f"postgresql://{auth_part}{host}:{port}/{database}?{ssl_part}"


# Database migration functions
async def run_migrations():
    """
    Run database migrations
    
    Returns:
        Migration status
    """
    try:
        import subprocess
        
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            check=True
        )
        
        if result.returncode == 0:
            logger.info("Database migrations completed successfully")
            return {
                "status": "success",
                "message": "Migrations completed",
            }
        else:
            logger.error(f"Database migrations failed: {result.stderr}")
            return {
                "status": "failed",
                "message": result.stderr,
            }
            
    except Exception as e:
        logger.error(f"Error running migrations: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
        }


# Database backup functions
async def backup_database() -> dict:
    """
    Create database backup
    
    Returns:
        Backup status
    """
    try:
        import subprocess
        from datetime import datetime
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_file = f"backup_{timestamp}.sql"
        
        result = subprocess.run(
            [
                "pg_dump",
                "-h", get_settings().database_url.split("@")[1].split("//")[1],
                "-U", get_settings().database_url.split("@")[0].split(":")[0],
                "-d", "tripo04os",
                "-f", backup_file,
            ],
            capture_output=True,
            text=True,
            check=True
        )
        
        if result.returncode == 0:
            logger.info(f"Database backup created: {backup_file}")
            return {
                "status": "success",
                "backup_file": backup_file,
            }
        else:
            logger.error(f"Database backup failed: {result.stderr}")
            return {
                "status": "failed",
                "message": result.stderr,
            }
            
    except Exception as e:
        logger.error(f"Error creating database backup: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
        }


# Database restore functions
async def restore_database(backup_file: str) -> dict:
    """
    Restore database from backup
    
    Args:
        backup_file: Path to backup file
        
    Returns:
        Restore status
    """
    try:
        import subprocess
        
        result = subprocess.run(
            [
                "psql",
                "-h", get_settings().database_url.split("@")[1].split("//")[1],
                "-U", get_settings().database_url.split("@")[0].split(":")[0],
                "-d", "tripo04os",
                "-f", backup_file,
            ],
            capture_output=True,
            text=True,
            check=True
        )
        
        if result.returncode == 0:
            logger.info(f"Database restored from: {backup_file}")
            return {
                "status": "success",
                "backup_file": backup_file,
            }
        else:
            logger.error(f"Database restore failed: {result.stderr}")
            return {
                "status": "failed",
                "message": result.stderr,
            }
            
    except Exception as e:
        logger.error(f"Error restoring database: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
        }


# Database statistics functions
async def get_database_statistics() -> dict:
    """
    Get database statistics
    
    Returns:
        Dictionary with database statistics
    """
    try:
        session = get_sync_db_session()
        
        # Get table sizes
        result = session.execute("""
            SELECT 
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname::regclassid)) as size
            FROM pg_tables
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY pg_total_relation_size(schemaname::regclassid) DESC
            LIMIT 10
        """)
        
        tables = []
        for row in result:
            tables.append({
                "schema": row[0],
                "table": row[1],
                "size": row[2],
            })
        
        # Get connection count
        result = session.execute("""
            SELECT count(*) as connection_count
            FROM pg_stat_activity
            WHERE state = 'active'
        """)
        connection_count = result.fetchone()[0]
        
        session.close()
        
        return {
            "status": "success",
            "tables": tables,
            "active_connections": connection_count,
        }
        
    except Exception as e:
        logger.error(f"Error getting database statistics: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
        }


# Database cleanup functions
async def cleanup_old_data() -> dict:
    """
    Clean up old data based on retention policies
    
    Returns:
        Cleanup status
    """
    try:
        from datetime import datetime, timedelta
        from .config import get_settings
        
        settings = get_settings()
        
        # Calculate retention dates
        conversation_retention_date = datetime.utcnow() - timedelta(days=settings.conversation_retention_days)
        transcript_retention_date = datetime.utcnow() - timedelta(days=settings.transcript_retention_days)
        feedback_retention_date = datetime.utcnow() - timedelta(days=settings.feedback_retention_days)
        log_retention_date = datetime.utcnow() - timedelta(days=settings.log_retention_days)
        
        session = get_sync_db_session()
        
        # Delete old conversations
        result = session.execute("""
            DELETE FROM support_conversations
            WHERE created_at < %s AND status IN ('RESOLVED', 'ESCALATED')
        """, (conversation_retention_date,))
        deleted_conversations = result.rowcount
        
        # Delete old messages
        result = session.execute("""
            DELETE FROM support_messages
            WHERE created_at < %s
        """, (transcript_retention_date,))
        deleted_messages = result.rowcount
        
        # Delete old feedback
        result = session.execute("""
            DELETE FROM ai_response_feedback
            WHERE created_at < %s
        """, (feedback_retention_date,))
        deleted_feedback = result.rowcount
        
        session.commit()
        session.close()
        
        logger.info(f"Database cleanup completed: {deleted_conversations} conversations, {deleted_messages} messages, {deleted_feedback} feedback")
        
        return {
            "status": "success",
            "deleted_conversations": deleted_conversations,
            "deleted_messages": deleted_messages,
            "deleted_feedback": deleted_feedback,
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up old data: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
        }


# Database optimization functions
async def optimize_database() -> dict:
    """
    Optimize database performance
    
    Returns:
        Optimization status
    """
    try:
        session = get_sync_db_session()
        
        # Analyze tables
        result = session.execute("""
            SELECT 
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname::regclassid)) as size,
                pg_total_relation_size(schemaname::regclassid) as size_bytes
            FROM pg_tables
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY pg_total_relation_size(schemaname::regclassid) DESC
        """)
        
        optimizations = []
        for row in result:
            schema = row[0]
            table = row[1]
            size = row[2]
            size_bytes = row[3]
            
            # Check if table needs vacuum
            if size_bytes > 100 * 1024 * 1024:  # 100 MB
                result = session.execute(f"VACUUM ANALYZE {schema}.{table}")
                session.commit()
                optimizations.append({
                    "action": "VACUUM ANALYZE",
                    "table": f"{schema}.{table}",
                    "reason": f"Table size: {size}",
                })
            
            # Check if table needs reindex
            result = session.execute(f"""
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    idx_scan,
                    idx_tup_fetch,
                    idx_tup_read
                FROM pg_indexes
                WHERE schemaname = %s AND tablename = %s
            """, (schema, table))
            
            indexes = result.fetchall()
            for index in indexes:
                if index[3] > 10000 or index[4] > 10000:  # High scan or tuple fetch
                    result = session.execute(f"REINDEX INDEX CONCURRENTLY {index[2]} ON {schema}.{table}")
                    session.commit()
                    optimizations.append({
                        "action": "REINDEX",
                        "index": index[2],
                        "reason": f"Scan: {index[3]}, Tuple fetch: {index[4]}",
                    })
        
        session.close()
        
        logger.info(f"Database optimization completed: {len(optimizations)} optimizations performed")
        
        return {
            "status": "success",
            "optimizations": optimizations,
        }
        
    except Exception as e:
        logger.error(f"Error optimizing database: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
        }


# Database replication status
async def get_replication_status() -> dict:
    """
    Get database replication status
    
    Returns:
        Replication status
    """
    try:
        session = get_sync_db_session()
        
        result = session.execute("""
            SELECT 
                application_name,
                client_addr,
                client_hostname,
                state,
                sync_state,
                sync_priority,
                reply_lag
            FROM pg_stat_replication
        """)
        
        replication = result.fetchone()
        session.close()
        
        if replication:
            return {
                "status": "success",
                "application_name": replication[0],
                "client_addr": replication[1],
                "client_hostname": replication[2],
                "state": replication[3],
                "sync_state": replication[4],
                "sync_priority": replication[5],
                "reply_lag": replication[6],
            }
        else:
            return {
                "status": "success",
                "message": "No replication configured",
            }
        
    except Exception as e:
        logger.error(f"Error getting replication status: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
        }
