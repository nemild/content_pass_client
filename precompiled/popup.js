let dropDown;
let loginForm;

const LOGIN_MESSAGE = 'LOGIN';

// Chrome Extension variables
let bgPage;
let runtime;

function configureLoggedInState() {
  $('#logout').show();
  loginForm.style.display = 'none';
  dropDown.style.display = 'initial';
}

function configureLoggedOutState() {
  dropDown.style.display = 'none';
  loginForm.style.display = 'initial';
  $('#logout').hide();
}

function login(e) {
  e.preventDefault();

  let email = loginForm.usermail.value;
  let password = loginForm.password.value;

  runtime.sendMessage(
    {
      'message': LOGIN_MESSAGE,
      'email': email,
      'password': password
    },
    function handleLoginRequest(response) {
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
    localStorage.id = '';
    bgPage.location.reload();
  });

  $('.content_pass_single_action').click(function singleAction() {
    if (!$(this).hasClass('selected')) {
      $('.content_pass_single_action').removeClass('selected');
      $(this).addClass('selected');

      // Add setting code here
      let multiplier = $(this).text();

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
          bgPage.console.log('received callback from multiplier update:' + response);
        });
      });
    }
  });
});


