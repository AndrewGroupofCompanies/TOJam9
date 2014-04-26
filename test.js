var _ = require('underscore'),
    gamejs     = require('gamejs'),
    gramework  = require('gramework'),
    Dispatcher = gramework.Dispatcher,
    Scene      = gramework.Scene,
    Vec2d      = gramework.vectors.Vec2d,
    entities      = require('./entities'),
    testEntities = require('./testEntities');

var Game = Scene.extend({
    initialize: function(options) {
        this.gravity = new Vec2d(0, 50);

        // Handles world speed.
        this.velocity = new Vec2d(0, 0);
        this.speed = 0;
        this.accel = 0;

        // For now, keep it simple with one protestor. Can adjust from there.
        this.createAnimation();
    },

    createAnimation: function() {
        var kane = new testEntities.Citizenkane({
            x: 960 - 30,
            y: 0,
            world: this
        });
        
        this.entities.add(kane);
    },

    update: function(dt) {
        Scene.prototype.update.call(this, dt);

        dt = (dt / 1000); // Sane velocity mutations.
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
    './assets/images/spritesheet-test.png'
]);
gamejs.ready(main);

