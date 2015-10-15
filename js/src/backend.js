/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _UrlVariation = __webpack_require__(1);

	var _UrlVariation2 = _interopRequireDefault(_UrlVariation);

	// Server Constants
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
	var REFRESH_RESTART_SCALE = 6; // amount to scale REFRESH_INTERVAL_MINUTES to determine if the HN scraping job should be restarted

	// Local Storage
	var PAGES_RECORDED_TODAY = 'pages_recorded_today';
	var PAGES_RECORDED_START_DAY = 'pages_recorded_start_day';
	var ENABLE_TRACKING = 'enable_tracking';

	var HN_DICT_URLS_KEY = PROVIDER_SLUG + 'urls';
	var HN_DICT_URLS_TEMP_KEY = PROVIDER_SLUG + 'newUrls';
	var HN_LAST_UPDATED = PROVIDER_SLUG + 'last_updated';
	var HN_INTERVAL_ID = PROVIDER_SLUG + 'interval_id';

	// Icons
	var PATH_FOR_POSTED_ICON = '../images/icon20.png';
	var PATH_FOR_DEFAULT_ICON = '../images/icon20.png';

	// Globals
	// let last_updated_id = null;

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
	var TOGGLE_ENABLED_MESSAGE = 'TOGGLE_ENABLED';

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
	        // console.log(jqXHR);
	        // console.log(textStatus);
	        // console.log(errorThrown);
	      });
	    }
	  }
	  downloadPage();
	}

	function startDownloadDaemonJob() {
	  localStorage[HN_INTERVAL_ID] = setInterval(downloadAllPages, REFRESH_INTERVAL_MINUTES * 60000).toString();
	  downloadAllPages();
	}

	function clearDownloadDaemonJob() {
	  if (localStorage[HN_INTERVAL_ID] || localStorage[HN_INTERVAL_ID] === '0') {
	    clearInterval(parseInt(localStorage[HN_INTERVAL_ID], 10));
	    delete localStorage[HN_INTERVAL_ID];
	  }
	}

	// Convenience helper provided as setInterval sometimes stops firing
	// In theory, we shouldn't need this
	function resetDownloadDaemonJob() {
	  clearDownloadDaemonJob();
	  startDownloadDaemonJob();
	}

	function checkAttemptRestart() {
	  if (localStorage[HN_LAST_UPDATED] && localStorage[ENABLE_TRACKING] === 'true') {
	    var previousDate = Date.parse(localStorage[HN_LAST_UPDATED]);
	    var elapsedSecondsSinceLastUpdate = (new Date() - previousDate) / 1000;

	    if (elapsedSecondsSinceLastUpdate > REFRESH_INTERVAL_MINUTES * 60 * REFRESH_RESTART_SCALE) {
	      console.info('Restarting Download Daemon');
	      resetDownloadDaemonJob();
	    }
	  }
	}

	function urlInTop(url) {
	  if (!url || url === '') {
	    return false;
	  }

	  var urlArr = getTopUrls();
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
	    if (parseInt(localStorage[PAGES_RECORDED_START_DAY], 10) !== currentDate) {
	      localStorage[PAGES_RECORDED_START_DAY] = currentDate.toString();
	      localStorage[PAGES_RECORDED_TODAY] = '0';
	    }

	    if (xhr.status === 201) {
	      chrome.browserAction.setIcon({ 'path': PATH_FOR_POSTED_ICON });
	      localStorage[PAGES_RECORDED_TODAY] = (parseInt(localStorage[PAGES_RECORDED_TODAY], 10) + 1).toString();
	      setTimeout(setDefaultIcon, 1000);
	      setCurrentPageCount();
	    } else if (xhr.status === 200) {
	      if (response && response.created_in_recent_hours) {
	        localStorage[PAGES_RECORDED_TODAY] = (parseInt(localStorage[PAGES_RECORDED_TODAY], 10) - 1).toString();
	      }
	      chrome.browserAction.setBadgeText({ 'text': 'Sent' });
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
	  chrome.browserAction.setIcon({ 'path': PATH_FOR_DEFAULT_ICON });
	}

	function setCurrentPageCount() {
	  chrome.browserAction.setBadgeText({ 'text': localStorage[PAGES_RECORDED_TODAY] });
	}

	function setWeight(url, multiplier, successCallback, failureCallback) {
	  var userInitiated = arguments[4] === undefined ? false : arguments[4];

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
	    // Configure the first time
	    if (localStorage[ENABLE_TRACKING] === undefined) {
	      localStorage[ENABLE_TRACKING] = 'true';
	    }
	    callback(responseData.uuid);
	  }).fail(function () {
	    // last_updated_id = null;
	    callback('');
	  });
	}

	function toggleTracking() {
	  if (localStorage[ENABLE_TRACKING] === 'false') {
	    localStorage[ENABLE_TRACKING] = 'true';
	    startDownloadDaemonJob();
	    return true;
	  } else if (localStorage[ENABLE_TRACKING] === 'true') {
	    clearDownloadDaemonJob();
	    localStorage[ENABLE_TRACKING] = 'false';
	    return false;
	  }
	  return '';
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
	          startDownloadDaemonJob();
	        }
	      });
	      return true;
	    case LOGOUT_MESSAGE:
	      delete localStorage.id;
	      clearDownloadDaemonJob();
	      delete localStorage[PAGES_RECORDED_TODAY];
	      chrome.browserAction.setBadgeText({ 'text': '' });

	      sendResponse({ 'hello': 'world' });
	      break;
	    case PAGE_LOADED_MESSAGE:
	      var url = sender.tab.url;
	      console.log(url);
	      checkAttemptRestart();
	      if (localStorage[ENABLE_TRACKING] !== 'false' && urlInTop(url)) {
	        setWeight(url, WEIGHTS[DEFAULT_WEIGHT_KEY], function (response) {
	          sendResponse({ 'success': 'true' });
	        }, function (response) {
	          sendResponse({ 'success': 'false' });
	        });
	        console.log('Sent to server');
	      } else {
	        // Ignored
	        console.log('Not sent');
	      }
	      break;
	    case TOGGLE_ENABLED_MESSAGE:
	      sendResponse({ 'tracking_on': toggleTracking() });
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

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var _default = (function () {
	  var _class = function _default(url) {
	    _classCallCheck(this, _class);

	    if (url) {
	      this.url = url.toLowerCase();
	      this.parsedUrl = null;
	      if (this.url) {
	        this.parsedUrl = parseUri(this.url);
	      }
	    }
	  };

	  _createClass(_class, [{
	    key: 'getAllUrlRepresentations',

	    // Public
	    value: function getAllUrlRepresentations() {
	      var p = this.parsedUrl;

	      if (!this.url || this.url === '' || !this.parsedUrl) {
	        return null;
	      }

	      var urlRepresentations = [this.url];
	      var altProtocolUrl = this.alternateProtocolUrl(this.url);
	      if (altProtocolUrl) {
	        urlRepresentations.push(altProtocolUrl);
	      }

	      var withoutQuery = this.withoutQueryParameters();
	      if (withoutQuery) {
	        urlRepresentations = urlRepresentations.concat(withoutQuery);
	      }

	      return urlRepresentations;
	    }
	  }, {
	    key: 'withoutQueryParameters',

	    // Private
	    value: function withoutQueryParameters() {
	      var p = this.parsedUrl;
	      var results = [];

	      if (p.query) {
	        var withoutQueryParams = undefined;
	        withoutQueryParams = p.protocol + '://' + p.host;
	        if (p.port) {
	          withoutQueryParams += ':' + p.port;
	        }
	        withoutQueryParams += p.path;
	        if (p.anchor) {
	          withoutQueryParams += '#' + p.anchor;
	        }
	        results.push(withoutQueryParams); // without query parameters

	        var altProtocolUrl = this.alternateProtocolUrl(withoutQueryParams);
	        if (altProtocolUrl) {
	          results.push(altProtocolUrl);
	        }

	        return results;
	      }

	      return null;
	    }
	  }, {
	    key: 'alternateProtocolUrl',

	    // Add HTTP representation for HTTPS, and vice versa
	    value: function alternateProtocolUrl(url) {
	      var p = parseUri(url);

	      if (!p) {
	        return null;
	      }

	      if (p.protocol === 'https') {
	        return url.replace('https', 'http');
	      } else if (p.protocol === 'http') {
	        return url.replace('http', 'https');
	      }
	      return null;
	    }
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

	parseUri.options = {
	  strictMode: false,
	  key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
	  q: {
	    name: 'queryKey',
	    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	  },
	  parser: {
	    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
	    loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	  }
	};
	module.exports = exports['default'];

/***/ }
/******/ ]);