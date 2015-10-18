// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
function parseUri(str) {
  let o = parseUri.options;
  let m   = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str);
  let uri = {};
  let i   = 14;

  while (i--) uri[o.key[i]] = m[i] || '';

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function doUriReplace($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });

  return uri;
}

parseUri.options = {
  'strictMode': false,
  'key': ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
  'q': {
    'name': 'queryKey',
    'parser': /(?:^|&)([^&=]*)=?([^&]*)/g
  },
  'parser': {
    'strict': /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    'loose': /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  }
};

export default class {
  constructor(url) {
    if (url) {
      this.url = url.toLowerCase();
      this.parsedUrl = null;
      if (this.url) {
        this.parsedUrl = parseUri(this.url);
      }
    }
  }

  // Public
  getAllUrlRepresentations() {
    // let p = this.parsedUrl;

    if (!this.url || this.url === '' || !this.parsedUrl) {
      return null;
    }

    let urlRepresentations = [ this.url ];
    let altProtocolUrl = this.alternateProtocolUrl(this.url);
    if (altProtocolUrl) {
      urlRepresentations.push(altProtocolUrl);
    }

    let withoutQuery = this.withoutQueryParameters();
    if (withoutQuery) {
      urlRepresentations = urlRepresentations.concat(withoutQuery);
    }

    return urlRepresentations;
  }

  // Private
  withoutQueryParameters() {
    let p = this.parsedUrl;
    let results = [];

    if (p.query) {
      let withoutQueryParams;
      withoutQueryParams = p.protocol + '://' + p.host;
      if (p.port) {
        withoutQueryParams += ':' + p.port;
      }
      withoutQueryParams += p.path;
      if (p.anchor) {
        withoutQueryParams += '#' + p.anchor;
      }
      results.push(withoutQueryParams); // without query parameters

      let altProtocolUrl = this.alternateProtocolUrl(withoutQueryParams);
      if (altProtocolUrl) {
        results.push(altProtocolUrl);
      }

      return results;
    }

    return null;
  }

  // Strip means remove query parameters and anchor from the URL
  static stripUrl(url) {
    return url.split(/[?#]/)[0];
  }

  // Add HTTP representation for HTTPS, and vice versa
  alternateProtocolUrl(url) {
    let p = parseUri(url);

    if (!p) {
      return null;
    }

    if (p.protocol === 'https') {
      return url.replace('https', 'http');
    } else if (p.protocol === 'http') {
      return url.replace('http', 'https');
    }
    return null;
  }
}


