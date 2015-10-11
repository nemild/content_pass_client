// Server Constants
'use strict';

var BASE_SERVER_URL = 'https://content-pass.herokuapp.com/';
// const BASE_SERVER_URL = 'http://localhost:3000/'
var PAGE_VIEW_RELATIVE_URL = 'api/v1/page_views';
var LOGIN_RELATIVE_URL = 'api/v1/sessions';

// Hacker News Constants
var PROVIDER_NAME = 'Hacker News';
var PROVIDER_SLUG = 'hn_';
var PROVIDER_BASE_URL = 'https://news.ycombinator.com/';
var PROVIDER_PAGE_RELATIVE_URL = 'news?p=';
var MAX_NUM_PAGES = 5;
var REFRESH_INTERVAL_MINUTES = 10;

// Local Storage
var PAGES_RECORDED_TODAY = 'pages_recorded_today';
var PAGES_RECORDED_START_DAY = 'pages_recorded_start_day';
var WELCOME_SCREEN_SHOWN = 'welcome_screen_shown';

var HN_DICT_URLS_KEY = PROVIDER_SLUG + 'urls';
var HN_DICT_URLS_TEMP_KEY = PROVIDER_SLUG + 'newUrls';
var HN_LAST_UPDATED = PROVIDER_SLUG + 'last_updated';
var HN_INTERVAL_ID = PROVIDER_SLUG + 'interval_id';

// Icons
var PATH_FOR_POSTED_ICON = '../images/icon20.png';
var PATH_FOR_DEFAULT_ICON = '../images/icon20.png';

// Globals
var last_updated_id = null;

// Acceptable weights
var WEIGHTS = {
  '0X': 0,
  '1X': 1,
  '5X': 5
};
var DEFAULT_WEIGHT_KEY = '1X';

// Messages, these consts are defined in other files (for future reference, if changed)
var LOGIN_MESSAGE = 'LOGIN';
var PAGE_LOADED_MESSAGE = 'PAGE_LOADED';
var LOGOUT_MESSAGE = 'LOGOUT';

// ******* End Constants ********

// Get Top 150 URLs on HN every 10 minutes
function extractURLs(data, i) {
  var html = $.parseHTML(data);
  var urlArr = $('.athing .title a', $(html)).map(function () {
    var currUrl = this.href;

    if (currUrl && currUrl !== '') {
      if (currUrl.substring(0, 19) === 'chrome-extension://') {
        return null;
      }
      return currUrl.toLowerCase();
    }
    return null;
  }).toArray();

  var key = HN_DICT_URLS_TEMP_KEY;

  var existingUrlArr = undefined;
  if (i === 0) {
    // First time -- start from scratch
    existingUrlArr = [];
  } else {
    existingUrlArr = JSON.parse(localStorage[key]);
  }

  existingUrlArr = existingUrlArr.concat(urlArr);

  if (i + 1 === MAX_NUM_PAGES) {
    //  Last time -- overwrite
    key = HN_DICT_URLS_KEY;
    console.log('Done downloading HN');
    localStorage[HN_LAST_UPDATED] = Date();
  }

  localStorage[key] = JSON.stringify(existingUrlArr);

  // Empty temp key out
  if (key === HN_DICT_URLS_KEY) {
    localStorage[HN_DICT_URLS_TEMP_KEY] = '';
    delete localStorage[HN_DICT_URLS_TEMP_KEY];
  }
}

function downloadAllPages() {
  var i = 0;
  function downloadPage() {
    if (i < MAX_NUM_PAGES) {
      $.ajax({
        'type': 'GET',
        'url': PROVIDER_BASE_URL + PROVIDER_PAGE_RELATIVE_URL + (i + 1).toString(),
        'dataType': 'html'
      }).done(function (response) {
        extractURLs(response, i);
        i += 1;
        downloadPage();
      }).fail(function handleError(jqXHR, textStatus, errorThrown) {
        console.warn('Could not download HN');
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
      });
    }
  }
  downloadPage();
}

function startDownloadDaemon() {
  downloadAllPages();
  localStorage[HN_INTERVAL_ID] = setInterval(downloadAllPages, REFRESH_INTERVAL_MINUTES * 60000).toString();
}

function urlInTop(url) {
  if (!url || url === '') {
    return false;
  }

  var urlArr = getTopUrls();
  var ur = new UrlVariation(url.toLowerCase());
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

function getTopUrls() {
  return JSON.parse(localStorage[HN_DICT_URLS_KEY]);
}

// *********
// Post a Page view
function postPageview(url, multiplier, successCallback, failureCallback) {
  var userInitiated = arguments[4] === undefined ? false : arguments[4];

  var uuid = localStorage.id;

  if (!loggedIn()) {
    return false;
  }

  var data = JSON.stringify({
    'uuid': uuid,
    'url': url,
    'weight': multiplier,
    'user_initiated': userInitiated,
    'hours_elapsed_today': getHoursElapsedToday()
  });
  $.ajax({
    'url': BASE_SERVER_URL + PAGE_VIEW_RELATIVE_URL,
    'type': 'POST',
    'data': data,
    'contentType': 'application/json',
    'dataType': 'json'
  }).done(function (response, textStatus, xhr) {
    // Reset counter if the day change, probably should be done on interval not during post
    var currentDate = new Date().getDate();
    if (localStorage[PAGES_RECORDED_START_DAY] != currentDate) {
      localStorage[PAGES_RECORDED_START_DAY] = currentDate.toString();
      localStorage[PAGES_RECORDED_TODAY] = '0';
    }
    console.log(response);
    window.response = response;

    if (xhr.status === 201) {
      chrome.browserAction.setIcon({ path: PATH_FOR_POSTED_ICON });
      localStorage[PAGES_RECORDED_TODAY] = (parseInt(localStorage[PAGES_RECORDED_TODAY]) + 1).toString();
      setTimeout(setDefaultIcon, 1000);
      setCurrentPageCount();
    } else if (xhr.status === 200) {
      if (response['created_in_recent_hours']) {
        console.log('here1');
      }

      if (response && response['created_in_recent_hours']) {
        console.log(typeof response.created_in_recent_hours);
        console.log('here');
        localStorage[PAGES_RECORDED_TODAY] = (parseInt(localStorage[PAGES_RECORDED_TODAY]) - 1).toString();
      }
      chrome.browserAction.setBadgeText({ text: 'Sent' });
      setTimeout(setCurrentPageCount, 1500);
    }
    if (successCallback) {
      successCallback();
    }
  }).fail(function (jqXHR, textStatus, errorThrown) {
    console.warn('Could not post page view');

    if (failureCallback) {
      failureCallback();
    }
  });
}

function setDefaultIcon() {
  chrome.browserAction.setIcon({ path: PATH_FOR_DEFAULT_ICON });
}

function setCurrentPageCount() {
  chrome.browserAction.setBadgeText({ text: localStorage[PAGES_RECORDED_TODAY] });
}

function setWeight(url, multiplier, successCallback, failureCallback) {
  var userInitiated = arguments[4] === undefined ? false : arguments[4];

  var uuid = localStorage.id;
  if (!loggedIn()) {
    return false;
  }
  postPageview(url, multiplier, successCallback, failureCallback, userInitiated);
}

function loggedIn() {
  var uuid = localStorage.id;

  return uuid && uuid !== '';
}

function getHoursElapsedToday() {
  var d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

function login(email, password, callback) {
  var data = JSON.stringify({
    'email': email,
    'password': password,
    'view_count_in_last_hours': getHoursElapsedToday()
  });

  $.ajax({
    'url': BASE_SERVER_URL + LOGIN_RELATIVE_URL,
    'type': 'POST',
    'data': data,
    'contentType': 'application/json',
    'dataType': 'json'
  }).done(function (responseData) {
    localStorage[PAGES_RECORDED_TODAY] = responseData.num_urls_recorded_in_last_hours;
    localStorage[PAGES_RECORDED_START_DAY] = new Date().getDate().toString();
    setCurrentPageCount();
    callback(responseData.uuid);
  }).fail(function () {
    last_updated_id = null;
    callback('');
  });
}

chrome.runtime.onMessage.addListener(function router(request, sender, sendResponse) {
  switch (request.message) {
    case LOGIN_MESSAGE:
      login(request.email, request.password, function (uuid) {
        if (uuid && uuid !== '') {
          localStorage.id = uuid;
        }
        sendResponse({
          'id': uuid
        });
        if (localStorage.id) {
          startDownloadDaemon();
        }
      });
      return true;
      break;
    case LOGOUT_MESSAGE:
      localStorage.id = '';
      delete localStorage.id;
      if (localStorage[HN_INTERVAL_ID]) {
        clearInterval(parseInt(localStorage[HN_INTERVAL_ID]));
        localStorage[HN_INTERVAL_ID] = '';
        delete localStorage[HN_INTERVAL_ID];
      }
      localStorage[PAGES_RECORDED_TODAY] = '';
      delete localStorage[PAGES_RECORDED_TODAY];
      chrome.browserAction.setBadgeText({ text: '' });

      sendResponse({ 'hello': 'world' });
      break;
    case PAGE_LOADED_MESSAGE:
      var url = sender.tab.url;
      console.log(url);
      if (urlInTop(url)) {
        setWeight(url, WEIGHTS[DEFAULT_WEIGHT_KEY], function (response) {
          sendResponse({ 'success': 'true' });
        }, function (response) {
          sendResponse({ 'success': 'false' });
        });
        // console.log('Page in top');
      } else {}
      break;
    default:
      if (WEIGHTS.hasOwnProperty(request.message)) {
        var _url = request.url;
        setWeight(_url, WEIGHTS[request.message], function (response) {
          sendResponse({ 'success': 'true' });
        }, function (response) {
          sendResponse({ 'success': 'false' });
        }, true);
        return true;
      } else {
        console.warn('Bad weight');
      }
      break;

  }
});

// Ignored
// console.log('Page not in top');