describe('Complete Order Flow - Rider to Driver', () => {
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
  let tripId;

  before(() => {
    cy.task('authenticate_rider', () => {
      cy.request('POST', '/api/v1/auth/login', {
        body: {
          email: 'test-rider@example.com',
          password: 'TestPass123!',
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        authToken = response.body.token;
        expect(authToken).to.be.a('string');
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
        expect(response.body).to.have.property('estimatedFare');
        expect(response.body.estimatedFare).to.be.a('number');
        orderId = response.body.id;
      });
    });

    it('should wait for driver assignment', () => {
      cy.request('GET', `/api/v1/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        timeout: 30000,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status');
        expect(response.body).to.have.property('driverId');
        expect(response.body).to.have.property('eta');

        if (response.body.status === 'MATCHED' || response.body.status === 'IN_PROGRESS') {
          expect(response.body.driverId).to.be.a('string');
          expect(response.body.eta).to.be.a('number');
        }
      });
    });

    it('should accept order as driver', () => {
      cy.task('authenticate_driver', () => {
        cy.request('POST', '/api/v1/auth/login', {
          body: {
            email: 'test-driver@example.com',
            password: 'TestPass123!',
          },
        }).then((response) => {
            const driverToken = response.body.token;
            
            cy.request('POST', `/api/v1/trips`, {
              body: {
                orderId: orderId,
                driverId: 'driver_1',
              },
              headers: {
                Authorization: `Bearer ${driverToken}`,
              },
            }).then((tripResponse) => {
                expect(tripResponse.status).to.eq(201);
                expect(tripResponse.body).to.have.property('id');
                tripId = tripResponse.body.id;
              });
          });
        });
      });
    });

    it('should update trip status to EN_ROUTE', () => {
      cy.task('update_trip_status', () => {
        cy.request('POST', `/api/v1/trips/${tripId}/start`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('status', 'EN_ROUTE');
          });
        });
      });
    });

    it('should update driver location during trip', () => {
      cy.request('POST', '/api/v1/drivers/driver_1/location', {
        body: {
          latitude: 40.7350,
          longitude: -73.9900,
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
            expect(response.status).to.eq(200);
          });
        });
    });

    it('should mark trip as driver arrived', () => {
      cy.request('POST', `/api/v1/trips/${tripId}/arrived`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('status', 'ARRIVED');
          });
        });
    });

    it('should complete trip', () => {
      cy.request('POST', `/api/v1/trips/${tripId}/complete`, {
        body: {
          rating: 5,
        fare: 25.00,
        distance: 3.2,
          duration: 15,
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('status', 'COMPLETED');
          });
      });
    });

    it('should verify rider can rate the trip', () => {
      cy.request('GET', `/api/v1/trips/${tripId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status', 'COMPLETED');
        expect(response.body).to.have.property('rating');
      });
    });

    it('should verify payment was processed', () => {
      cy.request('GET', `/api/v1/payments/order/${orderId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status');
        expect(['SUCCEEDED', 'COMPLETED']).to.include(response.body.status);
      });
    });

    after(() => {
      cy.task('cleanup_test_data', () => {
        cy.request('DELETE', `/api/v1/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }).then((response) => {
          expect([200, 404]).to.include(response.status);
        });
      });
    });
});
