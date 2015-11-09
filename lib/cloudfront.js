var CoreObject = require('core-object');

module.exports = CoreObject.extend({
  init: function(options) {
    this._plugin = options.plugin;
    var AWS = require('aws-sdk');
    this._client = this._plugin.readConfig('cloudfrontClient') || new AWS.CloudFront({
      accessKeyId: this._plugin.readConfig('accessKeyId'),
      secretAccessKey: this._plugin.readConfig('secretAccessKey'),
      region: this._plugin.readConfig('region')
    });
  },

  invalidate: function(options) {

  }
});
