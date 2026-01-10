#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "Tripo04OS API Gateway - Deployment Script"
echo "=========================================="
echo ""

case "$1" in
  setup)
    echo "Setting up API Gateway..."
    cd "$SCRIPT_DIR"

    echo "Creating Kubernetes namespace..."
    kubectl apply -f kubernetes/namespace.yaml

    echo "Creating configuration..."
    kubectl apply -f kubernetes/configmap.yaml

    echo "Deploying PostgreSQL..."
    kubectl apply -f kubernetes/postgres.yaml

    echo "Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=ready pod -l app=kong,component=postgres -n api-gateway --timeout=300s

    echo "Deploying Redis..."
    kubectl apply -f kubernetes/redis.yaml

    echo "Waiting for Redis to be ready..."
    kubectl wait --for=condition=ready pod -l app=kong,component=redis -n api-gateway --timeout=300s

    echo "Running Kong migrations..."
    kubectl apply -f kubernetes/migrations.yaml

    echo "Waiting for migrations to complete..."
    kubectl wait --for=condition=complete job/kong-migrations -n api-gateway --timeout=300s

    echo "Deploying Kong Gateway..."
    kubectl apply -f kubernetes/kong.yaml

    echo "Waiting for Kong to be ready..."
    kubectl wait --for=condition=ready pod -l app=kong,component=proxy -n api-gateway --timeout=300s

    echo ""
    echo "✅ API Gateway setup completed successfully!"
    echo ""
    echo "Access the API Gateway:"
    echo "  - Proxy: http://localhost:80"
    echo "  - Admin API: http://localhost:8001"
    echo "  - Kong Manager: http://localhost:8002"
    echo ""
    ;;

  deploy)
    echo "Deploying API Gateway..."
    cd "$SCRIPT_DIR"

    kubectl apply -f kubernetes/

    echo "Waiting for all pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=kong -n api-gateway --timeout=300s

    echo ""
    echo "✅ API Gateway deployed successfully!"
    ;;
    
  update)
    echo "Updating API Gateway..."
    cd "$SCRIPT_DIR"

    kubectl apply -f kubernetes/kong.yaml

    echo "Rolling update in progress..."
    kubectl rollout restart deployment/kong -n api-gateway

    echo "Waiting for rollout to complete..."
    kubectl rollout status deployment/kong -n api-gateway --timeout=300s

    echo ""
    echo "✅ API Gateway updated successfully!"
    ;;

  scale)
    if [ -z "$2" ]; then
      echo "Usage: $0 scale <replicas>"
      exit 1
    fi

    echo "Scaling Kong Gateway to $2 replicas..."
    kubectl scale deployment/kong --replicas="$2" -n api-gateway

    echo "Waiting for scale operation to complete..."
    kubectl rollout status deployment/kong -n api-gateway --timeout=300s

    echo ""
    echo "✅ API Gateway scaled successfully!"
    ;;

  status)
    echo "API Gateway Status:"
    echo "--------------------"
    kubectl get all -n api-gateway
    echo ""
    echo "Kong Pods:"
    kubectl get pods -n api-gateway -l app=kong
    ;;

  logs)
    echo "Fetching Kong Gateway logs..."
    kubectl logs -f -l app=kong,component=proxy -n api-gateway
    ;;

  delete)
    echo "Deleting API Gateway..."
    cd "$SCRIPT_DIR"

    kubectl delete namespace api-gateway

    echo ""
    echo "✅ API Gateway deleted successfully!"
    ;;

  test)
    echo "Testing API Gateway..."

    echo "Testing health endpoint..."
    curl -s -o /dev/null -w "Health check: %{http_code}\n" http://localhost:8001/status

    echo "Testing proxy endpoint..."
    curl -s -o /dev/null -w "Proxy: %{http_code}\n" http://localhost:80/

    echo ""
    echo "✅ API Gateway tests completed!"
    ;;

  *)
    echo "Usage: $0 {setup|deploy|update|scale|status|logs|delete|test}"
    echo ""
    echo "Commands:"
    echo "  setup   - Initial setup (deploy all components)"
    echo "  deploy  - Deploy/apply all Kubernetes manifests"
    echo "  update  - Update Kong Gateway configuration"
    echo "  scale   - Scale Kong replicas (usage: $0 scale <replicas>)"
    echo "  status  - Show API Gateway status"
    echo "  logs    - Show Kong Gateway logs"
    echo "  delete  - Delete API Gateway and namespace"
    echo "  test    - Test API Gateway endpoints"
    exit 1
    ;;
esac
