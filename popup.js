'use strict';

var dropDown = undefined;
var loginForm = undefined;

$(document).ready(function () {
  dropDown = document.getElementById('multiplier_selector');
  loginForm = document.forms.login;

  loginForm.addEventListener('submit', login);

  if (localStorage.id) {
    configureLoggedInState();
  } else {
    configureLoggedOutState();
  }

  $('.content_pass_single_action').click(function () {
    var _this = this;

    if (!$(this).hasClass('selected')) {
      (function () {
        $('.content_pass_single_action').removeClass('selected');
        $(_this).addClass('selected');

        // Add setting code here
        var multiplier = $(_this).text();

        // Grab URL
        chrome.tabs.query({
          'active': true,
          'currentWindow': true
        }, function (tabs) {
          chrome.runtime.sendMessage({ message: multiplier, url: tabs[0].url }, function (response) {
            console.log('received callback from multiplier update:' + response);
          });
        });
      })();
    }
  });

  function configureLoggedInState() {
    loginForm.style.display = 'none';
    dropDown.style.display = 'initial';
  }

  function configureLoggedOutState() {
    dropDown.style.display = 'none';
    loginForm.style.display = 'initial';
  }

  function login(e) {
    console.log('login, yo');
    e.preventDefault();
    var email = loginForm.usermail.value;
    var password = loginForm.password.value;
    chrome.runtime.sendMessage({ message: 'login', email: email, password: password }, function (response) {
      configureLoggedInState();
    });
  }
});
