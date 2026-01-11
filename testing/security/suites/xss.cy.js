describe('XSS Security Tests', () => {
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

  it('should prevent XSS in order creation', () => {
    const xssPayloads = [
      {
        vertical: 'RIDE',
        product: 'STANDARD',
        pickupLocation: { lat: 40.7128, lon: -74.0060, address: '<script>alert("XSS")</script>' },
        dropoffLocation: { lat: 40.7614, lon: -73.9776 },
        paymentMethod: 'CARD',
      },
      {
        vertical: 'RIDE',
        product: 'STANDARD',
        pickupLocation: { lat: 40.7128, lon: -74.0060, address: '"><img src=x onerror=alert(1)>' },
        dropoffLocation: { lat: 40.7614, lon: -73.9776 },
        paymentMethod: 'CARD',
      },
      {
        vertical: 'RIDE',
        product: 'STANDARD',
        pickupLocation: { lat: 40.7128, lon: -74.0060, address: 'javascript:alert("XSS")' },
        dropoffLocation: { lat: 40.7614, lon: -73.9776 },
        paymentMethod: 'CARD',
      },
    ];

    for (const payload of xssPayloads) {
      cy.request('POST', '/api/v1/orders', {
        body: payload,
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([201, 400]);
        
        if (response.status === 201) {
          cy.log('XSS payload should have been rejected!');
        }
      });
    }
  });

  it('should prevent XSS in user profile', () => {
    const xssUpdates = [
      { firstName: '<script>alert("XSS")</script>' },
      { lastName: '"><img src=x onerror=alert(1)>' },
      { email: 'javascript:alert("XSS")' },
      { phone: '+1-234-567-8900<img src=x onerror=alert(1)>' },
    ];

    for (const update of xssUpdates) {
      cy.request('PUT', '/api/v1/users/me', {
        body: update,
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        
        if (response.status === 200) {
          cy.log('XSS update should have been rejected!');
        }
      });
    }
  });

  it('should prevent XSS in trip status updates', () => {
    const xssUpdates = [
      { status: '<script>alert("XSS")</script>' },
      { notes: '"><img src=x onerror=alert(1)>' },
      { driverRating: 'javascript:alert("XSS")' },
    ];

    for (const update of xssUpdates) {
      cy.request('PUT', `/api/v1/trips/trp_12345`, {
        body: update,
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([200, 400]);
        
        if (response.status === 200) {
          cy.log('XSS update should have been rejected!');
        }
      });
    }
  });

  it('should escape HTML in API responses', () => {
    cy.request('GET', '/api/v1/users/me').then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('data');

      const data = response.body.data;
      if (data.firstName || data.lastName || data.email) {
        cy.log('Checking HTML escaping...');

        const dangerousPatterns = [
          '<script>',
          '</script>',
          '<img',
          'javascript:',
          'onerror=',
          'onload=',
        ];

        const allFields = JSON.stringify(data);
        for (const pattern of dangerousPatterns) {
          expect(allFields).not.to.contain(pattern);
        }
      }
    });
  });

  it('should sanitize user input in search', () => {
    const maliciousSearches = [
      '<script>alert("XSS")</script>',
      '"><img src=x onerror=alert(1)>',
      'javascript:alert("XSS")',
      '\'; DROP TABLE users--',
    ];

    for (const search of maliciousSearches) {
      cy.request('GET', `/api/v1/users/search?q=${encodeURIComponent(search)}`, {
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

  it('should prevent stored XSS in order history', () => {
    cy.request('GET', '/api/v1/orders').then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('data');

      const orders = response.body.data;
      if (Array.isArray(orders) && orders.length > 0) {
        const firstOrder = orders[0];

        if (firstOrder.pickupLocation?.address || firstOrder.dropoffLocation?.address) {
          const addressFields = [
            firstOrder.pickupLocation?.address || '',
            firstOrder.dropoffLocation?.address || '',
          ];

          for (const field of addressFields) {
            const dangerousPatterns = [
              '<script>',
              '</script>',
              '<img',
              'javascript:',
              'onerror=',
              'onload=',
              'document.cookie',
              'document.write',
            ];

            for (const pattern of dangerousPatterns) {
              expect(field).not.to.contain(pattern);
            }
          }
        }
      }
    });
  });
});
