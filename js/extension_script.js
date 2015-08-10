var num_pages = 5

downloadAllPages()
// Get all URLs every 10 minutes
setInterval(downloadAllPages, 600000) 

function downloadAllPages() {
  var i = 0
  function downloadPage() {
    if (i < num_pages) {
      $.ajax({
        type: "GET",
        url: "https://news.ycombinator.com/news?p="+(i+1).toString(),
        dataType: "html",
        success: function(data) {
          extractURLs(data, i);
          i += 1;
          downloadPage();
        },
        error: function( jqXHR, textStatus, errorThrown ) {
          console.log(jqXHR);
          console.log(textStatus);
          console.log(error);
        }
      });
    }
  }
  downloadPage();
}

function extractURLs(data, i) {
  var html = $.parseHTML(data);
  var url_arr = $('.athing .title a', $(html)).map(function() { 
                  return this['href']
                }).toArray();

  var key = "newUrls"

  if (i == 0) { // First time -- start from scratch
    var existing_url_arr = []
  } else {
    var existing_url_arr = JSON.parse(localStorage[key])
  }

  existing_url_arr = existing_url_arr.concat(url_arr)
  
  if (i + 1 == num_pages) { //  Last time -- overwrite
    key = "urls"
  }

  localStorage[key] = JSON.stringify(existing_url_arr)
}

function urlInTop150(url) {
  key = "urls"
  url_arr = JSON.parse(localStorage[key])
  // console.log(url_arr)
  if (url_arr.indexOf(url) > -1) {
    return true
  } else {
    return false  
  }
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message == "page loaded") {
      if (urlInTop150(sender.tab.url)) {
        console.log("you're reading hacker news!")
      }
    }
  }
);
