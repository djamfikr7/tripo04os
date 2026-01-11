describe('Authentication Bypass Security Tests', () => {
  const BASE_URL = Cypress.env('BASE_URL') || 'http://localhost:8000';
  const ADMIN_TOKEN = Cypress.env('ADMIN_TOKEN') || '';

  beforeEach(() => {
    cy.request('POST', '/api/v1/auth/login', {
      body: {
        email: 'admin@tripo04os.com',
        password: 'AdminPass123!',
      },
    }).then((response) => {
      cy.wrap(response.body).as('adminAuthResponse');
      cy.wrap(response.body).its('token').as('adminToken');
      if (Cypress.env('ADMIN_TOKEN')) {
        cy.wrap(response.body).its('token').as('adminToken');
      }
    });
  });

  it('should prevent admin credential reuse with rate limiting', () => {
    const maxAttempts = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      cy.request('POST', '/api/v1/auth/login', {
        body: {
          email: 'admin@tripo04os.com',
          password: 'AdminPass123!',
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.log(`Attempt ${attempt + 1}:`, response.status);

        if (response.status === 401 || response.status === 429) {
          cy.log('Rate limiting detected - blocking further attempts');
          expect(response.status).to.be.oneOf([401, 429]);
        } else if (response.status === 200) {
          cy.log('Login succeeded despite being rate limited - potential vulnerability');
          cy.fail('Rate limiting bypassed - admin credentials accepted too easily');
        }
      });
    }
  });

  it('should prevent brute force attacks with account lockout', () => {
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      cy.request('POST', '/api/v1/auth/login', {
        body: {
          email: 'admin@tripo04os.com',
          password: 'WrongPass123!',
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.log(`Attempt ${attempt + 1}:`, response.status);

        if (response.status === 401) {
          expect(response.body).to.have.property('error');
          expect(response.body.error).to.match(/locked|disabled|attempts|too many/i);
          
          if (attempt >= maxAttempts - 1) {
            cy.log('Account locked out after ' + maxAttempts + ' failed attempts');
            expect(response.status).to.equal(423);
          }
        } else if (response.status === 200) {
          cy.fail('Authentication succeeded with wrong password - brute force protection missing');
        }
      });
    }
  });

  it('should prevent password enumeration', () => {
    const testEmails = [
      'admin@tripo04os.com',
      'Administrator@tripo04os.com',
      'root@tripo04os.com',
      'Admin@tripo04os.com',
    ];

    for (const email of testEmails) {
      cy.request('POST', '/api/v1/auth/login', {
        body: {
          email: email,
          password: 'TestPass123!',
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.log(`Testing email: ${email}`);
        cy.log(`Response status: ${response.status}`);

        if (response.status === 200) {
          cy.log('Login succeeded for:', email);
          
          const errorTimes = response.body.error || response.body.loginTime || response.body.authenticateTime;
          
          if (errorTimes < 100) {
            cy.log(`Quick response time (${errorTimes}ms) - possible enumeration vulnerability`);
            cy.warn('Response too fast - may allow password enumeration');
          }
        } else if (response.status === 401 || response.status === 404) {
          cy.log('Login failed for:', email);
        } else {
          cy.log('Unexpected status for:', email);
        }
      });
    }
  });

  it('should prevent JWT token reuse after logout', () => {
    let firstToken = null;

    cy.request('POST', '/api/v1/auth/login', {
      body: {
        email: 'test-user@tripo04os.com',
        password: 'TestPass123!',
      },
    }).then((response) => {
      expect(response.status).to.equal(200);
      
      firstToken = response.body.token;
      cy.log('First token:', firstToken);
    });

    cy.request('POST', '/api/v1/auth/logout', {
      headers: {
        'Authorization': `Bearer ${firstToken}`,
      },
    }).then((response) => {
      expect(response.status).to.equal(204);
    });

    cy.request('GET', '/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${firstToken}`,
      },
    }).then((response) => {
      cy.log('Token after logout:', response.status);

      if (response.status === 200 && response.body.data && response.body.data.token) {
        cy.fail('Token still valid after logout - session not properly invalidated');
      } else if (response.status === 401) {
        cy.log('Token properly invalidated after logout');
      }
    });
  });

  it('should prevent JWT token tampering', () => {
    let token = 'valid.jwt.token.here';

    cy.request('GET', '/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 401]);

      if (response.status === 200) {
        cy.log('JWT token accepted - no tampering protection');
      }
    });

    const tamperedTokens = [
      'modified.jwt.token.here',
      'invalid.jwt.token.here',
      'expired.jwt.token.here',
    ];

    for (const tamperedToken of tamperedTokens) {
      cy.request('GET', '/api/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${tamperedToken}`,
        },
      }).then((response) => {
        expect(response.status).to.equal(401);
        cy.log(`Tampered token rejected: ${tamperedToken}`);
      });
    }
  });

  it('should enforce token expiration', () => {
    cy.request('POST', '/api/v1/auth/login', {
      body: {
        email: 'test-user@tripo04os.com',
        password: 'TestPass123!',
      },
    }).then((response) => {
      expect(response.status).to.equal(200);
      
      const token = response.body.token;
      cy.log('Token received:', token);
    });

    cy.wait(3600000);

    cy.request('GET', '/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).then((response) => {
        cy.log('Token status after 1 hour:', response.status);

        if (response.status === 200) {
          cy.fail('Token still valid after expiration time - JWT expiration not enforced');
        } else if (response.status === 401) {
          cy.log('Token properly expired');
        }
    });
  });

  it('should prevent role privilege escalation', () => {
    const testUserToken = Cypress.env('RIDER_TOKEN') || '';

    cy.request('POST', '/api/v1/auth/login', {
      body: {
        email: 'test-rider@tripo04os.com',
        password: 'RiderPass123!',
      },
    }).then((response) => {
      cy.wrap(response.body).as('riderAuthResponse');
      cy.wrap(response.body).its('token').as('riderToken');
    });

    cy.request('GET', '/api/v1/admin/users', {
      headers: {
        'Authorization': `Bearer ${testUserToken}`,
      },
    }).then((response) => {
        cy.log('Rider trying to access admin endpoint');
        cy.log('Response status:', response.status);

        if (response.status === 200) {
          cy.fail('Rider can access admin endpoint - privilege escalation vulnerability');
        } else if (response.status === 401 || response.status === 403) {
          cy.log('Access denied - authorization working correctly');
          expect(response.status).to.be.oneOf([401, 403]);
        }
      });
    });
  });

  it('should prevent direct access to admin endpoints without authentication', () => {
    const adminEndpoints = [
      '/api/v1/admin/users',
      '/api/v1/admin/reports',
      '/api/v1/admin/analytics',
      '/api/v1/admin/settings',
    ];

    for (const endpoint of adminEndpoints) {
      cy.request('GET', endpoint, {
        failOnStatusCode: false,
      }).then((response) => {
        cy.log(`Unauthenticated request to: ${endpoint}`);
        cy.log(`Response status: ${response.status}`);

        if (response.status === 401) {
          cy.log('Authentication required - authorization working');
          expect(response.status).to.equal(401);
        } else if (response.status === 404) {
          cy.log('Endpoint not found - acceptable');
        } else {
          cy.fail(`Admin endpoint ${endpoint} accessible without authentication - security issue`);
        }
      });
    }
  });

  it('should validate JWT token format and structure', () => {
    const malformedTokens = [
      'invalid.token',
      'invalid.jwt.token',
      'Bearer notoken',
      'notajwt.token',
    ];

    for (const malformedToken of malformedTokens) {
      cy.request('GET', '/api/v1/users/me', {
        headers: {
          'Authorization': malformedToken,
        },
      }).then((response) => {
        cy.log(`Testing malformed token: ${malformedToken}`);
        cy.log(`Response status: ${response.status}`);

        expect([400, 401, 403]).to.include(response.status);
      });
    }
  });

  it('should prevent session fixation attacks', () => {
    cy.request('POST', '/api/v1/auth/login', {
      body: {
        email: 'attacker@evil.com',
        password: 'SessionFixation!',
      },
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 401, 403, 422]);

      if (response.status === 200) {
        cy.request('GET', '/api/v1/users/me', {
          headers: {
            'Authorization': `Bearer ${response.body.token}`,
          },
        }).then((sessionResponse) => {
          cy.log('Session fixed by attacker');
          
          const sessionId = sessionResponse.body.sessionId || sessionResponse.body.id;

          cy.request('POST', '/api/v1/auth/logout', {
            headers: {
              'Authorization': `Bearer ${response.body.token}`,
            },
          }).then((logoutResponse) => {
            expect(logoutResponse.status).to.equal(204);

            cy.request('GET', '/api/v1/users/me', {
              headers: {
                'Authorization': `Bearer ${response.body.token}`,
              },
            }).then((checkResponse) => {
              cy.log('Session ID after logout:', sessionId);
              
              if (checkResponse.body.sessionId === sessionId || checkResponse.body.id === sessionId) {
                cy.fail('Session fixation - session ID persists after logout');
              }
            });
          });
        });
      } else if (response.status === 401) {
        cy.log('Login failed - session fixation prevented');
      }
    });
  });

  it('should prevent timing attacks on authentication', () => {
    const startTime = Date.now();

    cy.request('POST', '/api/v1/auth/login', {
      body: {
        email: 'admin@tripo04os.com',
        password: 'AdminPass123!',
      },
    }).then((response) => {
      const loginTime = Date.now();
      const timing = loginTime - startTime;

      cy.log('Authentication response time:', timing + 'ms');

      expect(timing).to.be.at.most(100);

      if (timing < 50) {
        cy.warn('Fast authentication response - potential timing attack vulnerability');
      }

      cy.wait(100);

      const checkTime = Date.now();
      cy.request('GET', '/api/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${response.body.token}`,
        },
      }).then((checkResponse) => {
        const checkTiming = checkTime - loginTime;

        cy.log('Token verification time:', checkTiming + 'ms');

        if (checkTiming < 100) {
          cy.warn('Fast token verification - allows timing attacks');
        }
      });
    });
  });
});
