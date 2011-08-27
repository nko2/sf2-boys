var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var Talk = new Schema({
    name        : { type: String, index: true }
  , description : String
  , speakers    : [String]
});

var Event = new Schema({
    name        : { type: String, index: true }
  , startsAt    : Date
  , endsAt      : Date
  , imageUrl    : String
  , description : String
  , location    : String
  , talks       : [Talk]
});

var Tweet = new Schema({
    tweet       : String
  , postedAt    : Date
  , user        : String
  , hashes      : [String]
});

mongoose.model('Talk', Talk);
mongoose.model('Event', Event);
mongoose.model('Tweet', Tweet);
