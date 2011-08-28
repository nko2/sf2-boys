var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , Promise  = mongoose.Promise
;

var Asset = new Schema({
    author       : String
  , type         : String
  , asset_author : String
  , provider     : String
  , provider_url : String
  , title        : String
  , description  : String
  , url          : String
  , height       : String
  , width        : String
  , html         : String
})

var Talk = new Schema({
    hash         : { type: String, index: true }
  , name         : String
  , startsAt     : Date
  , description  : String
  , speakers     : [String]
  , tweets       : [Tweet]
  , participants : [String]
  , assets       : [Asset]
});

var Event = new Schema({
    hash         : { type: String, index: true }
  , name         : String
  , startsAt     : Date
  , endsAt       : Date
  , lastSync     : Date
  , imageUrl     : String
  , overview     : String
  , description  : String
  , author       : String
  , location     : String
  , talks        : [Talk]
  , tweets       : [Tweet]
  , participants : [String]
  , assets       : [Asset]
});

Event.index({ hash: 1, 'talks.hash': 1 }, { unique: true });
Event.index({ 'tweets.tweet_id': 1 }, { unique: true });
Event.index({ 'talks.tweets.tweet_id': 1 }, { unique: true });
Event.index({ 'assets.type': 1 });
Event.index({ 'talks.assets.type': 1 });

var Tweet = new Schema({
    tweet_id    : String
  , tweet       : String
  , postedAt    : Date
  , user        : String
  , avatarUrl   : String
  , hashes      : [String]
});

Event.statics.getAll = function (callback) {
  var promise = new Promise;
  if (callback) promise.addBack(callback);
  this.find({}, promise.resolve.bind(promise));
  return promise;
};

Event.statics.getCurrent = function (callback) {
  var promise = new Promise;
  if (callback) promise.addBack(callback);
  this.find({ startsAt: { $lt: new Date }, endsAt: { $gt: new Date } }, promise.resolve.bind(promise));
  return promise;
};

Event.statics.getUpcoming = function (callback) {
  var promise = new Promise;
  if (callback) promise.addBack(callback);
  this.find({ startsAt: { $gt: new Date() } }, promise.resolve.bind(promise));
  return promise;
};

exports.Event = mongoose.model('Event', Event);

