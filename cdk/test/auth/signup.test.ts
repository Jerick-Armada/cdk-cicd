import { setupMockCognito } from '../utils/mockCognito';
const mockSend = setupMockCognito();

import { handler } from '../../lambdas/auth/signup';
import { CognitoIdentityProviderClient, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';

describe('Signup Lambda', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should signup successfully', async () => {
    mockSend.mockResolvedValueOnce({});
    const event = {
      body: JSON.stringify({ email: 'test@example.com', password: 'TestPass123' }),
    };
    const res = await handler(event);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).message).toContain('please confirm your email');
  });

  it('should handle missing fields', async () => {
    const event = { body: '{}' };
    const res = await handler(event);
    expect(res.statusCode).toBe(400); // because the catch block runs
  });
});
