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

    canMove: function(dx, dy) {
        var collidedX = false,
            collidedY = false,
            start;

        if (dy > 0) {
            start = this.rect.y;
            this.rect.y += dy;
            if (this.world.collides(this)) {
                this.rect.y = Math.floor(this.rect.y);
                while (this.world.collides(this)) {
                    collidedY = true;
                    this.rect.y -= 1;
                }
            }
        }

        return [collidedX, collidedY];
    },

    update: function(dt) {
        dt = (dt / 1000); // Sanity.

        var vec = new Vec2d().add(this.world.gravity);
        this.velocity.add(vec.mul(dt));

        this.rect.x += this.velocity.x;
        this.rect.y += this.velocity.y;

        // Decide next movement.
        var delta = new Vec2d(0, 0);
        delta.add(this.velocity).mul(dt);

        var collided = this.canMove.apply(this, delta.unpack()),
            collidedX = collided[0],
            collidedY = collided[1];
    },

    draw: function(surface) {
        gamejs.draw.rect(surface, "#ffcc00", this.rect);
    }
});

module.exports = {
    Protestor: Protestor
};
