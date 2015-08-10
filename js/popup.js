document.getElementById("multiplier_selector").addEventListener("change",multiplier_selected);

function multiplier_selected(event) {
  chrome.tabs.query({
    'active': true,
    'currentWindow': true
  }, function (tabs) {
    var multiplier = event.srcElement.value + 'x';
    chrome.runtime.sendMessage({message: multiplier, url: tabs[0].url});

  });  
}