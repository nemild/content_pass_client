'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var UrlVariation = (function () {
  function UrlVariation(url) {
    _classCallCheck(this, UrlVariation);

    this.url = url.toLowerCase();
    this.parsedUrl = null;
    if (this.url) {
      this.parsedUrl = parseUri(this.url);
    }
  }

  _createClass(UrlVariation, [{
    key: 'getAllUrlRepresentations',

    // Public
    value: function getAllUrlRepresentations() {
      var p = this.parsedUrl;

      if (!this.url || this.url === '' || !this.parsedUrl) {
        return null;
      }

      var urlRepresentations = [this.url];
      var altProtocolUrl = this.getAlternateProtocolUrl(this.url);
      if (altProtocolUrl) {
        urlRepresentations.push(altProtocolUrl);
      }

      var withoutQuery = this.withoutQueryParameters();
      if (withoutQuery) {
        urlRepresentations = urlRepresentations.concat(withoutQuery);
      }

      return urlRepresentations;
    }
  }, {
    key: 'withoutQueryParameters',

    // Private
    value: function withoutQueryParameters() {
      var p = this.parsedUrl;
      var results = [];

      if (p.query) {
        var withoutQueryParams = undefined;
        withoutQueryParams = p.protocol + '://' + p.host;
        if (p.port) {
          withoutQueryParams += ':' + p.port;
        }
        withoutQueryParams += p.path + p.anchor;
        results.push(withoutQueryParams); // without query parameters

        altProtocolUrl = getAlternateProtocolUrl(withoutQueryParams);
        if (altProtocolUrl) {
          results.push(altProtocolUrl);
        }

        return results;
      }

      return null;
    }
  }, {
    key: 'alternateProtocolUrl',

    // Add HTTP representation for HTTPS, and vice versa
    value: function alternateProtocolUrl(url) {
      var p = parseUri(url);

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
  }]);

  return UrlVariation;
})();

exports['default'] = UrlVariation;

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
function parseUri(str) {
  var o = parseUri.options,
      m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str),
      uri = {},
      i = 14;

  while (i--) uri[o.key[i]] = m[i] || '';

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });

  return uri;
};

parseUri.options = {
  strictMode: false,
  key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
  q: {
    name: 'queryKey',
    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
  },
  parser: {
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  }
};
module.exports = exports['default'];