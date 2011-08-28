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
  , spawn     = require('child_process').spawn
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

var child, jobs = [];

function startPolling() {
    var restart = true;

    // Queue polling jobs for the poller script
    schema.Event.find({}, function (err, events) {
        events.forEach(function(event) {
            schema.Job.count({status: 'run', id: event.id}, function(err, count) {
                if (0 === count) {
                    var job = new schema.Job({
                        id:        event.id
                      , createdAt: new Date()
                      , status:    'new'
                    })
                    job.save();
                    jobs.push(job);
                }
            })
        });
    });

    child = spawn('node', ['scripts/poller.js']);

    child.on('exit', function (code) {
        jobs.forEach(function(job) {
            job.status = 'old';
            job.save();
        });

        if (restart) {
            startPolling();
        }
    });

    process.on('SIGINT', function () {
        restart = false;
        child.kill();
        process.exit();
    });

    process.on('SIGTERM', function() {
        restart = false;
        child.kill();
        process.exit();
    });
}

startPolling();

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
    res.render('frontend', { layout:  false });
});

function andRequireUser(req, res, next) {
    req.loggedIn ? next() : res.send('Unauthorized', 403);
}

app.post('/events/new.json', andRequireUser, function(req, res){
    var event = new schema.Event({
        hash:        req.body.hash
      , name:        req.body.name
      , startsAt:    new Date(req.body.startsAtDate + ' ' + req.body.startsAtTime)
      , endsAt:      new Date(req.body.endsAtDate + ' ' + req.body.endsAtTime)
      , imageUrl:    req.body.imageUrl
      , location:    req.body.location
      , description: req.body.description
      , author:      req.session.auth.twitter.user.name
    });

    event.save(function(err, model){
        if (err) {
            res.send(JSON.stringify(err.errors), 403);
        } else {
            var job = new schema.Job({
                id:        model.id
              , createdAt: new Date()
              , status:    'new'
            })
            job.save();
            jobs.push(job);
            res.json(model);
        }
    });
});

app.put('/events/:id.json', andRequireUser, function(req, res){
    schema.Event.findOne({_id: req.params.id}, function(err, event) {
        if (err) {
            res.send('Can not find event', 404);
        } else if (event.get('author') !== req.session.auth.twitter.user.name) {
            res.send('You have no rights', 403);
        } else {
            event.set('name'        , req.body.name);
            event.set('hash'        , req.body.hash);
            event.set('startsAt'    , new Date(req.body.startsAtDate + ' ' + req.body.startsAtTime));
            event.set('endsAt'      , new Date(req.body.endsAtDate + ' ' + req.body.endsAtTime));
            event.set('imageUrl'    , req.body.imageUrl);
            event.set('location'    , req.body.location);
            event.set('description' , req.body.description);

            event.save(function(err, model){
                if (err) {
                    res.send(JSON.stringify(err.errors), 403);
                } else {
                    res.json(model);
                }
            });
        }
    });
});

app.get('/events.json', function(req, res){
    schema.Event.find({}, function (err, events) {
        if (err) {
            console.log(err);
            res.json({error: true}, 500);
            return;
        }

        var eventList = [];
        events.sort(function(a, b) {
            var now = new Date().getTime()
              , aTime = a.endsAt.getTime()
              , bTime = b.endsAt.getTime();

            if (aTime === bTime) {
                return 0;
            }

            if (now < aTime && now > bTime) {
                return 1;
            }

            if (now < bTime && now > aTime) {
                return 1;
            }

            return aTime > bTime ? 1 : -1
        }).forEach(function(event, i) {
            if (typeof req.query.q !== "undefined" &&
                [  event.hash
                 , event.name
                 , event.description
                 , event.author
                ].join(" ").search(new RegExp(req.query.q)) === -1) {
                return;
            }

            event.set("tweetsCount", event.tweets.length);
            event.set("assetsCount", event.assets.length);
            event.tweets = [];
            event.assets = [];

            eventList.push(event);
        });

        res.json(eventList, 200);
    });
});

app.get('/events/my.json', andRequireUser, function(req, res) {
    schema.Event.find({author: req.session.auth.twitter.user.name}, function(err, events) {
        if (err) {
            console.log(err);
            res.json({error: true}, 500);
            return;
        }

        var eventList = [];
        events.sort(function(a, b) {
            var aTime = a.endsAt.getTime()
              , bTime = b.endsAt.getTime();

            if (aTime === bTime) {
                return 0;
            }
            return aTime > bTime ? -1 : 1
        }).forEach(function(event, i) {
            event.set("tweetsCount", event.tweets.length);
            event.set("assetsCount", event.assets.length);
            event.tweets = [];
            event.assets = [];

            eventList.push(event);
        });

        res.json(eventList, 200);
    });
});

app.get('/events/current.json', function(req, res){
    schema.Event.getCurrent(function (err, events) {
        if (err) {
            console.log(err);
            res.json({error: true}, 500);
            return;
        }

        var eventList = [];
        events.sort(function(a, b) {
            var aTime = a.endsAt.getTime()
              , bTime = b.endsAt.getTime();

            if (aTime === bTime) {
                return 0;
            }
            return aTime > bTime ? -1 : 1
        }).forEach(function(event, i) {
            event.set("tweetsCount", event.tweets.length);
            event.set("assetsCount", event.assets.length);
            event.tweets = [];
            event.assets = [];

            eventList.push(event);
        });

        res.json(eventList, 200);
    });
});

app.get('/events/upcoming.json', function(req, res){
    schema.Event.getUpcoming(function (err, events) {
        if (err) {
            console.log(err);
            res.json({error: true}, 500);
            return;
        }

        var eventList = [];
        events.sort(function(a, b) {
            var aTime = a.endsAt.getTime()
              , bTime = b.endsAt.getTime();

            if (aTime === bTime) {
                return 0;
            }
            return aTime > bTime ? -1 : 1
        }).forEach(function(event, i) {
            event.set("tweetsCount", event.tweets.length);
            event.set("assetsCount", event.assets.length);
            event.tweets = [];
            event.assets = [];

            eventList.push(event);
        });

        res.json(eventList, 200);
    });
});

app.get('/events/:id.json', function(req, res) {
    schema.Event.findOne({_id: req.params.id}, function(err, event) {
        if (err) {
            console.log(err);
            res.json({error: true}, 500);
            return;
        }

        event.set("tweetsCount", event.tweets.length);
        event.set("assetsCount", event.assets.length);
        event.tweets = [];
        event.assets = [];

        res.json(event, 200);
    });
});

app.get('/events/:id/tweets.json', function(req, res) {
    schema.Event.findOne({_id: req.params.id}, function(err, event) {
        if (err) {
            console.log(err);
            res.json({error: true}, 500);
            return;
        }

        res.json(event.tweets.sort(function(a, b) {
            var aTime = a.postedAt.getTime()
              , bTime = b.postedAt.getTime();

            if (aTime === bTime) {
                return 0;
            }
            return aTime < bTime ? 1 : -1
        }), 200);
    });
});

app.get('/events/:id/assets/:type.json', function(req, res) {
    schema.Event.findOne({_id: req.params.id}, function(err, event) {
        if (err) {
            console.log(err);
            res.json({error: true}, 500);
            return;
        }

        res.json(event.assets.filter(function(asset) {
            return asset.type === req.params.type;
        }), 200);
    });
});

everyauth.helpExpress(app);
app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

// deploy
