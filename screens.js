var gamejs = require('gamejs'),
    gramework = require('gramework'),
    Scene = gramework.Scene;

var TitleScreen = Scene.extend({
    initialize: function(options) {
        this.game = options.game;
    },

    update: function(dt) {
        // Dispatch to game right away for now.
        this.dispatcher.push(this.game);
    },

    draw: function(surface) {
    }
});

module.exports = {
    TitleScreen: TitleScreen
};
