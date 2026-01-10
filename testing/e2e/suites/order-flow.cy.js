describe('Order Creation Flow', () => {
  const testOrder = {
    vertical: 'RIDE',
    product: 'STANDARD',
    pickupLocation: {
      lat: 40.7128,
      lon: -74.0060,
      address: 'Times Square, New York',
    },
    dropoffLocation: {
      lat: 40.7614,
      lon: -73.9776,
      address: 'Central Park, New York',
    },
    paymentMethod: 'CARD',
  };

  let authToken;
  let orderId;

  before(() => {
    cy.task('authenticate_rider', () => {
      cy.request('POST', '/api/v1/auth/login', {
        body: {
          email: 'test-rider@example.com',
          password: 'TestPass123!',
        },
      }).then((response) => {
        authToken = response.body.token;
        expect(response.status).to.eq(200);
      });
    });
  });

  it('should create a new order', () => {
    cy.request('POST', '/api/v1/orders', {
      body: testOrder,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('vertical', 'RIDE');
      expect(response.body).to.have.property('status', 'PENDING');
      orderId = response.body.id;
    });
  });

  it('should fetch the created order', () => {
    cy.request('GET', `/api/v1/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.id).to.eq(orderId);
      expect(response.body).to.have.property('pickupLocation');
      expect(response.body).to.have.property('dropoffLocation');
      expect(response.body).to.have.property('estimatedFare');
    });
  });

  it('should list user orders', () => {
    cy.request('GET', '/api/v1/orders', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an('array');
      expect(response.body).to.not.be.empty;
    });
  });

  after(() => {
    cy.task('cleanup_order', () => {
      cy.request('DELETE', `/api/v1/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  });
});
