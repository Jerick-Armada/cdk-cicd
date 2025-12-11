import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CdkCicdStack } from '../lib/cdk-cicd-stack';

test('Lambda Function Created', () => {
  const app = new cdk.App();
  const stack = new CdkCicdStack(app, 'TestStack');

  const template = Template.fromStack(stack);

  // Assert that a Lambda Function resource exists
  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'nodejs18.x',
  });
});
