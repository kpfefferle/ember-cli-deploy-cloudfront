# ember-cli-deploy-cloudfront [![Build Status](https://travis-ci.org/kpfefferle/ember-cli-deploy-cloudfront.svg?branch=master)](https://travis-ci.org/kpfefferle/ember-cli-deploy-cloudfront)

> An ember-cli-deploy plugin to invalidate cached files on [AWS CloudFront](https://aws.amazon.com/cloudfront/)

![](https://ember-cli-deploy.github.io/ember-cli-deploy-version-badges/plugins/ember-cli-deploy-cloudfront.svg)

This plugin invalidates one or more files in an Amazon CloudFront distribution. It is primarily useful for invalidating an outdated `index.html`, but can be configured to invalidate any other files as well.

## What is an ember-cli-deploy plugin?

A plugin is an addon that can be executed as a part of the ember-cli-deploy pipeline. A plugin will implement one or more of the ember-cli-deploy's pipeline hooks.

For more information on what plugins are and how they work, please refer to the [Plugin Documentation][1].

## Quick Start

To get up and running quickly, do the following:

1. Install this plugin

    ```bash
    $ ember install ember-cli-deploy-cloudfront
    ```

1. Place the following configuration into `config/deploy.js`

    ```javascript
    ENV.cloudfront = {
      accessKeyId: '<your-aws-access-key>',
      secretAccessKey: '<your-aws-secret>',
      distribution: '<your-cloudfront-distribution-id>'
    }
    ```

1. Run the pipeline with the activation flag

    ```bash
    $ ember deploy production --activate
    ```

## Installation
Run the following command in your terminal:

```bash
ember install ember-cli-deploy-cloudfront
```

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please refer to the [Plugin Documentation][1].

- `configure`
- `didActivate`

## Configuration Options

For detailed information on how configuration of plugins works, please refer to the [Plugin Documentation][1].

### accessKeyId

The AWS access key for the user that has the ability to upload to the `bucket`. If this is left undefined, the normal [AWS SDK credential resolution](https://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials) will take place.

*Default:* `undefined`

### secretAccessKey

The AWS secret for the user that has the ability to upload to the `bucket`. This must be defined when `accessKeyId` is defined.

*Default:* `undefined`

### distribution (`required`)

The CloudFront distribution ID that should be invalidated.

*Default:* `undefined`

### region

The AWS region to send service requests to.

*Default:* `us-east-1`

### objectPaths

CloudFront object paths contained in this array will be invalidated on CloudFront. Each object path must be relative to the CloudFront distribution root and begin with `/`.

*Default:* `['/index.html']`

### invalidationClient

The client used to create the invalidation. This allows the user the ability to use their own client for invalidating instead of the one provided by this plugin.

The client specified MUST implement a function called `invalidate`.

*Default:* the upload client provided by ember-cli-deploy-cloudfront

### cloudfrontClient

The underlying CloudFront library used to create the invalidation with CloudFront. This allows the user to use the default invalidation client provided by this plugin but switch out the underlying library that is used to actually create the invalidation.

The client specified MUST implement a function called `createInvalidation`.

*Default:* the default CloudFront library is `aws-sdk`

### Disabling invalidation

If you want to disable the CloudFront invalidation a specific environment, you can set `activateOnDeploy` conditionally based on the environment:

```javascript
if (deployTarget === 'staging') {
  ENV.pipeline.activateOnDeploy = false;
}
```

## Running Tests

- `npm test`

[1]: http://ember-cli.github.io/ember-cli-deploy/plugins "Plugin Documentation"
