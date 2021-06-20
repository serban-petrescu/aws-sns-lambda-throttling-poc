# SNS - Lambda throttling PoC

## Useful commands
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk synth`       emits the synthesized CloudFormation template

## Instructions
You need to have NodeJS installed locally to deploy this PoC. 

Install AWS CDK: `npm i -g aws-cdk` and install the packages used in this repository: `npm ci`. 

Perform a deployment using `cdk deploy`. It will create the Lambdas, SNS, DynamoDB table, etc. and will output a series of CLI commands that can be used to invoke the "producer" Lambda with various payloads.