// Hacker News Constants
const HN_PROVIDER_BASE_URL = 'https://news.ycombinator.com/';
const HN_PROVIDER_PAGE_RELATIVE_URL = 'news?p=';
const HN_MAX_NUM_PAGES = 4;

const HN_PROVIDER_SLUG = 'hackernews';
const HN_DICT_URLS_TEMP_KEY = HN_PROVIDER_SLUG + '_' + 'newUrls';

// Reddit
const REDDIT_PROVIDER_BASE_URL = 'https://www.reddit.com/r/';
const REDDIT_PROVIDER_RELATIVE_URL = '/hot.json?&show=all&limit=';
const REDDIT_NUM_POSTS = 100; // Max is a 100, larger requires pagination

export default class {
  constructor() {
  }

  // Hacker News
  // Get Top 150 URLs on HN every 10 minutes
  extractHNUrls(data, i, successCallback) {
    const html = $.parseHTML(data);
    let urlArr = $('.athing .title a', $(html)).map(function findHNUrl() {
      const currUrl = this.href;

      if (currUrl) {
        if (currUrl.substring(0, 19) === 'chrome-extension://') {return null;}
        return currUrl.toLowerCase();
      }
      return null;
    }).toArray();

    let existingUrlArr = [];
    if (i !== 0) {
      existingUrlArr = JSON.parse(localStorage[HN_DICT_URLS_TEMP_KEY]);
    }
    existingUrlArr = existingUrlArr.concat(urlArr);

    if (i + 1 === HN_MAX_NUM_PAGES) { //  Last time -- overwrite
      console.info('Done downloading HN');
      delete localStorage[HN_DICT_URLS_TEMP_KEY];

      successCallback(existingUrlArr);
    } else {
      localStorage[HN_DICT_URLS_TEMP_KEY] = JSON.stringify(existingUrlArr);
    }
  }

  downloadTopHN(successCallback, failureCallback) {
    let i = 0;
    let that = this;
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

  // Reddit
  downloadSubredditTop(subreddit, successCallback, failureCallback) {
    let that = this;
    $.ajax({
      'type': 'GET',
      'url': REDDIT_PROVIDER_BASE_URL + subreddit + REDDIT_PROVIDER_RELATIVE_URL + REDDIT_NUM_POSTS.toString(),
      'dataType': 'json',
      'contentType': 'application/json',
      'data': ''
    }).done(function downloadSubredditSuccess(data, textStatus, xhr) {
      if ( xhr.status === 200 && data && data.data && data.data.children) {
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

  parseUrlsFromSubredditData(data) {
    return data.map(function getRedditPostUrl(o) {
      return o.data.url;
    });
  }
}

