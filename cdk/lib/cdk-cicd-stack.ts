import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_lambda, aws_lambda_nodejs } from 'aws-cdk-lib';
import * as path from 'path';

export class CdkCicdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a Node.js Lambda function (TypeScript-friendly)
    const helloLambda = new aws_lambda_nodejs.NodejsFunction(this, 'HelloLambda', {
      entry: path.join(__dirname, '../../lambdas/users/test.ts'),
      handler: 'handler', // name of the exported function
      runtime: aws_lambda.Runtime.NODEJS_18_X,
      environment: {
        ENVIRONMENT: 'dev',
      },
    });

    // Output the Lambda function name
    new cdk.CfnOutput(this, 'LambdaName', {
      value: helloLambda.functionName,
    });
  }
}
