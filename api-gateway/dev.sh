#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Tripo04OS API Gateway - Local Dev Script"
echo "=========================================="
echo ""

case "$1" in
  start)
    echo "Starting API Gateway with Docker Compose..."
    cd "$SCRIPT_DIR"

    docker-compose up -d

    echo ""
    echo "Waiting for services to be healthy..."
    sleep 10

    echo ""
    echo "✅ API Gateway started successfully!"
    echo ""
    echo "Access the API Gateway:"
    echo "  - Proxy: http://localhost:8000"
    echo "  - Admin API: http://localhost:8001"
    echo "  - Kong Manager: http://localhost:8002"
    echo ""
    ;;

  stop)
    echo "Stopping API Gateway..."
    cd "$SCRIPT_DIR"

    docker-compose down

    echo ""
    echo "✅ API Gateway stopped successfully!"
    ;;

  restart)
    echo "Restarting API Gateway..."
    cd "$SCRIPT_DIR"

    docker-compose restart

    echo ""
    echo "✅ API Gateway restarted successfully!"
    ;;

  logs)
    echo "Fetching Kong Gateway logs..."
    cd "$SCRIPT_DIR"

    docker-compose logs -f kong
    ;;

  status)
    echo "API Gateway Status:"
    echo "--------------------"
    cd "$SCRIPT_DIR"

    docker-compose ps
    ;;

  health)
    echo "Checking API Gateway health..."

    echo -n "Kong Gateway: "
    curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/status
    echo ""

    echo -n "PostgreSQL: "
    docker-compose exec -T postgres pg_isready -U kong
    echo ""

    echo -n "Redis: "
    docker-compose exec -T redis redis-cli ping
    echo ""

    echo ""
    echo "✅ Health check completed!"
    ;;

  test)
    echo "Testing API Gateway..."

    echo "Testing health endpoint..."
    curl -s http://localhost:8001/status | jq .

    echo ""
    echo "Testing service routing..."
    echo "  Identity service health:"
    curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/auth/health || echo " (service not available)"

    echo ""
    echo "  Location service health:"
    curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/locations/health || echo " (service not available)"

    echo ""
    echo "✅ Tests completed!"
    ;;

  reset)
    echo "WARNING: This will delete all data and reset the API Gateway!"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
      echo "Operation cancelled."
      exit 0
    fi

    cd "$SCRIPT_DIR"

    docker-compose down -v
    docker-compose up -d

    echo ""
    echo "✅ API Gateway reset successfully!"
    ;;

  *)
    echo "Usage: $0 {start|stop|restart|logs|status|health|test|reset}"
    echo ""
    echo "Commands:"
    echo "  start   - Start API Gateway"
    echo "  stop    - Stop API Gateway"
    echo "  restart - Restart API Gateway"
    echo "  logs    - Show Kong Gateway logs"
    echo "  status  - Show API Gateway status"
    echo "  health  - Check API Gateway health"
    echo "  test    - Test API Gateway endpoints"
    echo "  reset   - Reset API Gateway (WARNING: deletes all data)"
    exit 1
    ;;
esac
