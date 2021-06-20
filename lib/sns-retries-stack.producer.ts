import { Context } from "aws-lambda";
import { SNS } from "aws-sdk";
import { captureAWSClient } from "aws-xray-sdk";

interface Input {
  error: boolean;
  duration: number;
  count: number;
}

export async function handler({error = false, duration = 2500, count = 100}: Input, context: Context) {
  console.log(`Execution id ${context.awsRequestId}.`);
  const sns = captureAWSClient(new SNS());
  for (let i = 0; i < count; ++i) {
    await sns
      .publish({
        TopicArn: process.env.SNS_TOPIC_ARN || "",
        Message: JSON.stringify({
          id: context.awsRequestId + "-" + i,
          duration,
          error
        }),
      })
      .promise();
  }
}
