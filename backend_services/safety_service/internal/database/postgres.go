package database

import (
	"fmt"

	"github.com/djamfikr7/tripo04os/safety-service/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Initialize(cfg config.DatabaseConfig) (*pgxpool.Pool, error) {
	connString := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
	)

	pool, err := pgxpool.New(nil, connString)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	return pool, nil
}
