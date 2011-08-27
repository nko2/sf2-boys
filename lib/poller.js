var Poller = function(twit, schema) {
    this.twit = twit;
    this.schema = schema;
}

Poller.prototype.startPolling = function() {
    console.log('polling...');
}

exports.createPoller = function(twit, schema) {
    return new Poller(twit, schema);
}