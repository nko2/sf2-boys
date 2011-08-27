var events = require('events')
  , util = require('util');

function Poller(twit, term) {
    this.twit = twit;
    this.term = term;
    events.EventEmitter.call(this);
}
util.inherits(Poller, events.EventEmitter);

Poller.prototype.startPolling = function() {
    if (typeof this.intervalId !== "undefined") {
        return;
    }

    this.emit('start');

    var lastId, self = this;
    this.intervalId = setInterval(function() {
        var params = {};
        if (typeof lastId !== "undefined") {
            params.since_id = lastId;
        }
        self.twit.search(self.term, params, function(data) {
            lastId = data.max_id_str;
            self.emit('data', data);
        });
    }, 500);
}

Poller.prototype.stopPolling = function() {
    if (typeof this.intervalId !== "undefined") {
        clearTimeout(this.intervalId);
        this.emit('stop');
        delete this.intervalId;
    }
}

exports.createPoller = function(twit, schema) {
    return new Poller(twit, schema);
}