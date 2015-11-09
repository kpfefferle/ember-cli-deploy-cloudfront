var assert = require('ember-cli/tests/helpers/assert');

describe('cloudfront', function() {
  var CloudFront, mockUi, cloudfrontClient, plugin, subject;

  before(function() {
    CloudFront = require('../../../lib/cloudfront');
  });

  beforeEach(function() {
    cloudfrontClient = {
      createInvalidation: function(params, cb) {
        cb();
      }
    };
    mockUi = {
      messages: [],
      write: function() {},
      writeLine: function(message) {
        this.messages.push(message);
      }
    };
    plugin = {
      ui: mockUi,
      readConfig: function(propertyName) {
        if (propertyName === 'cloudfrontClient') {
          return cloudfrontClient;
        }
      },
      log: function(message, opts) {
        this.ui.write('|    ');
        this.ui.writeLine('- ' + message);
      }
    };
    subject = new CloudFront({
      plugin: plugin
    });
  });

  describe('#invalidate', function() {
    
  });
});
