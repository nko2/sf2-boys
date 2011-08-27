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
})(jQuery);
