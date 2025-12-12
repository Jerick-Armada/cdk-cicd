import { setupMockCognito } from '../utils/mockCognito';
const mockSend = setupMockCognito();

import { handler } from '../../lambdas/auth/confirmEmail';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

describe('ConfirmEmail Lambda', () => {
  (CognitoIdentityProviderClient as any).mockImplementation(() => ({
    send: mockSend,
  }));

  beforeEach(() => jest.clearAllMocks());

  it('should confirm email successfully', async () => {
    mockSend.mockResolvedValueOnce({});
    const event = { body: JSON.stringify({ email: 'test@example.com', code: '123456' }) };
    const res = await handler(event);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).message).toContain('confirmed');
  });

  it('should handle missing params', async () => {
    const event = { body: '{}' };
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
  });
});
