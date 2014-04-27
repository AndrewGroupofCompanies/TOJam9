var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Scene = gramework.Scene;

var TitleScreen = Scene.extend({
    initialize: function(options) {
        this.next = options.next;
        this.image = options.image || null;
    },

    event: function(ev) {
        // Dispatch to game right away for now.
        if (ev.type === gamejs.event.KEY_DOWN) {
            if (ev.key === gamejs.event.K_SPACE) {
                this.dispatcher.push(this.next);
            }
        }
    },

    update: function(dt) {
        
    },

    draw: function(surface) {
        if (this.image) {
            surface.blit(this.image);
        }
    }
});

var Cutscene = Scene.extend({
    initialize: function(options) {
        this.next = options.next;
    },

    update: function(dt) {
        if (this.isDone()){
            this.dispatcher.push(this.next);
        }
    },

    draw: function(surface) {

    }
});

module.exports = {
    TitleScreen: TitleScreen,
    Cutscene: Cutscene
};
