#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { SnsRetriesStack } from "../lib/sns-retries-stack";

const app = new cdk.App();
new SnsRetriesStack(app, "SnsRetriesStack", {
  env: { account: "162174280605", region: "us-east-1" },
});
