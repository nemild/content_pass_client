const SUBMITTED_URLS_STORAGE_KEY = 'submitted_urls';
const EXPIRY_TIME_MINUTES = 60 * 24 * 7;

import UrlVariation from './UrlVariation';

export default class {
  constructor() {
    this.data = this.loadSubmittedUrls();
  }

  // Date is stored in Unix time
  setSubmittedUrl(url, weight) {
    // strip lookup URL - no query parameters, no id
    const lookupUrl = UrlVariation.stripUrl(url);
    const urlSearch = this.getDetailsOfUrl(url);
    let newDate;
    let urlKey;

    if (urlSearch) {
      newDate = urlSearch.date;
      urlKey = urlSearch.url;
      console.log('SubmittedUrls: Updating old entry ' + urlKey);
    } else {
      newDate = new Date;
      urlKey = lookupUrl;
      console.log('SubmittedUrls: Storing new entry ' + urlKey);
    }

    this.data[urlKey] = {
      'weight': weight,
      'date': newDate
    };

    this.storeSubmittedUrls();
  }

  getDetailsOfUrl(url) {
    const urlRepresentations = this.getUrlVariations(url);

    for (let i = 0; i < urlRepresentations.length; i++) {
      if (this.data[ urlRepresentations[i] ]) {
        const elem = this.data[urlRepresentations[i]];
        return {
          'url': urlRepresentations[i],
          'weight': elem.weight,
          'date': elem.date
        };
      }
    }
    return null;
  }

  expireSubmittedUrls() {
    const currDate = new Date;
    let parsedDate;

    for (keyName in this.data) {
      if (this.data.hasOwnProperty(keyName)) {
        parsedDate = Date.parse(this.data[keyName].date);
        if (parsedDate < currDate + (EXPIRY_TIME_MINUTES * 60 * 1000)) {
          delete this.data[keyName];
        }
      }
    }
  }

  // Private
  storeSubmittedUrls() {
    localStorage[SUBMITTED_URLS_STORAGE_KEY] = JSON.stringify(this.data);
  }

  loadSubmittedUrls() {
    if (localStorage[SUBMITTED_URLS_STORAGE_KEY] === undefined) {
      return {};
    } else {
      return JSON.parse(localStorage[SUBMITTED_URLS_STORAGE_KEY]);
    }
  }

  getUrlVariations(url) {
    const ur = new UrlVariation(url.toLowerCase());
    const urlRepresentations = ur.getAllUrlRepresentations();

    if (!urlRepresentations || urlRepresentations.length === 0 ) {
      return null;
    }
    return urlRepresentations;
  }
}
