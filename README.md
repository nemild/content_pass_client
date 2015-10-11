# ContentPass Client (Google Chrome)
**ContentPass is in early alpha**

### Overview
![Screenshot](screenshot.png)


ContentPass Client is a Google Chrome extension that works with ContentPass. It lets you sign in, submits relevant sites to our server, and change the weights of sites that you've visited.

### Installation
1. In Google Chrome, navigate to `chrome://extensions`
2. Check the top right box that says Developer Mode
3. Click the button at top left that says *Load Unpacked Extension*
4. Point the root directory of this repo
5. Look for the *CO* icon on the right side of your Google Chrome toolbar


### Developers
#### Getting started
*File Structure*
- `precompiled/`: All major source files are in the precompiled directory
  - `popup.js`: Code related to the view
  - `extension_script.js`: Backend logic
  - `UrlVariation.js`: Library to generate variations of a given URL (http, https, with/without query parameters)
- `html/`, `css/`, `images/`: HTML, CSS, and images
- `js/precompiled`: All compiled files are output here when run through the `compile.sh` script, do not modify files in this folder as they will be overwritten

To setup auto-compilation:
```
npm install -g babel # babel is the ES2015 transpiler
./compile.sh # auto compiles files on change, updated versions are output to js/precompiled/
```
