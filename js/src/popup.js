'use strict';

var dropDown = undefined;
var loginForm = undefined;

var LOGIN_MESSAGE = 'LOGIN';
var LOGOUT_MESSAGE = 'LOGOUT';
var TOGGLE_ENABLED_MESSAGE = 'TOGGLE_ENABLED';

// Chrome Extension variables
var bgPage = undefined;
var runtime = undefined;

function configureLoggedInState() {
  loginForm.style.display = 'none';
  dropDown.style.display = 'initial';
  if (localStorage.hn_last_updated && localStorage.hn_last_updated !== '') {
    var cleanDate = new Date(localStorage.hn_last_updated);
    $('#last_updated_data').text(cleanDate.toLocaleDateString() + ' ' + cleanDate.toLocaleTimeString());
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
    $auto_tracking.html('HN Tracking<br />On');
    $auto_tracking.removeClass('btn-danger').addClass('btn-success');
  } else if (set_on === false) {
    $auto_tracking.html('HN Tracking<br />Off');
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