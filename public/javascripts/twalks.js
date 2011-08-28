(function($) {
    // Replace ERB-style delimiters for Underscore templates
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
      , evaluate:    /\{\%(.+?)\%\}/g
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
            return this.isNew() ? 'events' : 'events/' + this.id;
        }
    });

    App.Collections.Event = Backbone.Collection.extend({
        model: App.Models.Event
      , url:   '/events.json'
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
      , render: function() {
            $(this.el).html(this.template({ model : this.model }));

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

    var eventsCollection = new App.Collections.Event();

    App.Routers.Events = Backbone.Router.extend({
        routes: {
            '':             'home'
          , 'event/new':    'createEvent'
          , 'event/:id':    'editEvent'
          , 'events':       'listEvents'
          , 'events/:id':   'showEvent'
          , 'current':      'current'
        }
      , initialize: function() {
            this.$container     = $('#bb-content');
            this.$navigation    = $('#navigation');
            this.eventsListView = new App.Views.EventsList({ collection: eventsCollection });
        }
      , home: function() {
            this.empty();
            this.$container.append($('#welcome-template').html());
        }
      , createEvent: function() {
            this.empty();
            var eventFormView = new App.Views.EventForm({ model: new App.Models.Event() });
            this.$container.append(eventFormView.render().el);
      }
      , editEvent: function(id) {
            this.empty();
            var event = new App.Models.Event({ id: id });

            event.fetch({
                success: function(model, res) {
                    var eventFormView = new App.Views.EventForm({ model: event });
                    self.$container.append(eventFormView.render().el);
                }
              , error: function() {
                    new Error({ message: 'Could not find that event.' });
                    window.location.hash = '#';
                }
            });
      }
      , listEvents: function() {
            this.empty();
            $('li.all-events', this.$navigation).addClass('active');

            var self = this;
            eventsCollection.fetch({ success: function() {
                self.$container.append(self.eventsListView.render().el);
            }});
        }
      , showEvent: function(id) {
            this.empty();
            var event = new App.Models.Event()
              , view  = new App.Views.Event({ model: event })
              , self  = this;

            event.fetch({ url: '/events/'+id+'.json' , success: function() {
                self.$container.append(view.render().el);
            }});
        }
      , current: function() {
            this.empty();
            $('li.current-events', this.$navigation).addClass('active');

            var self = this;
            eventsCollection.fetch({ success: function() {
                self.$container.append(self.eventsListView.render().el);
            }});
        }
      , empty: function() {
            $('li.active', this.$navigation).removeClass('active');
            this.$container.empty();
        }
    });

    window.App = App;
})(jQuery);
