var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Entity = gramework.Entity;

var Scrollable = Entity.extend({
    initialize: function(options) {
        options = (options || {});
        this.z = options.z || 0;

        if (options.image){
            this.image = gamejs.image.load(options.image);
        }
    },

    update: function(dt) {

    }
});

module.exports = {
    Scrollable: Scrollable
};