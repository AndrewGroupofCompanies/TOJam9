var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Entity = gramework.Entity;

var Scrollable = Entity.extend({
    initialize: function(options) {
        options = (options || {});

        if (options.image){
            this.image = gamejs.image.load(options.image);
        }
    }
});

module.exports = {
    Scrollable: Scrollable
};