$(function(){
    // Replace ERB-style delimiters for Underscore templates
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g
      , evaluate:    /\{\%(.+?)\%\}/g
    };

    // Models
    window.Event = Backbone.Model.extend({});
    window.Talk = Backbone.Model.extend({});

    // Collections
    window.EventList = Backbone.Collection.extend({
        model: Event,
      , url: '/events.json'
      , comparator: function(event) {
            return event.get('startsAt');
        }
    }

    window.TalkList = Backbone.Collection.extend({
        model: Talk
      , url: '/talks.json'
      , comparator: function(event) {
            return event.get('name');
        }
    }

    // Views
    window.EventView = Backbone.View.extend({
        tagName: 'li',
      , template: _.template($('#event-template').html())
    });

    window.Events = new EventList;
    window.Talks = new TalkList;
});

