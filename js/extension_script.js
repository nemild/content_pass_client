const num_pages = 5;
// const update_url = 

downloadAllPages();
// Get all URLs every 10 minutes
setInterval(downloadAllPages, 600000); 

function downloadAllPages() {
  var i = 0;
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
                  return this['href'];
                }).toArray();

  var key = "newUrls";

  if (i == 0) { // First time -- start from scratch
    var existing_url_arr = [];
  } else {
    var existing_url_arr = JSON.parse(localStorage[key]);
  }

  existing_url_arr = existing_url_arr.concat(url_arr);
  
  if (i + 1 == num_pages) { //  Last time -- overwrite
    key = "urls";
  }

  localStorage[key] = JSON.stringify(existing_url_arr);
}

function urlInTop150(url) {
  key = "urls";
  url_arr = JSON.parse(localStorage[key]);
  // console.log(url_arr)
  if (url_arr.indexOf(url) > -1) {
    return true;
  } else {
    return false;
  }
}

function post_pageview(url, multiplier) {
  var uuid = localStorage['id']
// TODO: check to make sure that's there
  var data =JSON.stringify({"uuid":uuid, "url":url, "weight":multiplier})
  $.ajax({
    url:"https://content-pass.herokuapp.com/api/v1/page_views",
    type:"POST",
    data:data,
    contentType:"application/json",
    dataType:"json",
    success: function() {
      console.log("woohooooo");
    }
  });
}

function set_weight(url, multiplier) {
  if (localStorage[url] != multiplier) {
    localStorage[url] = multiplier;
    post_pageview(url, multiplier);  
  }
}

function login(email, password, callback) {
  // $.ajax({
  //   url:"http://9fe57540.ngrok.io/pageview",
  //   type:"POST",
  //   data:data,
  //   contentType:"application/json",
  //   dataType:"json",
  //   success: function() {
  //     console.log("woohooooo");
  //   }
  // });
  
  callback(id)
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

// TODO: still sends stuff even if the user isn't logged in,
// And doesn't include real id in posts

    if (request.message == "login") {
      var email = request.email;
      var password = request.password;
      login(email, password, function (id) {
        localStorage['id'] = id
        sendResponse({id: id});  
      });
      return;
    }

    var url;
    if (request.message == "page loaded") {
      url = sender.tab.url;
    } else {
      url = request.url;
    }
// TODO: send 5x stuff even if the URL isn't currently in top 150
    if (urlInTop150(url)) {
      switch (request.message) {
        case "page loaded":
          set_weight(url, 1)
          break;
        case "0x":
          set_weight(url, 0);
          break;
        case "1x":
          set_weight(url, 1);
          break;
        case "5x":
          set_weight(url, 5);
          break;
      }
    }
  });
