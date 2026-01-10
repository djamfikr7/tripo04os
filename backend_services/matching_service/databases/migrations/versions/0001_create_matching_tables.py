"""Create matching tables

Revision ID: 0001
Revises:
Create Date: 2026-01-09

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create driver_availability table
    op.create_table(
        "driver_availability",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("driver_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("is_online", sa.Boolean(), nullable=False, default=False),
        sa.Column("is_available", sa.Boolean(), nullable=False, default=False),
        sa.Column("current_latitude", sa.Numeric(10, 8)),
        sa.Column("current_longitude", sa.Numeric(11, 8)),
        sa.Column("last_location_update", sa.TIMESTAMP(timezone=True)),
        sa.Column("vehicle_type", sa.String(50), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False, default=False),
        sa.Column("rating", sa.Numeric(3, 2), nullable=False, default=0),
        sa.Column("total_trips", sa.Integer(), nullable=False, default=0),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index(
        "idx_driver_availability_driver_id", "driver_availability", ["driver_id"]
    )
    op.create_index(
        "idx_driver_availability_is_online", "driver_availability", ["is_online"]
    )
    op.create_index(
        "idx_driver_availability_is_available", "driver_availability", ["is_available"]
    )
    op.create_index(
        "idx_driver_availability_location",
        "driver_availability",
        ["current_latitude", "current_longitude"],
    )
    op.create_index("idx_driver_availability_rating", "driver_availability", ["rating"])

    # Create driver_matches table
    op.create_table(
        "driver_matches",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("driver_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("match_score", sa.Numeric(10, 5), nullable=False),
        sa.Column("eta_score", sa.Numeric(10, 5), nullable=False),
        sa.Column("rating_score", sa.Numeric(10, 5), nullable=False),
        sa.Column("reliability_score", sa.Numeric(10, 5), nullable=False),
        sa.Column("fairness_boost", sa.Numeric(10, 5), nullable=False),
        sa.Column("vehicle_match", sa.Numeric(10, 5), nullable=False),
        sa.Column("estimated_arrival_minutes", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("driver_response_time_seconds", sa.Integer()),
        sa.Column("order_cancellation_reason", sa.String(200)),
        sa.Column("trip_id", postgresql.UUID(as_uuid=True)),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("idx_driver_matches_order_id", "driver_matches", ["order_id"])
    op.create_index("idx_driver_matches_driver_id", "driver_matches", ["driver_id"])
    op.create_index("idx_driver_matches_status", "driver_matches", ["status"])
    op.create_index("idx_driver_matches_match_score", "driver_matches", ["match_score"])

    # Create match_history table
    op.create_table(
        "match_history",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("driver_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("match_time", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("acceptance_time_seconds", sa.Integer()),
        sa.Column("accepted", sa.Boolean(), nullable=False, default=False),
        sa.Column("declined", sa.Boolean(), nullable=False, default=False),
        sa.Column("declined_reason", sa.String(200)),
        sa.Column("trip_completed", sa.Boolean(), nullable=False, default=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("idx_match_history_order_id", "match_history", ["order_id"])
    op.create_index("idx_match_history_driver_id", "match_history", ["driver_id"])
    op.create_index("idx_match_history_match_time", "match_history", ["match_time"])

    # Create matching_algorithm_config table
    op.create_table(
        "matching_algorithm_config",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("config_key", sa.String(100), nullable=False, unique=True),
        sa.Column("config_value", sa.Numeric(10, 5), nullable=False),
        sa.Column("description", sa.String(500)),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    # Insert default config values
    op.execute("""
        INSERT INTO matching_algorithm_config (config_key, config_value, description)
        VALUES 
            ('eta_weight', 0.35, 'Weight for ETA score'),
            ('rating_weight', 0.25, 'Weight for rating score'),
            ('reliability_weight', 0.15, 'Weight for reliability score'),
            ('fairness_weight', 0.15, 'Weight for fairness boost'),
            ('vehicle_weight', 0.10, 'Weight for vehicle match'),
            ('max_match_distance_km', 50.0, 'Maximum match distance in kilometers'),
            ('max_eta_minutes', 30.0, 'Maximum ETA in minutes'),
            ('fairness_boost_threshold', 0.3, 'Threshold for fairness boost'),
            ('reliability_window_hours', 24, 'Time window for reliability calculation'),
    """)


def downgrade():
    op.drop_table("matching_algorithm_config")
    op.drop_table("match_history")
    op.drop_table("driver_matches")
    op.drop_table("driver_availability")
