let dropDown;
let loginForm;

const LOGIN_MESSAGE = 'LOGIN';
const LOGOUT_MESSAGE = 'LOGOUT';

// Chrome Extension variables
let bgPage;
let runtime;

function configureLoggedInState() {
  $('#logout').show();
  loginForm.style.display = 'none';
  dropDown.style.display = 'initial';
  if(localStorage['hn_last_updated'] && localStorage['hn_last_updated'] !== '') {
    const cleanDate = (new Date(localStorage['hn_last_updated']));
    $('#last_updated_data').text(
      cleanDate.toLocaleDateString() + ' ' + cleanDate.toLocaleTimeString()
    );
    $('#last_updated_frame').show();
  }
  $('logged_in_frame').show();
  $('#updated_indicator_frame').show();
}

function configureLoggedOutState() {
  dropDown.style.display = 'none';
  loginForm.style.display = 'initial';
  $('#logout').hide();
  $('#last_updated_frame').hide();
  $('logged_in_frame').hide();
  $('#updated_indicator_frame').hide();
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
      }
    );
  });

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
          if(response.success === 'true') {
            $('#updated_indicator').text('Set to ' + multiplier.toString()).fadeIn(200);
            setTimeout(hide_updated_indicator, 1000);
          } else if(response.success == 'false') {
            $('#updated_indicator_error').text('Could not set to ' + multiplier.toString()).fadeIn(200);
            setTimeout(hide_updated_indicator_error, 1000);
          }
        });
      });
    }
  });
});

function hide_updated_indicator() {
  $('#updated_indicator').fadeOut(500);
}

function hide_updated_indicator_error() {
  $('#updated_indicator_error').fadeOut(500);
}
