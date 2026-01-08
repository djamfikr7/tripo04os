.PHONY: build run test clean deps docker-build docker-run docker-stop

build:
	go build -o bin/identity-service ./cmd/main.go

run:
	go run ./cmd/main.go

test:
	go test -v ./...

test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

deps:
	go mod tidy
	go mod download

clean:
	rm -rf bin/
	rm -f coverage.out

docker-build:
	docker build -t tripo04os/identity-service:latest .

docker-run:
	docker-compose up -d identity-service

docker-stop:
	docker-compose down

migrate-up:
	migrate -path databases/migrations -database "postgres://tripo04os:tripo04os123@localhost:5432/tripo04os_identity?sslmode=disable" up

migrate-down:
	migrate -path databases/migrations -database "postgres://tripo04os:tripo04os123@localhost:5432/tripo04os_identity?sslmode=disable" down

lint:
	golangci-lint run

format:
	go fmt ./...

vet:
	go vet ./...
