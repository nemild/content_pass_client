'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _TopUrl = require('./TopUrl');

var _TopUrl2 = _interopRequireDefault(_TopUrl);

// LocalStorage key
var ALL_PROVIDERS = 'all_providers';

// Hash keys
var HN_PROVIDER_SLUG = 'hackernews';
exports.HN_PROVIDER_SLUG = HN_PROVIDER_SLUG;
var REDDIT_PROVIDER_SLUG_PREFIX = 'reddit_';

exports.REDDIT_PROVIDER_SLUG_PREFIX = REDDIT_PROVIDER_SLUG_PREFIX;
// Thin wrapper to allow the creation and removal of providers: subreddits (and Hacker News) that provide lists of top links
// The main data structure is in the form { 'providername': last_updated_date }

var _default = (function () {
  var _class = function _default() {
    _classCallCheck(this, _class);
  };

  _createClass(_class, [{
    key: 'addSubredditProvider',

    // Public
    value: function addSubredditProvider(subreddit) {
      if (subreddit && subreddit !== '') {
        addProvider(REDDIT_PROVIDER_SLUG_PREFIX + subreddit);
      }
    }
  }, {
    key: 'addProvider',
    value: function addProvider(provider) {
      this.instantiateProvidersList();

      this.providersList[provider] = '';
      this.saveProvidersList();

      // TODO: Start update
    }
  }, {
    key: 'removeSubredditProvider',
    value: function removeSubredditProvider(subreddit) {
      removeProvider(REDDIT_PROVIDER_SLUG_PREFIX + subreddit);
    }
  }, {
    key: 'removeProvider',
    value: function removeProvider(provider) {
      this.instantiateProvidersList();

      delete this.providersList[provider];
      this.saveProvidersList();

      new _TopUrl2['default']().removeProviderFromTopUrls(provider);
    }
  }, {
    key: 'setProviderUpdateToCurrentDate',
    value: function setProviderUpdateToCurrentDate(provider) {
      this.instantiateProvidersList();
      if (provider in this.providersList) {
        this.providersList[provider] = new Date();
        this.saveProvidersList();
        return true;
      }
      return false;
    }
  }, {
    key: 'getCurrentProviders',
    value: function getCurrentProviders() {
      this.instantiateProvidersList();
      Object.keys(this.providersList);
    }
  }, {
    key: 'getLastUpdate',
    value: function getLastUpdate(provider) {
      this.instantiateProvidersList();
      return this.providersList[provider];
    }
  }, {
    key: 'instantiateProvidersList',

    // Private
    value: function instantiateProvidersList() {
      this.providersList = this.loadProvidersList();

      if (!this.providersList) {
        this.providersList = {};
        this.providersList[HN_PROVIDER_SLUG] = '';
        this.saveProvidersList();
      }
    }
  }, {
    key: 'loadProvidersList',
    value: function loadProvidersList() {
      if (localStorage[ALL_PROVIDERS]) {
        return JSON.parse(localStorage[ALL_PROVIDERS]);
      } else {
        return null;
      }
    }
  }, {
    key: 'saveProvidersList',
    value: function saveProvidersList() {
      localStorage[ALL_PROVIDERS] = JSON.stringify(this.providersList);
    }
  }]);

  return _class;
})();

exports['default'] = _default;