# [ContentPass](https://content-pass.herokuapp.com) Client (Google Chrome)
**ContentPass is in early alpha**

### Overview
![Screenshot](screenshot.png)

[ContentPass](https://content-pass.herokuapp.com) is a way to let readers pay content creators automatically by tracking the sites readers visit. Initially, we're testing it out in the [Hacker News](https://news.ycombinator.com) community. While it doesn't solicit money right now, over time, you would select an aggregate monthly budget - and the money would be automatically amortized across the relevant top Hacker News sites that you visit. You can also 5X a site to indicate that it should get 5 times the normal weight.

ContentPass Client (this repo) is a Google Chrome extension that works with ContentPass. It lets you sign in, submits relevant sites to our server, and change the weights (you can 5X the weight given to great content).

### What we record
Privacy matters to us. The extension only sends our server urls that you visit that are in the top 150 on Hacker News in the recent past (last 10 mins) - all other sites are excluded, and are not sent to our servers.

To change this default behavior, you can toggle the disable button - once disabled, the extension will only send us a URL if you manually click the relevant site weighting (0X, 1X, 5X). This is a more manual way to use ContentPass.

In addition to disabling, you can also log out or go into Incognito Mode - and no information will be sent to our servers.

Finally, if you have submitted a URL to our site, you can still delete it from our database. Simply 0X the url within a week - or go to your dashboard and click the delete action. We delete the URL from our database.

### Installation

1. Clone the *content_pass_client* repo to your local machine
2. In Google Chrome, navigate to `chrome://extensions`
3. Check the top right box that says Developer Mode
4. Click the button at top left that says *Load Unpacked Extension*
5. Select the root directory of the *content_pass_client* repo that you cloned locally.
6. Look for the *CO* icon on the right side of your Google Chrome toolbar
 - Click to login, you can sign up [here](https://content-pass.herokuapp.com/users/sign_up); once you're signed in, only the HN related top 150 sites will be sent to our server
 - You can additionally 5X sites you really like or 0X ones you don't, the badge will show the daily number of sites that it has recorded (you can always go to the [Dashboard](https://content-pass.herokuapp.com/dashboard))
 - Logout at anytime to stop HN-related sites being recorded - or switch to disabled mode

### Developers
#### Getting started
*Instructions*

1. Clone the content_pass_client repo to your local machine and `cd` into the directory.
2. Run `npm install` (this installs the compilation dependencies like babel, webpack, and watch)
3. Run `make` (run `make watch` if you want to compile on every source file change, rather than once)

##### Testing
To run the tests, type `make test`

*File Structure*

- `src/`: All major source files are in the src directory
  - `popup.js`: Code related to the view
  - `extension_script.js`: Backend logic
  - `UrlVariation.js`: Library to generate variations of a given URL (http, https, with/without query parameters)
- `html/`, `css/`, `images/`: HTML, CSS, and images
- `js/src`: All compiled files are output here when run through the default makefile target, do not modify files in this folder as they will be overwritten

#### Outstanding issues
##### URL Variations
Often on HN, posted URLs are different from that the browser navigates to. Currently, we catch http -> https, and url with and without query parameters. In the future, we will also handle the following variations:

- www -> no subdomain
- no subdomain -> www
- github.com url ending in .git -> github.com url without a .git
- *Submit additional cases here*
