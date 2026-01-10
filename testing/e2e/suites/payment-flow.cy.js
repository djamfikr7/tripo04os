describe('Payment Flow', () => {
  let authToken;
  let paymentIntentId;
  let orderId;

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
      });
    });

    it('should create payment intent', () => {
      cy.task('create_order_first', () => {
        cy.request('POST', '/api/v1/orders', {
          body: {
            vertical: 'RIDE',
            product: 'STANDARD',
            pickupLocation: {
              lat: 40.7128,
              lon: -74.0060,
            },
            dropoffLocation: {
              lat: 40.7614,
              lon: -73.9776,
            },
            paymentMethod: 'CARD',
          },
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }).then((orderResponse) => {
          orderId = orderResponse.body.id;
        });
      });

      cy.request('POST', '/api/v1/payments/create-intent', {
        body: {
          amount: 2500,
          currency: 'usd',
          paymentMethodTypes: ['card'],
          orderId: orderId,
          customerEmail: 'test-rider@example.com',
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('clientSecret');
        expect(response.body).to.have.property('id');
        paymentIntentId = response.body.id;
      });
    });

    it('should confirm payment with payment method', () => {
      cy.task('add_payment_method', () => {
        cy.request('POST', '/api/v1/payments/payment-methods', {
          body: {
            type: 'card',
            token: 'tok_testcard',
            billingDetails: {
              name: 'Test Rider',
              email: 'test-rider@example.com',
            },
          },
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }).then((methodResponse) => {
          expect(methodResponse.status).to.eq(201);
          expect(methodResponse.body).to.have.property('id');
        });

        cy.request('POST', '/api/v1/payments/confirm', {
          body: {
            paymentIntentId: paymentIntentId,
            paymentMethodId: methodResponse.body.id,
          },
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('status');
            expect(['SUCCEEDED', 'REQUIRES_ACTION', 'REQUIRES_PAYMENT_METHOD']).to.include(response.body.status);
          });
        });
    });
  });

  it('should handle cash payment', () => {
    cy.task('create_cash_order', () => {
      cy.request('POST', '/api/v1/orders', {
        body: {
          vertical: 'RIDE',
          product: 'STANDARD',
          pickupLocation: {
            lat: 40.7128,
            lon: -74.0060,
          },
          dropoffLocation: {
            lat: 40.7614,
            lon: -73.9776,
          },
          paymentMethod: 'CASH',
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((orderResponse) => {
          const cashOrderId = orderResponse.body.id;
          
          cy.request('POST', '/api/v1/payments/cash/initiate', {
            body: {
              orderId: cashOrderId,
              riderId: 'user_1',
              driverId: 'driver_1',
              amount: 2500,
              currency: 'usd',
            },
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }).then((cashResponse) => {
            expect(cashResponse.status).to.eq(200);
            expect(cashResponse.body).to.have.property('status', 'initiated');
          });
        });
      });
    });
  });

  it('should process refund', () => {
    cy.task('refund_test', () => {
      cy.request('POST', '/api/v1/payments/create-intent', {
        body: {
          amount: 2500,
          currency: 'usd',
          paymentMethodTypes: ['card'],
          orderId: orderId,
          customerEmail: 'test-rider@example.com',
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        paymentIntentId = response.body.id;
      });

      cy.request('POST', '/api/v1/payments/' + paymentIntentId + '/refund', {
        body: {
          reason: 'Customer cancellation',
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((refundResponse) => {
        expect(refundResponse.status).to.eq(200);
        expect(refundResponse.body).to.have.property('status');
        expect(['REFUNDED', 'PROCESSED']).to.include(refundResponse.body.status);
      });
    });
  });

  after(() => {
    cy.task('cleanup_payment_test', () => {
      if (orderId) {
        cy.request('DELETE', `/api/v1/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
      }
    });
  });
});
