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
    cop01: './assets/images/cop01.png',
    bg_test: './assets/images/bg_test.jpg',
    sprite_test: './assets/images/spritesheet-enemy.png',
    sprite_test_2: './assets/images/spritesheet-player.png',
    protester01: './assets/images/protester_01_pete.png',
    protester02: './assets/images/protester_02_pete.png',
    protester03: './assets/images/protester_03_pete.png',
    protester04: './assets/images/protester_04_xyz.png',
    protester05: './assets/images/protester_05_xyz.png',
    protester06: './assets/images/protester_06_xyz.png',
    tree_01: './assets/images/tree_01.png',
    fence: './assets/images/fencebroken.png',
    barricade: './assets/images/barricade.png'
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

        //Gotta init them spriteSheets
        this.spriteSheets = {
            police: initSpriteSheet(imgfy(Images.cop01), 60, 30),
            protester01: initSpriteSheet(imgfy(Images.protester01), 30, 30),
            protester02: initSpriteSheet(imgfy(Images.protester02), 30, 30),
            protester03: initSpriteSheet(imgfy(Images.protester03), 30, 30),
            protester04: initSpriteSheet(imgfy(Images.protester04), 30, 30),
            protester05: initSpriteSheet(imgfy(Images.protester05), 30, 30),
            protester06: initSpriteSheet(imgfy(Images.protester06), 30, 30),
        };

        var previousAdd = this.entities.add;
        this.entities.add = function(list) {
            previousAdd.apply(this, arguments);

            this._sprites.sort(function(a, b){
                return b.z-a.z;
            });
        };
        /*
        this.bg = new scrollables.Scrollable({
            image: Images.bg_test,
            height: 128,
            width: 256,
            x: 0,
            y: 0,
            z: 0
        });
        */
        // Handles world speed.
        this.velocity = new Vec2d(0, 0);
        this.speed = -10;
        this.accel = 5;
        this.runningPlane = this.surface.getSize()[1] - 50;

        // The front line of the protestors. Let's keep them grouped.
        this.frontLine = this.surface.getSize()[0] - 50;
        this.backLine = 10;
        this.createProtestors(15);
        this.scrollGenerator = new scrollables.SceneryGenerator({
            world: this,
            images: [
                Images.tree_01
            ]
        });

        // Track the police pressure by using an imaginery line on the x-axis.
        this.policePressure = 50;

        // Police distraction is a "safe" zone in which while the active player
        // is in it, the police pressure does not increase. We keep track
        // of this so that when we're ahead of it, pressure increases!
        this.policeDistraction = this.policePressure + 50;
        this.createPolice(10);

        // Obstacles
        this.Obstacles = null;

        // Player management
        this.controller = new GameController({
            pressure: gamejs.event.K_p,
            takeover: gamejs.event.K_t
        });
        this.player = null;
        this.spawnPlayer();
    },

    createProtestors: function(limit) {
        _.each(_.range(limit), function(i) {
            var randomNum= _.random(1,6);
            var spriteId  = 'protester0' + randomNum;
            var tmpSpriteSheet = this.spriteSheets[spriteId];
            var p = new entities.Protestor({
                x: 80 + (i * 15), y: this.runningPlane,
                width: 30, height: 30,
                world: this,
                spriteSheet: tmpSpriteSheet
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
                x: (i * 5), y: this.runningPlane,
                width: 60, height: 30,
                spriteSheet: this.spriteSheets.police,
                world: this
            });
            this.entities.add(p);
        }, this);
    },

    // Pluck a random protestor from the group. The player will now control this
    // one.
    spawnPlayer: function() {
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

    // Police are getting madder!
    increasePolicePressure: function(step) {
        step = (step || 1);
        this.policePressure += step;
        this.policeDistraction += step;
    },

    update: function(dt) {
        this.scrollGenerator.update(dt);

        Scene.prototype.update.call(this, dt);


        dt = (dt / 1000); // Sane velocity mutations.

        var accel = new Vec2d(this.accel, 0);
        this.velocity.add(accel.mul(dt).mul(this.speed));

        if (this.Obstacles && this.Obstacles.alive) {
            this.Obstacles.update(dt);
        } else if (this.Obstacles === null) {
            /*
            this.Obstacles = new obstacles.ObstacleEmitter({
                world: this,
                images: [Images.fence, Images.barricade]
            });
            */
        } else if (!this.Obstacles.alive) {
            this.Obstacles = null;
        }
    },

    draw: function(surface) {
        surface.clear();
        this.view.clear();

        this.surface.fill('#fff');

            //this.scrollables.draw(this.view);

        // Draw the police pressure line as useful debugging.
        gamejs.draw.line(this.view, "#cccccc",
            [this.policePressure, 0],
            [this.policePressure, surface.getSize()[1]]);

        // Police distraction zone.
        gamejs.draw.line(this.view, "#cccccc",
            [this.policeDistraction, 0],
            [this.policeDistraction, surface.getSize()[1]]);

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
            this.spawnPlayer();
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

