var embedly = require('embedly')
  , require_either = embedly.utils.require_either
  , util = require_either('util', 'utils')
  , Api = embedly.Api
  , api = new Api({user_agent: 'Mozilla/5.0 (compatible; myapp/1.0; u@my.com)'})
  , resolve = require('./url_resolver')
;

function Parser() {
    this.pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/;
}

Parser.prototype.parse = function(text, callback) {
    var self = this;
    var urls = text.split(" ").filter(function(word) {
        return self.pattern.test(word);
    }).map(function(url) {
        resolve(url, function(e, url) {
            api.oembed({ url: url })
                .on('complete', function(objs) {
                    callback(objs[0]);
                }).start();
        });
    });
}

exports.Parser = new Parser();