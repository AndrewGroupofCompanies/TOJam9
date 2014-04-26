var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Dispatcher = gramework.Dispatcher,
    Scene = gramework.Scene,
    entities = require('./entities'),
    obstacles = require('./obstacles'),
    Vec2d = gramework.vectors.Vec2d;

var Game = Scene.extend({
    initialize: function(options) {
        this.gravity = new Vec2d(0, 50);

        // Handles world speed.
        this.velocity = new Vec2d(0, 0);
        this.speed = -10;
        this.accel = 5;

        // For now, keep it simple with one protestor. Can adjust from there.
        this.createProtestors(5);
        
        
        this.Obstacles = null;
        
        // Track the police pressure by using an imaginery line on the x-axis.
        this.policePressure = 150;
        this.createPolice(2);
    },

    createProtestors: function(limit) {
        _.each(_.range(limit), function(i) {
            var p = new entities.Protestor({
                x: 200 + (i * 15), y: 0,
                width: 32, height: 32,
                world: this
            });
            this.entities.add(p);
        }, this);
    },

    createPolice: function(limit) {
        _.each(_.range(limit), function(i) {
            var p = new entities.Police({
                x: 25 + (i * 5), y: 0,
                width: 32, height: 32,
                world: this
            });
            this.entities.add(p);
        }, this);
    },

    // Identify if an entity is colliding with our world.
    collides: function(entity) {
        // hit ROCK BOTTOM
        if (entity.rect.y >= (this.height() - entity.rect.height)) {
            return true;
        }
    },

    update: function(dt) {
        Scene.prototype.update.call(this, dt);

        dt = (dt / 1000); // Sane velocity mutations.

        var accel = new Vec2d(this.accel, 0);
        this.velocity.add(accel.mul(dt).mul(this.speed));
        
        if (this.Obstacles && this.Obstacles.alive) {
            this.Obstacles.update(dt);
        } else if (this.Obstacles === null) {
            this.Obstacles = new obstacles.ObstacleEmitter({
                world: this
            });
            console.log("obstacleemitter made")
        } else if (!this.Obstacles.alive) {
            this.Obstacles = null;
        }
    },

    draw: function(surface) {
        surface.clear();
        this.view.clear();

        this.view.fill("#ff22cc");
        surface.fill("#ff22cc");

        // Draw the police pressure line as useful debugging.
        gamejs.draw.line(this.view, "#cccccc",
            [this.policePressure, 0],
            [this.policePressure, surface.getSize()[1]]);
        Scene.prototype.draw.call(this, surface, {clear: false});
    },

    event: function(ev) {
        // Placeholder. Need to send event and identify active protestor.
    }
});

var main = function() {
    var game = new Game({
        pixelScale: 2
    });
    var d = new Dispatcher(gamejs, {
        initial: game,
        canvas: {flag: gamejs.display.DISABLE_SMOOTHING}
    });
};

gamejs.ready(main);

