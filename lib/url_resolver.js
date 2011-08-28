var http  = require('http'),
urlParser = require('url');

var resolve = function(url, fn) {
  var parts = urlParser.parse(url),
  result,
  req = http.request({
    host:    parts.hostname,
    port:    parts.port || 80,
    path:    parts.pathname,
    query:   parts.query || null,
    method:  'HEAD',
    headers: {
      'content-length': 0
    }
  },
  function(res) {
    if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
      return resolve(res.headers.location, fn);
    }
    fn(null, url);
  });

  req.end();

  req.on('error', function(e) {
    fn(e);
  });
}

module.exports = resolve;