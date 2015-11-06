/* jshint node: true */
'use strict';

var BasePlugin = require('ember-cli-deploy-plugin');

module.exports = {
  name: 'ember-cli-deploy-cloudfront',

  createDeployPlugin: function(options) {
    var DeployPlugin = BasePlugin.extend({
      name: options.name,
      defaultConfig: {
        objectPaths: '/index.html'
      },
      requiredConfig: ['accessKeyId', 'secretAccessKey', 'distributionId'],

      didActivate: function(context) {

        var accessKeyId = this.readConfig('accessKeyId');
        var secretAccessKey = this.readConfig('secretAccessKey');
        var distributionId = this.readConfig('distributionId');
        var objectPaths = this.readConfig('objectPaths');

        this.log('setting for accessKeyId: `' + accessKeyId + '`');
        this.log('setting for secretAccessKey: `' + secretAccessKey + '`');
        this.log('preparing to create invalidation for CloudFront distribution `' + distributionId + '`');
        this.log('setting for objectPaths: `' + objectPaths + '`');
      }
    });

    return new DeployPlugin();
  }
};
