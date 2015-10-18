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

	// import UrlVariation from './UrlVariation';
	'use strict';

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	var _ProviderStore = __webpack_require__(1);

	var _ProviderStore2 = _interopRequireDefault(_ProviderStore);

	var _TopUrlStore = __webpack_require__(2);

	var _TopUrlStore2 = _interopRequireDefault(_TopUrlStore);

	var _SubmittedUrlStore = __webpack_require__(5);

	var _SubmittedUrlStore2 = _interopRequireDefault(_SubmittedUrlStore);

	// Server Constants
	var BASE_SERVER_URL = 'https://content-pass.herokuapp.com/';
	// const BASE_SERVER_URL = 'http://localhost:3000/'
	var PAGE_VIEW_RELATIVE_URL = 'api/v1/page_views';
	var LOGIN_RELATIVE_URL = 'api/v1/sessions';

	// General refresh
	var REFRESH_INTERVAL_MINUTES = 20;
	var REFRESH_RESTART_SCALE = 6; // amount to scale REFRESH_INTERVAL_MINUTES to determine if the HN scraping job should be restarted

	// Local Storage
	var PAGES_RECORDED_TODAY = 'pages_recorded_today';
	var PAGES_RECORDED_START_DAY = 'pages_recorded_start_day';
	var ENABLE_TRACKING = 'enable_tracking';
	var LAST_EXPIRED_SUBMITTED_URL_STORE = 'last_expired_submitted_url_store';
	var DOWNLOAD_DAEMON_INTERVAL_ID = 'interval_id';

	// Icons
	var PATH_FOR_POSTED_ICON = '../images/icon20.png';
	var PATH_FOR_DEFAULT_ICON = '../images/icon20.png';

	var MINS_BETWEEN_SUBMITTED_EXPIRATION_CALLS = 60 * 12;
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
	var ADD_PROVIDER_MESSAGE = 'ADD_PROVIDER';
	var REMOVE_PROVIDER_MESSAGE = 'REMOVE_PROVIDER';
	// ******* End Constants ********

	function loggedIn() {
	  var uuid = localStorage.id;
	  return uuid;
	}

	function getHoursElapsedToday() {
	  var d = new Date();
	  return d.getHours() + d.getMinutes() / 60;
	}

	function downloadAllPages() {
	  var ps = new _ProviderStore2['default']();
	  ps.updateAllTopUrlsForProviders();
	}

	function setDefaultIcon() {
	  chrome.browserAction.setIcon({ 'path': PATH_FOR_DEFAULT_ICON });
	}

	function setCurrentPageCount() {
	  chrome.browserAction.setBadgeText({ 'text': localStorage[PAGES_RECORDED_TODAY] });
	}

	function initFirstLoginDefaults() {
	  if (localStorage[ENABLE_TRACKING] === undefined) {
	    localStorage[ENABLE_TRACKING] = 'true';
	  }
	}

	function startDownloadDaemonJob() {
	  localStorage[DOWNLOAD_DAEMON_INTERVAL_ID] = setInterval(downloadAllPages, REFRESH_INTERVAL_MINUTES * 60000).toString();
	  downloadAllPages();
	}

	function clearDownloadDaemonJob() {
	  if (localStorage[DOWNLOAD_DAEMON_INTERVAL_ID]) {
	    clearInterval(parseInt(localStorage[DOWNLOAD_DAEMON_INTERVAL_ID], 10));
	    delete localStorage[DOWNLOAD_DAEMON_INTERVAL_ID];
	  }
	}

	// Convenience helper provided as setInterval sometimes stops firing
	// In theory, we shouldn't need this
	function resetDownloadDaemonJob() {
	  clearDownloadDaemonJob();
	  startDownloadDaemonJob();
	}

	function checkAttemptRestart() {
	  var provider = new _ProviderStore2['default']();
	  var lastUpdate = provider.getLastUpdate(_ProviderStore.HN_PROVIDER_SLUG);
	  if (localStorage[ENABLE_TRACKING] === 'true' && lastUpdate) {
	    var previousDate = Date.parse(lastUpdate);
	    var elapsedSecondsSinceLastUpdate = (new Date() - previousDate) / 1000;

	    if (elapsedSecondsSinceLastUpdate > REFRESH_INTERVAL_MINUTES * 60 * REFRESH_RESTART_SCALE) {
	      console.info('Restarting Download Daemon');
	      resetDownloadDaemonJob();
	    }
	  }
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
	  }).done(function pageviewPostSuccessCallback(response, textStatus, xhr) {
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
	      setAndExpireUrlStore(url, multiplier);
	    } else if (xhr.status === 200) {
	      if (response && response.created_in_recent_hours) {
	        localStorage[PAGES_RECORDED_TODAY] = (parseInt(localStorage[PAGES_RECORDED_TODAY], 10) - 1).toString();
	      }
	      chrome.browserAction.setBadgeText({ 'text': 'Sent' });
	      setTimeout(setCurrentPageCount, 1500);
	      setAndExpireUrlStore(url, multiplier);
	    }

	    if (successCallback) {
	      successCallback();
	    }
	  }).fail(function pageviewPostFailureCallback(jqXHR, textStatus, errorThrown) {
	    console.warn('Could not post page view');

	    if (failureCallback) {
	      setAndExpireUrlStore(null, null);
	      failureCallback();
	    }
	  });
	}

	function setAndExpireUrlStore(url, weight) {
	  var sus = null;
	  if (url && (weight || weight === 0)) {
	    sus = new _SubmittedUrlStore2['default']();
	    sus.setSubmittedUrl(url, weight);
	  }

	  if (!localStorage[LAST_EXPIRED_SUBMITTED_URL_STORE] || new Date(localStorage[LAST_EXPIRED_SUBMITTED_URL_STORE]) + MINS_BETWEEN_SUBMITTED_EXPIRATION_CALLS * 60 * 1000 < new Date()) {
	    if (!sus) {
	      sus = new _SubmittedUrlStore2['default']();
	    }
	    sus.expireSubmittedUrls();
	    localStorage[LAST_EXPIRED_SUBMITTED_URL_STORE] = new Date();
	  }
	}

	function setWeight(url, multiplier, successCallback, failureCallback) {
	  var userInitiated = arguments[4] === undefined ? false : arguments[4];

	  if (!loggedIn()) {
	    return false;
	  }
	  postPageview(url, multiplier, successCallback, failureCallback, userInitiated);
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
	  }).done(function loginSuccessCallback(responseData) {
	    localStorage[PAGES_RECORDED_TODAY] = responseData.num_urls_recorded_in_last_hours;
	    localStorage[PAGES_RECORDED_START_DAY] = new Date().getDate().toString();
	    setCurrentPageCount();

	    // Configure the first time
	    initFirstLoginDefaults();

	    callback(responseData.uuid);
	  }).fail(function loginFailureCallback() {
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
	    case ADD_PROVIDER_MESSAGE:
	      new _ProviderStore2['default']().addProvider(request.provider_slug);
	      break;
	    case REMOVE_PROVIDER_MESSAGE:
	      new _ProviderStore2['default']().removeProvider(request.provider_slug);
	      break;
	    case LOGIN_MESSAGE:
	      login(request.email, request.password, function loginCallback(uuid) {
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
	      var topUrls = new _TopUrlStore2['default']();
	      if (localStorage[ENABLE_TRACKING] !== 'false' && topUrls.urlInTop(url)) {
	        setWeight(url, WEIGHTS[DEFAULT_WEIGHT_KEY], function pageLoadedSuccessCallback(response) {
	          sendResponse({ 'success': 'true' });
	        }, function pageLoadedFailureCallback(response) {
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
	        setWeight(_url, WEIGHTS[request.message], function pageLoadedSuccessCallback(response) {
	          sendResponse({ 'success': 'true' });
	        }, function pageLoadedFailureCallback(response) {
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
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var _TopUrlStore = __webpack_require__(2);

	var _TopUrlStore2 = _interopRequireDefault(_TopUrlStore);

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

	      var o = {};
	      o[provider] = '';
	      this.updateAllTopUrlsForProviders(o);
	    }
	  }, {
	    key: 'updateAllTopUrlsForProviders',

	    // Run all updates
	    value: function updateAllTopUrlsForProviders() {
	      var providerListInit = arguments[0] === undefined ? null : arguments[0];

	      var providerList = providerListInit;
	      if (!providerList) {
	        this.instantiateProvidersList();
	        providerList = this.providersList;
	      }
	      var t = new _TopUrlStore2['default']();

	      for (var providerName in providerList) {
	        if (providerList.hasOwnProperty(providerName)) {
	          if (providerName.startsWith(HN_PROVIDER_SLUG)) {
	            t.populateHNUrlStoreFromServer();
	          } else if (providerName.startsWith(REDDIT_PROVIDER_SLUG_PREFIX)) {
	            var l = providerName.length;
	            var subreddit = providerName.substr(l - (l - REDDIT_PROVIDER_SLUG_PREFIX.length));
	            t.populateSubredditUrlStoreFromServer(subreddit);
	          }
	        }
	      }
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

	      new _TopUrlStore2['default']().removeProviderFromTopUrls(provider);
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

	      return this.providersList;
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

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var _UrlVariation = __webpack_require__(3);

	var _UrlVariation2 = _interopRequireDefault(_UrlVariation);

	var _ProviderStore = __webpack_require__(1);

	var _ProviderStore2 = _interopRequireDefault(_ProviderStore);

	var _Downloader = __webpack_require__(4);

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
	module.exports = exports['default'];

/***/ },
/* 3 */
/***/ function(module, exports) {

	// parseUri 1.2.2
	// (c) Steven Levithan <stevenlevithan.com>
	// MIT License
	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	function parseUri(str) {
	  var o = parseUri.options;
	  var m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str);
	  var uri = {};
	  var i = 14;

	  while (i--) uri[o.key[i]] = m[i] || '';

	  uri[o.q.name] = {};
	  uri[o.key[12]].replace(o.q.parser, function doUriReplace($0, $1, $2) {
	    if ($1) uri[o.q.name][$1] = $2;
	  });

	  return uri;
	}

	parseUri.options = {
	  'strictMode': false,
	  'key': ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
	  'q': {
	    'name': 'queryKey',
	    'parser': /(?:^|&)([^&=]*)=?([^&]*)/g
	  },
	  'parser': {
	    'strict': /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
	    'loose': /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	  }
	};

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
	      // let p = this.parsedUrl;

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
	  }], [{
	    key: 'stripUrl',

	    // Strip means remove query parameters and anchor from the URL
	    value: function stripUrl(url) {
	      return url.split(/[?#]/)[0];
	    }
	  }]);

	  return _class;
	})();

	exports['default'] = _default;
	module.exports = exports['default'];

/***/ },
/* 4 */
/***/ function(module, exports) {

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

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var _UrlVariation = __webpack_require__(3);

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
	        // console.log('SubmittedUrls: Updating old entry ' + urlKey);
	      } else {
	        newDate = new Date();
	        urlKey = lookupUrl;
	        // console.log('SubmittedUrls: Storing new entry ' + urlKey);
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

	      for (var keyName in this.data) {
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

/***/ }
/******/ ]);