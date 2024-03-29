import ProviderStore from './ProviderStore';
import SubmittedUrlStore from './SubmittedUrlStore';

let dropDown;
let loginForm;
let providerSection;

const LOGIN_MESSAGE = 'LOGIN';
const LOGOUT_MESSAGE = 'LOGOUT';
const TOGGLE_ENABLED_MESSAGE = 'TOGGLE_ENABLED';
const ADD_PROVIDER_MESSAGE = 'ADD_PROVIDER';
const REMOVE_PROVIDER_MESSAGE = 'REMOVE_PROVIDER';

// Chrome Extension variables
let bgPage;
let runtime;

function cleanDate(date) {
  if (date) {
    const parsedDate = new Date(date);
    return parsedDate.toLocaleDateString() + ' ' + parsedDate.toLocaleTimeString();
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

  $('#logged_in_frame #show-providers').on('click', function handleShowProviders() {
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
  $('#provider-section .a-provider').remove();

  $('#provider-section #provider-edit-done').on('click', function handleProviderViewDone() {
    providerSection.style.display = 'none';
    configureLoggedInState();
    $('#provider-section .a-provider').remove();
  });

  $('footer.links').hide();

  // Populate current table
  let p = (new ProviderStore).getCurrentProviders();
  for (let providerName in p) {
    if (p.hasOwnProperty(providerName)) {
      $('.provider-table').append(
        `<tr class='${providerName} a-provider'><td>${providerName}</td><td class='provider-last-update-date'>${cleanDate(p[providerName])}</td><td><div class='remove' data-slug='${providerName}'>Remove</div></td></tr>`
      );
    }
  }

  $('#provider-section .remove').on('click', function handleRemoveProviderAction(e) {
    // bgPage.console.log('Remove slug' + $(this).parents('tr'));
    runtime.sendMessage({
      'message': REMOVE_PROVIDER_MESSAGE,
      'provider_slug': $(this).data('slug')
    },
    function callback(response) {}
                       );
    $(this).parents('tr').fadeOut(500, function removeProviderDisplay() { $(this).remove(); });
  });
}

function determineCurrentTabUrl() {
  chrome.tabs.getSelected(null,function(tab) {
    if(tab && tab.url) {
      let submittedStore = new SubmittedUrlStore();
      let search = submittedStore.getDetailsOfUrl(tab.url);
      if (search) {
        $('.content-pass-single-action[data-weight="' + search.weight.toString() + '"]').addClass('selected');
      }
    }
  });
}

function toggleTracking() {
  runtime.sendMessage({
      'message': TOGGLE_ENABLED_MESSAGE
    },
    function handleToggleTracking(response) {
      setTrackingIndicator(response.tracking_on);
    });
}

function setTrackingIndicator(set_on) {
  let $auto_tracking = $('#auto_tracking');
  if (set_on === true || set_on === undefined) {
    $auto_tracking.html('Auto<br />Submission On');
    $auto_tracking.removeClass('btn-danger').addClass('btn-success');
  } else if (set_on === false) {
    $auto_tracking.html('Auto<br />Submission Off');
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
        if( localStorage.tutorialShown === undefined ) {
          $('#tutorial-frame').fadeIn();
        }
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

document.addEventListener('DOMContentLoaded', function documentReady() {
  bgPage = chrome.extension.getBackgroundPage();
  runtime = chrome.runtime;
  determineCurrentTabUrl();

  dropDown = document.getElementById('multiplier_selector');
  loginForm = document.forms.login;
  providerSection = document.getElementById('provider-section');

  loginForm.addEventListener('submit', login);

  if (localStorage.id) {
    configureLoggedInState();
  } else {
    configureLoggedOutState();
  }

  $('#provider-section .add').on('click', function(e) {
    const addString = $('#provider-section input[type="text"]').val();
    if (addString) {
      runtime.sendMessage({
        'message': ADD_PROVIDER_MESSAGE,
        'provider_slug': addString
      },
      function (response) {configureListProvidersPage(); });
      $('#provider-section input[type="text"]').val('');
    }
    e.preventDefault();

  });


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

  $('.tutorial-next-button').on('click', function() {
    let next = $(this).data('next-target');
    let current = $(this).data('current-target');

    $('#' + current).fadeOut();
    if (next !== '') {
      $('#' + next).fadeIn();
    } else {
      $('#tutorial-frame').fadeOut();
      localStorage.tutorialShown = 'true';
    }
  });

  let et = localStorage.enable_tracking;
  setTrackingIndicator(
    (et === 'true' || et === undefined) ? true : false
  );

  $('.content-pass-single-action').click(function singleAction() {
    if (!$(this).hasClass('selected')) {
      $('.content-pass-single-action').removeClass('selected');
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


