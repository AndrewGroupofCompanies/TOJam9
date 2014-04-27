var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Entity = gramework.Entity,
    Vec2d = gramework.vectors.Vec2d;

var Obstacle = Entity.extend({
    initialize: function(options) {
        options = (options || {});

        this.isObstacle = true; // identifier

        this.z = options.z;
        this.world = options.world;
        this.velocity = new Vec2d(0, 0);
        this.speed = -2;
        this.onGround = false;
        this.name = 'obstacle';

        this.hex = "#000000";
        this.image = gamejs.image.load(options.image);

    },

    update: function(dt) {
        if (this.world.paused) return;
        this.rect.left += this.speed;
    },

    draw: function(surface) {
        Entity.prototype.draw.apply(this, arguments);
        //gamejs.draw.rect(surface, "#ffcc00", this.collisionRect);
    }
});

var Fence = Obstacle.extend({
    high: true,

    initialize: function(options) {
        Obstacle.prototype.initialize.call(this, options);

        this.collisionRect = this.rect.clone();
        this.collisionRect.width = 5;
        this.collisionRect.height = 30;
    },

    update: function(dt) {
        Obstacle.prototype.update.call(this, dt);
        this.collisionRect.left = this.rect.left + 55;
        this.collisionRect.top = this.rect.top + 75;
    }

});

var Barricade = Obstacle.extend({
    low: true,

    initialize: function(options) {
        Obstacle.prototype.initialize.call(this, options);

        this.collisionRect = this.rect.clone();
        this.collisionRect.width = 5;
        this.collisionRect.height = 30;
    },

    update: function(dt) {
        Obstacle.prototype.update.call(this, dt);
        this.collisionRect.left = this.rect.left + 65;
        this.collisionRect.top = this.rect.top + 75;
    }

});

// TODO: For now, this order must match the order of the list sent to
// ObstacleEmitter in main.js
var AllowedObstacles = [
    Fence,
    Barricade
];

var ObstacleEmitter = function(options){
    this.alive = true;
    // Spawn obstacles, much like coins! Randomness
    this.count = _.random(1, 5);
    this.world = options.world;
    this.currentDuration = 0;
    this.duration = 8;
    this.images = options.images;
};

ObstacleEmitter.prototype = {
    randomDuration: function() {
        return ( _.random(2, 10));
    },

    randomObstacle: function() {
        return _.sample(AllowedObstacles, 1)[0];
    },

    obstacleType: function() {
        return ( _.random(1, 2));
    },

    update: function(dt) {
        this.currentDuration += dt;
        if(this.count > 0 && this.currentDuration >= this.duration) {
            var ObstacleKlass = this.randomObstacle();

            this.world.entities.add(new ObstacleKlass({
                world: this.world,
                x: this.world.width(),
                y: this.world.height() - 130,
                height: 187,
                width: 150,
                image: this.images[_.indexOf(AllowedObstacles, ObstacleKlass)],
                z: 1
            }));
            this.currentDuration = 0;
            this.count -= 1;
            this.duration = this.randomDuration();
        }

        if (this.count === 0) {
            this.alive = false;
        }
    }
};

module.exports = {
    ObstacleEmitter: ObstacleEmitter,
    Obstacle: Obstacle
};
