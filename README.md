# ContentPass Client (Google Chrome)
**ContentPass is in early alpha**

### Overview


ContentPass Client is a Google Chrome extension that works with ContentPass. It lets you sign in, submits relevant sites to our server, and change the weights of sites that you've visited.

### Developers
#### Getting started
*File Structure*
- `precompiled/`: All major source files are in the precompiled directory
  - `popup.js`: Code related to the view
  - `extension_script.js`: Backend logic
  - `UrlVariation.js`: Library to generate variations of a given URL (http, https, with/without query parameters)
- `html/`, `css/`, `images/`: HTML, CSS, and images
- `js/precompiled`: All compiled files are output here when run through the `compile.sh` script

To setup auto-compilation:
```
./compile.sh # auto compiles files on reload
```