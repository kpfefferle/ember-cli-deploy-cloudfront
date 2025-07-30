/* eslint-env node */
/* global describe, before, beforeEach, context, it */
var assert = require('../helpers/assert');
var RSVP = require('rsvp');

describe('cloudfront', () => {
  var CloudFront, validResponse, validOptions, customCloudfrontClient, plugin, subject;

  before(() => {
    process.env['AWS_ACCESS_KEY_ID'] = 'set_via_env_var';
    process.env['AWS_SECRET_ACCESS_KEY'] = 'set_via_env_var';

    CloudFront = require('../../lib/cloudfront');
  });

  beforeEach(() => {
    validResponse = {
      Invalidation: {
        Id: 'ID',
      },
    };
    customCloudfrontClient = {
      send: function (params, cb) {
        cb(null, validResponse);
      },
    };
    plugin = {
      readConfig: function (propertyName) {
        if (
          propertyName === 'accessKeyId' ||
          propertyName === 'secretAccessKey'
        ) {
          return 'set_via_config';
        }
      },
      log: function noop() {},
    };
    subject = new CloudFront({
      plugin: plugin,
    });
    validOptions = {
      objectPaths: ['/index.html'],
      distribution: 'ABCDEFG',
    };
  });

  describe('#init', () => {
    context('with a custom CloudFront client', () => {
      beforeEach(() => {
        plugin.readConfig = function (propertyName) {
          if (propertyName === 'cloudfrontClient') {
            return customCloudfrontClient;
          }
        };
        subject = new CloudFront({ plugin: plugin });
      });

      it('uses the custom client', () => {
        assert.equal(customCloudfrontClient, subject._client);
      });
    });

    context('using the aws-sdk CloudFront client', () => {
      it('uses the AWS client', () => {
        const awsClient = require('@aws-sdk/client-cloudfront');
        assert.ok(subject._client instanceof awsClient.CloudFrontClient);
      });

      context('with credentials in plugin config', () => {
        it('uses the configured credentials', () => {
          const promise = subject._client.config.credentials();

          return assert.isFulfilled(promise).then(function (credential) {
            assert.equal(
              'set_via_config',
              credential.accessKeyId
            );
            assert.equal(
              'set_via_config',
              credential.secretAccessKey
            );

          });
        });
      });

      context('with no credentials in the plugin config', () => {
        beforeEach(() => {
          plugin.readConfig = function () {};
          subject = new CloudFront({ plugin: plugin });
        });

        it('falls back to default AWS credential resolution', () => {
          const promise = subject._client.initConfig.credentials();
          return assert.isFulfilled(promise).then(function (credential) {
            assert.equal(
              'set_via_env_var',
              credential.accessKeyId
            );
            assert.equal(
              'set_via_env_var',
              credential.secretAccessKey
            );
          });
        });
      });
    });
  });

  describe('#invalidate', () => {
    beforeEach(() => {
      plugin.readConfig = function (propertyName) {
        if (propertyName === 'cloudfrontClient') {
          return customCloudfrontClient;
        }
      };
      subject = new CloudFront({ plugin: plugin });
    });

    it('resolves if invalidation succeeds', () => {
      const promises = subject.invalidate(validOptions);

      return assert.isFulfilled(promises);
    });

    it('rejects if invalidation fails', () => {
      customCloudfrontClient.send = function (params, cb) {
        cb('error creating invalidation');
      };

      const promises = subject.invalidate(validOptions);

      return assert.isRejected(promises);
    });

    describe('creating the invalidation with CloudFront', () => {
      it('sends the correct params', () => {
        let cloudfrontParams;
        customCloudfrontClient.send = (params, cb) => {
          cloudfrontParams = params;
          cb(null, validResponse);
        };

        var promises = subject.invalidate(validOptions);

        return assert.isFulfilled(promises).then(() => {
          assert.equal(
            cloudfrontParams.input.DistributionId,
            validOptions.distribution
          );
          assert.isDefined(cloudfrontParams.input.InvalidationBatch.CallerReference);
          assert.equal(
            cloudfrontParams.input.InvalidationBatch.Paths.Quantity,
            validOptions.objectPaths.length
          );
          assert.deepEqual(
            cloudfrontParams.input.InvalidationBatch.Paths.Items,
            validOptions.objectPaths
          );
        });
      });

      describe('waiting for invalidation', () => {
        beforeEach(() => {
          validOptions.waitForInvalidation = true;
        });

        it('should not quit until validation is finished', () => {
          let callback = () => {};
          customCloudfrontClient.waitFor = function (state, params, cb) {
            callback = cb;
          };

          var promise = subject.invalidate(validOptions);

          assert.isUndefined(promise._result);

          callback(null, validResponse);
          assert.instanceOf(promise, RSVP.Promise);

          assert.equal(promise._result, 'ID');
        });
      });
    });
  });
});
