var _ = require('underscore'),
    gamejs     = require('gamejs'),
    gramework  = require('gramework'),
    Dispatcher = gramework.Dispatcher,
    Scene      = gramework.Scene,
    Vec2d      = gramework.vectors.Vec2d,
    entities      = require('./entities'),
    testAnimationEntities = require('./testAnimationEntities');

var Game = Scene.extend({
    initialize: function(options) {
        this.gravity = new Vec2d(0, 50);

        // Handles world speed.
        this.velocity = new Vec2d(0, 0);
        this.speed = 0;
        this.accel = 0;

        // For now, keep it simple with one protestor. Can adjust from there.
        this.createAnimation(1);
    },

    createAnimation: function(limit) {
        _.each(_.range(limit), function(i) {
            var p = new testAnimationEntities.Citizenkane({
                x: 200 + (i * 15), y: 0,
                width: 30, height: 30,
                world: this
            });
            // console.log(p);
            this.entities.add(p);
        }, this);
    },

    // Identify if an entity is colliding with our world.
    collides: function(entity) {
        // hit ROCK BOTTOM
        if (Math.round(entity.rect.y) >= Math.round(this.height() - entity.rect.height)) {
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

        this.view.fill("#7b7b7b");
        surface.fill("#7b7b7b");
        Scene.prototype.draw.call(this, surface, {clear: false});
    },

    event: function(ev) {
        // Placeholder. Need to send event and identify active protestor.
    }
});

var main = function() {
    var game = new Game({});
    var d = new Dispatcher(gamejs, {
        initial: game
    });
};

gamejs.preload([
    './assets/spritesheet-test.png'
]);
gamejs.ready(main);

