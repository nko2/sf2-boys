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

var Event = new Schema({
    hash         : { type: String, required: true, match: /^\#[_a-zA-Z0-9]{2,}$/, index: true }
  , name         : { type: String, required: true }
  , startsAt     : Date
  , endsAt       : Date
  , lastSync     : Date
  , imageUrl     : { type: String, match: /^$|^https?\:\/\// }
  , description  : String
  , author       : { type: String, requried: true }
  , location     : { type: String, required: true }
  , tweets       : [Tweet]
  , participants : [String]
  , assets       : [Asset]
});

Event.index({ 'tweets.tweet_id': 1 });
Event.index({ 'assets.type': 1 });

var Tweet = new Schema({
    tweetId     : String
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
  this.find({ startsAt: { $lte: new Date }, endsAt: { $gte: new Date } }, promise.resolve.bind(promise));
  return promise;
};

Event.statics.getUpcoming = function (callback) {
  var promise = new Promise;
  if (callback) promise.addBack(callback);
  this.find({ startsAt: { $gte: new Date() } }, promise.resolve.bind(promise));
  return promise;
};

exports.Event = mongoose.model('Event', Event);

var Job = new Schema({
    createdAt : Date,
    status    : {type: String, index: true},
    id        : Schema.ObjectId
});

exports.Job = mongoose.model('Job', Job);
