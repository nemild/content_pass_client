// import UrlVariation from './UrlVariation';
import ProviderStore, {HN_PROVIDER_SLUG} from './ProviderStore';
import TopUrlStore from './TopUrlStore';
import SubmittedUrlStore from './SubmittedUrlStore';

// Server Constants
const BASE_SERVER_URL = 'https://content-pass.herokuapp.com/';
// const BASE_SERVER_URL = 'http://localhost:3000/'
const PAGE_VIEW_RELATIVE_URL = 'api/v1/page_views';
const LOGIN_RELATIVE_URL = 'api/v1/sessions';

// General refresh
const REFRESH_INTERVAL_MINUTES = 20;
const REFRESH_RESTART_SCALE = 6; // amount to scale REFRESH_INTERVAL_MINUTES to determine if the HN scraping job should be restarted

// Local Storage
const PAGES_RECORDED_TODAY = 'pages_recorded_today';
const PAGES_RECORDED_START_DAY = 'pages_recorded_start_day';
const ENABLE_TRACKING = 'enable_tracking';
const LAST_EXPIRED_SUBMITTED_URL_STORE = 'last_expired_submitted_url_store';
const DOWNLOAD_DAEMON_INTERVAL_ID = 'interval_id';

// Icons
const PATH_FOR_POSTED_ICON =  '../images/icon20.png';
const PATH_FOR_DEFAULT_ICON = '../images/icon20.png';

const MINS_BETWEEN_SUBMITTED_EXPIRATION_CALLS = 60 * 12;
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

function loggedIn() {
  const uuid = localStorage.id;
  return uuid;
}

function getHoursElapsedToday() {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60.0;
}

function downloadAllPages() {
  let ps = new ProviderStore;
  ps.updateAllTopUrlsForProviders();
}

function setDefaultIcon() {
  chrome.browserAction.setIcon({'path': PATH_FOR_DEFAULT_ICON});
}

function setCurrentPageCount() {
  chrome.browserAction.setBadgeText({'text': localStorage[PAGES_RECORDED_TODAY]});
}

function initFirstLoginDefaults() {
    if (localStorage[ENABLE_TRACKING] === undefined) {
      localStorage[ENABLE_TRACKING] = 'true';
    }
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
  const lastUpdate = provider.getLastUpdate(HN_PROVIDER_SLUG);
  if (localStorage[ENABLE_TRACKING] === 'true' && lastUpdate) {
    const previousDate = Date.parse(lastUpdate);
    const elapsedSecondsSinceLastUpdate = ( new Date - previousDate ) / 1000;

    if (elapsedSecondsSinceLastUpdate > REFRESH_INTERVAL_MINUTES * 60 * REFRESH_RESTART_SCALE ) {
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
  }).done(function pageviewPostSuccessCallback(response, textStatus, xhr) {
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
      setAndExpireUrlStore(url, multiplier);
    } else if (xhr.status === 200) {
      if (response && response.created_in_recent_hours) {
        localStorage[PAGES_RECORDED_TODAY] = (parseInt( localStorage[PAGES_RECORDED_TODAY], 10 ) - 1).toString();
      }
      chrome.browserAction.setBadgeText({'text': 'Sent'});
      setTimeout(setCurrentPageCount, 1500);
      setAndExpireUrlStore(url, multiplier);
    }

    if (successCallback) {
      successCallback();
    }
  }).fail(function pageviewPostFailureCallback(jqXHR, textStatus, errorThrown ) {
    console.warn('Could not post page view');

    if (failureCallback) {
      setAndExpireUrlStore(null, null);
      failureCallback();
    }
  });
}

function setAndExpireUrlStore(url, weight) {
  let sus = null;
  if (url && (weight || weight === 0)) {
    sus = new SubmittedUrlStore();
    sus.setSubmittedUrl(url, weight);
  }

  if(!localStorage[LAST_EXPIRED_SUBMITTED_URL_STORE] || new Date(localStorage[LAST_EXPIRED_SUBMITTED_URL_STORE]) + MINS_BETWEEN_SUBMITTED_EXPIRATION_CALLS * 60 * 1000 < (new Date) ) {
     if (!sus) { sus = new SubmittedUrlStore(); }
     sus.expireSubmittedUrls();
     localStorage[LAST_EXPIRED_SUBMITTED_URL_STORE] = new Date;
  }
}

function setWeight(url, multiplier, successCallback, failureCallback, userInitiated = false) {
  if (!loggedIn()) {
    return false;
  }
  postPageview(url, multiplier, successCallback, failureCallback, userInitiated);
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
  }).done(function loginSuccessCallback(responseData) {
    localStorage[PAGES_RECORDED_TODAY] = responseData.num_urls_recorded_in_last_hours;
    localStorage[PAGES_RECORDED_START_DAY] = ((new Date()).getDate()).toString();
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
          function loginCallback(uuid) {
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
        const url = sender.tab.url;
        console.log(url);
        checkAttemptRestart();
        const topUrls = new TopUrlStore();
        if (localStorage[ENABLE_TRACKING] !== 'false' && topUrls.urlInTop(url)) {
          setWeight(
            url,
            WEIGHTS[DEFAULT_WEIGHT_KEY],
            function pageLoadedSuccessCallback(response) {
              sendResponse({'success': 'true'});
            },
            function pageLoadedFailureCallback(response) {
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
        const url = request.url;
        setWeight(
          url,
          WEIGHTS[request.message],
          function pageLoadedSuccessCallback(response) {
            sendResponse({'success': 'true'});
          },
          function pageLoadedFailureCallback(response) {
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
