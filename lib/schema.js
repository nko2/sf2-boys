var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , Promise  = require("promise").Promise
;

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

