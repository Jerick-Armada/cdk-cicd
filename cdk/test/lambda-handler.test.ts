import { handler } from '../../lambdas/users/test';

describe('TestLambda handler', () => {
  it('returns a success response', async () => {
    const result = await handler({});
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toHaveProperty('message', 'Hello from Lambda!');
  });
});
