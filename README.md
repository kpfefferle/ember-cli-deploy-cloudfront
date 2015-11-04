**WARNING: This plugin is currently under development. This README outlines the planned functionality (subject to change).**

----------

# ember-cli-deploy-cloudfront

> An ember-cli-deploy plugin to invalidate cached files on [AWS CloudFront](https://aws.amazon.com/cloudfront/)

----------

**WARNING: This plugin is only compatible with ember-cli-deploy versions >= 0.5.0**

----------

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
    ENV.cloudFront {
      accessKeyId: '<your-aws-access-key>',
      secretAccessKey: '<your-aws-secret>',
      distributionId: '<your-cloudfront-distribution-id>'
    }
    ```

1. Run the pipeline with activation

    ```bash
    $ ember deploy --activate
    ```

## Installation
Run the following command in your terminal:

```bash
ember install ember-cli-deploy-cloudfront
```

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please refer to the [Plugin Documentation][1].

- `configure`
- `activate`

## Configuration Options

For detailed information on how configuration of plugins works, please refer to the [Plugin Documentation][1].

### accessKeyId (`required`)

The AWS access key for the user that has the ability to upload to the `bucket`.

*Default:* `undefined`

### secretAccessKey (`required`)

The AWS secret for the user that has the ability to upload to the `bucket`.

*Default:* `undefined`

### distributionId (`required`)

The CloudFront distribution ID that should be invalidated.

*Default:* `undefined`

### filePattern

Files that match this pattern will be invalidated on CloudFront. The file pattern must be relative to `distDir`.

*Default:* 'index.html'

## Prerequisites

The following properties are expected to be present on the deployment `context` object:

[TBD]

## Running Tests

- `npm test`

[1]: http://ember-cli.github.io/ember-cli-deploy/plugins "Plugin Documentation"
