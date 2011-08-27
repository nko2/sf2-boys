$(function(){
    window.Event = Backbone.Model.extend({});
    window.Session = Backbone.Model.extend({});

    window.EventList = Backbone.Collection.extend({
        model: Event,

        url: '/events',

        comparator: function(event) {
            return event.get('startsAt');
        },
    }

    window.SessionList = Backbone.Collection.extend({
        model: Session,

        url: '/sessions',

        comparator: function(event) {
            return event.get('name');
        },
    }

    window.Events = new EventList;
    window.Sessions = new SessionList;
});

