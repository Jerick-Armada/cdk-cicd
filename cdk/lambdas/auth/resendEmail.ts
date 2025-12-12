import {
  CognitoIdentityProviderClient,
  InvalidParameterException,
  ResendConfirmationCodeCommand,
  UserNotFoundException,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email } = body;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email is required.' }),
      };
    }

    const command = new ResendConfirmationCodeCommand({
      ClientId: process.env.CLIENT_ID!,
      Username: email,
    });

    const x = await client.send(command);

    console.log(x)
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Verification email resent successfully.' }),
    };
  } catch (error: any) {
    console.error('Error resending confirmation email:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error resending confirmation email.',
        error: error.message,
        code: error.name
      }),
    };
  }
};
