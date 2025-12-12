import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  try{
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email and password are required.' }),
      };
    }

    const command = new SignUpCommand({
      ClientId: process.env.CLIENT_ID!,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: 'email', Value: email }],
    });
  
    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User signup initiated, please confirm your email.' }),
    };
  }
  catch(error: any){
    console.log("Error in signup: ", error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error signing in.',
        error: error.message,
        code: error.name
      }),
    };
  }
};
