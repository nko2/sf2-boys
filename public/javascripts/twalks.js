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
    });
    window.eventsList = new Events();

    window.EventsListEventView = Backbone.View.extend({
        tagName: 'article'
      , initialize: function() {
            this.template = _.template($('#events-list-event-template').html());
        }
      , render: function() {
            var content = this.template(this.model.toJSON());
            $(this.el).html(content);

            return this;
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
    });

    window.Twalks = Backbone.Router.extend({
        routes: {
            '':        'home'
          , 'events':  'events'
        }
      , initialize: function() {
            this.$container     = $('#bb-content');
            this.$navigation    = $('#navigation');
            this.eventsListView = new EventsListView({ collection: window.eventsList });
        }
      , home: function() {
            $('li.active', this.$navigation).removeClass('active');
            this.$container.empty();
            this.$container.append($('#welcome-template').html());
        }
      , events: function() {
            $('li.active', this.$navigation).removeClass('active');
            $('li.all-events', this.$navigation).addClass('active');

            this.$container.empty();
            this.$container.append(this.eventsListView.render().el);
            window.eventsList.fetch();
        }
    });

})(jQuery);
