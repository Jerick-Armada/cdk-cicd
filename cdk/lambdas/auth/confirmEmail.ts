import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, code } = body;

    if (!email || !code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email and confirmation code are required.' }),
      };
    }

    const command = new ConfirmSignUpCommand({
      ClientId: process.env.CLIENT_ID!,
      Username: email,
      ConfirmationCode: code,
    });

    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email confirmed successfully.' }),
    };
  } catch (error: any) {
    console.error('Error confirming email:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error confirming email.',
        error: error.message,
        code: error.name
      }),
    };
  }
};
