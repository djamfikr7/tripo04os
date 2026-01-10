# Tripo04OS Kubernetes Deployment Guide

Complete Kubernetes manifests for deploying Tripo04OS platform.

## Overview

This directory contains all Kubernetes resources needed to deploy the Tripo04OS platform:
- 16 microservices
- PostgreSQL database
- Redis cache
- Persistent storage
- Auto-scaling
- SSL/TLS termination
- External access via Ingress

## Prerequisites

- Kubernetes cluster (v1.25+)
- kubectl configured
- cert-manager installed (for TLS certificates)
- nginx-ingress controller installed
- Sufficient storage capacity (minimum 100GB)

## Architecture

### Services

**Microservices (16 total):**
1. Identity Service (port 8001) - Authentication & authorization
2. Location Service (port 8002) - Geolocation & maps
3. Order Service (port 8003) - Order management
4. Trip Service (port 8004) - Trip lifecycle
5. Matching Service (port 8005) - Driver-rider matching
6. Pricing Service (port 8006) - Fare calculation
7. Communication Service (port 8007) - In-app messaging
8. Safety Service (port 8008) - Emergency features
9. Reputation Service (port 8009) - User ratings
10. Fraud Service (port 8010) - Fraud detection
11. Subscription Service (port 8011) - Premium features
12. Analytics Service (port 8012) - Metrics & reporting
13. Payment Service (port 8013) - Payment processing
14. Maps Service (port 8014) - Maps integration
15. Notification Service (port 8015) - Push notifications
16. SMS Service (port 8016) - SMS notifications

**Infrastructure:**
- PostgreSQL (port 5432) - Primary database
- Redis (port 6379) - Cache layer

### Resource Allocation

**Default Replicas:**
- Core services (Identity, Order, Trip, Payment): 3 replicas
- Matching Service: 4 replicas (high traffic)
- Other services: 2 replicas
- Databases: 1 replica

**Resource Requests:**
- CPU: 100-500m per service
- Memory: 128-512Mi per service
- PostgreSQL: 512Mi - 2048Mi
- Redis: 128Mi - 512Mi

**Auto-scaling:**
- Most services: 3-10 replicas
- Matching Service: 4-15 replicas
- CPU target: 60-70%
- Memory target: 70-80%

## Deployment Steps

### 1. Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Update Secrets

Edit `secrets.yaml` and replace all `CHANGE_ME` values:

```bash
kubectl create secret generic database-credentials \
  --from-literal=postgres-user=tripo04os \
  --from-literal=postgres-password=STRONG_PASSWORD \
  --from-literal=redis-password=STRONG_PASSWORD \
  -n tripo04os
```

Or apply the secrets file after editing:

```bash
kubectl apply -f secrets.yaml
```

### 3. Apply ConfigMaps

```bash
kubectl apply -f configmaps.yaml
```

### 4. Create Persistent Volumes

```bash
kubectl apply -f persistent-volumes.yaml
```

### 5. Deploy Services

```bash
kubectl apply -f services.yaml
```

### 6. Deploy Applications

```bash
kubectl apply -f deployments.yaml
```

### 7. Configure Auto-scaling

```bash
kubectl apply -f hpa.yaml
```

### 8. Configure Ingress

```bash
kubectl apply -f ingress.yaml
```

## Verification

### Check All Resources

```bash
kubectl get all -n tripo04os
```

### Check Pod Status

```bash
kubectl get pods -n tripo04os
```

Expected output: All pods should be `Running` or `Ready`

### Check Services

```bash
kubectl get svc -n tripo04os
```

### Check HPA Status

```bash
kubectl get hpa -n tripo04os
```

### Check Ingress

```bash
kubectl get ingress -n tripo04os
```

### Test Service Health

```bash
kubectl run test-pod --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s http://identity-service:8001/health
```

## Configuration Management

### Updating Environment Variables

Edit `configmaps.yaml` and apply:

```bash
kubectl apply -f configmaps.yaml
kubectl rollout restart deployment/identity-service -n tripo04os
```

### Updating Secrets

Edit `secrets.yaml` and apply:

```bash
kubectl apply -f secrets.yaml
kubectl rollout restart deployment/identity-service -n tripo04os
```

### Scaling Services

Manually scale a service:

```bash
kubectl scale deployment/identity-service --replicas=5 -n tripo04os
```

## Monitoring & Debugging

### View Pod Logs

```bash
kubectl logs -f deployment/identity-service -n tripo04os
```

### Pod with Issues

```bash
kubectl describe pod <pod-name> -n tripo04os
```

### Port Forward to Local

```bash
kubectl port-forward svc/identity-service 8001:8001 -n tripo04os
```

### Exec into Pod

```bash
kubectl exec -it <pod-name> -n tripo04os -- /bin/sh
```

## Rollbacks

### Rollback Deployment

```bash
kubectl rollout undo deployment/identity-service -n tripo04os
```

### View Rollout History

```bash
kubectl rollout history deployment/identity-service -n tripo04os
```

## Troubleshooting

### Pods Not Starting

1. Check pod status: `kubectl get pods -n tripo04os`
2. Check pod logs: `kubectl logs <pod-name> -n tripo04os`
3. Check events: `kubectl describe pod <pod-name> -n tripo04os`
4. Verify secrets and configmaps are applied

### Persistent Volume Issues

1. Check PV/PVC status: `kubectl get pv,pvc -n tripo04os`
2. Verify host path exists on nodes
3. Check storage class availability

### Ingress Not Working

1. Verify ingress controller is running
2. Check DNS records point to ingress IP
3. Verify TLS certificates are issued

### Service Not Accessible

1. Check service endpoints: `kubectl get endpoints <service-name> -n tripo04os`
2. Verify pods are ready
3. Check service selector matches pod labels

## External Access

### API Endpoints

After deployment, access APIs via:

- https://api.tripo04os.com/v1/identity
- https://api.tripo04os.com/v1/location
- https://api.tripo04os.com/v1/order
- (etc for all services)

### Web Interface

- https://web.tripo04os.com

### Admin Dashboard

- https://admin.tripo04os.com
- IP whitelist applied (see ingress annotations)

## Security Considerations

### Secrets Management

- Never commit secrets to version control
- Use Kubernetes secrets for sensitive data
- Rotate secrets regularly
- Use strong, randomly generated passwords

### Network Policies

Consider adding network policies:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: tripo04os
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

### RBAC

Implement role-based access control:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: tripo04os
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
```

## Maintenance

### Rolling Updates

```bash
kubectl set image deployment/identity-service \
  identity-service=tripo04os/identity-service:v2.0.0 \
  -n tripo04os
```

### Drain Node for Maintenance

```bash
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
```

### Backup PostgreSQL

```bash
kubectl exec postgres-0 -n tripo04os -- pg_dumpall -U tripo04os > backup.sql
```

## Cost Optimization

### Right-size Resources

Monitor actual usage and adjust:

```bash
kubectl top pods -n tripo04os
```

### Cluster Autoscaler

Enable cluster autoscaler to scale nodes:

```bash
kubectl annotate nodepool <pool-name> \
  cluster.kubernetes.io/cluster-autoscaler-enabled=true
```

## Disaster Recovery

### Backup Configuration

```bash
kubectl get all,configmaps,secrets -n tripo04os -o yaml > backup.yaml
```

### Restore from Backup

```bash
kubectl apply -f backup.yaml
```

### Database Backup Strategy

- Daily automated backups
- Weekly full snapshots
- Off-site storage

## Best Practices

1. **Always test in staging first**
2. **Use git for manifest versioning**
3. **Monitor resource usage**
4. **Implement alerts for pod failures**
5. **Regular security updates**
6. **Document custom configurations**
7. **Use labels for organization**
8. **Implement health checks for all services**
9. **Use resource limits to prevent noisy neighbors**
10. **Plan for horizontal scaling**

## Support

For issues or questions:
- Check pod logs: `kubectl logs -f <pod> -n tripo04os`
- Check events: `kubectl get events -n tripo04os --sort-by=.metadata.creationTimestamp`
- Review documentation for each service
- Contact DevOps team

## License

MIT
