var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Dispatcher = gramework.Dispatcher,
    Scene = gramework.Scene,
    scrollables = require('./scrollables'),
    Vec2d = gramework.vectors.Vec2d,
    GameController = gramework.input.GameController,
    entities = require('./entities');

var Images = {
    bg_test: './assets/images/bg_test.jpg',
    sprite_test: './assets/images/spritesheet-enemy.png',
    sprite_test_2: './assets/images/spritesheet-player.png'
};

var GROUND_HEIGHT = 20;

var Game = Scene.extend({
    initialize: function(options) {
        this.gravity = new Vec2d(0, 50);

        this.bg = new scrollables.Scrollable({
            image: Images.bg_test,
            height: 128,
            width: 256,
            x: 0,
            y: 0
        });

        // Handles world speed.
        this.velocity = new Vec2d(0, 0);
        this.speed = -10;
        this.accel = 5;
        this.scrollables = new gamejs.sprite.Group();

        this.scrollables.add(this.bg);

        // The front line of the protestors. Let's keep them grouped.
        this.frontLine = this.surface.getSize()[0] - 50;
        this.createProtestors(15);

        // Track the police pressure by using an imaginery line on the x-axis.
        this.policePressure = 50;
        //this.createPolice(10);
        this.controller = new GameController({
            pressure: gamejs.event.K_p
        });
    },

    createProtestors: function(limit) {
        _.each(_.range(limit), function(i) {
            var p = new entities.Protestor({
                x: 200 + (i * 15), y: 0,
                width: 21, height: 30,
                world: this,
                
                spriteSheet: {
                    path: Images.sprite_test_2,
                    height: 30,
                    width: 21
                }  
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

        // Front line.
        gamejs.draw.line(this.view, "#cccccc",
            [this.frontLine, 0],
            [this.frontLine, surface.getSize()[1]]);
        Scene.prototype.draw.call(this, surface, {clear: false});
    },

    event: function(ev) {
        // Placeholder. Need to send event and identify active protestor.
        var handled = this.controller.handle(ev);
        if (!handled) return;
        if (handled.value === this.controller.controls.pressure) {
            this.policePressure += 10;
        }
    }
});

var main = function() {
    var game = new Game({
        pixelScale: 4
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

