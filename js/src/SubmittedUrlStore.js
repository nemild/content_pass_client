'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _UrlVariation = require('./UrlVariation');

var _UrlVariation2 = _interopRequireDefault(_UrlVariation);

var SUBMITTED_URLS_STORAGE_KEY = 'submitted_urls';
var EXPIRY_TIME_MINUTES = 60 * 24 * 7;

var _default = (function () {
  var _class = function _default() {
    _classCallCheck(this, _class);

    this.data = this.loadSubmittedUrls();
  };

  _createClass(_class, [{
    key: 'setSubmittedUrl',

    // Date is stored in Unix time
    value: function setSubmittedUrl(url, weight) {
      // strip lookup URL - no query parameters, no id
      var lookupUrl = _UrlVariation2['default'].stripUrl(url);
      var urlSearch = this.getDetailsOfUrl(url);
      var newDate = undefined;
      var urlKey = undefined;

      if (urlSearch) {
        newDate = urlSearch.date;
        urlKey = urlSearch.url;
        console.log('SubmittedUrls: Updating old entry ' + urlKey);
      } else {
        newDate = new Date();
        urlKey = lookupUrl;
        console.log('SubmittedUrls: Storing new entry ' + urlKey);
      }

      this.data[urlKey] = {
        'weight': weight,
        'date': newDate
      };

      this.storeSubmittedUrls();
    }
  }, {
    key: 'getDetailsOfUrl',
    value: function getDetailsOfUrl(url) {
      var urlRepresentations = this.getUrlVariations(url);

      for (var i = 0; i < urlRepresentations.length; i++) {
        if (this.data[urlRepresentations[i]]) {
          var elem = this.data[urlRepresentations[i]];
          return {
            'url': urlRepresentations[i],
            'weight': elem.weight,
            'date': elem.date
          };
        }
      }
      return null;
    }
  }, {
    key: 'expireSubmittedUrls',
    value: function expireSubmittedUrls() {
      var currDate = new Date();
      var parsedDate = undefined;

      for (keyName in this.data) {
        if (this.data.hasOwnProperty(keyName)) {
          parsedDate = Date.parse(this.data[keyName].date);
          if (parsedDate < currDate + EXPIRY_TIME_MINUTES * 60 * 1000) {
            delete this.data[keyName];
          }
        }
      }
    }
  }, {
    key: 'storeSubmittedUrls',

    // Private
    value: function storeSubmittedUrls() {
      localStorage[SUBMITTED_URLS_STORAGE_KEY] = JSON.stringify(this.data);
    }
  }, {
    key: 'loadSubmittedUrls',
    value: function loadSubmittedUrls() {
      if (localStorage[SUBMITTED_URLS_STORAGE_KEY] === undefined) {
        return {};
      } else {
        return JSON.parse(localStorage[SUBMITTED_URLS_STORAGE_KEY]);
      }
    }
  }, {
    key: 'getUrlVariations',
    value: function getUrlVariations(url) {
      var ur = new _UrlVariation2['default'](url.toLowerCase());
      var urlRepresentations = ur.getAllUrlRepresentations();

      if (!urlRepresentations || urlRepresentations.length === 0) {
        return null;
      }
      return urlRepresentations;
    }
  }]);

  return _class;
})();

exports['default'] = _default;
module.exports = exports['default'];