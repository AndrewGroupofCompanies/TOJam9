var _ = require('underscore'),
    gamejs    = require('gamejs'),
    gramework = require('gramework'),
    animate   = gramework.animate,
    Entity    = gramework.Entity,
    Vec2d     = gramework.vectors.Vec2d;

var Citizenkane = Entity.extend({
    initialize: function(options) {
        options = (options || {});

        this.world    = options.world;
        this.velocity = new Vec2d(0, 0);
        this.speed    = 0;
        this.onGround = false;
        this.hex      = '#77ff77';

        this.sprite = new animate.SpriteSheet('./assets/spritesheet-test.png', 30, 30);

        this.anim = new animate.Animation(this.sprite, "static", {
            static: {frames: 4, rate: 10.5}
        });
        // TODO: Shouldnt need to do this.
        this.image = this.anim.update(0);
    },

    update: function(dt) {
        this.image = this.anim.update(dt);
    },

    draw: function(surface) {
        gamejs.draw.rect(surface, this.hex, this.rect);
    }

});

var Citizenkane = Citizenkane.extend({});

module.exports = {
    Citizenkane: Citizenkane
};
