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

    var self = this;
    this.intervalId = setInterval(function() {
        self.twit.search(self.term, function(data) {
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