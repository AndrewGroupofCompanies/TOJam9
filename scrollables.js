var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Entity = gramework.Entity;

var Scrollable = Entity.extend({
    initialize: function(options) {
        options = (options || {});
        this.z = options.z || 0;
        this.world = options.world || null;

        if (options.image){
            this.image = gamejs.image.load(options.image);
        }
    },

    update: function(dt) {
        if (this.world) {
            this.move(this.world.speed + this.z, 0);
        }
    }
});

module.exports = {
    Scrollable: Scrollable
};