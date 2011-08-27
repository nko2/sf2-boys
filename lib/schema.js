var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var Talk = new Schema({
    hash        : { type: String, index: true }
  , name        : String
  , description : String
  , speakers    : [String]
});

var Event = new Schema({
    hash        : { type: String, index: true }
  , name        : String
  , createdBy   : String
  , startsAt    : Date
  , endsAt      : Date
  , imageUrl    : String
  , description : String
  , location    : String
  , talks       : [Talk]
});

Event.index({ hash: 1, 'talks.hash': 1 }, { unique: true });

var Tweet = new Schema({
    tweet_id    : { type: String, unique: true }
  , tweet       : String
  , postedAt    : Date
  , user        : String
  , hashes      : [String]
});

exports.Event = mongoose.model('Event', Event);
exports.Tweet = mongoose.model('Tweet', Tweet);
