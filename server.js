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
        startPolling();
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
    res.render('frontend', {
        flash:   req.flash()
      , layout:  false
    });
});

function andRequireUser(req, res, next) {
    req.loggedIn ? next() : next(new Error('Unauthorized'));
}

app.post('/events/new.json', andRequireUser, function(req, res){
    var event = new schema.Event({
        hash:        req.body.hash
      , name:        req.body.name
      , startsAt:    new Date(req.body.startsAtDate + ' ' + req.body.startsAtTime)
      , endsAt:      new Date(req.body.endsAtDate + ' ' + req.body.endsAtTime)
      , imageUrl:    req.body.imageUrl
      , overview:    req.body.overview
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

app.put('/events/:id', andRequireUser, function(req, res){
    schema.Event.findOne({_id: req.params.id}, function(err, event) {
        if (err) {
            console.log(err);
        } else {
            // TODO: save edited fields
        }
    })
});

app.get('/events.json', function(req, res){
    schema.Event.find({}, function (err, events) {
        res.contentType('json');
        if (err) {
            console.log(err);
        }

        var eventList = [];
        events.forEach(function(event, i) {
            event.set("numberOfTalks", event.talks.length);
            event.set("numberOfTweets", event.tweets.length);
            event.talks = [];
            event.tweets = [];

            eventList.push(event);
        });

        res.end(JSON.stringify(eventList));
    });
});

app.get('/events/:id.json', function(req, res) {
    schema.Event.findOne({_id: req.params.id}, function(err, event) {
        res.contentType('json');
        if (err) {
            console.log(err);
        }

        event.set("numberOfTalks", event.talks.length);
        event.set("numberOfTweets", event.tweets.length);
        event.talks = [];
        event.tweets = [];

        res.end(JSON.stringify(event));
    });
});

app.get('/events/:id/talks.json', function(req, res) {
    schema.Event.findOne({_id: req.params.id}, function(err, event) {
        res.contentType('json');
        if (err) {
            console.log(err);
        }

        var talksList = [];
        event.talks.forEach(function(talk, i) {
            talk.set("numberOfTweets", talk.tweets.length);
            talk.tweets = [];

            talksList.push(talk);
        });


        res.end(JSON.stringify(talksList));
    });
});

app.get('/events/:id/talks/:num.json', function(req, res) {
    schema.Event.findOne({_id: req.params.id}, function(err, event) {
        res.contentType('json');
        if (err) {
            console.log(err);
        }

        talk = event.talks[req.params.num];
        talk.set('num', req.params.num);
        talk.set('event', {
            '_id':       event._id
          , 'name':      event.name
          , 'hash':      event.hash
          , 'location':  event.location
        });

        res.end(JSON.stringify(talk));
    });
});

app.get('/events/:id/talks/:num/tweets.json', function(req, res) {
    schema.Event.findOne({_id: req.params.id}, function(err, event) {
        res.contentType('json');
        if (err) {
            console.log(err);
        }

        talk = event.talks[req.params.num];

        res.end(JSON.stringify(talk.tweets));
    });
});

app.get('/events/:id/tweets.json', function(req, res) {
    schema.Event.findOne({_id: req.params.id}, function(err, event) {
        res.contentType('json');
        if (err) {
            console.log(err);
        }

        res.end(JSON.stringify(event.tweets));
    });
});

app.get('/currentEvents.json', function(req, res){
    schema.Event.getCurrent(function (err, events) {
        res.contentType('json');
        if (err) {
            console.log(err);
        }

        var eventList = [];
        events.forEach(function(event, i) {
            event.set("numberOfTalks", event.talks.length);
            event.set("numberOfTweets", event.tweets.length);
            event.talks = [];
            event.tweets = [];

            eventList.push(event);
        });

        res.end(JSON.stringify(eventList));
    });
});

app.get('/upcomingEvents.json', function(req, res){
    schema.Event.getUpcoming(function (err, events) {
        res.contentType('json');
        if (err) {
            console.log(err);
        }

        var eventList = [];
        events.forEach(function(event, i) {
            event.set("numberOfTalks", event.talks.length);
            event.set("numberOfTweets", event.tweets.length);
            event.talks = [];
            event.tweets = [];

            eventList.push(event);
        });

        res.end(JSON.stringify(eventList));
    });
});

everyauth.helpExpress(app);
app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
