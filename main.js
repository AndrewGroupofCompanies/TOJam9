var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Dispatcher = gramework.Dispatcher,
    Scene = gramework.Scene,
    entities = require('./entities'),
    scrollables = require('./scrollables'),
    Vec2d = gramework.vectors.Vec2d;

var Images = {
    bg_test: './assets/images/bg_test.jpg',
    sprite_test: './assets/images/spritesheet-enemy.png'
};

var GROUND_HEIGHT = 40;

var Game = Scene.extend({
    initialize: function(options) {
        this.gravity = new Vec2d(0, 50);

        this.bg = new scrollables.Scrollable({
            image: Images.bg_test,
            height: 256,
            width: 512,
            x: 0,
            y: 0
        });

        // Handles world speed.
        this.velocity = new Vec2d(0, 0);
        this.speed = -10;
        this.accel = 5;
        this.scrollables = new gamejs.sprite.Group();

        this.scrollables.add(this.bg);

        // For now, keep it simple with one protestor. Can adjust from there.
        this.createProtestors(25);

        // Track the police pressure by using an imaginery line on the x-axis.
        this.policePressure = 150;
        this.createPolice(10);
    },

    createProtestors: function(limit) {
        _.each(_.range(limit), function(i) {
            var p = new entities.Protestor({
                x: 200 + (i * 15), y: 0,
                width: 32, height: 32,
                world: this,
                spriteSheet: {
                    path: Images.sprite_test,
                    height: 30,
                    width: 26
                }  
            });
            this.entities.add(p);
        }, this);
    },

    createPolice: function(limit) {
        _.each(_.range(limit), function(i) {
            console.log("cop");
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
        if (entity.rect.y >= (this.height() - entity.rect.height - GROUND_HEIGHT)) {
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

        this.scrollables.draw(this.view);

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

var images = Object.keys(Images).map(function(img) {
    return Images[img];
});

gamejs.preload(images);
gamejs.ready(main);

