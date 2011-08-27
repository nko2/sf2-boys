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
});