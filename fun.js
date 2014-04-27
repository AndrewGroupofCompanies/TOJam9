var _ = require('underscore'),
    _s = require('underscore.string'),
    EventEmitter = require('events').EventEmitter,
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Dispatcher = gramework.Dispatcher,
    Scene = gramework.Scene,
    animate = gramework.animate,
    Entity = gramework.Entity,
    entities = require('./entities'),
    Vec2d = gramework.vectors.Vec2d,
    FadeTransition = gramework.state.FadeTransition,
    GameController = gramework.input.GameController;


var ImagesC = {
    // cop01:         './assets/images/cop01.png',
    // cop02:         './assets/images/cop02.png',
    protester01:   './assets/images/protester01.png',
    protester02:   './assets/images/protester02.png',
    protester03:   './assets/images/protester03.png',
    protester04:   './assets/images/protester04.png',
    protester05:   './assets/images/protester05.png',
    protester06:   './assets/images/protester07.png',
    protester07:   './assets/images/protester01.png',
};
var ImagesP = {
    cop01:         './assets/images/cop01.png',
    cop02:         './assets/images/cop02.png',
};
var Images = {};
Images = _.extend(Images, ImagesC);
Images = _.extend(Images, ImagesP);

var FunCitizen = Entity.extend({
    animSpec: {
        running:    {frames: _.range(0,  40),   rate: 30, loop: true},
        duck:       {frames: _.range(41, 50),   rate: 30, loop: true},
        deke:       {frames: _.range(81, 90),   rate: 30, loop: true},
        stumble:    {frames: _.range(121, 145), rate: 30, loop: true},
        stumblebig: {frames: _.range(161, 180), rate: 30, loop: true},
        clothesline:{frames: _.range(201, 215), rate: 30, loop: true},
        captured:   {frames: _.range(240, 260), rate: 30, loop: true}
    },

    initialize: function(options) {
        options = (options || {});

        this.world = options.world;

        if (options.spriteSheet) {
            this.spriteSheet = options.spriteSheet;
            this.anim = new animate.Animation(this.spriteSheet, "running", this.animSpec);
            this.image = this.anim.update(0);
            this.anim.setFrame(0);
        }

    },

    update: function(dt) {
        if (this.world.paused) return;

        this.image = this.anim.update(dt);
    },


    draw: function(surface) {
        if (this.image) {
            Entity.prototype.draw.apply(this, arguments);
        } else {
            gamejs.draw.rect(surface, this.hex, this.rect);
        }

    },

    setAnimation: function(animation) {
        if (this.anim.currentAnimation !== animation) {
            this.anim.start(animation);
        }
    },

});
var FunCitizen = FunCitizen.extend({});

// animSpec: {
//     running:    {frames: _.range(0,  40),   rate: 30, loop: true},
//     duck:       {frames: _.range(41, 50),   rate: 30, loop: true},
//     deke:       {frames: _.range(81, 90),   rate: 30, loop: true},
//     stumble:    {frames: _.range(121, 145), rate: 30, loop: true},
//     stumblebig: {frames: _.range(161, 180), rate: 30, loop: true},
//     clothesline:{frames: _.range(201, 215), rate: 30, loop: true},
//     captured:   {frames: _.range(240, 260), rate: 30, loop: true}
// },
var FunPolice = Entity.extend({
    animSpec: {
        running:     {frames: _.range(0,   40),  rate: 30, loop: true},
        duck:        {frames: _.range(41,  50),  rate: 30, loop: true},
        deke:        {frames: _.range(81,  90),  rate: 30, loop: true},
        clothesline: {frames: _.range(161, 177), rate: 30, loop: true},
        falling:     {frames: _.range(201, 221), rate: 30, loop: true},
        reaching:    {frames: _.range(281, 297), rate: 30, loop: true},
        reaching2:   {frames: _.range(320, 337), rate: 30, loop: true},
        capturing:   {frames: _.range(361, 400), rate: 30, loop: true},
        capturing2:  {frames: _.range(401, 441), rate: 30, loop: true},
    },

    initialize: function(options) {
        options = (options || {});

        this.world = options.world;

        if (options.spriteSheet) {
            this.spriteSheet = options.spriteSheet;
            this.anim = new animate.Animation(this.spriteSheet, "running", this.animSpec);
            this.image = this.anim.update(0);
            this.anim.setFrame(0);
        }

    },

    update: function(dt) {
        if (this.world.paused) return;

        this.image = this.anim.update(dt);
    },


    draw: function(surface) {
        if (this.image) {
            Entity.prototype.draw.apply(this, arguments);
        } else {
            gamejs.draw.rect(surface, this.hex, this.rect);
        }

    },

    setAnimation: function(animation) {
        if (this.anim.currentAnimation !== animation) {
            this.anim.start(animation);
        }
    },

});
var FunCitizen = FunCitizen.extend({});

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
        this.spriteSheetsC = {
            protester01: [initSpriteSheet(imgfy(ImagesC.protester01), 30, 30)],
            protester02: [initSpriteSheet(imgfy(ImagesC.protester02), 30, 30)],
            protester03: [initSpriteSheet(imgfy(ImagesC.protester03), 30, 30)],
            protester04: [initSpriteSheet(imgfy(ImagesC.protester04), 30, 30)],
            protester05: [initSpriteSheet(imgfy(ImagesC.protester05), 30, 30)],
            protester06: [initSpriteSheet(imgfy(ImagesC.protester06), 30, 30)],
            protester07: [initSpriteSheet(imgfy(ImagesC.protester07), 30, 30)],
        };
        this.spriteSheetsP = {
            cop01: [initSpriteSheet(imgfy(ImagesP.cop01), 30, 30)],
            cop02: [initSpriteSheet(imgfy(ImagesP.cop02), 30, 30)],
        };

        var saved_ypos_start; // used for the next run
        var xpos_multiplier;
        saved_ypos_start = 0;
        xpos_multiplier = 0;

        _.each(this.spriteSheetsC, function(ss) {
            var ypos_multiplier = 0;
            var x, y;

            x =  30 + (30 * (xpos_multiplier));
            y =  30 + (30 * (ypos_multiplier));
            var p1 = new FunCitizen({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p1.setAnimation("running");
            this.entities.add(p1);

            ypos_multiplier++;
            y =  30 + (30 * (ypos_multiplier));
            var p2 = new FunCitizen({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p2.setAnimation("duck");
            this.entities.add(p2);

            ypos_multiplier++;
            y =  30 + (30 * (ypos_multiplier));
            var p3 = new FunCitizen({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p3.setAnimation("deke");
            this.entities.add(p3);

            ypos_multiplier++;
            y =  30 + (30 * (ypos_multiplier));
            var p4 = new FunCitizen({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p4.setAnimation("stumble");
            this.entities.add(p4);

            ypos_multiplier++;
            y =  30 + (30 * (ypos_multiplier));
            var p5 = new FunCitizen({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p5.setAnimation("stumblebig");
            this.entities.add(p5);

            ypos_multiplier++;
            y =  30 + (30 * (ypos_multiplier));
            var p6 = new FunCitizen({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p6.setAnimation("clothesline");
            this.entities.add(p6);

            ypos_multiplier++;
            y =  30 + (30 * (ypos_multiplier));
            var p7 = new FunCitizen({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p7.setAnimation("captured");
            this.entities.add(p7);

            saved_ypos_start = y;
            xpos_multiplier++;
        }, this);

        xpos_multiplier = 0;
        _.each(this.spriteSheetsP, function(ss) {
            var ypos_multiplier = 0;
            var x, y, y_simple;

            x =  30 + (30 * (xpos_multiplier));
            y_simple =  30 + (30 * (ypos_multiplier));
            y = saved_ypos_start + y_simple;
            // console.log(x);
            // console.log(y);

            var p1 = new FunPolice({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p1.setAnimation("running");
            this.entities.add(p1);

            ypos_multiplier++;
            y_simple =  30 + (30 * (ypos_multiplier));
            y = saved_ypos_start + y_simple;
            var p2 = new FunPolice({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p2.setAnimation("duck");
            this.entities.add(p2);

            ypos_multiplier++;
            y_simple =  30 + (30 * (ypos_multiplier));
            y = saved_ypos_start + y_simple;
            var p3 = new FunPolice({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p3.setAnimation("deke");
            this.entities.add(p3);

            ypos_multiplier++;
            y_simple =  30 + (30 * (ypos_multiplier));
            y = saved_ypos_start + y_simple;
            var p4 = new FunPolice({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p4.setAnimation("clothesline");
            this.entities.add(p4);

            ypos_multiplier++;
            y_simple =  30 + (30 * (ypos_multiplier));
            y = saved_ypos_start + y_simple;
            var p5 = new FunPolice({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p5.setAnimation("falling");
            this.entities.add(p5);

            ypos_multiplier++;
            y_simple =  30 + (30 * (ypos_multiplier));
            y = saved_ypos_start + y_simple;
            var p6 = new FunPolice({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p6.setAnimation("reaching");
            this.entities.add(p6);

            ypos_multiplier++;
            y_simple =  30 + (30 * (ypos_multiplier));
            y = saved_ypos_start + y_simple;
            var p7 = new FunPolice({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p7.setAnimation("reaching2");
            this.entities.add(p7);

            ypos_multiplier++;
            y_simple =  30 + (30 * (ypos_multiplier));
            y = saved_ypos_start + y_simple;
            var p8 = new FunPolice({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p8.setAnimation("capturing");
            this.entities.add(p8);

            ypos_multiplier++;
            y_simple =  30 + (30 * (ypos_multiplier));
            y = saved_ypos_start + y_simple;
            var p9 = new FunPolice({
                x: x, y: y,
                width: 30, height: 30,
                world: this,
                spriteSheet: ss[0],
            });
            p9.setAnimation("capturing2");
            this.entities.add(p9);

            xpos_multiplier++;
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

