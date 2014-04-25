var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Entity = gramework.Entity,
    Vec2d = gramework.vectors.Vec2d;

var randomHex = function() {
    return '#' + (function co(lor){   return (lor += [0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'][Math.floor(Math.random()*16)]) && (lor.length == 6) ?  lor : co(lor); })('');
};

var Citizen = Entity.extend({
    initialize: function(options) {
        options = (options || {});

        this.world = options.world;
        this.velocity = new Vec2d(0, 0);
        this.speed = _.random(-3, 3);
        this.onGround = false;

        this.hex = randomHex();
    },

    canMove: function(dx, dy) {
        var collidedX = false,
            collidedY = false,
            start;

        // Moving to the right! Endless runner style.
        if (dx > 0) {
            start = this.rect.x;
            this.rect.x += dx;
        }

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

        // Adjust X vector based on the world speed. Some protestors will be
        // slower than others, eventually getting caught.
        if (this.speed !== 0) {
            var setTo = (this.world.velocity.magnitude() * 0.0025 * this.speed);
            this.velocity.setX(setTo);
        } else {
            this.velocity.setX(-(this.world.velocity.magnitude() * 0.0025));
        }

        this.rect.x += this.velocity.getX();
        this.rect.y += this.velocity.getY();

        // Decide next movement.
        var delta = new Vec2d(0, 0);
        delta.add(this.velocity).mul(dt);

        var collided = this.canMove.apply(this, delta.unpack()),
            collidedX = collided[0],
            collidedY = collided[1];

        if (collidedY) {
            this.velocity.setY(0);
            if (delta.getY() > 0) {
                this.onGround = true;
            }
        } else {
            // We're moving up or down, probably not on ground.
            if (Math.floor(delta.getY()) !== 0) {
                this.onGround = false;
            }
        }
    },

    draw: function(surface) {
        gamejs.draw.rect(surface, this.hex, this.rect);
    }

});

var Protestor = Citizen.extend({});

module.exports = {
    Protestor: Protestor
};
