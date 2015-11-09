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
  });

  describe('#invalidate', function() {
    it('resolves if invalidation succeeds', function() {
      var options = {
        objectPaths: ['/index.html'],
        distribution: 'ABCDEFG'
      };

      var promises = subject.invalidate(options);

      return assert.isFulfilled(promises);
    });
  });
});
