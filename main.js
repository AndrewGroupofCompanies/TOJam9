var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Dispatcher = gramework.Dispatcher,
    Scene = gramework.Scene,
    entities = require('./entities');

var Game = Scene.extend({
    initialize: function(options) {
        // For now, keep it simple with one protestor. Can adjust from there.
        this.protestor = new entities.Protestor({
            x: 0, y: 0,
            width: 32, height: 32,
            world: this
        });
        this.entities.add(this.protestor);
    },

    update: function(dt) {
        Scene.prototype.update.call(this, dt);
    },

    draw: function(surface) {
        Scene.prototype.draw.call(this, surface);
    }
});

var main = function() {
    var game = new Game({
    });
    var d = new Dispatcher(gamejs, {
        initial: game
    });
};

gamejs.ready(main);

