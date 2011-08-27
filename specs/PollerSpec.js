var poller = require('../lib/poller.js');

describe('poller', function() {
    var poll, twit = {};

    beforeEach(function() {
        poll = poller.createPoller({
            search: function(keyword, callback) {
                twit.keyword  = keyword;
                twit.callback = callback;
                callback('asd');
            }
        }, "#nko");
    });

    it('uses twitter api to poll tweets', function() {

        poll.on('data', function(data) {
            expect(data).toEqual('asd');
        });

        poll.startPolling();

        runs(function() {
            expect(twit.keyword).toBeUndefined()
        });

        waits(500);

        runs(function() {
            expect(twit.keyword).toEqual("#nko");
        });
    });

    it('stops polling when requested', function() {
        var emits = 0;

        poll.on('data', function(data) {
            emits++;
        });

        poll.startPolling();

        runs(function() {
            expect(emits).toEqual(0);
        });

        waits(500);

        runs(function() {
            expect(emits).toEqual(1);
            poll.stopPolling();
        });

        waits(500);

        runs(function() {
            expect(emits).toEqual(1);
        });
    });

    it('emits a "stop" event when requested to stop polling', function() {
        var stopped = false;

        poll.on('stop', function() {
            stopped = true;
        })

        poll.startPolling();
        poll.stopPolling();

        expect(stopped).toBeTruthy();
    });

    it('emits a "start" event when requested to start polling', function() {
        var started = false;

        poll.on('start', function() {
            started = true;
        })

        poll.startPolling();
        poll.stopPolling();

        expect(started).toBeTruthy();
    });
});