/**
 * deploy check-in
 */
require('nko')('UJuIrlX5JM5B0V/g');

/**
 * Params
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
  , links     = require('./lib/links_parser').Parser
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
    var mapper = function(tweet) {
        return tweet.tweet_id
    };
    var tweetToDoc = function(tweet) {
        return {
            tweet_id: tweet.id_str,
            tweet: tweet.text,
            postedAt: new Date(tweet.created_at),
            user: tweet.from_user,
            avatarUrl: tweet.profile_image_url,
            hashes: tweet.text.split(' ').filter(function(word) {
                        return word[0] === "#";
                    }).map(function(hashCandidate) {
                        return hashCandidate.replace(/[^A-z0-9]/g, '');
                    })
        }
    }
    events.forEach(function(event) {
        var poll = poller.createPoller(twit, event.hash);
        poll.on('data', function(response) {
            if (typeof response.results !== "undefined") {
                response.results.forEach(function(tweet) {
                    var tweet_doc = tweetToDoc(tweet);
                    if (event.tweets.map(mapper).indexOf(tweet_doc.tweet_id) === -1) {
                        if (event.participants.indexOf(tweet_doc.user) === -1) {
                            event.participants.push(tweet_doc.user);
                        }
                        event.tweets.push(tweet_doc);
                        links.parse(tweet_doc.tweet, function(media) {
                            if (media.type === "error") {
                                return;
                            }
                            if (event.assets.map(function(asset) {
                                    return asset.url;
                                }).indexOf(media.url) !== -1) {
                                return;
                            }
                            event.assets.push({
                                author       : tweet_doc.user
                              , type         : media.type
                              , asset_author : (media.author_name || '')
                              , provider     : (media.provider_name || '')
                              , provider_url : (media.provider_url || '')
                              , title        : (media.title || '')
                              , description  : (media.description || '')
                              , url          : (media.url || '')
                              , height       : (media.height || '')
                              , width        : (media.width || '')
                              , html         : (media.html || '')
                            });
                            event.save();
                        });
                    }
                    event.talks.forEach(function(talk) {
                        if (tweet_doc.hashes.indexOf(talk.hash.substring(1)) !== -1 &&
                            talk.tweets.map(mapper).indexOf(tweet_doc.tweet_id) === -1) {
                            if (talk.participants.indexOf(tweet_doc.user) === -1) {
                                talk.participants.push(tweet_doc.user);
                            }
                            talk.tweets.push(tweet_doc);
                            links.parse(tweet_doc.tweet, function(media) {
                                if (media.type === "error") {
                                    return;
                                }
                                if (talk.assets.map(function(asset) {
                                        return asset.url;
                                    }).indexOf(media.url) !== -1) {
                                    return;
                                }
                                talk.assets.push({
                                    author       : tweet_doc.user
                                  , type         : media.type
                                  , asset_author : (media.author_name || '')
                                  , provider     : (media.provider_name || '')
                                  , provider_url : (media.provider_url || '')
                                  , title        : (media.title || '')
                                  , description  : (media.description || '')
                                  , url          : (media.url || '')
                                  , height       : (media.height || '')
                                  , width        : (media.width || '')
                                  , html         : (media.html || '')
                                });
                                event.save();
                            });
                            
                        }
                    });
                });
                event.lastSync = new Date();
                event.save();
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
    res.render('welcome', {
        flash: req.flash()
    });
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

app.get('/currentEvents.json', function(req, res){
    schema.Event.getCurrent(function (err, events) {
        res.contentType('json');
        if (err) {
            console.log(err);
        }
        res.end(JSON.stringify(events));
    });
});

app.get('/upcomingEvents.json', function(req, res){
    schema.Event.getUpcoming(function (err, events) {
        res.contentType('json');
        if (err) {
            console.log(err);
        }
        res.end(JSON.stringify(events));
    });
});

function andRequireUser(req, res, next) {
    req.loggedIn ? next() : next(new Error('Unauthorized'));
}

app.get('/form', andRequireUser, function(req, res){
    res.render('form', { layout: 'staticLayout' });
});

everyauth.helpExpress(app);
app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
