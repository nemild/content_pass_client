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

	var _ProviderStore = __webpack_require__(1);

	var _ProviderStore2 = _interopRequireDefault(_ProviderStore);

	var dropDown = undefined;
	var loginForm = undefined;
	var providerSection = undefined;

	var LOGIN_MESSAGE = 'LOGIN';
	var LOGOUT_MESSAGE = 'LOGOUT';
	var TOGGLE_ENABLED_MESSAGE = 'TOGGLE_ENABLED';
	var ADD_PROVIDER_MESSAGE = 'ADD_PROVIDER';
	var REMOVE_PROVIDER_MESSAGE = 'REMOVE_PROVIDER';

	// Chrome Extension variables
	var bgPage = undefined;
	var runtime = undefined;

	function cleanDate(date) {
	  bgPage.console.log(date);
	  // bgPage.console.log('here');
	  if (date) {
	    var _cleanDate = new Date(date);
	    return _cleanDate.toLocaleDateString() + ' ' + _cleanDate.toLocaleTimeString();
	  }

	  return '';
	}

	function configureLoggedInState() {
	  loginForm.style.display = 'none';
	  dropDown.style.display = 'initial';
	  // if (localStorage.hn_last_updated && localStorage.hn_last_updated !== '') {
	  //   $('#last_updated_data').text(
	  //   cleanDate(localStorage.hn_last_updated)
	  //   );
	  //   $('#last_updated_frame').show();
	  // }
	  $('#logout').show();
	  $('#logged_in_frame').show();
	  $('#updated_indicator_frame').show();
	  $('footer.links').show();

	  $('#logged_in_frame #show-providers').on('click', function () {
	    configureListProvidersPage();
	  });
	}

	function configureLoggedOutState() {
	  dropDown.style.display = 'none';
	  loginForm.style.display = 'initial';
	  $('#logout').hide();
	  $('#last_updated_frame').hide();
	  $('#logged_in_frame').hide();
	  $('#updated_indicator_frame').hide();
	}

	function configureListProvidersPage() {
	  providerSection.style.display = 'initial';

	  dropDown.style.display = 'none';
	  loginForm.style.display = 'none';
	  $('#logout').hide();
	  $('#last_updated_frame').hide();
	  $('#logged_in_frame').hide();
	  $('#updated_indicator_frame').hide();
	  $('#provider-section #provider-edit-done').on('click', function () {
	    providerSection.style.display = 'none';
	    configureLoggedInState();
	    $('#provider-section .a-provider').remove();
	  });

	  $('footer.links').hide();

	  // Populate current table
	  var p = new _ProviderStore2['default']().getCurrentProviders();
	  for (var providerName in p) {
	    if (p.hasOwnProperty(providerName)) {
	      $('.provider-table').append('<tr class=\'' + providerName + ' a-provider\'><td>' + providerName + '</td><td class=\'provider-last-update-date\'>' + cleanDate(p[providerName]) + '</td><td><div class=\'remove\' data-slug=\'' + providerName + '\'>Remove</div></td></tr>');
	    }
	  }

	  $('#provider-section .remove').on('click', function (e) {
	    // bgPage.console.log('Remove slug' + $(this).parents('tr'));
	    runtime.sendMessage({
	      'message': REMOVE_PROVIDER_MESSAGE,
	      'provider_slug': $(this).data('slug')
	    }, function (response) {});
	    $(this).parents('tr').fadeOut(500, function () {
	      $(this).remove();
	    });
	  });
	}

	function determineCurrentTabHistory() {
	  chrome.tabs.getCurrent(function (tab) {
	    console.log(tab.url);
	  });
	}

	function toggleTracking() {
	  runtime.sendMessage({
	    'message': TOGGLE_ENABLED_MESSAGE
	  }, function handleToggleTracking(response) {
	    setTrackingIndicator(response.tracking_on);
	  });
	}

	function setTrackingIndicator(set_on) {
	  var $auto_tracking = $('#auto_tracking');
	  if (set_on === true || set_on === undefined) {
	    $auto_tracking.html('Tracking<br />On');
	    $auto_tracking.removeClass('btn-danger').addClass('btn-success');
	  } else if (set_on === false) {
	    $auto_tracking.html('Tracking<br />Off');
	    $auto_tracking.addClass('btn-danger').removeClass('btn-success');
	  }
	}

	function login(e) {
	  e.preventDefault();

	  var email = loginForm.usermail.value;
	  var password = loginForm.password.value;

	  $('#login_loading').fadeIn(200);
	  runtime.sendMessage({
	    'message': LOGIN_MESSAGE,
	    'email': email,
	    'password': password
	  }, function handleLoginRequest(response) {
	    $('#login_loading').fadeOut(200);
	    if (response.id) {
	      configureLoggedInState();
	      if (localStorage.tutorialShown === undefined) {
	        $('#tutorial-frame').fadeIn();
	      }
	    } else {
	      var errorFlash = $('#login-flash');
	      errorFlash.text('Sorry, your username or password was invalid').fadeIn();
	    }
	  });
	}

	function hideUpdatedIndicator() {
	  $('#updated_indicator').fadeOut(500);
	}

	function hideUpdatedIndicatorError() {
	  $('#updated_indicator_error').fadeOut(500);
	}

	document.addEventListener('DOMContentLoaded', function loadPage() {
	  bgPage = chrome.extension.getBackgroundPage();
	  runtime = chrome.runtime;

	  dropDown = document.getElementById('multiplier_selector');
	  loginForm = document.forms.login;
	  providerSection = document.getElementById('provider-section');

	  loginForm.addEventListener('submit', login);

	  if (localStorage.id) {
	    configureLoggedInState();
	  } else {
	    configureLoggedOutState();
	  }

	  $('#provider-section .add').on('click', function (e) {
	    e.preventDefault();
	    $('#provider-section input[type="text"]').val('');
	    runtime.sendMessage({
	      'message': ADD_PROVIDER_MESSAGE,
	      'provider_slug': $('#provider-section input[type="text"]').val()
	    }, function (response) {
	      configureListProvidersPage();
	    });
	  });

	  $('#logout').on('click', function logout(e) {
	    e.preventDefault();

	    runtime.sendMessage({
	      'message': LOGOUT_MESSAGE
	    }, function handleLogoutRequest(response) {
	      configureLoggedOutState();
	    });
	  });

	  $('#auto_tracking').on('click', function (e) {
	    toggleTracking();
	  });

	  $('.tutorial-next-button').on('click', function () {
	    var next = $(this).data('next-target');
	    var current = $(this).data('current-target');

	    $('#' + current).fadeOut();
	    if (next !== '') {
	      $('#' + next).fadeIn();
	    } else {
	      $('#tutorial-frame').fadeOut();
	      localStorage.tutorialShown = 'true';
	    }
	  });

	  var et = localStorage.enable_tracking;
	  setTrackingIndicator(et === 'true' || et === undefined ? true : false);

	  $('.content-pass-single-action').click(function singleAction() {
	    var _this = this;

	    if (!$(this).hasClass('selected')) {
	      (function () {
	        $('.content-pass-single-action').removeClass('selected');
	        $(_this).addClass('selected');

	        // Add setting code here
	        var multiplier = $(_this).text();

	        $('#loggedin_loading').fadeIn(200);
	        // Grab URL
	        chrome.tabs.query({
	          'active': true,
	          'currentWindow': true
	        }, function sendMultiplierMessage(tabs) {
	          chrome.runtime.sendMessage({
	            'message': multiplier,
	            'url': tabs[0].url
	          }, function callback(response) {
	            $('#loggedin_loading').fadeOut(200);
	            if (response.success === 'true') {
	              $('#updated_indicator').text('Set to ' + multiplier.toString()).fadeIn(200);
	              setTimeout(hideUpdatedIndicator, 1000);
	            } else if (response.success === 'false') {
	              $('#updated_indicator_error').text('Could not set to ' + multiplier.toString()).fadeIn(200);
	              setTimeout(hideUpdatedIndicatorError, 1000);
	            }
	          });
	        });
	      })();
	    }
	  });
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
	      var providerList = arguments[0] === undefined ? null : arguments[0];

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

/***/ },
/* 3 */
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
	var HN_MAX_NUM_PAGES = 5;

	var HN_PROVIDER_SLUG = 'hackernews';
	var HN_DICT_URLS_KEY = HN_PROVIDER_SLUG + '_' + 'urls';
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
	      var urlArr = $('.athing .title a', $(html)).map(function () {
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
	          }).done(function (response) {
	            that.extractHNUrls(response, i, successCallback);
	            i += 1;
	            downloadPage();
	          }).fail(function handleError(jqXHR, textStatus, errorThrown) {
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
	      }).done(function (data, textStatus, xhr) {
	        if (xhr.status === 200 && data && data.data && data.data.children) {
	          console.info('Done downloading subreddit: ' + subreddit);
	          successCallback(that.parseUrlsFromSubredditData(data.data.children, subreddit));
	        } else {
	          console.warn('Reddit: No data or bad data received for subreddit: ' + subreddit);
	          failureCallback();
	        }
	      }).fail(function (jqXHR, textStatus, errorThrown) {
	        console.warn('Could not load subreddit: ' + subreddit);
	        failureCallback();
	      });
	    }
	  }, {
	    key: 'parseUrlsFromSubredditData',
	    value: function parseUrlsFromSubredditData(data, subreddit) {
	      return data.map(function (o) {
	        return o.data.url;
	      });
	    }
	  }]);

	  return _class;
	})();

	exports['default'] = _default;
	module.exports = exports['default'];

/***/ }
/******/ ]);