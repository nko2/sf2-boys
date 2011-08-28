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

    App.Models.Event = Backbone.Model.extend({
        url : function() {
            return this.isNew() ? 'event/new' : 'event/' + this.id;
        }
    });

    App.Collections.Event = Backbone.Collection.extend({
        model: App.Models.Event
      , url:   '/events.json'
    });

    App.Collections.EventsCurrent = Backbone.Collection.extend({
        model: App.Models.Event
      , url:   '/currentEvents.json'
    });

    App.Collections.EventsUpcoming = Backbone.Collection.extend({
        model: App.ModelsEvent
      , url:   '/upcomingEvents.json'
    });

    App.Views.Event = Backbone.View.extend({
        initialize: function() {
            this.template = _.template($('#event-show-template').html());
        }
      , render: function() {
            $(this.el).html(this.template(this.model.toJSON()));

            return this;
        }
    });

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

    var eventsCollection = new App.Collections.Event();

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
            var self = this;
            this.hideAndEmptyContainer(function() {
                var eventFormView = new App.Views.EventForm({ model: new App.Models.Event() });
                self.displayContainer(eventFormView.render().el);
            });
      }
      , editEvent: function(id) {
            this.showProgressBar();

            var event = new App.Models.Event({ id: id })
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

            var event = new App.Models.Event()
              , view  = new App.Views.Event({ model: event })
              , self  = this;

            event.fetch({ url: '/events/'+id+'.json' , success: function() {
                self.hideAndEmptyContainer(function(){
                    self.displayContainer(view.render().el);
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
