var mongoose = require('mongoose'),
    schema = require('../lib/schema.js');

describe('event', function(){
    it('should be created properly with sample data', function() {
        var startDate = new Date('2011-08-27 09:00:00');
        var endDate = new Date('2011-08-29 16:00:00');

        var EventModel = mongoose.model('Event');
        var event = new EventModel();
        event.name = 'test event';
        event.createdBy = 'jmikola';
        event.startsAt = startDate;
        event.endsAt = endDate;
        event.imageUrl = 'http://www.example.com/test.png';
        event.description = 'test event description';
        event.location = 'New York, NY';
        event.tweets.push({tweet_id: 5, tweet: 'test'});
        expect(event.name).toEqual('test event');
        expect(event.createdBy).toEqual('jmikola');
        expect(event.startsAt).toEqual(startDate);
        expect(event.endsAt).toEqual(endDate);
        expect(event.imageUrl).toEqual('http://www.example.com/test.png');
        expect(event.description).toEqual('test event description');
        expect(event.location).toEqual('New York, NY');
        expect(event.tweets.length).toEqual(1);
        expect(event.tweets[0].tweet_id).toEqual(5);
        expect(event.tweets[0].tweet).toEqual('test');
    });
});
