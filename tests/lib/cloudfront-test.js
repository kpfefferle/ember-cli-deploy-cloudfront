/* eslint-env node */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
var assert = require('../helpers/assert');
var RSVP = require('rsvp');

describe('cloudfront', function () {
  var CloudFront, validParams, validOptions, cloudfrontClient, plugin, subject;

  before(function () {
    process.env['AWS_ACCESS_KEY_ID'] = 'set_via_env_var';
    process.env['AWS_SECRET_ACCESS_KEY'] = 'set_via_env_var';

    CloudFront = require('../../lib/cloudfront');
  });

  beforeEach(function () {
    validResponse = {
      Invalidation: {
        Id: 'ID',
      },
    };
    cloudfrontClient = {
      createInvalidation: function (params, cb) {
        cb(null, validResponse);
      },
    };
    plugin = {
      readConfig: function (propertyName) {
        if (propertyName === 'cloudfrontClient') {
          return cloudfrontClient;
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

  describe('#init', function () {
    context('with a custom CloudFront client', function () {
      it('uses the custom client', function () {
        assert.equal(cloudfrontClient, subject._client);
      });
    });

    context('using the aws-sdk CloudFront client', function () {
      beforeEach(function () {
        plugin.readConfig = function (propertyName) {};
        subject = new CloudFront({ plugin: plugin });
      });

      it('uses the AWS client', function () {
        var AWS = require('aws-sdk');
        assert.ok(subject._client instanceof AWS.CloudFront);
      });

      context('with credentials in plugin config', function () {
        beforeEach(function () {
          plugin.readConfig = function (propertyName) {
            if (
              propertyName === 'accessKeyId' ||
              propertyName === 'secretAccessKey'
            ) {
              return 'set_via_config';
            }
          };
          subject = new CloudFront({ plugin: plugin });
        });

        it('uses the configured credentials', function () {
          assert.equal(
            'set_via_config',
            subject._client.config.credentials.accessKeyId
          );
          assert.equal(
            'set_via_config',
            subject._client.config.credentials.secretAccessKey
          );
        });
      });

      context('with no credentials in the plugin config', function () {
        beforeEach(function () {
          plugin.readConfig = function (propertyName) {};
          subject = new CloudFront({ plugin: plugin });
        });

        it('falls back to default AWS credential resolution', function () {
          assert.equal(
            'set_via_env_var',
            subject._client.config.credentials.accessKeyId
          );
          assert.equal(
            'set_via_env_var',
            subject._client.config.credentials.secretAccessKey
          );
        });
      });
    });
  });

  describe('#invalidate', function () {
    it('resolves if invalidation succeeds', function () {
      var promises = subject.invalidate(validOptions);

      return assert.isFulfilled(promises);
    });

    it('rejects if invalidation fails', function () {
      cloudfrontClient.createInvalidation = function (params, cb) {
        cb('error creating invalidation');
      };

      var promises = subject.invalidate(validOptions);

      return assert.isRejected(promises);
    });

    describe('creating the invalidation with CloudFront', function () {
      it('sends the correct params', function () {
        var cloudfrontParams;
        cloudfrontClient.createInvalidation = function (params, cb) {
          cloudfrontParams = params;
          cb(null, validResponse);
        };

        var promises = subject.invalidate(validOptions);

        return assert.isFulfilled(promises).then(function () {
          assert.equal(
            cloudfrontParams.DistributionId,
            validOptions.distribution
          );
          assert.isDefined(cloudfrontParams.InvalidationBatch.CallerReference);
          assert.equal(
            cloudfrontParams.InvalidationBatch.Paths.Quantity,
            validOptions.objectPaths.length
          );
          assert.deepEqual(
            cloudfrontParams.InvalidationBatch.Paths.Items,
            validOptions.objectPaths
          );
        });
      });

      describe('waiting for invalidation', function () {
        beforeEach(function () {
          subject = new CloudFront({
            plugin: plugin,
          });
          validOptions.waitForInvalidation = true;
        });

        it('should not quit until validation is finished', function () {
          var callback = function () {};
          cloudfrontClient.waitFor = function (state, params, cb) {
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
