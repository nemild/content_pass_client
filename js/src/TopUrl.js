'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _UrlVariation = require('./UrlVariation');

var _UrlVariation2 = _interopRequireDefault(_UrlVariation);

var _Provider = require('./Provider');

var _Provider2 = _interopRequireDefault(_Provider);

var TOP_URLS = 'top_urls';

var _default = (function () {
  var _class = function _default() {
    _classCallCheck(this, _class);
  };

  _createClass(_class, [{
    key: 'urlInTop',
    value: function urlInTop(url) {
      if (!url || url === '') {
        return false;
      }

      var urlArr = this.getTopUrlsArray();
      var ur = new _UrlVariation2['default'](url.toLowerCase());
      var urlRepresentations = ur.getAllUrlRepresentations();

      if (!urlRepresentations || urlRepresentations.length === 0) {
        return false;
      }

      for (var i = 0; i < urlRepresentations.length; i++) {
        if (urlArr.indexOf(urlRepresentations[i]) !== -1) {
          return true;
        }
      }

      return false;
    }
  }, {
    key: 'setUrlsForProvider',

    // Private
    value: function setUrlsForProvider(providerName, urls) {
      this.instantiateTopUrlsList();
      this.topUrlsList[providerName] = urls;
      this.saveTopUrlsList();

      var provider = new _Provider2['default']();
      provider.setProviderUpdateToCurrentDate(providerName);
    }
  }, {
    key: 'removeProviderFromTopUrls',
    value: function removeProviderFromTopUrls(provider) {
      this.instantiateTopUrlsList();
      delete this.topUrlList[provider];
      this.saveTopUrlsList();
    }
  }, {
    key: 'getTopUrlsArray',
    value: function getTopUrlsArray() {
      this.instantiateTopUrlsList();

      var urls = [];
      for (var provider in this.topUrlsList) {
        if (this.topUrlsList.hasOwnProperty(provider)) {
          urls = urls.concat(this.topUrlsList[provider]);
        }
      }
      return urls;
    }
  }, {
    key: 'instantiateTopUrlsList',
    value: function instantiateTopUrlsList() {
      this.topUrlsList = this.loadTopUrlsList();
      if (!this.topUrlsList) {
        this.topUrlsList = {};
        this.saveTopUrlsList();
      }
    }
  }, {
    key: 'loadTopUrlsList',
    value: function loadTopUrlsList() {
      if (localStorage[TOP_URLS]) {
        return JSON.parse(localStorage[TOP_URLS]);
      } else {
        return null;
      }
    }
  }, {
    key: 'saveTopUrlsList',
    value: function saveTopUrlsList() {
      localStorage[TOP_URLS] = JSON.stringify(this.topUrlsList);
    }
  }]);

  return _class;
})();

exports['default'] = _default;
module.exports = exports['default'];