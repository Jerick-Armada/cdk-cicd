import { CognitoIdentityProviderClient, InitiateAuthCommand, UserNotConfirmedException } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email and password are required.' }),
      };
    }

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.CLIENT_ID!,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Signin successful.',
        tokens: response.AuthenticationResult, // contains IdToken, AccessToken, RefreshToken
      }),
    };
  } catch (error: any) {
    console.error('Error signing in:', error);

    if (error.name === 'UserNotConfirmedException') {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: 'User not confirmed. Please verify your email before signing in.',
          error: error.message,
          code: error.name
        }),
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error signing in.',
        error: (error as Error).message,
      }),
    };
  }
};
