var _ = require('underscore'),
    _s = require('underscore.string'),
    EventEmitter = require('events').EventEmitter,
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Dispatcher = gramework.Dispatcher,
    Scene = gramework.Scene,
    animate = gramework.animate,
    entities = require('./entities'),
    Vec2d = gramework.vectors.Vec2d,
    FadeTransition = gramework.state.FadeTransition,
    GameController = gramework.input.GameController;

var Images = {
    cop01:         './assets/images/cop01.png',
    cop02:         './assets/images/cop02.png',
    protester01:   './assets/images/protester01.png',
    protester02:   './assets/images/protester02.png',
    protester03:   './assets/images/protester03.png',
    protester04:   './assets/images/protester04.png',
    protester05:   './assets/images/protester05.png',
    protester06:   './assets/images/protester07.png',
    protester07:   './assets/images/protester01.png',
};

var Simplesprite = Entity.extend({
    initialize: function(options) {
        options          = (options || {});
        this.world       = options.world;
        this.spritesheet = options.spritesheet;
        this.xwidth      = options.x;
        this.xheight     = options.y;

        animSpec: {
            running: {frames: _.range(40), rate: 30, loop: true},
            deke: {frames: _.range(81, 90), rate: 30},
            duck: {frames: _.range(41, 50), rate: 30},
            stumble: {frames: _.range(121, 145), rate: 30},
            captured: {frames: _.range(240, 260), rate: 30}
        };

        this.sprite = new animate.SpriteSheet(this.spritesheet, this.xwidth, this.xheight);

        this.anim = new animate.Animation(this.sprite, "static", {
            static: {frames: _.range(40), rate: 2}
        });

        // TODO: Shouldnt need to do this.
        this.image = this.anim.update(0);

        this.anim.start('static');
    },

    update: function(dt) {
        this.image = this.anim.update(dt);
    },

    draw: function(surface) {
        if (this.image) {
            Entity.prototype.draw.apply(this, arguments);
        } else {
            gamejs.draw.rect(surface, this.hex, this.rect);
        }
    }

});

var Simplesprite = Simplesprite.extend({});

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
        this.paused = false;
        this.debug = true;
        this.timer = 0;
        this.indicator = null;

        this.startingProtestors = 1;
        this.maxProtestors = 25;
        this.obstaclesOff = 0;

        //Gotta init them spriteSheets
        this.spriteSheets = {
            cop01: [initSpriteSheet(imgfy(Images.cop01), 30, 30)],
            cop02: [initSpriteSheet(imgfy(Images.cop02), 30, 30)],
            protester01: [initSpriteSheet(imgfy(Images.protester01), 30, 30)],
            protester02: [initSpriteSheet(imgfy(Images.protester02), 30, 30)],
            protester03: [initSpriteSheet(imgfy(Images.protester03), 30, 30)],
            protester04: [initSpriteSheet(imgfy(Images.protester04), 30, 30)],
            protester05: [initSpriteSheet(imgfy(Images.protester05), 30, 30)],
            protester06: [initSpriteSheet(imgfy(Images.protester06), 30, 30)],
            protester07: [initSpriteSheet(imgfy(Images.protester07), 30, 30)],
        };

        _.each(this.spriteSheets, function(element, index, list) {

            var x =  30 + (30 * (index-1));
            var y =  30;

            console.log(element);
            var p = new entities.Protestor({
                x: x,
                y: y,
                width: 30,
                height: 30,
                world: this,
                spriteSheet: element,
            });
            this.entities.add(p);
            console.log('hi');
        }, this);

    },

    update: function(dt) {
        Scene.prototype.update.call(this, dt);
        dt = (dt / 1000); // Sane velocity mutations.
        this.timer += dt;
    },

    draw: function(surface) {
        surface.clear();
        this.view.clear();

        this.surface.fill('#fff');

        Scene.prototype.draw.call(this, surface, {clear: false});

    },

    event: function(ev) {
    }
});

var main = function() {
    var game = new Game({});
    var d = new Dispatcher(gamejs, {
        initial: game
    });
};

gamejs.preload(_.values(Images));
gamejs.ready(main);

