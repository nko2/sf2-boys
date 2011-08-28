(function($) {
    // Replace ERB-style delimiters for Underscore templates
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
      , evaluate:    /\{\%(.+?)\%\}/g
    };

    // Enable close button on alert messages
    $('.alert-message a.close').live('click', function(ev) {
        $(this).parent().remove();
        ev.preventDefault();
    });

    var alertMessage = function(type, msg) {
        if (-1 == ['error', 'info' , 'success', 'warning'].indexOf(type)) {
            return;
        }

        $('<div class="alert-message"><a href="#" class="close">×</a><p></p></div>')
            .addClass(type)
            .children('p')
                .text(msg)
                .end()
            .prependTo('#bb-content');
    }

    // see: http://stackoverflow.com/questions/1184624/serialize-form-to-json-with-jquery
    $.fn.serializeObject = function() {
        var o = {}
          , a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };

    var App = {
        Collections: {}
      , Models: {}
      , Routers: {}
      , Views: {}
      , init: function() {
            new App.Routers.Events();
            Backbone.history.start();
        }
    }

    /**
     * :: Models
     */
    App.Models.Event = Backbone.Model.extend({
        url: function() {
            return '/events/' + (this.isNew() ? 'new' : this.id) + '.json';
        }
    });

    App.Models.Talk = Backbone.Model.extend({
        url: function() {
            return '/events/' + this.eventId + '/' + (this.isNew() ? 'new' : this.id) + '.json';
        }
    });

    App.Models.Tweet = Backbone.Model.extend({});

    /**
     * :: Collections
     */
    App.Collections.Events = Backbone.Collection.extend({
        model: App.Models.Event
      , url:   '/events.json'
    });

    App.Collections.EventsCurrent = Backbone.Collection.extend({
        model: App.Models.Event
      , url:   '/currentEvents.json'
    });

    App.Collections.EventsUpcoming = Backbone.Collection.extend({
        model: App.Models.Event
      , url:   '/upcomingEvents.json'
    });

    App.Collections.Talks = Backbone.Collection.extend({
        model: App.Models.Talk
      , url:   function() {
            return '/events/' + this.eventId + '/talks.json';
        }
    });

    App.Collections.EventTweets = Backbone.Collection.extend({
        model: App.Models.Tweet
      , url:   function() {
            return '/events/' + this.eventId + '/tweets.json';
        }
    });

    App.Collections.TalkTweets = Backbone.Collection.extend({
        model: App.Models.Tweet
      , url:   function() {
            return '/events/' + this.eventId + '/talks/' + this.talkId + '/tweets.json';
        }
    });

    /**
     * :: Views
     */
    App.Views.Event = Backbone.View.extend({
        initialize: function() {
            this.template = _.template($('#event-show-template').html());
        }
      , render: function() {
            $(this.el).html(this.template(this.model.toJSON()));

            return this;
        }
    });

    App.Views.EventsListEvent = App.Views.Event.extend({
        tagName: 'article'
      , initialize: function() {
            this.template = _.template($('#events-list-event-template').html());
        }
    });

    App.Views.EventsList = Backbone.View.extend({
        initialize: function() {
            _.bindAll(this, 'render');
            this.template = _.template($('#events-list-template').html());
            this.collection.bind('reset', this.render);
        }
      , render: function() {
            var $list;

            $(this.el).html(this.template({}));
            $list = this.$('.list');

            this.collection.each(function(event) {
                var view = new App.Views.EventsListEvent({ model: event });
                $list.append(view.render().el);
            });

            return this;
        }
    });

    App.Views.TalksList = App.Views.Event.extend({
        initialize: function() {
            this.template = _.template($('#talks-list-template').html());
        }
      , render: function() {
            var days = {}
              , self = this;

            this.collection
                .sortBy(function(talk) {
                    return talk.startsAt;
                })
                .forEach(function(talk) {
                    var day  = dateFormat(talk.startsAt, 'd mmmm yyyy')
                      , json = talk.toJSON();
                    json.eventId = self.collection.eventId;

                    if (!(day in days)) {
                        days[day] = [];
                    }

                    days[day].push(json);
                });

            $(this.el).html(this.template({ 'days': days }));

            return this;
        }
    });

    App.Views.TweetsList = App.Views.Event.extend({
        initialize: function() {
            this.template = _.template($('#tweets-list-template').html());
        }
      , render: function() {
            $(this.el).html(this.template({ 'tweets': this.collection.toJSON() }));

            return this;
        }
    });

    // :: Forms
    App.Views.EventForm = Backbone.View.extend({
        initialize: function() {
            this.template = _.template($('#event-form-template').html());
        }
      , events: {
            'submit form': 'save'
        }
      , render: function() {
            $(this.el).html(this.template({ model : this.model }));

            return this;
        }
      , save: function() {
            var self = this
              , msg = this.model.isNew() ? 'Successfully created!' : 'Saved!';

            this.model.save(this.$('form').serializeObject(), {
                success: function(model, res) {
                    alertMessage('info', msg);
                    self.model = model;
                    self.render();
                    self.delegateEvents();

                    Backbone.history.navigate('#event/' + model.id);
                }
              , error: function() {
                    alertMessage('error', 'An error occurred');
                }
            });

            return false;
        }
    });

    var eventsCollection = new App.Collections.Events();

    /**
     * :: Routers
     */
    App.Routers.Events = Backbone.Router.extend({
        routes: {
            '':                 'home'
          , 'events/new':       'createEvent'
          , 'events/:id/edit':  'editEvent'
          , 'events':           'listEvents'
          , 'events/:id':       'showEvent'
          , 'current':          'current'
          , 'upcoming':         'upcoming'
        }
      , initialize: function() {
            this.$container     = $('#bb-content');
            this.$navigation    = $('#navigation');
            this.$secondaryNav  = $('.secondary-nav', this.$navigation);
            this.eventsListView = new App.Views.EventsList({ collection: eventsCollection });
        }
      , home: function() {
            $('li.active', this.$navigation).removeClass('active');

            var self = this;
            this.hideAndEmptyContainer(function() {
                self.displayContainer($('#welcome-template').html());
            });
        }
      , createEvent: function() {
            $('li.active', this.$navigation).removeClass('active');
            $('li.new-event', this.$navigation).addClass('active');

            var self = this;
            this.hideAndEmptyContainer(function() {
                var eventFormView = new App.Views.EventForm({ model: new App.Models.Event() });
                self.displayContainer(eventFormView.render().el);
            });
      }
      , editEvent: function(id) {
            this.showProgressBar();

            $('li.active', this.$navigation).removeClass('active');

            var event = new App.Models.Event({ 'id': id })
              , self  = this;

            event.fetch({
                success: function(model, res) {
                    var eventFormView = new App.Views.EventForm({ model: event });
                    self.hideAndEmptyContainer(function() {
                        self.displayContainer(eventFormView.render().el);
                    });
                }
              , error: function() {
                    new Error({ message: 'Could not find that event.' });
                    this.navigate('', true);
                }
            });
      }
      , listEvents: function() {
            this.showProgressBar();

            $('li.active', this.$navigation).removeClass('active');
            $('li.all-events', this.$navigation).addClass('active');

            var self = this;
            eventsCollection.fetch({ success: function() {
                self.hideAndEmptyContainer(function(){
                    self.displayContainer(self.eventsListView.render().el);
                });
            }});
        }
      , showEvent: function(id) {
            this.showProgressBar();

            $('li.active', this.$navigation).removeClass('active');

            var event = new App.Models.Event({ 'id': id })
              , view  = new App.Views.Event({ model: event })
              , self  = this
              , eventTalksList = function(eventId) {
                    self.showProgressBar();

                    var collection = new App.Collections.Talks({ 'eventId': eventId })
                      , listView   = new App.Views.TalksList({ collection: collection });
                    collection.eventId = eventId;

                    collection.fetch({ success: function() {
                        self.hideProgressBar();
                        $('#talk-footer').empty().append(listView.render().el);
                    }});
                }
              , eventTweetsList = function(eventId) {
                    self.showProgressBar();

                    var collection = new App.Collections.EventTweets()
                      , listView   = new App.Views.TweetsList({ collection: collection });
                    collection.eventId = eventId;

                    collection.fetch({ success: function() {
                        self.hideProgressBar();
                        $('#talk-footer').empty().append(listView.render().el);
                    }});
                }
            ;

            event.fetch({ success: function() {
                self.hideAndEmptyContainer(function(){
                    self.displayContainer(view.render().el);

                    $('#event-show footer .tabs .talks a').click(function() {
                        $('#event-show footer .tabs li.active').removeClass('active');
                        $(this).parent().addClass('active');
                        eventTalksList(id);
                    }).click();

                    $('#event-show footer .tabs .tweets a').click(function() {
                        $('#event-show footer .tabs li.active').removeClass('active');
                        $(this).parent().addClass('active');
                        eventTweetsList(id);
                    });
                });
            }});
        }
      , current: function() {
            this.showProgressBar();

            $('li.active', this.$navigation).removeClass('active');
            $('li.current-events', this.$navigation).addClass('active');

            var self = this
              , collection = new App.Collections.EventsCurrent
              , listView = new App.Views.EventsList({ collection: collection });

            collection.fetch({ success: function() {
                self.hideAndEmptyContainer(function() {
                    self.displayContainer(listView.render().el);
                });
            }});
        }
      , upcoming: function() {
            this.showProgressBar();

            $('li.active', this.$navigation).removeClass('active');
            $('li.upcoming-events', this.$navigation).addClass('active');

            var self = this
              , collection = new App.Collections.EventsUpcoming
              , listView = new App.Views.EventsList({ collection: collection });

            collection.fetch({ success: function() {
                self.hideAndEmptyContainer(function() {
                    self.displayContainer(listView.render().el);
                });
            }});
        }
      , showProgressBar: function() {
            $('li.user', this.$secondaryNav).stop().hide();
            $('li.progress', this.$secondaryNav).stop().show();
        }
      , hideProgressBar: function() {
            var progress = $('li.progress', this.$secondaryNav);

            if (progress.is(':visible')) {
                progress.stop().hide();
                $('li.user', this.$secondaryNav).stop().show();
            }
        }
      , hideAndEmptyContainer: function(func) {
            var self = this;
            this.$container.fadeOut(300, function() {
                self.$container.empty();

                if (func) { func(); }
            });
        }
      , displayContainer: function(html) {
            this.hideProgressBar();
            this.$container.append(html);
            this.$container.fadeIn(500);
        }
    });

    window.App = App;
})(jQuery);
