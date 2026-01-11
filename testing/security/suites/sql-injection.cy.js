describe('SQL Injection Security Tests', () => {
  const BASE_URL = Cypress.env('BASE_URL') || 'http://localhost:8000';
  const adminToken = Cypress.env('ADMIN_TOKEN') || '';

  beforeEach(() => {
    cy.request('POST', '/api/v1/auth/login', {
      body: {
        email: 'admin@tripo04os.com',
        password: 'AdminPass123!',
      },
    }).then((response) => {
      cy.wrap(response.body).as('authResponse');

      const token = cy.wrap(response.body).its('token');
      if (token) {
        adminToken = token;
      }
    });
  });

  it('should prevent SQL injection in login endpoint', () => {
    const maliciousPayloads = [
      { email: "' OR '1'='1", password: 'password' },
      { email: 'admin@tripo04os.com" -- DROP TABLE users --', password: 'password' },
      { email: 'admin@tripo04os.com', password: "' UNION SELECT * FROM users --" },
    ];

    for (const payload of maliciousPayloads) {
      cy.request('POST', '/api/v1/auth/login', {
        body: payload,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 401, 403]);
        expect(response.body).to.have.property('error');
      });
    }
  });

  it('should prevent SQL injection in order search', () => {
    const maliciousQueries = [
      "' OR '1'='1",
      "'; DROP TABLE orders; --",
      "' UNION SELECT * FROM orders --",
      "admin'--",
      "1' AND 1=1",
    ];

    for (const query of maliciousQueries) {
      cy.request('GET', `/api/v1/orders?search=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 403]);
        expect(response.body).to.have.property('error');
      });
    }
  });

  it('should prevent SQL injection in trip details', () => {
    const maliciousIds = [
      "' OR '1'='1",
      "'; DROP TABLE trips; --",
      "' UNION SELECT * FROM trips --",
    ];

    for (const tripId of maliciousIds) {
      cy.request('GET', `/api/v1/trips/${encodeURIComponent(tripId)}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 403, 404]);
        expect(response.body).to.have.property('error');
      });
    }
  });

  it('should prevent SQL injection in user lookup', () => {
    const maliciousParams = [
      "?id='1' OR '1'='1",
      "?id=1'; DROP TABLE users--",
      "?id=1' UNION SELECT * FROM users--",
    ];

    for (const params of maliciousParams) {
      cy.request('GET', `/api/v1/users/me${params}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 403, 404]);
      });
    }
  });

  it('should prevent SQL injection in pricing calculation', () => {
    const maliciousParams = [
      "?pickup_lat=40.7128 OR 1=1",
      "?pickup_lat=40.7128; DROP TABLE pricing--",
      "?pickup_lat=40.7128' UNION SELECT * FROM pricing--",
    ];

    for (const params of maliciousParams) {
      cy.request('GET', `/api/v1/pricing/calculate${params}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 403]);
        expect(response.body).to.have.property('error');
      });
    }
  });

  it('should handle special characters in order creation', () => {
    const orderPayloads = [
      {
        vertical: 'RIDE',
        product: 'STANDARD',
        pickupLocation: { lat: "40.7128'; DROP TABLE orders--", lon: -74.0060 },
        dropoffLocation: { lat: 40.7614, lon: -73.9776 },
        paymentMethod: 'CARD',
      },
      {
        vertical: 'RIDE',
        product: 'STANDARD',
        pickupLocation: { lat: 40.7128, address: "<script>alert('XSS')</script>" },
        dropoffLocation: { lat: 40.7614, lon: -73.9776 },
        paymentMethod: 'CARD',
      },
    ];

    for (const payload of orderPayloads) {
      cy.request('POST', '/api/v1/orders', {
        body: payload,
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 422]);
        expect(response.body).to.have.property('error');
      });
    }
  });

  it('should validate and sanitize all input parameters', () => {
    const testCases = [
      { endpoint: '/api/v1/auth/login', payload: { email: 'test@example.com', password: "' OR '1'='1" } },
      { endpoint: '/api/v1/orders', payload: { vertical: "'; DROP TABLE orders--" } },
    ];

    for (const testCase of testCases) {
      cy.request(testCase.endpoint, {
        method: testCase.payload.email || testCase.payload.vertical ? 'POST' : 'GET',
        body: testCase.payload.email || testCase.payload.vertical ? testCase.payload : {},
        failOnStatusCode: false,
      }).then((response) => {
        if (testCase.payload.email || testCase.payload.vertical) {
          expect(response.status).to.be.oneOf([400, 422]);
        } else {
          expect(response.status).to.be.oneOf([200, 403, 404]);
        }
      });
    }
  });
});
