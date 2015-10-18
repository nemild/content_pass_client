// Hacker News Constants
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var HN_PROVIDER_BASE_URL = 'https://news.ycombinator.com/';
var HN_PROVIDER_PAGE_RELATIVE_URL = 'news?p=';
var HN_MAX_NUM_PAGES = 4;

var HN_PROVIDER_SLUG = 'hackernews';
var HN_DICT_URLS_TEMP_KEY = HN_PROVIDER_SLUG + '_' + 'newUrls';

// Reddit
var REDDIT_PROVIDER_BASE_URL = 'https://www.reddit.com/r/';
var REDDIT_PROVIDER_RELATIVE_URL = '/hot.json?&show=all&limit=';
var REDDIT_NUM_POSTS = 100; // Max is a 100, larger requires pagination

var _default = (function () {
  var _class = function _default() {
    _classCallCheck(this, _class);
  };

  _createClass(_class, [{
    key: 'extractHNUrls',

    // Hacker News
    // Get Top 150 URLs on HN every 10 minutes
    value: function extractHNUrls(data, i, successCallback) {
      var html = $.parseHTML(data);
      var urlArr = $('.athing .title a', $(html)).map(function findHNUrl() {
        var currUrl = this.href;

        if (currUrl) {
          if (currUrl.substring(0, 19) === 'chrome-extension://') {
            return null;
          }
          return currUrl.toLowerCase();
        }
        return null;
      }).toArray();

      var existingUrlArr = [];
      if (i !== 0) {
        existingUrlArr = JSON.parse(localStorage[HN_DICT_URLS_TEMP_KEY]);
      }
      existingUrlArr = existingUrlArr.concat(urlArr);

      if (i + 1 === HN_MAX_NUM_PAGES) {
        //  Last time -- overwrite
        console.info('Done downloading HN');
        delete localStorage[HN_DICT_URLS_TEMP_KEY];

        successCallback(existingUrlArr);
      } else {
        localStorage[HN_DICT_URLS_TEMP_KEY] = JSON.stringify(existingUrlArr);
      }
    }
  }, {
    key: 'downloadTopHN',
    value: function downloadTopHN(successCallback, failureCallback) {
      var i = 0;
      var that = this;
      function downloadPage() {
        if (i < HN_MAX_NUM_PAGES) {
          $.ajax({
            'type': 'GET',
            'url': HN_PROVIDER_BASE_URL + HN_PROVIDER_PAGE_RELATIVE_URL + (i + 1).toString(),
            'dataType': 'html'
          }).done(function downloadHnPageSuccess(response) {
            that.extractHNUrls(response, i, successCallback);
            i += 1;
            downloadPage();
          }).fail(function downloadHnPageError(jqXHR, textStatus, errorThrown) {
            console.warn('Could not download HN');
            failureCallback();
            // console.log(jqXHR);
            // console.log(textStatus);
            // console.log(errorThrown);
          });
        }
      }
      downloadPage();
    }
  }, {
    key: 'downloadSubredditTop',

    // Reddit
    value: function downloadSubredditTop(subreddit, successCallback, failureCallback) {
      var that = this;
      $.ajax({
        'type': 'GET',
        'url': REDDIT_PROVIDER_BASE_URL + subreddit + REDDIT_PROVIDER_RELATIVE_URL + REDDIT_NUM_POSTS.toString(),
        'dataType': 'json',
        'contentType': 'application/json',
        'data': ''
      }).done(function downloadSubredditSuccess(data, textStatus, xhr) {
        if (xhr.status === 200 && data && data.data && data.data.children) {
          console.info('Done downloading subreddit: ' + subreddit);
          successCallback(that.parseUrlsFromSubredditData(data.data.children));
        } else {
          console.warn('Reddit: No data or bad data received for subreddit: ' + subreddit);
          failureCallback();
        }
      }).fail(function downloadSubredditFailure(jqXHR, textStatus, errorThrown) {
        console.warn('Could not load subreddit: ' + subreddit);
        failureCallback();
      });
    }
  }, {
    key: 'parseUrlsFromSubredditData',
    value: function parseUrlsFromSubredditData(data) {
      return data.map(function getRedditPostUrl(o) {
        return o.data.url;
      });
    }
  }]);

  return _class;
})();

exports['default'] = _default;
module.exports = exports['default'];