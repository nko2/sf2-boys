var mongoose = require('mongoose'),
    schema = require('../lib/schema.js');

describe('session', function(){
    it('should be created properly with sample data', function() {
        var SessionModel = mongoose.model('Session');
        var session = new SessionModel();
        session.name = 'test session';
        session.description = 'test session description';
        session.speakers.push('steves');
        session.speakers.push('jmikola');

        expect(session.name).toEqual('test session');
        expect(session.description).toEqual('test session description');
    });
});

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

        expect(event.name).toEqual('test event');
        expect(event.startsAt).toEqual(startDate);
        expect(event.endsAt).toEqual(endDate);
        expect(event.imageUrl).toEqual('http://www.example.com/test.png');
        expect(event.description).toEqual('test event description');
        expect(event.location).toEqual('New York, NY');
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

        expect(tweet.tweet).toEqual('test tweet');
        expect(tweet.user).toEqual('stevensurowiec');
        expect(tweet.postedAt).toEqual(postedDate);
    });
});