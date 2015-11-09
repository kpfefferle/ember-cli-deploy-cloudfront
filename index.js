/* jshint node: true */
'use strict';

var Promise    = require('ember-cli/lib/ext/promise');
var BasePlugin = require('ember-cli-deploy-plugin');
var CloudFront = require('./lib/cloudfront');

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
      requiredConfig: ['accessKeyId', 'secretAccessKey', 'distribution', 'region'],

      didActivate: function(context) {
        var self            = this;

        var distribution    = this.readConfig('distribution');
        var objectPaths     = this.readConfig('objectPaths');

        var cloudfront = this.readConfig('invalidationClient') || new CloudFront({
          plugin: this
        });

        var options = {
          objectPaths: objectPaths,
          distribution: distribution
        };

        this.log('preparing to create invalidation for CloudFront distribution `' + distribution + '`', { verbose: true });

        return cloudfront.invalidate(options)
        .then(function(objectsInvalidated) {
          this.log('created invalidation for ' + objectsInvalidated.length + ' object(s) ok', { verbose: true });
        })
        .catch(this._errorMessage.bind(this));
      },
      _errorMessage: function(error) {
        this.log(error, { color: 'red' });
        if (error) {
          this.log(error.stack, { color: 'red' });
        }
        return Promise.reject(error);
      }
    });

    return new DeployPlugin();
  }
};
