import { setupMockCognito } from '../utils/mockCognito';
const mockSend = setupMockCognito();

// 2️⃣ Import after the mock
import { handler } from '../../lambdas/auth/signin';
import * as cognito from '@aws-sdk/client-cognito-identity-provider';

describe('Signin Lambda', () => {

  beforeEach(() => {
    mockSend.mockReset();
  });

  it('should sign in successfully', async () => {
    mockSend.mockResolvedValueOnce({ AuthenticationResult: { IdToken: '123' } });
    const event = {
      body: JSON.stringify({ email: 'test@example.com', password: 'Pass1234' }),
    };
    const res = await handler(event);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.tokens.IdToken).toBe('123');
  });

  it('should handle unconfirmed user', async () => {
    const mockError = new Error('User not confirmed');
    (mockError as any).name = 'UserNotConfirmedException';
    mockSend.mockRejectedValueOnce(mockError);

    const event = {
      body: JSON.stringify({ email: 'test@example.com', password: 'Pass1234' }),
    };
    const res = await handler(event);
    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(403);
    expect(body.code).toBe('UserNotConfirmedException');
  });
});
