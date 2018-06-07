# ember-cli-deploy-cloudfront [![CircleCI](https://circleci.com/gh/kpfefferle/ember-cli-deploy-cloudfront.svg?style=svg)](https://circleci.com/gh/kpfefferle/ember-cli-deploy-cloudfront)

[![Ember Observer Score](https://emberobserver.com/badges/ember-cli-deploy-cloudfront.svg)](https://emberobserver.com/addons/ember-cli-deploy-cloudfront)

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

### profile

The AWS profile as definied in ~/.aws/credentials. If this is left undefined, the normal AWS SDK credential resolution will take place.

*Default:* `undefined`

### sessionToken

The AWS session token for the user that has the ability to manage the CloudFront distribution. This may be required if you are using the [AWS Security Token Service](http://docs.aws.amazon.com/STS/latest/APIReference/Welcome.html).
This requires both `accessKeyId` and `secretAccessKey` to be defined.

*Default:* `undefined`

### distribution (`required`)

The CloudFront distribution ID that should be invalidated. May be specified as a string for a single distribution (most common) or as an array of strings for multiple distributions.

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

## Disable in Selected Environments

If your application doesn't need CloudFront invalidation in an environment where you do need to run other activation hooks, it is possible to whitelist the plugins that you *do* want ember-cli-deploy to run. For an application using the ember-cli-deploy-aws-pack for example, the whitelist would look like this when excluding ember-cli-deploy-cloudfront:

```js
ENV.plugins = ['build', 'gzip', 's3', 'manifest'];
```

While this may not be ideal for complicated deploy processes with many plugins, there is an effort currently underway to add per-plugin disabling to ember-cli-deploy: https://github.com/ember-cli-deploy/ember-cli-deploy/pull/349

## Configuring AWS

### Minimum CloudFront Permissions

Ensure you have the minimum required permissions configured for the user (`accessKeyId`). A bare minimum policy should have the following permissions:

```json
{
   "Version": "2012-10-17",
   "Statement":[{
      "Effect":"Allow",
      "Action":["cloudfront:CreateInvalidation"],
      "Resource":"*"
      }
   ]
}
```

The `cloudfront:CreateInvalidation` action is the only one necessary for this addon, though the more permissive `cloudfront:*` permission will also work. AWS does not currently allow CloudFront permissions to be limited by distribution, so the only accepted value for `Resource` is `*` (all distributions).

## Running Tests

- `yarn test`

## Why `ember build` and `ember test` don't work

Since this is a node-only ember-cli addon, this package does not include many files and dependencies which are part of ember-cli's typical `ember build` and `ember test` processes.

[1]: http://ember-cli-deploy.com/docs/v0.6.x/plugins-overview/ "Plugin Documentation"
