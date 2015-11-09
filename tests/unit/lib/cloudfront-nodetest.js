var assert = require('ember-cli/tests/helpers/assert');

describe('cloudfront', function() {
  var CloudFront, mockUi, cloudfrontClient, plugin, subject;

  before(function() {
    CloudFront = require('../../../lib/cloudfront');
  });

  beforeEach(function() {
    validResponse = {
      Invalidation: {
        Id: 'ID'
      }
    };
    cloudfrontClient = {
      createInvalidation: function(params, cb) {
        cb(null, validResponse);
      }
    };
    plugin = {
      readConfig: function(propertyName) {
        if (propertyName === 'cloudfrontClient') {
          return cloudfrontClient;
        }
      },
    };
    subject = new CloudFront({
      plugin: plugin
    });
    validOptions = {
      objectPaths: ['/index.html'],
      distribution: 'ABCDEFG'
    };
  });

  describe('#invalidate', function() {
    it('resolves if invalidation succeeds', function() {
      var promises = subject.invalidate(validOptions);

      return assert.isFulfilled(promises);
    });

    it('rejects if invalidation fails', function() {
      cloudfrontClient.createInvalidation = function(params, cb) {
        cb('error creating invalidation');
      };

      var promises = subject.invalidate(validOptions);

      return assert.isRejected(promises);
    });

    describe('creating the invalidation with CloudFront', function() {
      it('sends the correct params', function() {
        var cloudfrontParams;
        cloudfrontClient.createInvalidation = function(params, cb) {
          cloudfrontParams = params;
          cb(null, validResponse);
        };

        var promises = subject.invalidate(validOptions);

        return assert.isFulfilled(promises)
          .then(function() {
            assert.equal(cloudfrontParams.DistributionId, validOptions.distribution);
            assert.isDefined(cloudfrontParams.InvalidationBatch.CallerReference);
            assert.equal(cloudfrontParams.InvalidationBatch.Paths.Quantity, validOptions.objectPaths.length);
            assert.deepEqual(cloudfrontParams.InvalidationBatch.Paths.Items, validOptions.objectPaths);
          });
      });
    });
  });
});
