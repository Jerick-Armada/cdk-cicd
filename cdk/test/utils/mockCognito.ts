// test/utils/mockCognito.ts
export const setupMockCognito = () => {
  const mockSend = jest.fn();
  jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
    CognitoIdentityProviderClient: jest.fn(() => ({ send: mockSend })),
    SignUpCommand: jest.fn(),
    ConfirmSignUpCommand: jest.fn(),
    InitiateAuthCommand: jest.fn(),
    ResendConfirmationCodeCommand: jest.fn(),
  }));
  return mockSend;
};
