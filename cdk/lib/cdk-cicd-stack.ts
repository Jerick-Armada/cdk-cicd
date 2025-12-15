import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_lambda,
  aws_lambda_nodejs,
  aws_apigatewayv2,
  aws_cognito,
} from 'aws-cdk-lib';
import * as path from 'path';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';

export class CdkCicdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      env: {
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION,
      },
      ...props
    });

    // ===== COGNITO USER POOL =====
    const userPool = new aws_cognito.UserPool(this, 'UserPool', {
      userPoolName: `UserServicePool-${process.env.DEV_NAME}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
      },
    });

    // Create a User Pool Client for app authentication
    const userPoolClient = new aws_cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    // ===== Lambda Functions =====
    const signupLambda = new aws_lambda_nodejs.NodejsFunction(this, 'SignupLambda', {
      entry: path.join(__dirname, '../lambdas/auth/signup.ts'),
      handler: 'handler',
      runtime: aws_lambda.Runtime.NODEJS_18_X,
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    const signinLambda = new aws_lambda_nodejs.NodejsFunction(this, 'SigninLambda', {
      entry: path.join(__dirname, '../lambdas/auth/signin.ts'),
      handler: 'handler',
      runtime: aws_lambda.Runtime.NODEJS_18_X,
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    const confirmEmailLambda = new aws_lambda_nodejs.NodejsFunction(this, 'ConfirmEmailLambda', {
      entry: path.join(__dirname, '../lambdas/auth/confirmEmail.ts'),
      handler: 'handler',
      runtime: aws_lambda.Runtime.NODEJS_18_X,
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    const resendEmailLambda = new aws_lambda_nodejs.NodejsFunction(this, 'ResendEmailLambda', {
      entry: path.join(__dirname, '../lambdas/auth/resendEmail.ts'),
      handler: 'handler',
      runtime: aws_lambda.Runtime.NODEJS_18_X,
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    const profileLambda = new aws_lambda_nodejs.NodejsFunction(this, 'ProfileLambda', {
      entry: path.join(__dirname, '../lambdas/users/profile.ts'),
      handler: 'handler',
      runtime: aws_lambda.Runtime.NODEJS_18_X,
    });


    // Grant Lambdas permission to use Cognito
    userPool.grant(signupLambda, 'cognito-idp:SignUp', 'cognito-idp:AdminConfirmSignUp');
    userPool.grant(signinLambda, 'cognito-idp:InitiateAuth');
    userPool.grant(confirmEmailLambda, 'cognito-idp:ConfirmSignUp');

    const authorizer = new authorizers.HttpUserPoolAuthorizer(
      'CognitoUserPoolAuthorizer', // logical ID
      userPool,
      {
        userPoolClients: [userPoolClient],
        identitySource: ['$request.header.Authorization'], // optional, default is header
      }
    );

    // ===== HTTP API (v2) =====
    const httpApiGateway = new aws_apigatewayv2.HttpApi(this, 'UsersHttpApi', {
      apiName: 'UsersHttpApi',
      description: 'HTTP API for user authentication routes.',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [aws_apigatewayv2.CorsHttpMethod.ANY],
      },
    });

    // Routes
    httpApiGateway.addRoutes({
      path: '/users/signup',
      methods: [aws_apigatewayv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('SignupIntegration', signupLambda),
    });

    httpApiGateway.addRoutes({
      path: '/users/signin',
      methods: [aws_apigatewayv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('SigninIntegration', signinLambda),
    });

    httpApiGateway.addRoutes({
      path: '/users/confirm-email',
      methods: [aws_apigatewayv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('ConfirmEmailIntegration', confirmEmailLambda),
    });

    httpApiGateway.addRoutes({
      path: '/users/resend-email',
      methods: [aws_apigatewayv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('ResendEmailIntegration', resendEmailLambda),
    });

    httpApiGateway.addRoutes({
      path: '/users/profile',
      methods: [aws_apigatewayv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration('ProfileIntegration', profileLambda),
      authorizer,
    });

    // ===== Outputs =====
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: httpApiGateway.apiEndpoint,
      description: 'HTTP API endpoint URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });
  }
}