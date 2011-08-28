(function($) {
    // Replace ERB-style delimiters for Underscore templates
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
      , evaluate:    /\{\%(.+?)\%\}/g
    };

    window.Event = Backbone.Model.extend({});
    window.Events = Backbone.Collection.extend({
        model:  Event
      , url:    '/events.json'
      , current: function() {
            return this.filter(function(event) {
                return true;
            });
        }
    });
    window.eventsList = new Events();

    window.EventView = Backbone.View.extend({
        initialize: function() {
            this.template = _.template($('#event-show-template').html());
        }
      , render: function() {
            var content = this.template(this.model.toJSON());
            $(this.el).html(content);

            return this;
        }
    });

    window.EventsListEventView = EventView.extend({
        tagName: 'article'
      , initialize: function() {
            this.template = _.template($('#events-list-event-template').html());
        }
    });

    window.EventsListView = Backbone.View.extend({
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
                var view = new EventsListEventView({ model: event });
                $list.append(view.render().el);
            });

            return this;
        }
      , renderCollection: function(collection) {
            var $list;

            $(this.el).html(this.template({}));
            $list = this.$('.list');

            collection.each(function(event) {
                var view = new EventsListEventView({ model: event });
                $list.append(view.render().el);
            });

            return this;
        }
    });

    window.Twalks = Backbone.Router.extend({
        routes: {
            '':             'home'
          , 'events':       'events'
          , 'events/:id':   'event'
          , 'current':      'current'
        }
      , initialize: function() {
            this.$container     = $('#bb-content');
            this.$navigation    = $('#navigation');
            this.eventsListView = new EventsListView({ collection: window.eventsList });
        }
      , home: function() {
            this.empty();
            this.$container.append($('#welcome-template').html());
        }
      , events: function() {
            this.empty();
            $('li.all-events', this.$navigation).addClass('active');

            var self = this;
            window.eventsList.fetch({ success: function() {
                self.$container.append(self.eventsListView.render().el);
            }});
        }
      , event: function(id) {
            this.empty();
            var event = new Event()
              , view  = new EventView({ model: event })
              , self  = this;

            event.fetch({ url: '/events/'+id+'.json' , success: function() {
                self.$container.append(view.render().el);
            }});
        }
      , current: function() {
            this.empty();
            $('li.current-events', this.$navigation).addClass('active');

            console.log(window.eventsList.current());

            var self = this;
            window.eventsList.fetch({ success: function() {
                self.$container.append(self.eventsListView.render().el);
            }});
        }
      , empty: function() {
            $('li.active', this.$navigation).removeClass('active');
            this.$container.empty();
        }
    });

})(jQuery);
