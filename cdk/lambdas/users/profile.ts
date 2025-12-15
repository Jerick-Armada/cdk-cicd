import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({});

const USER_POOL_ID = process.env.USER_POOL_ID!;

export const handler = async (event: any) => {
  console.log("Authorized request:", event.requestContext.authorizer);

  // Extract username (sub or cognito:username)
  const claims = event.requestContext.authorizer?.jwt?.claims;

  if (!claims) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  const username =
    claims["cognito:username"] || claims["username"] || claims["sub"];

  try {
    const command = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    });

    const user = await cognitoClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Welcome to your profile!",
        user: {
          username: user.Username,
          enabled: user.Enabled,
          status: user.UserStatus,
          attributes: user.UserAttributes?.reduce(
            (acc: any, attr) => {
              acc[attr.Name!] = attr.Value;
              return acc;
            },
            {}
          ),
        },
      }),
    };
  } catch (error) {
    console.error("Error fetching Cognito user:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to fetch user details",
      }),
    };
  }
};
