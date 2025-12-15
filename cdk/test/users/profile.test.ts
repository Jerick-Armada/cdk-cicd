import { setupMockCognito } from '../utils/mockCognito';
const mockSend = setupMockCognito();

import { handler } from '../../lambdas/users/profile';
import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

describe('Profile Lambda', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, USER_POOL_ID: 'test-pool-id' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 when no claims are present', async () => {
      const event = {
        requestContext: {
          authorizer: {},
        },
      };
      const res = await handler(event);
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).message).toBe('Unauthorized');
    });

    it('should return 401 when authorizer is missing', async () => {
      const event = {
        requestContext: {},
      };
      const res = await handler(event);
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).message).toBe('Unauthorized');
    });

    it('should return 401 when jwt claims are null', async () => {
      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: null,
            },
          },
        },
      };
      const res = await handler(event);
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).message).toBe('Unauthorized');
    });

    it('should return 401 when jwt is missing', async () => {
      const event = {
        requestContext: {
          authorizer: {
            jwt: null,
          },
        },
      };
      const res = await handler(event);
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).message).toBe('Unauthorized');
    });
  });

  describe('Username Extraction', () => {
    it('should extract username from cognito:username claim', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'sub', Value: '12345' },
        ],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should extract username from username claim when cognito:username is missing', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                username: 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should extract username from sub claim when other claims are missing', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'sub-user-123',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                sub: 'sub-user-123',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should prioritize cognito:username over other claims', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'cognito-user',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'cognito-user',
                username: 'regular-user',
                sub: 'sub-user',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('Successful Profile Retrieval', () => {
    it('should retrieve user profile successfully with all attributes', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'sub', Value: '12345' },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: 'Test User' },
        ],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.message).toBe('Welcome to your profile!');
      expect(body.user.username).toBe('testuser');
      expect(body.user.enabled).toBe(true);
      expect(body.user.status).toBe('CONFIRMED');
      expect(body.user.attributes.email).toBe('test@example.com');
      expect(body.user.attributes.sub).toBe('12345');
      expect(body.user.attributes.email_verified).toBe('true');
      expect(body.user.attributes.name).toBe('Test User');
    });

    it('should handle user with no attributes', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: undefined,
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.user.attributes).toEqual({});
    });

    it('should handle user with empty attributes array', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        Enabled: false,
        UserStatus: 'FORCE_CHANGE_PASSWORD',
        UserAttributes: [],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.user.enabled).toBe(false);
      expect(body.user.status).toBe('FORCE_CHANGE_PASSWORD');
      expect(body.user.attributes).toEqual({});
    });

    it('should handle disabled user', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'disableduser',
        Enabled: false,
        UserStatus: 'CONFIRMED',
        UserAttributes: [
          { Name: 'email', Value: 'disabled@example.com' },
        ],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'disableduser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.user.enabled).toBe(false);
    });

    it('should handle various user statuses', async () => {
      const statuses = ['UNCONFIRMED', 'CONFIRMED', 'ARCHIVED', 'COMPROMISED', 'UNKNOWN', 'RESET_REQUIRED', 'FORCE_CHANGE_PASSWORD'];

      for (const status of statuses) {
        mockSend.mockResolvedValueOnce({
          Username: 'testuser',
          Enabled: true,
          UserStatus: status,
          UserAttributes: [],
        });

        const event = {
          requestContext: {
            authorizer: {
              jwt: {
                claims: {
                  'cognito:username': 'testuser',
                },
              },
            },
          },
        };

        const res = await handler(event);
        expect(res.statusCode).toBe(200);

        const body = JSON.parse(res.body);
        expect(body.user.status).toBe(status);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle Cognito service errors gracefully', async () => {
      const mockError = new Error('Service unavailable');
      mockSend.mockRejectedValueOnce(mockError);

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(500);

      const body = JSON.parse(res.body);
      expect(body.message).toBe('Failed to fetch user details');
    });

    it('should handle UserNotFoundException', async () => {
      const mockError = new Error('User not found');
      (mockError as any).name = 'UserNotFoundException';
      mockSend.mockRejectedValueOnce(mockError);

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'nonexistent',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(500);

      const body = JSON.parse(res.body);
      expect(body.message).toBe('Failed to fetch user details');
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network timeout');
      (mockError as any).code = 'NetworkingError';
      mockSend.mockRejectedValueOnce(mockError);

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(500);

      const body = JSON.parse(res.body);
      expect(body.message).toBe('Failed to fetch user details');
    });

    it('should handle permission errors', async () => {
      const mockError = new Error('Access denied');
      (mockError as any).name = 'NotAuthorizedException';
      mockSend.mockRejectedValueOnce(mockError);

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(500);

      const body = JSON.parse(res.body);
      expect(body.message).toBe('Failed to fetch user details');
    });

    it('should handle null/undefined error gracefully', async () => {
      mockSend.mockRejectedValueOnce(null);

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(500);

      const body = JSON.parse(res.body);
      expect(body.message).toBe('Failed to fetch user details');
    });
  });

  describe('Edge Cases and Input Validation', () => {
    it('should handle undefined username gracefully', async () => {
      mockSend.mockResolvedValueOnce({
        Username: undefined,
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.user.username).toBeUndefined();
    });

    it('should handle special characters in username', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'user+test@example.com',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'user+test@example.com',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.user.username).toBe('user+test@example.com');
    });

    it('should handle very long attribute values', async () => {
      const longValue = 'a'.repeat(2048);
      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [
          { Name: 'custom:long_field', Value: longValue },
        ],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.user.attributes['custom:long_field']).toBe(longValue);
    });

    it('should handle attributes with special characters', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [
          { Name: 'custom:field', Value: '<script>alert("xss")</script>' },
          { Name: 'custom:json', Value: '{"key": "value"}' },
          { Name: 'custom:unicode', Value: '🎉 Unicode 测试' },
        ],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.user.attributes['custom:field']).toBe('<script>alert("xss")</script>');
      expect(body.user.attributes['custom:json']).toBe('{"key": "value"}');
      expect(body.user.attributes['custom:unicode']).toBe('🎉 Unicode 测试');
    });

    it('should handle empty string username', async () => {
      mockSend.mockResolvedValueOnce({
        Username: '',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': '',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Attribute Transformation', () => {
    it('should correctly transform multiple attributes into an object', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'phone_number', Value: '+1234567890' },
          { Name: 'name', Value: 'Test User' },
          { Name: 'custom:role', Value: 'admin' },
        ],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(Object.keys(body.user.attributes).length).toBe(4);
      expect(body.user.attributes.email).toBe('test@example.com');
      expect(body.user.attributes.phone_number).toBe('+1234567890');
      expect(body.user.attributes.name).toBe('Test User');
      expect(body.user.attributes['custom:role']).toBe('admin');
    });

    it('should handle attributes with undefined Name', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: undefined, Value: 'orphan-value' },
        ],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.user.attributes.email).toBe('test@example.com');
    });

    it('should handle duplicate attribute names (last one wins)', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [
          { Name: 'email', Value: 'first@example.com' },
          { Name: 'email', Value: 'second@example.com' },
        ],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.user.attributes.email).toBe('second@example.com');
    });
  });

  describe('Environment Variable Handling', () => {
    it('should use USER_POOL_ID from environment', async () => {
      process.env.USER_POOL_ID = 'custom-pool-id';

      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      await handler(event);
      
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('Response Format Validation', () => {
    it('should return valid JSON in response body for success', async () => {
      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [],
      });

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);
      expect(() => JSON.parse(res.body)).not.toThrow();
    });

    it('should return valid JSON in response body for errors', async () => {
      const event = {
        requestContext: {
          authorizer: {},
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(401);
      expect(() => JSON.parse(res.body)).not.toThrow();
    });

    it('should return valid JSON for Cognito errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('Test error'));

      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                'cognito:username': 'testuser',
              },
            },
          },
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(500);
      expect(() => JSON.parse(res.body)).not.toThrow();
    });
  });
});