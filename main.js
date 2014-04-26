var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Dispatcher = gramework.Dispatcher,
    Scene = gramework.Scene,
    scrollables = require('./scrollables'),
    animate = gramework.animate,
    entities = require('./entities'),
    obstacles = require('./obstacles'),
    Vec2d = gramework.vectors.Vec2d,
    GameController = gramework.input.GameController;

var Images = {
    bg_test: './assets/images/bg_test.jpg',
    sprite_test: './assets/images/spritesheet-enemy.png',
    sprite_test_2: './assets/images/spritesheet-player.png',
    tree_01: './assets/images/tree_01.png',
    protester01: './assets/images/protester01.png'
};

var initSpriteSheet = function(image, width, height) {
    var ss = new animate.SpriteSheet(image, width, height);
    return ss;
};

var imgfy = function(image) {
    return gamejs.image.load(image);
};

var GROUND_HEIGHT = 20;


var Game = Scene.extend({
    initialize: function(options) {
        this.gravity = new Vec2d(0, 50);

        //Gotta init them spriteSheets
        this.spriteSheets = {
            police: initSpriteSheet(imgfy(Images.sprite_test), 26, 30),
            protester01: initSpriteSheet(imgfy(Images.protester01), 30, 30)
        };

        this.bg = new scrollables.Scrollable({
            image: Images.bg_test,
            height: 128,
            width: 256,
            x: 0,
            y: 0,
            z: 0
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
        this.createScrollable(3);
        this.createScrollable(5);
        this.createScrollable(7);
        this.createScrollable(-10);
        this.createScrollable(-1);

        // Track the police pressure by using an imaginery line on the x-axis.
        this.policePressure = 50;
        this.createPolice(10);

        // Obstacles
        this.Obstacles = null;

        // Player management
        this.controller = new GameController({
            pressure: gamejs.event.K_p,
            takeover: gamejs.event.K_t
        });
        this.player = null;
        this.pluckProtestor();
    },

    createScrollable: function(z) {
        var s = new scrollables.Scrollable({
            height: 64,
            width: 64,
            x:256,
            y:50,
            z:z,
            image: Images.tree_01,
            world: this
        });
        this.scrollables.add(s);
    },

    createProtestors: function(limit) {
        _.each(_.range(limit), function(i) {
            var p = new entities.Protestor({
                x: 200 + (i * 15), y: 0,
                width: 30, height: 30,
                world: this,

                spriteSheet: this.spriteSheets.protester01
            });
            this.entities.add(p);
        }, this);
    },

    getProtestors: function() {
        return _.filter(this.entities._sprites, function(entity) {
            return entity.isProtestor === true;
        });
    },

    createPolice: function(limit) {
        _.each(_.range(limit), function(i) {
            var p = new entities.Police({
                x: 25 + (i * 5), y: 0,
                width: 32, height: 32,
                world: this
            });
            this.entities.add(p);
        }, this);
    },

    // Pluck a random protestor from the group. The player will now control this
    // one.
    pluckProtestor: function() {
        var protestor = _.sample(this.getProtestors(), 1)[0];

        this.player = new entities.Player({
            existing: protestor
        });
        this.entities.add(this.player);

        protestor.kill();
        console.log("Added new player", this.player.hex);
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
        this.scrollables.update(dt);

        if (this.Obstacles && this.Obstacles.alive) {
            this.Obstacles.update(dt);
        } else if (this.Obstacles === null) {
            /*
             * TODO: Dont spawn these for now.
            this.Obstacles = new obstacles.ObstacleEmitter({
                world: this
            });
            */
        } else if (!this.Obstacles.alive) {
            this.Obstacles = null;
        }
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
        if (this.player !== null) {
            this.player.event(ev);
        }

        // Placeholder. Need to send event and identify active protestor.
        var handled = this.controller.handle(ev);
        if (!handled) return;
        if (handled.value === this.controller.controls.pressure) {
            this.policePressure += 10;
        } else if (handled.value === this.controller.controls.takeover) {
            if (this.player !== null) {
                // Kill the active player protestor.
                console.log("Killed player");
                this.player.kill();
            }
            this.pluckProtestor();
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

gamejs.preload(_.values(Images));
gamejs.ready(main);

