# Security Testing for Tripo04OS

## Overview

Automated security testing to identify and fix vulnerabilities before production launch.

## Security Scans

### 1. OWASP Top 10 Vulnerabilities

Target areas:
- **Injection**: SQL injection, NoSQL injection, command injection
- **Broken Authentication**: Weak passwords, credential exposure
- **Sensitive Data Exposure**: Keys, tokens, PII in logs
- **XML External Entities (XXE)**
- **Broken Access Control**: Unauthorized access, privilege escalation
- **Security Misconfiguration**: Default credentials, exposed admin panels
- **Cross-Site Scripting (XSS)**: Stored and reflected XSS
- **Insecure Deserialization**
- **Using Components with Known Vulnerabilities**: Dependency scanning
- **Insufficient Logging & Monitoring**: Attack detection

### 2. API Security

Testing endpoints:
- Authentication and authorization
- Rate limiting and abuse prevention
- Input validation and sanitization
- CORS configuration
- Secure headers implementation
- Token handling (JWT, refresh tokens)

### 3. Container Security

Scanning:
- Docker images vulnerabilities
- Container configuration issues
- Secrets in container layers
- Root container usage

### 4. Dependency Scanning

Scanning:
- Node.js packages (npm audit)
- Python packages (pip-audit)
- Go modules (go mod audit)
- Java dependencies (OWASP Dependency Check)

## Tools

### OWASP ZAP

Web application vulnerability scanner.

```bash
# Run ZAP in Docker
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:8020 \
  -r security/reports/zap-baseline-report.html \
  -I security/zap/exclusions.txt
```

### Snyk

Dependency vulnerability scanner.

```bash
# Scan Node.js dependencies
snyk test --json > security/reports/dependency-scan.json

# Scan Python dependencies
snyk test --file=requirements.txt --json > security/reports/python-deps.json

# Scan all directories
snyk monitor
```

### Trivy

Container vulnerability scanner.

```bash
# Scan Docker images
trivy image --severity HIGH,CRITICAL \
  --output security/reports/trivy-scan.json \
  --format json \
  tripo04os/identity-service:latest
```

### Bandit

Python security linter.

```bash
# Scan Python services
bandit -r security/reports/bandit-report.json \
  backend_services/*/app/*.py
```

## Security Tests

### 1. Authentication Test

```python
def test_auth_weak_passwords():
    """Test against common weak passwords"""
    weak_passwords = ['password', '123456', 'admin', 'qwerty']
    
    for password in weak_passwords:
        response = login_with_password(password)
        assert response.status != 200, f"Weak password {password} accepted"
```

### 2. SQL Injection Test

```python
def test_sql_injection():
    """Test SQL injection on order search"""
    injection_attempts = [
        "1' OR '1'='1",
        "1; DROP TABLE orders--",
        "1' UNION SELECT * FROM users--",
    ]
    
    for payload in injection_attempts:
        response = search_orders(payload)
        assert "error" in response.text.lower(), f"SQL injection {payload} succeeded"
```

### 3. XSS Test

```python
def test_xss_injection():
    """Test XSS on user profile"""
    xss_payloads = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
        "javascript:alert('xss')",
    ]
    
    for payload in xss_payloads:
        response = update_profile(payload)
        assert payload not in response.text, f"XSS payload {payload} reflected"
```

### 4. Rate Limiting Test

```python
def test_rate_limiting():
    """Test rate limiting on login endpoint"""
    for i in range(20):  # Make 20 rapid requests
        response = login()
        if i >= 10:  # Should be blocked after 10 attempts
            assert response.status == 429, "Rate limiting not working"
```

### 5. Authorization Test

```python
def test_authorization_bypass():
    """Test accessing other users' data"""
    rider_token = get_user_token('rider1')
    driver_token = get_user_token('driver1')
    
    # Try to access driver's orders as rider
    response = get_orders(rider_token, user_id='driver1')
    assert response.status == 403, "Authorization bypass possible"
```

## Running Security Tests

```bash
# Run all security tests
npm run test:security

# Run specific security scan
npm run test:security:zap      # OWASP ZAP scan
npm run test:security:dependency # Dependency scan
npm run test:security:container  # Container scan
npm run test:security:auth      # Authentication tests
npm run test:security:injection # Injection tests
npm run test:security:xss       # XSS tests
```

## Reporting

Security scan results are stored in:

- `testing/security/reports/zap/` - OWASP ZAP reports
- `testing/security/reports/dependency/` - Dependency scan reports
- `testing/security/reports/container/` - Container scan reports
- `testing/security/reports/functional/` - Functional security test results

## Security Best Practices

### 1. Never commit secrets

- Use environment variables
- Use secret management (AWS Secrets Manager, HashiCorp Vault)
- Rotate credentials regularly

### 2. Implement proper authentication

- Use JWT with short expiration
- Implement refresh tokens
- Use HTTPS only
- Implement proper logout

### 3. Validate all inputs

- Whitelist allowed characters
- Sanitize user inputs
- Use parameterized queries
- Implement input length limits

### 4. Rate limit all endpoints

- Prevent brute force attacks
- Implement IP-based limits
- Use CAPTCHA for critical operations
- Block repeated abuse

### 5. Implement CORS properly

- Whitelist allowed origins
- Don't use `*` in production
- Implement pre-flight checks
- Handle OPTIONS requests

### 6. Secure headers

```javascript
// Required security headers
helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
});
```

## Fixing Vulnerabilities

1. **High Priority** (Critical/High severity)
   - Fix immediately
   - Deploy hotfix
   - Monitor for exploit attempts

2. **Medium Priority** (Medium severity)
   - Fix within 1 week
   - Include in next release
   - Add monitoring

3. **Low Priority** (Low/Info severity)
   - Fix within 1 month
   - Track in backlog
   - Document as known issue

## Monitoring

Implement security monitoring in production:

```python
# Log security events
security_events = {
    'brute_force_attempt': {'alert': True, 'block': True},
    'sql_injection_attempt': {'alert': True, 'block': True},
    'xss_attempt': {'alert': True, 'block': False},
    'rate_limit_exceeded': {'alert': True, 'block': True},
    'unauthorized_access': {'alert': True, 'block': True},
}
```

## Next Steps

1. Run full security scan
2. Fix all critical vulnerabilities
3. Address high-severity issues
4. Document security posture
5. Implement continuous security monitoring

## License

Proprietary - Tripo04OS Internal Use Only
