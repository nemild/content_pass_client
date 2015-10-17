import UrlVariation from './UrlVariation';
import ProviderStore, {REDDIT_PROVIDER_SLUG_PREFIX, HN_PROVIDER_SLUG} from './ProviderStore';
import Downloader from './Downloader';

const TOP_URLS = 'top_urls';

export default class {
  constructor() {}

  urlInTop(url) {
    if (!url || url === '') {
      return false;
    }

    const urlArr = this.getTopUrlsArray();
    const ur = new UrlVariation(url.toLowerCase());
    const urlRepresentations = ur.getAllUrlRepresentations();

    if (!urlRepresentations || urlRepresentations.length === 0 ) {
      return false;
    }

    // TODO: Change data structure to {}, to speed up lookups
    for (let i = 0; i < urlRepresentations.length; i++) {
      if (urlArr.indexOf(urlRepresentations[i]) !== -1) {
        return true;
      }
    }

    return false;
  }

  populateHNUrlStoreFromServer() {
    const that = this;
    const downloader = new Downloader();
    downloader.downloadTopHN(
      function successHN(urlArray) {
        that.setUrlsForProvider(HN_PROVIDER_SLUG, urlArray);
      },
      function failureHN() {}
    );
  }

  populateSubredditUrlStoreFromServer(subreddit) {
    const that = this;
    const downloader = new Downloader();
    downloader.downloadSubredditTop(
      subreddit,
      function successSubreddit(urlArray) {
        that.setUrlsForProvider( REDDIT_PROVIDER_SLUG_PREFIX + subreddit.toLowerCase(), urlArray);
      },
      function failureSubreddit() {}
    );
  }

  static stripQueryParams() {

  }

  // Private
  setUrlsForProvider(providerName, urls) {
    this.instantiateTopUrlsList();
    this.topUrlsList[providerName] = urls;
    this.saveTopUrlsList();

    const provider = new ProviderStore();
    provider.setProviderUpdateToCurrentDate(providerName);
  }

  removeProviderFromTopUrls(provider) {
    this.instantiateTopUrlsList();
    delete this.topUrlsList[provider];
    this.saveTopUrlsList();
  }

  getTopUrlsArray() {
    this.instantiateTopUrlsList();

    let urls = [];
    for (let provider in this.topUrlsList) {
      if (this.topUrlsList.hasOwnProperty(provider)) {
        urls = urls.concat(this.topUrlsList[provider]);
      }
    }
    return urls;
  }

  instantiateTopUrlsList() {
    this.topUrlsList = this.loadTopUrlsList();
    if (!this.topUrlsList) {
      this.topUrlsList = {};
      this.saveTopUrlsList();
    }
  }

  loadTopUrlsList() {
    if (localStorage[TOP_URLS]) {
      return JSON.parse(localStorage[TOP_URLS]);
    } else { return null; }
  }

  saveTopUrlsList() {
    localStorage[TOP_URLS] = JSON.stringify(this.topUrlsList);
  }
}

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
function parseUri (str) {
  var	o = parseUri.options,
    m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
    uri = {},
    i   = 14;

  while (i--) uri[o.key[i]] = m[i] || "";

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });

  return uri;
};

