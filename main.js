var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Dispatcher = gramework.Dispatcher,
    Scene = gramework.Scene,
    entities = require('./entities'),
    Vec2d = gramework.vectors.Vec2d;

var Game = Scene.extend({
    initialize: function(options) {
        this.gravity = new Vec2d(0, 50);

        // Handles world speed.
        this.velocity = new Vec2d(0, 0);
        this.speed = -10;
        this.accel = 5;

        // For now, keep it simple with one protestor. Can adjust from there.
        this.createProtestors(40);
        this.createPolice(10);
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
                x: 50 + (i * 15), y: 0,
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
    },
    
    draw: function(surface) {
        surface.clear();
        this.view.clear();

        this.view.fill("#ff22cc");
        surface.fill("#ff22cc");
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

