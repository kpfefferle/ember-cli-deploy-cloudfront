/* jshint node: true */

var CoreObject = require('core-object');
var Promise    = require('ember-cli/lib/ext/promise');
var uuid       = require('uuid');

module.exports = CoreObject.extend({
  init: function(options) {
    this._plugin = options.plugin;
    var AWS = require('aws-sdk');
    this._client = this._plugin.readConfig('cloudfrontClient') || new AWS.CloudFront({
      accessKeyId: this._plugin.readConfig('accessKeyId'),
      secretAccessKey: this._plugin.readConfig('secretAccessKey'),
      region: this._plugin.readConfig('region')
    });
  },

  invalidate: function(options) {
    options = options || {};

    return new Promise(function(resolve, reject) {
      var distribution = options.distribution;
      var objectPaths = options.objectPaths || [];
      if (typeof objectPaths === 'string') {
        objectPaths = [objectPaths];
      }

      var params = {
        DistributionId: distribution,
        InvalidationBatch: {
          CallerReference: uuid.v4(),
          Paths: {
            Quantity: objectPaths.length,
            Items: objectPaths
          }
        }
      };

      this._client.createInvalidation(params, function(error, data) {
        if (error) {
          reject(error);
        } else {
          resolve(data.Invalidation.Id);
        }
      }.bind(this));
    }.bind(this));
  }
});
