/* eslint-env node */

const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const { fromIni } = require('@aws-sdk/credential-providers');
const CoreObject = require('core-object');
const RSVP = require('rsvp');
const { v4: uuidv4 } = require('uuid');

module.exports = CoreObject.extend({
  init: function (options) {
    this._super(options);

    const customClient = this.plugin.readConfig('cloudfrontClient');

    if (typeof customClient !== 'undefined') {
      this._client = customClient;
    } else {
      const accessKeyId = this.plugin.readConfig('accessKeyId');
      const secretAccessKey = this.plugin.readConfig('secretAccessKey');
      const profile = this.plugin.readConfig('profile');
      const sessionToken = this.plugin.readConfig('sessionToken');

      const awsOptions = {
        region: this.plugin.readConfig('region'),
      };

      if (profile) {
        this.plugin.log('Using AWS profile from config', { verbose: true });
        awsOptions.credentials = fromIni({ profile: profile });
      } else {
        if (accessKeyId && secretAccessKey) {
          this.plugin.log('Using AWS access key id and secret access key from config', { verbose: true });
          awsOptions.credentials = {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
          };
          if (sessionToken) {
            this.plugin.log('Using AWS session token from config', { verbose: true });
            awsOptions.credentials.sessionToken = sessionToken;
          }
        }
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
              this.plugin.log(`created CloudFront invalidation ${data.Invalidation.Id} ok`);
              if (options.waitForInvalidation) {
                const waitForParams = {
                  DistributionId: distribution,
                  Id: data.Invalidation.Id,
                };
                this.plugin.log(`waiting for invalidation ${data.Invalidation.Id} to complete`);
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
