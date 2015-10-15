var chai = require('chai');
var assert = chai.assert;
// var UrlVariation = require('../precompiled/UrlVariation.js');
import UrlVariation from '../src/UrlVariation'

describe('UrlVariation', function() {
  it('should provide both http and https for a simple url', function() {
    var uv = new UrlVariation('');
    var result = uv.getAllUrlRepresentations();
    assert(result === null, 'should return a null array');
  });

  it('should provide both http and https for a simple url', function() {
    var uv = new UrlVariation(null);
    var result = uv.getAllUrlRepresentations();
    assert(result === null, 'should return a null array');
  });

  it('should provide both http and https for a simple url', function() {
    var uv = new UrlVariation('http://www.example.com');
    var result = uv.getAllUrlRepresentations();
    assert(result.length === 2, 'should only have two elements');
    assert(result[0].indexOf('http') !== -1, 'should have first element be the http variation');
    assert(result[1].indexOf('https') !== -1, 'should have first element be the http variation');
  });

  it('should provide both http and https for a simple url', function() {
    var uv = new UrlVariation('abc');
    var result = uv.getAllUrlRepresentations();
    assert(result.length === 1, 'should only return single element for non-standard');
    assert(result[0].indexOf('abc') !== -1, 'should only return single element back for non-standard');
  });

  it('should provide both https and http for a simple url', function() {
    var uv = new UrlVariation('https://www.example.com');
    var result = uv.getAllUrlRepresentations();
    assert(result.length === 2, 'should only have two elements');
    assert(result[0].indexOf('https') !== -1, 'should have first element be the http variation');
    assert(result[1].indexOf('http') !== -1, 'should have first element be the http variation');
  });

  it('should only provide one protocol for non-http', function() {
    var uv = new UrlVariation('ftp://www.example.com');
    var result = uv.getAllUrlRepresentations();
    assert(result.length === 1, 'should only have one element');
    assert(result[0].indexOf('ftp') !== -1, 'should have only element start with ftp');
  });

  it('should provide both http and https for a simple url with port', function() {
    var uv = new UrlVariation('http://www.example.com:8080');
    var result = uv.getAllUrlRepresentations();
    assert(result.length === 2, 'should only have two elements');
    assert(result[0].indexOf('http') !== -1, 'should have first element be the http variation');
    assert(result[1].indexOf('https') !== -1, 'should have first element be the http variation');
  });

  it('should provide both http and https for a simple url with port', function() {
    var uv = new UrlVariation('http://www.example.com:8080/abc/def/hello.html?xyz=123#ghi');
    var result = uv.getAllUrlRepresentations();
    assert(result.length === 4, 'should only have two elements');
    var expectedResult = [
      'http://www.example.com:8080/abc/def/hello.html?xyz=123#ghi',
      'https://www.example.com:8080/abc/def/hello.html?xyz=123#ghi',
      'http://www.example.com:8080/abc/def/hello.html#ghi',
      'https://www.example.com:8080/abc/def/hello.html#ghi'
    ]
    for(var i = 0; i < expectedResult.length; i++){
      assert(result[i] === expectedResult[i], 'should have ' + i.toString() + ' element be correct');
    }
  });
});
