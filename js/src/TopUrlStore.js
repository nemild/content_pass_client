'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _UrlVariation = require('./UrlVariation');

var _UrlVariation2 = _interopRequireDefault(_UrlVariation);

var _ProviderStore = require('./ProviderStore');

var _ProviderStore2 = _interopRequireDefault(_ProviderStore);

var _Downloader = require('./Downloader');

var _Downloader2 = _interopRequireDefault(_Downloader);

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

      // TODO: Change data structure to {}, to speed up lookups
      for (var i = 0; i < urlRepresentations.length; i++) {
        if (urlArr.indexOf(urlRepresentations[i]) !== -1) {
          return true;
        }
      }

      return false;
    }
  }, {
    key: 'populateHNUrlStoreFromServer',
    value: function populateHNUrlStoreFromServer() {
      var that = this;
      var downloader = new _Downloader2['default']();
      downloader.downloadTopHN(function successHN(urlArray) {
        that.setUrlsForProvider(_ProviderStore.HN_PROVIDER_SLUG, urlArray);
      }, function failureHN() {});
    }
  }, {
    key: 'populateSubredditUrlStoreFromServer',
    value: function populateSubredditUrlStoreFromServer(subreddit) {
      var that = this;
      var downloader = new _Downloader2['default']();
      downloader.downloadSubredditTop(subreddit, function successSubreddit(urlArray) {
        that.setUrlsForProvider(_ProviderStore.REDDIT_PROVIDER_SLUG_PREFIX + subreddit.toLowerCase(), urlArray);
      }, function failureSubreddit() {});
    }
  }, {
    key: 'setUrlsForProvider',

    // Private
    value: function setUrlsForProvider(providerName, urls) {
      this.instantiateTopUrlsList();
      this.topUrlsList[providerName] = urls;
      this.saveTopUrlsList();

      var provider = new _ProviderStore2['default']();
      provider.setProviderUpdateToCurrentDate(providerName);
    }
  }, {
    key: 'removeProviderFromTopUrls',
    value: function removeProviderFromTopUrls(provider) {
      this.instantiateTopUrlsList();
      delete this.topUrlsList[provider];
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
  }], [{
    key: 'stripQueryParams',
    value: function stripQueryParams() {}
  }]);

  return _class;
})();

exports['default'] = _default;

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
function parseUri(str) {
  var o = parseUri.options,
      m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str),
      uri = {},
      i = 14;

  while (i--) uri[o.key[i]] = m[i] || '';

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });

  return uri;
};
module.exports = exports['default'];