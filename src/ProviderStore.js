import TopUrlStore from './TopUrlStore';
// LocalStorage key
const ALL_PROVIDERS = 'all_providers';

// Hash keys
export const HN_PROVIDER_SLUG = 'hackernews';
export const REDDIT_PROVIDER_SLUG_PREFIX = 'reddit_';

// Thin wrapper to allow the creation and removal of providers: subreddits (and Hacker News) that provide lists of top links
// The main data structure is in the form { 'providername': last_updated_date }
export default class {
  constructor() {}

  // Public
  addSubredditProvider(subreddit) {
    if (subreddit && subreddit !== '') {
      addProvider(REDDIT_PROVIDER_SLUG_PREFIX + subreddit);
    }
  }

  addProvider(provider) {
    this.instantiateProvidersList();

    this.providersList[provider] = '';
    this.saveProvidersList();

    let o = {};
    o[provider] = '';
    this.updateAllTopUrlsForProviders(o);
  }

  // Run all updates
  updateAllTopUrlsForProviders(providerListInit = null) {
    let providerList = providerListInit;
    if (!providerList) {
      this.instantiateProvidersList();
      providerList = this.providersList;
    }
    const t = new TopUrlStore();

    for (let providerName in providerList) {
      if (providerList.hasOwnProperty(providerName)) {
        if (providerName.startsWith(HN_PROVIDER_SLUG)) {
          t.populateHNUrlStoreFromServer();
        } else if (providerName.startsWith(REDDIT_PROVIDER_SLUG_PREFIX)) {
          const l = providerName.length;
          const subreddit = providerName.substr(
            l - (l - REDDIT_PROVIDER_SLUG_PREFIX.length)
          );
          t.populateSubredditUrlStoreFromServer(subreddit);
        }
      }
    }
  }

  removeSubredditProvider(subreddit) {
    removeProvider(REDDIT_PROVIDER_SLUG_PREFIX + subreddit);
  }

  removeProvider(provider) {
    this.instantiateProvidersList();

    delete this.providersList[provider];
    this.saveProvidersList();

    (new TopUrlStore).removeProviderFromTopUrls(provider);
  }

  setProviderUpdateToCurrentDate(provider) {
    this.instantiateProvidersList();
    if (provider in this.providersList) {
      this.providersList[provider] = new Date();
      this.saveProvidersList();
      return true;
    }
    return false;
  }

  getCurrentProviders() {
    this.instantiateProvidersList();

    return this.providersList;
  }

  getLastUpdate(provider) {
    this.instantiateProvidersList();
    return this.providersList[provider];
  }

  // Private
  instantiateProvidersList() {
    this.providersList = this.loadProvidersList();

    if (!this.providersList) {
      this.providersList =  {};
      this.providersList[HN_PROVIDER_SLUG] = '';
      this.saveProvidersList();
    }
  }

  loadProvidersList() {
    if (localStorage[ALL_PROVIDERS]) {
      return JSON.parse(localStorage[ALL_PROVIDERS]);
    } else { return null; }
  }

  saveProvidersList() {
    localStorage[ALL_PROVIDERS] = JSON.stringify(this.providersList);
  }
}
