import { AttributeType, BillingMode, Table } from "@aws-cdk/aws-dynamodb";
import {
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "@aws-cdk/aws-iam";
import { Tracing } from "@aws-cdk/aws-lambda";
import { SnsEventSource } from "@aws-cdk/aws-lambda-event-sources";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { Topic } from "@aws-cdk/aws-sns";
import * as cdk from "@aws-cdk/core";
import { CfnOutput, Duration } from "@aws-cdk/core";
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from "@aws-cdk/custom-resources";

export class SnsRetriesStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const role = new Role(this, "LoggingRole", {
      assumedBy: new ServicePrincipal("sns.amazonaws.com"),
      inlinePolicies: {
        Inline: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ["logs:*"],
              resources: ["*"],
            }),
          ],
        }),
      },
    });

    const topic = new Topic(this, "Topic");
    this.setTopicAttribute(topic, "LambdaFailureFeedbackRoleArn", role);
    this.setTopicAttribute(topic, "LambdaSuccessFeedbackRoleArn", role);
    this.setTopicAttribute(topic, "LambdaSuccessFeedbackSampleRate", "100");

    const table = new Table(this, "Table", {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const consumer = new NodejsFunction(this, "Consumer", {
      reservedConcurrentExecutions: 1,
      timeout: Duration.minutes(5),
      tracing: Tracing.PASS_THROUGH,
      environment: {
        DDB_TABLE_NAME: table.tableName,
      },
    });
    consumer.addEventSource(new SnsEventSource(topic));
    table.grantWriteData(consumer);

    const producer = new NodejsFunction(this, "Producer", {
      timeout: Duration.minutes(1),
      environment: {
        SNS_TOPIC_ARN: topic.topicArn,
      },
      tracing: Tracing.ACTIVE,
    });
    topic.grantPublish(producer);

    new CfnOutput(this, 'InvokeProducerWithDefaultThrottle', {
      value: `aws lambda invoke --function-name ${producer.functionName} --payload '{}'`
    });

    new CfnOutput(this, 'InvokeProducerWithLargeThrottle', {
      value: `aws lambda invoke --function-name ${producer.functionName} --payload '{"count": 1000, "duration": 2000}'`
    });

    new CfnOutput(this, 'InvokeProducerWithError', {
      value: `aws lambda invoke --function-name ${producer.functionName} --payload '{"error": true}'`
    });
  }

  private setTopicAttribute(topic: Topic, name: string, value: Role | string) {
    const resource = new AwsCustomResource(this, "TopicAttribute" + name, {
      onCreate: {
        service: "SNS",
        action: "setTopicAttributes",
        parameters: {
          TopicArn: topic.topicArn,
          AttributeName: name,
          AttributeValue: typeof value === "string" ? value : value.roleArn,
        },
        physicalResourceId: PhysicalResourceId.of(topic.node.id + name),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [topic.topicArn],
      }),
    });

    if (typeof value !== "string") {
      value.grantPassRole(resource.grantPrincipal);
    }
  }
}
