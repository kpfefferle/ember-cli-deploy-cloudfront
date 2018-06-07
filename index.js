/* eslint-env node */
'use strict';

var RSVP       = require('rsvp');
var BasePlugin = require('ember-cli-deploy-plugin');
var CloudFront = require('./lib/cloudfront');

var _handleSingleDistribution = function(distribution, objectPaths, cloudfront, logger, errorMessageHandler) {
  var options = {
    objectPaths: objectPaths,
    distribution: distribution
  };

  logger('preparing to create invalidation for CloudFront distribution `' + distribution + '`', { verbose: true });

  return cloudfront.invalidate(options)
    .then(function(invalidation) {
      self.log('created CloudFront invalidation `' + invalidation + '` ok', { verbose: true });
    })
    .catch(errorMessageHandler);
};

module.exports = {
  name: 'ember-cli-deploy-cloudfront',

  createDeployPlugin: function(options) {
    var DeployPlugin = BasePlugin.extend({
      name: options.name,
      defaultConfig: {
        region: 'us-east-1',
        objectPaths: ['/index.html'],
        invalidationClient: function(context) {
          return context.invalidationClient; // if you want to provide your own invalidation client to be used instead of one from this plugin
        },
        cloudfrontClient: function(context) {
          return context.cloudfrontClient; // if you want to provide your own CloudFront client to be used instead of one from aws-sdk
        }
      },
      requiredConfig: ['distribution', 'region'],

      didActivate: function(/*context*/) {
        var self            = this;

        var distributions    = this.readConfig('distribution');
        var objectPaths     = this.readConfig('objectPaths');

        var cloudfront = this.readConfig('invalidationClient') || new CloudFront({
          plugin: this
        });
        
        var logger = this.log.bind(this);
        var errorMessageHandler = this._errorMessage.bind(this);
        
        if (!Array.isArray(distributions)) {
          distributions = [distributions]
        }
        
        return Promise.all(function (distribution) {
          return _handleSingleDistribution(distribution, objectPaths, cloudfront, logger, errorMessageHandler);
        });
      },

      _errorMessage: function(error) {
        this.log(error, { color: 'red' });
        if (error) {
          this.log(error.stack, { color: 'red' });
        }
        return RSVP.reject(error);
      }
    });

    return new DeployPlugin();
  }
};
