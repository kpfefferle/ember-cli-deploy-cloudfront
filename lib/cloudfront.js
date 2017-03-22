/* eslint-env node */

var CoreObject = require('core-object');
var RSVP    = require('rsvp');
var uuid       = require('uuid');

module.exports = CoreObject.extend({
  init: function(options) {
    this._super();
    this._plugin = options.plugin;

    var AWS = require('aws-sdk');
    const accessKeyId = this._plugin.readConfig('accessKeyId');
    const secretAccessKey = this._plugin.readConfig('secretAccessKey');
    var awsOptions = {
      region: this._plugin.readConfig('region')
    };

    if (accessKeyId && secretAccessKey) {
      awsOptions.accessKeyId = accessKeyId;
      awsOptions.secretAccessKey = secretAccessKey;
    }

    this._client = this._plugin.readConfig('cloudfrontClient') || new AWS.CloudFront(awsOptions);
  },

  invalidate: function(options) {
    options = options || {};

    return new RSVP.Promise(function(resolve, reject) {
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
