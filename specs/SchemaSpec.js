var mongoose = require('mongoose'),
    schema = require('../lib/schema.js');

describe('event', function(){
    it('should be created properly with sample data', function() {
        var startDate = new Date('2011-08-27 09:00:00');
        var endDate = new Date('2011-08-29 16:00:00');

        var EventModel = mongoose.model('Event');
        var event = new EventModel();
        event.name = 'test event';
        event.startsAt = startDate;
        event.endsAt = endDate;
        event.imageUrl = 'http://www.example.com/test.png';
        event.description = 'test event description';
        event.location = 'New York, NY';
        event.talks.push({hash: 'test talk'});

        expect(event.name).toEqual('test event');
        expect(event.startsAt).toEqual(startDate);
        expect(event.endsAt).toEqual(endDate);
        expect(event.imageUrl).toEqual('http://www.example.com/test.png');
        expect(event.description).toEqual('test event description');
        expect(event.location).toEqual('New York, NY');
        expect(event.talks.length).toEqual(1);
        expect(event.talks[0].hash).toEqual('test talk');
    });
});

describe('tweet', function(){
    it('should be created properly with sample data', function() {
        var postedDate = new Date('2011-08-28 14:23:21');
        var TweetModel = mongoose.model('Tweet');
        var tweet = new TweetModel();
        tweet.tweet = 'test tweet';
        tweet.user = 'stevensurowiec';
        tweet.postedAt = postedDate;
        tweet.hashes.push('#nodeknockout');
        tweet.hashes.push('#sf2_boys');

        expect(tweet.tweet).toEqual('test tweet');
        expect(tweet.user).toEqual('stevensurowiec');
        expect(tweet.postedAt).toEqual(postedDate);
        expect(tweet.hashes.length).toEqual(2);
        expect(tweet.hashes[0]).toEqual('#nodeknockout');
        expect(tweet.hashes[1]).toEqual('#sf2_boys');
    });
});