var gamejs = require('gamejs'),
    gramework = require('gramework'),
    Entity = gramework.Entity,
    Vec2d = gramework.vectors.Vec2d;

var Protestor = Entity.extend({
    initialize: function(options) {
        options = (options || {});

        this.world = options.world;
        this.velocity = new Vec2d(0, 0);
    },

    update: function(dt) {
        dt = (dt / 1000); // Sanity.

        var vec = new Vec2d().add(this.world.gravity);
        this.velocity.add(vec.mul(dt));

        this.rect.x += this.velocity.x;
        this.rect.y += this.velocity.y;
    },

    draw: function(surface) {
        gamejs.draw.rect(surface, "#ffcc00", this.rect);
    }
});

module.exports = {
    Protestor: Protestor
};
