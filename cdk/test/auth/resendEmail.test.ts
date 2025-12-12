import { setupMockCognito } from '../utils/mockCognito';
const mockSend = setupMockCognito();

// 2️⃣ Import AFTER mock is declared
import { handler } from '../../lambdas/auth/resendEmail';
import * as cognito from '@aws-sdk/client-cognito-identity-provider';

describe('ResendEmail Lambda', () => {

  beforeEach(() => {
    mockSend.mockReset();
  });

  it('should resend confirmation email successfully', async () => {
    mockSend.mockResolvedValueOnce({});
    const event = { body: JSON.stringify({ email: 'test@example.com' }) };
    const res = await handler(event);
    expect(res.statusCode).toBe(200);
  });

  it('should handle user not found', async () => {
    const error = new Error('User not found');
    (error as any).name = 'UserNotFoundException';
    mockSend.mockRejectedValueOnce(error);

    const event = { body: JSON.stringify({ email: 'doesnotexist@example.com' }) };
    const res = await handler(event);

    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('UserNotFoundException');
  });
});
