var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Entity = gramework.Entity,
    Vec2d = gramework.vectors.Vec2d;
    
var Obstacle = Entity.extend({
    initialize: function(options) {
        options = (options || {});

        this.world = options.world;
        this.velocity = new Vec2d(0, 0);
        this.speed = -10;
        this.onGround = false;

        this.hex = "#000000";
    },
    
    update: function(dt) {
        this.rect.left += this.speed;
    },
    
    draw: function(surface) {
        gamejs.draw.rect(surface, this.hex, this.rect);
    }
});

var ObstacleEmitter = function(options){
    this.alive = true;
    // Spawn obstacles, much like coins! Randomness
    this.count = _.random(2, 4);
    this.world = options.world;
    this.currentDuration = 0;
    this.duration = 5;
};

ObstacleEmitter.prototype = {
    randomDuration: function() {
        return ( _.random(2, 5));
    },
    
    update: function(dt) {        
        this.currentDuration += dt;
        if(this.count > 0 && this.currentDuration >= this.duration) {
            this.world.entities.add(new Obstacle({
                world: this.world,
                x: this.world.width(),
                y: 100,
                height: 30,
                width: 30
            }));
            console.log('im makin obstacles, b');
            this.currentDuration = 0;
            this.count -= 1;
            this.duration = this.randomDuration();
        };
        
        //console.log(this.currentDuration);

        if (this.count === 0) {
            console.log("peace out");
            this.alive = false;
        };
    }
};

module.exports = {
    ObstacleEmitter: ObstacleEmitter,
    Obstacle: Obstacle
};