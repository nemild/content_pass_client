var drop_down = document.getElementById('multiplier_selector');
login_form = document.forms["login"];

drop_down.addEventListener("change", multiplier_selected);
login_form.addEventListener("submit", login);

if (localStorage['id']) {
  login_form.style.display='none';
  drop_down.style.display='initial';
} else {
  drop_down.style.display='none'; 
  login_form.style.display='initial'; 
}

function login() {
  var email = login_form["usermail"].value;
  var password = login_form["password"].value;
  chrome.runtime.sendMessage({message: "login", email:email, password:password}, function(response) {
    console.log(response);
  });
  
}

// function validateForm() {
//   console.log('validating form')
//   var x=document.forms["login"]["username"].value;
//   if (x==null || x=="") {
//     alert("Please fill out the username");
//     return false;
//   }
// }

function multiplier_selected(event) {
  chrome.tabs.query({
    'active': true,
    'currentWindow': true
  }, function (tabs) {
    var multiplier = event.srcElement.value + 'x';
    chrome.runtime.sendMessage({message: multiplier, url: tabs[0].url});

  });  
}