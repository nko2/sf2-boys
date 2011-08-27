/**
 * deploy check-in
 */
require('nko')('UJuIrlX5JM5B0V/g');

/**
 * Parameters
 */
var parameters = {
    twitter: {
        consumerKey:       'DROXwWEJw3tXjU4YJpZLw'
      , consumerSecret:    'pwv1Nvlvi3PcQ9fwkojiUd933prElu60Iu8FNAonwcI'
      , accessToken:       '9881092-BZ6uQiCxPvq4qKhsNu4ptEl2jDXbH9O2HKfVnFDCkA'
      , accessTokenSecret: '6LNRCRMdg6LE2egHAZLFLcVUWxBDIvgaafG6LKCtec4'
    },
    mongodb: {
        user:     'user'
      , password: '111111'
      , server:   'staff.mongohq.com:10090'
      , database: 'twalks'
    }
};

/**
 * Module dependencies.
 */
var express   = require('express')
  , everyauth = require('everyauth')
  , users     = require('./lib/users')
  , schema    = require('./lib/schema')
  , poller    = require('./lib/poller')
  , mongoose  = require('mongoose')
  , sys       = require('sys')
  , Twitter   = require('twitter')
;

everyauth.twitter
    .consumerKey(parameters.twitter.consumerKey)
    .consumerSecret(parameters.twitter.consumerSecret)
    .findOrCreateUser(function(session, accessToken, accessTokenSecret, userData) {
        return users.createUserFromTwitterData(userData);
    })
    .redirectPath('/')
;

mongoose
    .connect('mongodb://'+parameters.mongodb.user+':'+parameters.mongodb.password+'@'+parameters.mongodb.server+'/'+parameters.mongodb.database)
;


var app  = module.exports = express.createServer()
  , twit = new Twitter({
        consumer_key: parameters.twitter.consumerKey,
        consumer_secret: parameters.twitter.consumerSecret,
        access_token_key: parameters.twitter.accessToken,
        access_token_secret: parameters.twitter.accessTokenSecret
    });

// start polling existing events
schema.Event.find({}, function (err, events) {
    events.forEach(function(event) {
        var poll = poller.createPoller(twit, event.hash);
        poll.on('data', function(response) {
            if (typeof response.results !== "undefined") {
                response.results.forEach(function(tweet) {
                    event.tweets.push({
                        tweet_id: tweet.id_str,
                        tweet: tweet.text,
                        postedAt: new Date(tweet.created_at),
                        user: tweet.from_user,
                        hashes: tweet.text.split(' ').filter(function(word) {
                                    return word[0] === "#";
                                }).map(function(hashCandidate) {
                                    return hashCandidate.replace(/[^0-9]/g, '');
                                })
                    });
                    event.save();
                });
            }
        });
        poll.startPolling();
    });
});

// Configuration
app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({secret: "dbe811f8f1b8ea"}));
  app.use(everyauth.middleware());
  app.use(express.methodOverride());
  app.use(app.router);
  app.set('view engine', 'ejs');
  app.use(express.static(__dirname + '/public'));
  app.set('views', __dirname + '/views');
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', function(req, res){
    res.render('welcome', {});
});

app.get('/events.json', function(req, res){
    schema.Event.find({}, function (err, events) {
        res.contentType('json');
        if (err) {
            console.log(err);
        }
        res.end(JSON.stringify(events));
    });
});

app.get('/events/:id.json', function(req, res) {
    schema.Event.findOne({_id: req.params.id}, function(err, event) {
        res.contentType('json');
        if (err) {
            console.log(err);
        }
        res.end(JSON.stringify(event));
    })
});

app.get('/events/1', function(req, res){
    res.render('event', {});
});

app.get('/events/1/1', function(req, res){
    res.render('talk', {});
});

app.get('/events.json', function(req, res){
    res.send(schema.Event.getAll());
});

app.get('/form', function(req, res){
    res.render('form', {});
});

everyauth.helpExpress(app);
app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
