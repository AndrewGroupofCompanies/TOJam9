var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Dispatcher = gramework.Dispatcher,
    Scene = gramework.Scene;

var Game = function() {
};

_.extend(Game.prototype, {
});

var main = function() {
    var game = new Game();
    var d = new Dispatcher(gamejs, {
        initial: game
    });
};

gamejs.ready(main);

