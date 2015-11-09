var assert = require('ember-cli/tests/helpers/assert');

describe('cloudfront', function() {
  var CloudFront, mockUi, cloudfrontClient, plugin, subject;

  before(function() {
    CloudFront = require('../../../lib/cloudfront');
  });

  beforeEach(function() {
    cloudfrontClient = {
      createInvalidation: function(params, cb) {
        cb(null, {
          Invalidation: {
            Id: 'ID'
          }
        });
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
  });
});
