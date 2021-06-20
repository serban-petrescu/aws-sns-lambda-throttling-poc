import { SNSEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

function sleep(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}

interface Record {
  id: string;
  duration: number;
  error: boolean;
}

export async function handler(event: SNSEvent) {
  const ddb = new DynamoDB.DocumentClient();
  const records = event.Records.map(
    (record) => JSON.parse(record.Sns.Message) as Record
  );
  for (const { duration, id, error } of records) {
    console.log(`Sleeping for ${duration} ms.`);
    if (error) {
        throw new Error('Intentional error.');
    }
    await sleep(duration);
    await ddb
      .put({
        TableName: process.env.DDB_TABLE_NAME || "",
        Item: { id: id || "unknown" },
      })
      .promise();
  }
}
