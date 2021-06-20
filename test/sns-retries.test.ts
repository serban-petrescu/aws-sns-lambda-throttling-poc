import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as SnsRetries from '../lib/sns-retries-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new SnsRetries.SnsRetriesStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
