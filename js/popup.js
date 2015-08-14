var drop_down
var login_form
$(document).ready(function() {

  drop_down = document.getElementById('multiplier_selector');
  login_form = document.forms["login"];

  login_form.addEventListener("submit", login);

  if (localStorage['id']) {
    configureLoggedInState();
  } else {
    configureLoggedOutState();
  }


  $('.content_pass_single_action').click(function() {
    if(!$(this).hasClass('selected')) {
      $('.content_pass_single_action').removeClass('selected');
      $(this).addClass('selected');

      // Add setting code here
      var multiplier = $(this).text();

      // Grab URL
      chrome.tabs.query({
        'active': true,
        'currentWindow': true
      }, function (tabs) {
        chrome.runtime.sendMessage({message: multiplier, url: tabs[0].url}, function (response) {
          console.log('received callback from multiplier update:' + response);
        });
      }); 
    }
  });

  function configureLoggedInState() {
    login_form.style.display='none';
    drop_down.style.display='initial';
  }

  function configureLoggedOutState() {
    drop_down.style.display='none'; 
    login_form.style.display='initial'; 
  }

  function login(e) {
    console.log("login, yo")
    e.preventDefault()
    var email = login_form["usermail"].value;
    var password = login_form["password"].value;
    chrome.runtime.sendMessage({message: "login", email:email, password:password}, function (response) {
        configureLoggedInState();  
    });
  }
});
