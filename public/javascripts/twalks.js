(function($) {
    // Replace ERB-style delimiters for Underscore templates
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
      , evaluate:    /\{\%(.+?)\%\}/g
    };

    // Enable close button on alert messages
    $('.alert-message a.close').live('click', function(ev) {
        $(this).parent().slideUp('fast', function(){ $(this).remove(); });
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

    var clearAlertMessages = function() {
        $('#bb-content .alert-message').remove();
    }

    var fieldError = function(field, error) {
        var pos = $(field).position()
          , height = $(field).height()
          , width = $(field).width()
          , msg;

        if ('required' == error.type) {
            msg = 'The '+error.path+' is required.';
        } else if ('regexp' == error.type) {
            msg = 'The '+error.path+' is invalid.';
        } else {
            msg = 'Something is wrong with this field, but we\'re not sure why.';
        }

        $('<div class="twipsy right field-error"><div class="twipsy-arrow"></div><div class="twipsy-inner"></div>')
            .children('.twipsy-inner')
                .text(msg)
                .end()
            .insertAfter(field)
            .css('top', pos.top)
            .css('left', pos.left + width + 15);
    }

    var clearFieldErrors = function() {
        $('#bb-content .field-error').remove();
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
            this.router = new App.Routers.Events();
            Backbone.history.start();
        }
    };

    /**
     * :: Models
     */
    App.Models.Event = Backbone.Model.extend({
        url: function() {
            return '/events/' + (this.isNew() ? 'new' : this.id) + '.json';
        }
    });

    App.Models.Tweet = Backbone.Model.extend({});

    App.Models.Asset = Backbone.Model.extend({});

    /**
     * :: Collections
     */
    App.Collections.Events = Backbone.Collection.extend({
        model: App.Models.Event
      , url:   '/events.json'
    });

    App.Collections.EventsCurrent = App.Collections.Events.extend({
        url:   '/events/current.json'
    });

    App.Collections.EventsUpcoming = Backbone.Collection.extend({
        url:   '/events/upcoming.json'
    });

    App.Collections.EventsMy = Backbone.Collection.extend({
        url:   '/events/my.json'
    });

    App.Collections.EventTweets = Backbone.Collection.extend({
        model: App.Models.Tweet
      , url:   function() {
            return '/events/' + this.eventId + '/tweets.json';
        }
      , initialize: function(models, options) {
            this.eventId = options.eventId;
        }
    });

    App.Collections.EventPhotos = Backbone.Collection.extend({
        model: App.Models.Asset
      , url:   function() {
            return '/events/' + this.eventId + '/assets/photo.json';
        }
      , initialize: function(models, options) {
            this.eventId = options.eventId;
        }
    });

    App.Collections.EventVideos = Backbone.Collection.extend({
        model: App.Models.Asset
      , url:   function() {
            return '/events/' + this.eventId + '/assets/video.json';
        }
      , initialize: function(models, options) {
            this.eventId = options.eventId;
        }
    });

    /**
     * :: Views
     */
    App.Views.Event = Backbone.View.extend({
        initialize: function(options) {
            this.talksCollection  = options.talksCollection;
            this.tweetsCollection = options.tweetsCollection;
            this.photosCollection = options.photosCollection;
            this.videosCollection = options.videosCollection;
            this.template         = _.template($('#event-show-template').html());
        }
      , render: function() {
            $(this.el).html(this.template(this.model.toJSON()));

            var self         = this,
                $tabsContent = this.$('.event-footer-content');

            this.$('.tabs .tweets a').click(function() {
                self.$('.tabs li.active').removeClass('active');
                $(this).parent().addClass('active');

                self.tweetsCollection.fetch({ success: function() {
                    var view = new App.Views.TweetsList({ collection: self.tweetsCollection });
                    $tabsContent.empty().append(view.render().el);
                }});
            }).click();

            this.$('.tabs .photos a').click(function() {
                self.$('.tabs li.active').removeClass('active');
                $(this).parent().addClass('active');

                self.photosCollection.fetch({ success: function() {
                    var view = new App.Views.PhotosList({ collection: self.photosCollection });
                    $tabsContent.empty().append(view.render().el);
                }});
            });

            this.$('.tabs .videos a').click(function() {
                self.$('.tabs li.active').removeClass('active');
                $(this).parent().addClass('active');

                self.videosCollection.fetch({ success: function() {
                    var view = new App.Views.VideosList({ collection: self.videosCollection });
                    $tabsContent.empty().append(view.render().el);
                }});
            });

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
            if (this.collection.length > 0) {
                var $list;

                $(this.el).html(this.template({}));
                $list = this.$('.list');

                this.collection.each(function(event) {
                    var view = new App.Views.EventsListEvent({ model: event });
                    $list.append(view.render().el);
                });
            } else {
                $(this.el).html($('#events-list-empty-template').html());
            }

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

    App.Views.PhotosList = App.Views.Event.extend({
        initialize: function() {
            this.template = _.template($('#photos-list-template').html());
        }
      , render: function() {
            $(this.el).html(this.template({ 'photos': this.collection.toJSON() }));
            $(this.el).find('a.fancybox-group').attr('rel', 'gallery').fancybox();

            return this;
        }
    });

    App.Views.VideosList = App.Views.Event.extend({
        initialize: function() {
            this.template = _.template($('#videos-list-template').html());
        }
      , render: function() {
            $(this.el).html(this.template({ 'videos': this.collection.toJSON() }));

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
            var self  = this
              , msg   = this.model.isNew() ? 'Successfully created!' : 'Saved!'
              , data  = this.$('form').serializeObject();

            data.hash = '#' + data.hash;
            console.log(data);
            this.$('form .error').removeClass('error');
            clearAlertMessages();
            clearFieldErrors();

            this.model.save(data, {
                success: function(model, err) {
                    self.model = model;
                    self.render();
                    self.delegateEvents();

                    window.App.router.navigate('events/' + model.get('_id'), true);
                }
              , error: function(model, err) {
                    if (403 == err.status) {
                        alertMessage('warning', 'You must be signed in to submit this form. Please sign in using the link at the top right.');
                        return;
                    }

                    alertMessage('error', 'Oops! There was a problem submitting this form. Please fix the errors below and try again.');
                    var errors = $.parseJSON(err.responseText)
                      , self   = this;

                    _.each(errors, function(error, name) {
                        var field = this.$('form .' + name)
                          , lastInput = $(field).find(':input:last');

                        field.addClass('error');
                        fieldError(lastInput, error);
                    });
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
            '':                     'home'
          , 'events/current':       'listCurrent'
          , 'events/upcoming':      'listUpcoming'
          , 'events/my':            'listMy'
          , 'events/new':           'createEvent'
          , 'events/:id/edit':      'editEvent'
          , 'events':               'listEvents'
          , 'events/:id':           'showEvent'
        }
      , initialize: function() {
            this.$container     = $('#bb-content');
            this.$navigation    = $('#navigation');
            this.$secondaryNav  = $('.secondary-nav', this.$navigation);
            this.eventsListView = new App.Views.EventsList({ collection: eventsCollection });
            this.$searchInput   = $('#search-form input');

            var self = this
              , timeout;

            this.$searchInput.keyup(function() {
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    if ('' !== self.$searchInput.val().replace(/^ +| +$/, '')) {
                        self.hideAndEmptyContainer(function() {
                            self.listEvents(true);
                        });
                    }
                    clearTimeout(timeout);
                }, 500);
            });
        }
      , home: function() {
            if ($('#navigation .user.menu.loggedIn').length) {
                this.navigate('events/my', true);
                return;
            }

            $('li.active', this.$navigation).removeClass('active');

            var self = this;
            this.hideAndEmptyContainer(function() {
                document.title = 'Twalks';
                self.displayContainer($('#welcome-template').html());
                self.$searchInput.val('');
            });
        }
      , createEvent: function() {
            $('li.active', this.$navigation).removeClass('active');
            $('li.new-event', this.$navigation).addClass('active');

            var self = this;
            this.hideAndEmptyContainer(function() {
                document.title = 'New event :: Twalks';
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
                        document.title = 'Edit '+model.get('name')+' :: Twalks';
                        self.displayContainer(eventFormView.render().el);
                    });
                }
              , error: function() {
                    self.hideProgressBar();
                    self.navigate('', true);
                }
            });
      }
      , listEvents: function(withoutAnimation) {
            this.showProgressBar();

            $('li.active', this.$navigation).removeClass('active');
            $('li.all-events', this.$navigation).addClass('active');

            var self   = this
              , filter = this.$searchInput.val().replace(/^ +| +$/, '');
            if ('' !== filter) {
                eventsCollection.url = '/events.json?q='+filter;
            } else {
                eventsCollection.url = '/events.json';
            }

            eventsCollection.fetch({
                success: function() {
                    if (withoutAnimation) {
                        self.displayContainer(self.eventsListView.render().el);
                    } else {
                        self.hideAndEmptyContainer(function(){
                            document.title = 'Events :: Twalks';
                            self.displayContainer(self.eventsListView.render().el);
                        });
                    }
                }
              , error: function(){
                    alertMessage('warning', 'We encountered an error fetching your events.');
                }
            });
        }
      , listMy: function() {
            this.showProgressBar();

            $('li.active', this.$navigation).removeClass('active');
            $('li.my-events', this.$navigation).addClass('active');

            var self = this
              , collection = new App.Collections.EventsMy
              , listView = new App.Views.EventsList({ collection: collection });

            collection.fetch({
                success: function() {
                    self.hideAndEmptyContainer(function() {
                        document.title = 'My events :: Twalks';
                        self.displayContainer(listView.render().el);
                    });
                }
              , error: function(model, err){
                    if (403 == err.status) {
                        alertMessage('warning', 'You must be signed in to view your events. Please sign in using the link at the top right.');
                        return;
                    }

                    alertMessage('warning', 'We encountered an error fetching your events.');
                }
            });
        }
      , listCurrent: function() {
            this.showProgressBar();

            $('li.active', this.$navigation).removeClass('active');
            $('li.current-events', this.$navigation).addClass('active');

            var self = this
              , collection = new App.Collections.EventsCurrent
              , listView = new App.Views.EventsList({ collection: collection });

            collection.fetch({
                success: function() {
                    self.hideAndEmptyContainer(function() {
                        document.title = 'Ongoing events :: Twalks';
                        self.displayContainer(listView.render().el);
                    });
                }
              , error: function(){
                    alertMessage('warning', 'We encountered an error fetching ongoing events.');
                }
            });
        }
      , listUpcoming: function() {
            this.showProgressBar();

            $('li.active', this.$navigation).removeClass('active');
            $('li.upcoming-events', this.$navigation).addClass('active');

            var self = this
              , collection = new App.Collections.EventsUpcoming
              , listView = new App.Views.EventsList({ collection: collection });

            collection.fetch({
                success: function() {
                    self.hideAndEmptyContainer(function() {
                        document.title = 'Upcomming events :: Twalks';
                        self.displayContainer(listView.render().el);
                    });
                }
              , error: function(){
                    alertMessage('warning', 'We encountered an error fetching upcoming events.');
                }
            });
        }
      , showEvent: function(id) {
            this.showProgressBar();

            $('li.active', this.$navigation).removeClass('active');

            var event = new App.Models.Event({ 'id': id })
              , view  = new App.Views.Event({
                    model:             event
                  , tweetsCollection:  new App.Collections.EventTweets([], { 'eventId': id })
                  , photosCollection:  new App.Collections.EventPhotos([], { 'eventId': id })
                  , videosCollection:  new App.Collections.EventVideos([], { 'eventId': id })
                })
              , self  = this
            ;

            event.fetch({
                success: function() {
                    self.hideAndEmptyContainer(function(){
                        document.title = event.get('name') + ' :: Twalks';
                        self.displayContainer(view.render().el);
                    });
                }
              , error: function(){
                    alertMessage('warning', 'We encountered an error fetching this event.');
                }
            });
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

    String.prototype.parseTweet = function() {
        var parsed =  this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function(url) {
            return url.link(url);
        });

        parsed = parsed.replace(/[@]+[A-Za-z0-9-_]+/g, function(u) {
            var username = u.replace("@","")
            return u.link("http://twitter.com/" + username);
        });

        parsed =  parsed.replace(/[#]+[A-Za-z0-9-_]+/g, function(t) {
            var tag = t.replace("#", "%23")
            return t.link("http://search.twitter.com/search?q=" + tag);
        });

        return parsed;
    }
})(jQuery);
