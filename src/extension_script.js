import UrlVariation from './UrlVariation';
import ProviderStore, {HN_PROVIDER_SLUG} from './ProviderStore';
import TopUrlStore from './TopUrlStore';

// Server Constants
const BASE_SERVER_URL = 'https://content-pass.herokuapp.com/';
// const BASE_SERVER_URL = 'http://localhost:3000/'
const PAGE_VIEW_RELATIVE_URL = 'api/v1/page_views';
const LOGIN_RELATIVE_URL = 'api/v1/sessions';

// General refresh
const REFRESH_INTERVAL_MINUTES = 10;
const REFRESH_RESTART_SCALE = 6; // amount to scale REFRESH_INTERVAL_MINUTES to determine if the HN scraping job should be restarted

// Local Storage
const PAGES_RECORDED_TODAY = 'pages_recorded_today';
const PAGES_RECORDED_START_DAY = 'pages_recorded_start_day';
const ENABLE_TRACKING = 'enable_tracking';

const DOWNLOAD_DAEMON_INTERVAL_ID = 'interval_id';

// Icons
const PATH_FOR_POSTED_ICON =  '../images/icon20.png';
const PATH_FOR_DEFAULT_ICON = '../images/icon20.png';

// Acceptable weights
const WEIGHTS = {
  '0X': 0,
  '1X': 1,
  '5X': 5
};
const DEFAULT_WEIGHT_KEY = '1X';

// Messages, these consts are defined in other files (for future reference, if changed)
const LOGIN_MESSAGE = 'LOGIN';
const PAGE_LOADED_MESSAGE = 'PAGE_LOADED';
const LOGOUT_MESSAGE = 'LOGOUT';
const TOGGLE_ENABLED_MESSAGE = 'TOGGLE_ENABLED';
const ADD_PROVIDER_MESSAGE = 'ADD_PROVIDER';
const REMOVE_PROVIDER_MESSAGE = 'REMOVE_PROVIDER';
// ******* End Constants ********

function downloadAllPages() {
  let ps = new ProviderStore;
  ps.updateAllTopUrlsForProviders();
}

function startDownloadDaemonJob() {
  localStorage[DOWNLOAD_DAEMON_INTERVAL_ID] = setInterval(
    downloadAllPages,
    REFRESH_INTERVAL_MINUTES * 60000
  ).toString();
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
  const provider = new ProviderStore();
  const last_update = provider.getLastUpdate(HN_PROVIDER_SLUG);
  if (localStorage[ENABLE_TRACKING] === 'true' && last_update) {
    const previousDate = Date.parse(last_update);
    const elapsedSecondsSinceLastUpdate = ( new Date - previousDate ) / 1000;

    if (elapsedSecondsSinceLastUpdate > (REFRESH_INTERVAL_MINUTES * 60 * REFRESH_RESTART_SCALE) ) {
      console.info('Restarting Download Daemon');
      resetDownloadDaemonJob();
    }
  }
}

// *********
// Post a Page view
function postPageview(url, multiplier, successCallback, failureCallback, userInitiated = false) {
  const uuid = localStorage.id;

  if (!loggedIn()) {
    return false;
  }

  const data = JSON.stringify({
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
  }).done(function(response, textStatus, xhr) {
    // Reset counter if the day change, probably should be done on interval not during post
    let currentDate = (new Date()).getDate();
    if (parseInt(localStorage[PAGES_RECORDED_START_DAY], 10) !== currentDate) {
      localStorage[PAGES_RECORDED_START_DAY] = currentDate.toString();
      localStorage[PAGES_RECORDED_TODAY] = '0';
    }

    if (xhr.status === 201) {
      chrome.browserAction.setIcon({'path': PATH_FOR_POSTED_ICON});
      localStorage[PAGES_RECORDED_TODAY] = (parseInt( localStorage[PAGES_RECORDED_TODAY], 10 ) + 1).toString();
      setTimeout(setDefaultIcon, 1000);
      setCurrentPageCount();
    } else if (xhr.status === 200) {
      if (response && response.created_in_recent_hours) {
        localStorage[PAGES_RECORDED_TODAY] = (parseInt( localStorage[PAGES_RECORDED_TODAY], 10 ) - 1).toString();
      }
      chrome.browserAction.setBadgeText({'text': 'Sent'});
      setTimeout(setCurrentPageCount, 1500);
    }
    if (successCallback) {
      successCallback();
    }
  }).fail(function(jqXHR, textStatus, errorThrown ) {
    console.warn('Could not post page view');

    if (failureCallback) {
      failureCallback();
    }
  });
}

function setDefaultIcon() {
  chrome.browserAction.setIcon({'path': PATH_FOR_DEFAULT_ICON});
}

function setCurrentPageCount() {
  chrome.browserAction.setBadgeText({'text': localStorage[PAGES_RECORDED_TODAY]});
}

function setWeight(url, multiplier, successCallback, failureCallback, userInitiated = false) {
  if (!loggedIn()) {
    return false;
  }
  postPageview(url, multiplier, successCallback, failureCallback, userInitiated);
}

function loggedIn() {
  const uuid = localStorage.id;
  return uuid;
}

function getHoursElapsedToday() {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60.0;
}

function login(email, password, callback) {
  const data = JSON.stringify({
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
  }).done(function(responseData) {
    localStorage[PAGES_RECORDED_TODAY] = responseData.num_urls_recorded_in_last_hours;
    localStorage[PAGES_RECORDED_START_DAY] = ((new Date()).getDate()).toString();
    setCurrentPageCount();

    // Configure the first time
    initFirstLoginDefaults();

    callback(responseData.uuid);
  }).fail(function() {
    // last_updated_id = null;
    callback('');
  });
}

function initFirstLoginDefaults() {
    if (localStorage[ENABLE_TRACKING] === undefined) {
      localStorage[ENABLE_TRACKING] = 'true';
    }
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

chrome.runtime.onMessage.addListener(
  function router(request, sender, sendResponse) {
    switch (request.message) {
      case ADD_PROVIDER_MESSAGE:
        (new ProviderStore).addProvider(request.provider_slug);
        break;
      case REMOVE_PROVIDER_MESSAGE:
        (new ProviderStore).removeProvider(request.provider_slug);
        break;
      case LOGIN_MESSAGE:
        login(
          request.email,
          request.password,
          function(uuid) {
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
        chrome.browserAction.setBadgeText({'text': ''});

        sendResponse({'hello': 'world'});
        break;
      case PAGE_LOADED_MESSAGE:
        let url = sender.tab.url;
        console.log(url);
        checkAttemptRestart();
        let top_urls = new TopUrlStore();
        if (localStorage[ENABLE_TRACKING] !== 'false' && top_urls.urlInTop(url)) {
          setWeight(
            url,
            WEIGHTS[DEFAULT_WEIGHT_KEY],
            function(response) {
              sendResponse({'success': 'true'});
            },
            function(response) {
              sendResponse({'success': 'false'});
            }
          );
          console.log('Sent to server');
        } else {
          // Ignored
          console.log('Not sent');
        }
        break;
      case TOGGLE_ENABLED_MESSAGE:
        sendResponse({'tracking_on': toggleTracking() });
        break;
      default:
        if (WEIGHTS.hasOwnProperty(request.message)) {
        let url = request.url;
        setWeight(
          url,
          WEIGHTS[request.message],
          function(response) {
            sendResponse({'success': 'true'});
          },
          function(response) {
            sendResponse({'success': 'false'});
          },
          true);
          return true;
      } else {
        console.warn('Bad weight');
      }
      break;
    }
  }
);
