var poller = require('../lib/poller.js');

describe('poller', function() {
    var poll, twit = {};

    beforeEach(function() {
        poll = poller.createPoller({
            search: function(keyword, params, callback) {
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

    it('can resume polling', function() {
        var starts = 0, stops = 0;

        poll.on('stop', function() {
            stops++;
        });

        poll.on('start', function() {
            starts++;
        });

        poll.startPolling();
        expect(starts).toEqual(1);

        poll.startPolling();
        expect(starts).toEqual(1);

        poll.stopPolling();
        expect(stops).toEqual(1);

        poll.stopPolling();
        expect(stops).toEqual(1);

        poll.startPolling();
        expect(starts).toEqual(2);

        poll.stopPolling();
        expect(stops).toEqual(2);
    });
});