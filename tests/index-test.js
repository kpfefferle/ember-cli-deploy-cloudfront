/* eslint-env node */
/* eslint-disable no-undef */
var assert = require('./helpers/assert');
var plugin = require('../index');
var BasePlugin = require('ember-cli-deploy-plugin');

describe('ember-cli-dpeloy-cloudfront plugin', function() {
  var pluginInstance, invalidateAssertions;
  var invalidateMock = function(options) {
    invalidateAssertions.forEach(function(customAssert) {
      customAssert(options);
    });
    return Promise.resolve('invalidation_id');
  };

  beforeEach(function() {
    var mockUi = {
      messages: [],
      verbose: true,
      startProgress: function() { },
      write: function() { },
      writeLine: function(message) {
        this.messages.push(message);
      },
      writeError: function(message) {
        this.messages.push(message);
      },
      writeDeprecateLine: function(message) {
        this.messages.push(message);
      },
      writeWarnLine: function(message) {
        this.messages.push(message);
      }
    };
    invalidateAssertions = [];
    pluginInstance = plugin.createDeployPlugin({
      name: 'ember-cli-deploy-cloudfront-test'
    });
    var context = {
      ui: mockUi,
      config: {
        'ember-cli-deploy-cloudfront-test': {
          distribution: 'nope',
          invalidationClient: {
            invalidate: invalidateMock
          }
        }
      }
    };
    pluginInstance.beforeHook(context);
    pluginInstance.configure();
  });

  it('returns a plugin instance', function() {
    assert.ok(pluginInstance instanceof BasePlugin);
  });

  describe('objectPaths option', function() {
    it('has a default value of objects to invalidate', function() {
      invalidateAssertions.push(function(options) {
        assert.deepEqual(options.objectPaths, ['/index.html']);
      });
      pluginInstance.didActivate();
    });

    it('allows to customize the objects to invalidate', function() {
      pluginInstance.pluginConfig.objectPaths = ['/yep.html'];
      invalidateAssertions.push(function(options) {
        assert.deepEqual(options.objectPaths, ['/yep.html']);
      });
      pluginInstance.didActivate();
    });

    it('allows to use a function for objectPaths', function() {
      pluginInstance.pluginConfig.objectPaths = function(/*config, context, configHelper*/) {
        return ['/dynamic_filename.html'];
      };
      invalidateAssertions.push(function(options) {
        assert.deepEqual(options.objectPaths, ['/dynamic_filename.html']);
      });
      pluginInstance.didActivate();
    });
  });
});

