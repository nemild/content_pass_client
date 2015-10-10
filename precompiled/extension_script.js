// Server Constants
// const BASE_SERVER_URL = 'https://content-pass.herokuapp.com/';
const BASE_SERVER_URL = 'http://localhost:3000/'
const PAGE_VIEW_RELATIVE_URL = 'api/v1/page_views';
const LOGIN_RELATIVE_URL = 'api/v1/sessions';

// Hacker News Constants
const PROVIDER_NAME = 'Hacker News'
const PROVIDER_SLUG = 'hn_'
const PROVIDER_BASE_URL = 'https://news.ycombinator.com/';
const PROVIDER_PAGE_RELATIVE_URL = 'news?p=';
const MAX_NUM_PAGES = 5;
const REFRESH_INTERVAL_MINUTES = 10;

// Local Storage
const PAGES_RECORDED_TODAY = 'pages_recorded_today';
const PAGES_RECORDED_START_DAY = 'pages_recorded_start_day';
const WELCOME_SCREEN_SHOWN = 'welcome_screen_shown';

const HN_DICT_URLS_KEY = PROVIDER_SLUG + 'urls'
const HN_DICT_URLS_TEMP_KEY = PROVIDER_SLUG + 'newUrls';
const HN_LAST_UPDATED = PROVIDER_SLUG + 'last_updated';
const HN_INTERVAL_ID = PROVIDER_SLUG + 'interval_id'

// Icons
const PATH_FOR_POSTED_ICON =  '../images/icon20.png';
const PATH_FOR_DEFAULT_ICON = '../images/icon19.png';

// Globals
let last_updated_id = null;

// Acceptable weights
const WEIGHTS = {
  '0X': 0,
  '1X': 1,
  '5X': 5
}
const DEFAULT_WEIGHT_KEY = '1X';

// Messages, these consts are defined in other files (for future reference, if changed)
const LOGIN_MESSAGE = 'LOGIN';
const PAGE_LOADED_MESSAGE = 'PAGE_LOADED';
const LOGOUT_MESSAGE = 'LOGOUT';

// ******* End Constants ********

// Get Top 150 URLs on HN every 10 minutes
function extractURLs(data, i) {
  const html = $.parseHTML(data);
  let urlArr = $('.athing .title a', $(html)).map(function() {
    const currUrl = this.href;

    if (currUrl && currUrl !== '') {
      if(currUrl.substring(0,19) === 'chrome-extension://') {return null;}
      return currUrl.toLowerCase();
    }
    return null;
  }).toArray();

  let key = HN_DICT_URLS_TEMP_KEY;

  let existingUrlArr;
  if (i === 0) { // First time -- start from scratch
    existingUrlArr = [];
  } else {
    existingUrlArr = JSON.parse(localStorage[key]);
  }

  existingUrlArr = existingUrlArr.concat(urlArr);

  if (i + 1 === MAX_NUM_PAGES) { //  Last time -- overwrite
    key = HN_DICT_URLS_KEY;
    console.log('Done downloading HN');
    localStorage[HN_LAST_UPDATED] = Date();
  }

  localStorage[key] = JSON.stringify(existingUrlArr);

  // Empty temp key out
  if (key === HN_DICT_URLS_KEY) {
    localStorage[HN_DICT_URLS_TEMP_KEY] = '';
    delete(localStorage[HN_DICT_URLS_TEMP_KEY]);
  }
}

function downloadAllPages() {
  let i = 0;
  function downloadPage() {
    if (i < MAX_NUM_PAGES) {
      $.ajax({
        'type': 'GET',
        'url': PROVIDER_BASE_URL + PROVIDER_PAGE_RELATIVE_URL + (i + 1).toString(),
        'dataType': 'html'
      }).done(function(response) {
        extractURLs(response, i);
        i += 1;
        downloadPage();
      }).fail(function handleError(jqXHR, textStatus, errorThrown){
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

  const urlArr = getTopUrls();
  const ur = new UrlVariation(url.toLowerCase());
  const urlRepresentations = ur.getAllUrlRepresentations();

  if (!urlRepresentations || urlRepresentations.length === 0 ) {
    return false;
  }

  for(let i = 0; i < urlRepresentations.length; i++){
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
function postPageview(url, multiplier, successCallback, failureCallback, userInitiated = false) {
  const uuid = localStorage.id;

  if(!loggedIn()) {
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
    if(localStorage[PAGES_RECORDED_START_DAY] != (currentDate)) {
      localStorage[PAGES_RECORDED_START_DAY] = currentDate.toString();
      localStorage[PAGES_RECORDED_TODAY] ='0';
    }
    console.log(response);
    window.response = response;

    if(xhr.status === 201) {
      chrome.browserAction.setIcon({path:PATH_FOR_POSTED_ICON});
      localStorage[PAGES_RECORDED_TODAY] = (parseInt( localStorage[PAGES_RECORDED_TODAY] ) + 1).toString();
      setTimeout(setDefaultIcon, 1000);
      setCurrentPageCount();
    } else if (xhr.status === 200) {
      if(response['created_in_recent_hours']) {
        console.log('here1');
      }

      if(response && response['created_in_recent_hours']) {
        console.log(typeof(response.created_in_recent_hours));
        console.log('here');
        localStorage[PAGES_RECORDED_TODAY] = (parseInt( localStorage[PAGES_RECORDED_TODAY] ) - 1).toString();
      }
      chrome.browserAction.setBadgeText({text: 'Sent'});
      setTimeout(setCurrentPageCount, 1500);
    }
    if(successCallback) {
      successCallback();
    }
  }).fail(function(jqXHR, textStatus, errorThrown ) {
    console.warn('Could not post page view');

    if(failureCallback){
      failureCallback();
    }
  });
}

function setDefaultIcon() {
  chrome.browserAction.setIcon({path:PATH_FOR_DEFAULT_ICON});
}

function setCurrentPageCount() {
  chrome.browserAction.setBadgeText({text: localStorage[PAGES_RECORDED_TODAY]});
}

function setWeight(url, multiplier, successCallback, failureCallback, userInitiated = false) {
  const uuid = localStorage.id;
  if(!loggedIn()) {
    return false;
  }
  postPageview(url, multiplier, successCallback, failureCallback, userInitiated);
}

function loggedIn() {
  const uuid = localStorage.id;

  return (uuid && uuid !== '');
}

function getHoursElapsedToday() {
  const d = new Date();
  return d.getHours() + (d.getMinutes() / 60.0);
}

function login(email, password, last_updated_display_id, callback) {
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
    last_updated_id = last_updated_display_id;
    localStorage[PAGES_RECORDED_TODAY] = responseData.num_urls_recorded_in_last_hours;
    localStorage[PAGES_RECORDED_START_DAY] = ((new Date()).getDate()).toString();
    setCurrentPageCount();
    callback(responseData.uuid);
  }).fail(function() {
    last_updated_id = null;
    callback('');
  });
}

chrome.runtime.onMessage.addListener(
  function router(request, sender, sendResponse) {
    switch(request.message) {
      case LOGIN_MESSAGE:
        login(
          request.email,
          request.password,
          request.last_updated_id,
          function(uuid) {
            if (uuid && uuid !== '') {
              localStorage.id = uuid;
            }
            sendResponse({
              'id': uuid
            });
            if(localStorage.id) {
              startDownloadDaemon();
            }
          });
          return true;
          break;
          case LOGOUT_MESSAGE:
          localStorage.id = '';
          delete(localStorage.id);
          if(localStorage[HN_INTERVAL_ID]){
            clearInterval(parseInt(localStorage[HN_INTERVAL_ID]));
            localStorage[HN_INTERVAL_ID]= '';
            delete(localStorage[HN_INTERVAL_ID]);
          }
          localStorage[PAGES_RECORDED_TODAY] = '';
          delete(localStorage[PAGES_RECORDED_TODAY]);
          chrome.browserAction.setBadgeText({text: ''});

          sendResponse({'hello':'world'});
          break;
        case PAGE_LOADED_MESSAGE:
          let url = sender.tab.url;
          console.log(url);
          if (urlInTop(url)) {
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
            // console.log('Page in top');
          } else {
            // Ignored
            // console.log('Page not in top');
          }
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
          console.warn('Bad weight')
        }
        break;

    }
  }
);
