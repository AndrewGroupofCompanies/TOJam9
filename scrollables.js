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

        var scale_factor = 1 / Math.pow(Math.E, (this.z / 5));
        this.rect.width = Math.floor(this.rect.width * scale_factor);
        this.rect.height = Math.floor(this.rect.height * scale_factor);
        this.rect.top += this.z * 2.7;
    },

    update: function(dt) {
        if (this.world) {
            this.move(this.world.speed + this.z, 0);
        }
    }
});

var SceneryGenerator = function(options) {
    this.initialize(options);
};

_.extend(SceneryGenerator.prototype, {
    initialize: function(options) {

    }
});

module.exports = {
    Scrollable: Scrollable
};