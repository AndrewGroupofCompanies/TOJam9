var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    gameui = require('./gameui'),
    Scene = gramework.Scene;

var TitleScreen = Scene.extend({
    initialize: function(options) {
        this.next = options.next;
        this.image = gamejs.image.load(options.image) || null;
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
            this.surface.blit(this.image, [0,40]);
        }

        Scene.prototype.draw.apply(this, arguments);

    }
});

var Cutscene = Scene.extend({
    initialize: function(options) {
        this.imageDuration = options.imageDuration || 3000;
        this.elapsed = 0;
        this.currentImage = 0;
        this.next = options.next;
        this.text = options.text;
        this.images = options.images || [];
        this.borderImage = options.borderImage;
        this.duration = options.duration || null;
        console.log(this.duration);
        //this.portrait = options.portrait;
        this._isDone = false;
        this.topbar = new gameui.TopBar({
            color: [0,0,0],
            width: this.surface.getSize()[0],
            height: 40,
            x: 0,
            y: 0,
            world: this,
            subBorderImage: gamejs.image.load(this.borderImage),
            subFont: "8px Ebit",
            doneDuration: 1800
            //portraits: this.portraits
        });

        this.elements.add(this.topbar);

        this.text.forEach(function(text){
            this.topbar.displayText(text, null, true);
        }, this);
    },

    update: function(dt) {
        this.elapsed += dt;
        this.topbar.update(dt);
        if (this.elapsed >= this.imageDuration) {
            this.elapsed = 0;
            this.currentImage++;
        }
        if (this.duration) {
            if (this.elapsed > this.duration) {
                this._isDone = true;
            }
        } else {
            if (this.topbar.textQueue.length === 0 && !this.topbar.showingQueuedText) {
                this._isDone = true;
            }
        }
        if (this.isDone()){
            if (this.next) {
                this.dispatcher.push(this.next);
            }
        }
    },

    draw: function(surface) {
        this.topbar.draw(this.view);
        if (this.currentImage < this.images.length) {
            this.surface.blit(this.images[this.currentImage], [0,40]);
        }
        Scene.prototype.draw.apply(this, arguments);
    },

    isDone: function() {
        return this._isDone;
    }
});

module.exports = {
    TitleScreen: TitleScreen,
    Cutscene: Cutscene
};
