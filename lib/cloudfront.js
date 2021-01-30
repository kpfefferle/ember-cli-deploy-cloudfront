/* eslint-env node */

const CoreObject = require('core-object');
const RSVP = require('rsvp');
const { v4: uuidv4 } = require('uuid');

module.exports = CoreObject.extend({
  init: function (options) {
    this._super();
    this._plugin = options.plugin;

    var AWS = require('aws-sdk');
    const accessKeyId = this._plugin.readConfig('accessKeyId');
    const secretAccessKey = this._plugin.readConfig('secretAccessKey');
    const profile = this._plugin.readConfig('profile');

    var awsOptions = {
      region: this._plugin.readConfig('region'),
    };

    if (this._plugin.readConfig('sessionToken')) {
      awsOptions.sessionToken = this._plugin.readConfig('sessionToken');
    }

    if (accessKeyId && secretAccessKey) {
      awsOptions.accessKeyId = accessKeyId;
      awsOptions.secretAccessKey = secretAccessKey;
    }

    if (profile) {
      this._plugin.log('Using AWS profile from config', { verbose: true });
      AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
    }

    this._client =
      this._plugin.readConfig('cloudfrontClient') ||
      new AWS.CloudFront(awsOptions);
  },

  invalidate: function (options) {
    options = options || {};

    return new RSVP.Promise(
      function (resolve, reject) {
        var distribution = options.distribution;
        var objectPaths = options.objectPaths || [];
        if (typeof objectPaths === 'string') {
          objectPaths = [objectPaths];
        }

        var params = {
          DistributionId: distribution,
          InvalidationBatch: {
            CallerReference: uuidv4(),
            Paths: {
              Quantity: objectPaths.length,
              Items: objectPaths,
            },
          },
        };

        this._client.createInvalidation(
          params,
          function (error, data) {
            if (error) {
              reject(error);
            } else {
              this._plugin.log(
                'created CloudFront invalidation ' +
                  data.Invalidation.Id +
                  ' ok'
              );
              if (options.waitForInvalidation) {
                var params = {
                  DistributionId: distribution,
                  Id: data.Invalidation.Id,
                };
                this._plugin.log(
                  'waiting for invalidation ' +
                    data.Invalidation.Id +
                    ' to complete'
                );
                this._client.waitFor(
                  'invalidationCompleted',
                  params,
                  function (invalidationCompletedError) {
                    if (invalidationCompletedError) {
                      reject(invalidationCompletedError);
                    } else {
                      resolve(data.Invalidation.Id);
                    }
                  }.bind(this)
                );
              } else {
                resolve(data.Invalidation.Id);
              }
            }
          }.bind(this)
        );
      }.bind(this)
    );
  },
});
