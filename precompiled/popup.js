let dropDown;
let loginForm;

const LOGIN_MESSAGE = 'LOGIN';
const LOGOUT_MESSAGE = 'LOGOUT';
const TOGGLE_ENABLED_MESSAGE = 'TOGGLE_ENABLED';

// Chrome Extension variables
let bgPage;
let runtime;

function configureLoggedInState() {
  loginForm.style.display = 'none';
  dropDown.style.display = 'initial';
  if (localStorage.hn_last_updated && localStorage.hn_last_updated !== '') {
    const cleanDate = new Date(localStorage.hn_last_updated);
    $('#last_updated_data').text(
      cleanDate.toLocaleDateString() + ' ' + cleanDate.toLocaleTimeString()
    );
    $('#last_updated_frame').show();
  }
  $('#logout').show();
  $('#logged_in_frame').show();
  $('#updated_indicator_frame').show();
}

function configureLoggedOutState() {
  dropDown.style.display = 'none';
  loginForm.style.display = 'initial';
  $('#logout').hide();
  $('#last_updated_frame').hide();
  $('#logged_in_frame').hide();
  $('#updated_indicator_frame').hide();
}

function toggleTracking() {
  runtime.sendMessage(
    {
      'message': TOGGLE_ENABLED_MESSAGE
    },
    function handleToggleTracking(response) {
      setTrackingIndicator(response.tracking_on);
    });
}

function setTrackingIndicator(set_on) {
  let $auto_tracking = $('#auto_tracking');
  if (set_on === true || set_on === undefined) {
    $auto_tracking.html('HN Tracking<br />On');
    $auto_tracking.removeClass('btn-danger').addClass('btn-success');
  } else if (set_on === false) {
    $auto_tracking.html('HN Tracking<br />Off');
    $auto_tracking.addClass('btn-danger').removeClass('btn-success');
  }
}

function login(e) {
  e.preventDefault();

  let email = loginForm.usermail.value;
  let password = loginForm.password.value;

  $('#login_loading').fadeIn(200);
  runtime.sendMessage(
    {
      'message': LOGIN_MESSAGE,
      'email': email,
      'password': password
    },
    function handleLoginRequest(response) {
      $('#login_loading').fadeOut(200);
      if (response.id) {
        configureLoggedInState();
      } else {
        const errorFlash = $('#login-flash');
        errorFlash.text('Sorry, your username or password was invalid').fadeIn();
      }
    }
  );
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
  loginForm.addEventListener('submit', login);

  if (localStorage.id) {
    configureLoggedInState();
  } else {
    configureLoggedOutState();
  }

  $('#logout').on('click', function logout(e) {
    e.preventDefault();

    runtime.sendMessage({
      'message': LOGOUT_MESSAGE
    },
    function handleLogoutRequest(response) {
      configureLoggedOutState();
    });
  });

  $('#auto_tracking').on('click', function(e) {
    toggleTracking();
  });

  let et = localStorage.enable_tracking;
  setTrackingIndicator(
    (et === 'true' || et === undefined) ? true : false
  );

  $('.content_pass_single_action').click(function singleAction() {
    if (!$(this).hasClass('selected')) {
      $('.content_pass_single_action').removeClass('selected');
      $(this).addClass('selected');

      // Add setting code here
      let multiplier = $(this).text();

      $('#loggedin_loading').fadeIn(200);
      // Grab URL
      chrome.tabs.query({
        'active': true,
        'currentWindow': true
      }, function sendMultiplierMessage(tabs) {
        chrome.runtime.sendMessage({
          'message': multiplier,
          'url': tabs[0].url
        },
        function callback(response) {
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
    }
  });
});


