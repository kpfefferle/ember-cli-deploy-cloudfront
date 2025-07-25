/* eslint-env node */

const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const { fromIni } = require('@aws-sdk/credential-providers');
const CoreObject = require('core-object');
const RSVP = require('rsvp');
const { v4: uuidv4 } = require('uuid');

module.exports = CoreObject.extend({
  init: function (options) {
    this._super();
    this._plugin = options.plugin;

    const customClient = this._plugin.readConfig('cloudfrontClient');

    if (typeof customClient !== 'undefined') {
      this._client = customClient;
    } else {
      const accessKeyId = this._plugin.readConfig('accessKeyId');
      const secretAccessKey = this._plugin.readConfig('secretAccessKey');
      const profile = this._plugin.readConfig('profile');

      const awsOptions = {
        region: this._plugin.readConfig('region'),
        credentials: {},
      };

      if (profile) {
        this._plugin.log('Using AWS profile from config', { verbose: true });
        awsOptions.credentials = fromIni({ profile });
      } else {
        if (this._plugin.readConfig('sessionToken')) {
          awsOptions.credentials.sessionToken = this._plugin.readConfig('sessionToken');
        }

        if (accessKeyId && secretAccessKey) {
          awsOptions.credentials.accessKeyId = accessKeyId;
          awsOptions.credentials.secretAccessKey = secretAccessKey;
        }
      }
      if (Object.keys(awsOptions.credentials).length === 0) {
        throw new Error('missing credentials: aws-sdk v3 requires credentials to be passed to each client');
      }
      this._client = new CloudFrontClient(awsOptions);
    }
  },

  invalidate: function (options) {
    options = options || {};

    return new RSVP.Promise(
      (resolve, reject) => {
        const distribution = options.distribution;
        let objectPaths = options.objectPaths || [];
        if (typeof objectPaths === 'string') {
          objectPaths = [objectPaths];
        }

        const params = {
          DistributionId: distribution,
          InvalidationBatch: {
            CallerReference: uuidv4(),
            Paths: {
              Quantity: objectPaths.length,
              Items: objectPaths,
            },
          },
        };

        const command = new CreateInvalidationCommand(params);
        this._client.send(command,
          (error, data) => {
            if (error) {
              reject(error);
            } else {
              this._plugin.log(`created CloudFront invalidation ${data.Invalidation.Id} ok`);
              if (options.waitForInvalidation) {
                const waitForParams = {
                  DistributionId: distribution,
                  Id: data.Invalidation.Id,
                };
                this._plugin.log(`waiting for invalidation ${data.Invalidation.Id} to complete`);
                this._client.waitFor(
                  'invalidationCompleted',
                  waitForParams,
                  (invalidationCompletedError) => {
                    if (invalidationCompletedError) {
                      reject(invalidationCompletedError);
                    } else {
                      resolve(data.Invalidation.Id);
                    }
                  }
                );
              } else {
                resolve(data.Invalidation.Id);
              }
            }
          }
        );
      }
    );
  },
});
