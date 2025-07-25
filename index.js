/* eslint-env node */
'use strict';

const RSVP = require('rsvp');
const BasePlugin = require('ember-cli-deploy-plugin');
const CloudFront = require('./lib/cloudfront');

module.exports = {
  name: require('./package').name,

  createDeployPlugin: function (options) {
    const DeployPlugin = BasePlugin.extend({
      name: options.name,
      defaultConfig: {
        region: 'us-east-1',
        objectPaths: ['/index.html'],
        invalidationClient: function (context) {
          return context.invalidationClient; // if you want to provide your own invalidation client to be used instead of one from this plugin
        },
        cloudfrontClient: function (context) {
          return context.cloudfrontClient; // if you want to provide your own CloudFront client to be used instead of one from aws-sdk
        },
        waitForInvalidation: false,
      },
      requiredConfig: ['distribution', 'region'],

      didActivate: function (/*context*/) {
        const distribution = this.readConfig('distribution');
        const objectPaths = this.readConfig('objectPaths');
        const waitForInvalidation = this.readConfig('waitForInvalidation');

        const cloudfront =
          this.readConfig('invalidationClient') ||
          new CloudFront({
            plugin: this,
          });

        const distributions = Array.isArray(distribution)
          ? distribution
          : [distribution];
        const distributionInvalidations = distributions.map((currDistribution) => {
          const options = {
            objectPaths: objectPaths,
            distribution: currDistribution,
            waitForInvalidation: waitForInvalidation,
          };

          this.log(`preparing to create invalidation for CloudFront distribution '${currDistribution}'`, { verbose: true });

          return cloudfront
            .invalidate(options)
            .then((invalidationId) => {
              this.log(`invalidation process finished for invalidation ${invalidationId}`, { verbose: true });
            })
            .catch((error) => {
              this._errorMessage(error);
            });
        });

        return RSVP.Promise.all(distributionInvalidations);
      },

      _errorMessage: function (error) {
        this.log(error, { color: 'red' });
        if (error) {
          this.log(error.stack, { color: 'red' });
        }
        return RSVP.reject(error);
      },
    });

    return new DeployPlugin();
  },
};
