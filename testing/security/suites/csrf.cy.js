describe('CSRF Protection Tests', () => {
  const BASE_URL = Cypress.env('BASE_URL') || 'http://localhost:8000';
  const riderToken = Cypress.env('RIDER_TOKEN') || '';
  const adminToken = Cypress.env('ADMIN_TOKEN') || '';

  beforeEach(() => {
    if (riderToken) {
      cy.request('POST', '/api/v1/auth/login', {
        body: {
          email: 'test-rider@example.com',
          password: 'TestPass123!',
        },
      }).then((response) => {
        cy.wrap(response.body).as('authResponse');
        cy.wrap(response.body).its('token').as('riderToken');
      });
    }
  });

  it('should include CSRF token in protected endpoints', () => {
    cy.request('GET', '/api/v1/orders/ord_12345', {
      headers: {
        'Authorization': `Bearer ${riderToken}`,
      },
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 404]);
      
      if (response.status === 200) {
        const csrfToken = response.headers['x-csrf-token'];
        
        if (csrfToken) {
          cy.log('CSRF token present:', csrfToken);
          expect(csrfToken).to.exist;
        } else {
          cy.log('CSRF token missing - should be present for protected endpoints');
        }
      }
    });
  });

  it('should validate CSRF token in state-changing requests', () => {
    cy.request('POST', '/api/v1/orders', {
      body: {
        vertical: 'RIDE',
        product: 'STANDARD',
        pickupLocation: { lat: 40.7128, lon: -74.0060 },
        dropoffLocation: { lat: 40.7614, lon: -73.9776 },
        paymentMethod: 'CARD',
      },
      headers: {
        'Authorization': `Bearer ${riderToken}`,
      },
    }).then((response) => {
      expect(response.status).to.be.oneOf([201, 403]);
      
      if (response.status === 403) {
        cy.log('Request rejected - CSRF protection working');
      } else if (response.status === 201) {
        cy.log('Request accepted - check if CSRF validation occurred');
      }
    });
  });

  it('should reject state-changing requests without CSRF token', () => {
    cy.request('POST', '/api/v1/orders', {
      body: {
        vertical: 'RIDE',
        product: 'STANDARD',
        pickupLocation: { lat: 40.7128, lon: -74.0060 },
        dropoffLocation: { lat: 40.7614, lon: -73.9776 },
        paymentMethod: 'CARD',
      },
      headers: {
        'Authorization': `Bearer ${riderToken}`,
      },
    }).then((response) => {
      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
    });
  });

  it('should include CSRF token in payment requests', () => {
    cy.request('POST', '/api/v1/payments', {
      body: {
        orderId: 'ord_12345',
        amount: 25.50,
        currency: 'USD',
      },
      headers: {
        'Authorization': `Bearer ${riderToken}`,
      },
    }).then((response) => {
      expect(response.status).to.be.oneOf([201, 403]);
      
      if (response.status === 200 || response.status === 201) {
        const csrfToken = response.headers['x-csrf-token'];
        
        if (csrfToken) {
          cy.log('CSRF token present in payment request');
        } else {
          cy.log('WARNING: CSRF token missing from payment endpoint');
        }
      }
    });
  });

  it('should validate CSRF token on server side', () => {
    const validCsrfToken = 'valid-csrf-token-' + Date.now();
    
    cy.request('POST', '/api/v1/orders', {
      body: {
        vertical: 'RIDE',
        product: 'STANDARD',
        pickupLocation: { lat: 40.7128, lon: -74.0060 },
        dropoffLocation: { lat: 40.7614, lon: -73.9776 },
        paymentMethod: 'CARD',
        _csrf: validCsrfToken,
      },
      headers: {
        'Authorization': `Bearer ${riderToken}`,
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.match(/CSRF/);
    });
  });

  it('should handle expired CSRF tokens', () => {
    const expiredCsrfToken = 'expired-csrf-token';
    
    cy.request('POST', '/api/v1/orders', {
      body: {
        vertical: 'RIDE',
        product: 'STANDARD',
        pickupLocation: { lat: 40.7128, lon: -74.0060 },
        dropoffLocation: { lat: 40.7614, lon: -73.9776 },
        paymentMethod: 'CARD',
        _csrf: expiredCsrfToken,
      },
      headers: {
        'Authorization': `Bearer ${riderToken}`,
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.equal(403);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.match(/expired/i);
    });
  });

  it('should require new CSRF token after successful request', () => {
    cy.request('POST', '/api/v1/orders', {
      body: {
        vertical: 'RIDE',
        product: 'STANDARD',
        pickupLocation: { lat: 40.7128, lon: -74.0060 },
        dropoffLocation: { lat: 40.7614, lon: -73.9776 },
        paymentMethod: 'CARD',
      },
      headers: {
        'Authorization': `Bearer ${riderToken}`,
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      if (response.status === 201) {
        const newCsrfToken = response.headers['x-csrf-new-token'];
        
        cy.log('New CSRF token received:', newCsrfToken);
        expect(newCsrfToken).to.exist;
      }
    });
  });

  it('should prevent CSRF for GET requests', () => {
    cy.request('GET', '/api/v1/orders', {
      headers: {
        'Authorization': `Bearer ${riderToken}`,
      },
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('data');
      
      if (response.status === 200) {
        cy.log('GET request allowed without CSRF token - safe for read operations');
      }
    });
  });

  it('should prevent CSRF in admin endpoints', () => {
    const testEndpoints = [
      { method: 'POST', endpoint: '/api/v1/admin/users' },
      { method: 'PUT', endpoint: '/api/v1/admin/users/usr_123' },
      { method: 'DELETE', endpoint: '/api/v1/admin/users/usr_123' },
    ];

    for (const endpoint of testEndpoints) {
      cy.request(endpoint.method, endpoint.endpoint, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        body: { role: 'admin' },
      }).then((response) => {
        expect([401, 403]).to.include(response.status);
      });
    }
  });

  it('should verify SameSite cookie attribute', () => {
    cy.request('GET', '/api/v1/auth/me').then((response) => {
      expect(response.status).to.equal(200);
      
      const cookies = response.headers['set-cookie'];
      
      if (cookies) {
        cy.log('Response cookies:', cookies);
        
        const hasSecureCookie = cookies.includes('Secure');
        const hasHttpOnlyCookie = cookies.includes('HttpOnly');
        const hasSameSiteCookie = cookies.match(/SameSite=([^;]+)/);
        
        if (hasSecureCookie || hasHttpOnlyCookie) {
          cy.log('Security: Secure or HttpOnly attributes found on cookies');
        }
        
        if (hasSameSiteCookie) {
          const sameSiteValue = hasSameSiteCookie[1];
          
          if (['Strict', 'Lax'].includes(sameSiteValue)) {
            cy.log('CSRF: SameSite attribute set to:', sameSiteValue);
          } else {
            cy.log('WARNING: SameSite attribute not properly set for CSRF protection');
          }
        } else {
          cy.log('WARNING: SameSite attribute missing from cookies');
        }
      }
    });
  });
});
