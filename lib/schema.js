var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var Session = new Schema({
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
  , sessions    : [Session]
});

mongoose.model('Session', Session);
mongoose.model('Event', Event);
