var _ = require('underscore'),
    EventEmitter = require('events').EventEmitter,
    _s = require('underscore.string'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Dispatcher = gramework.Dispatcher,
    Scene = gramework.Scene,
    scrollables = require('./scrollables'),
    animate = gramework.animate,
    entities = require('./entities'),
    obstacles = require('./obstacles'),
    Vec2d = gramework.vectors.Vec2d,
    gameui = require('./gameui'),
    TitleScreen = require('./screens').TitleScreen,
    Cutscene = require('./screens').Cutscene,
    FadeTransition = gramework.state.FadeTransition,
    GameController = gramework.input.GameController;

var Images = {
    cop01:         './assets/images/cop01.png',
    bg_test:       './assets/images/bg_test.jpg',
    sprite_test:   './assets/images/spritesheet-enemy.png',
    sprite_test_2: './assets/images/spritesheet-player.png',
    terrain: './assets/images/terrain01.png',
    titlescreen: './assets/images/titlescreen.png',
    protester01:   './assets/images/protester01.png',
    protester02:   './assets/images/protester02.png',
    protester03:   './assets/images/protester03.png',
    protester04:   './assets/images/protester04.png',
    protester05:   './assets/images/protester05.png',
    protester06:   './assets/images/protester07.png',
    protester07:   './assets/images/protester01.png',
    protester08:   './assets/images/protester02.png',
    protester09:   './assets/images/protester03.png',
    protester10:   './assets/images/protester04.png',
    protester11:   './assets/images/protester05.png',
    protester12:   './assets/images/protester01.png',
    protester13:   './assets/images/protester02.png',
    protester14:   './assets/images/protester03.png',
    protester15:   './assets/images/protester04.png',
    tree_01:       './assets/images/tree_01.png',
    fence:         './assets/images/fencebroken.png',
    barricade:     './assets/images/barricade.png',
    gascloud: './assets/images/gascloud.png',
    staticcloud: './assets/images/staticcloud.png',
    border: './assets/images/border01.png',
    goat: './assets/images/goat.png',
    indicator: './assets/images/active_player_icon.png',
    beagle: './assets/images/beagle_icon.png',
    portrait1: './assets/images/portrait-andrewgardner.png',
    portrait2: './assets/images/portrait-protestor01.png',
    portrait3: './assets/images/portrait-protestor02.png',
    portrait4: './assets/images/portrait-protestor03.png',
    portrait5: './assets/images/portrait-protestor04.png',
    portrait6: './assets/images/portrait-protestor05.png',
    portrait7: './assets/images/portrait-protestor06.png',
    portrait8: './assets/images/portrait-protestor07.png',
    opening01: './assets/images/opening01.png',
    opening02: './assets/images/opening02.png',
    opening03: './assets/images/opening03.png',
    opening04: './assets/images/opening04.png',
    opening05: './assets/images/opening05.png',
    lose: './assets/images/lose.png',
    cop_static: './assets/images/cop_static.png',
    music: './assets/music/jam.ogg',
    intromusic: './assets/music/intro.ogg',
    posisound: './assets/music/positive.ogg',
    negisound: './assets/music/negative.ogg',
    caughtsound: './assets/music/copcaught.ogg'
};

var initSpriteSheet = function(image, width, height) {
    var ss = new animate.SpriteSheet(image, width, height);
    return ss;
};

var imgfy = function(image) {
    return gamejs.image.load(image);
};

var GROUND_HEIGHT = 20;

var GameOver = Scene.extend({
    initialize: function(options) {
        this.image = imgfy(Images.gameover);
    },

    draw: function(surface) {
        surface.blit(this.image, [0,0]);
    },

    event: function(ev) {
        if (ev.type === gamejs.event.KEY_DOWN) {
            if (ev.key === gamejs.event.K_r) {
                main();
            }
        }
    }
});

var Game = Scene.extend({
    initialize: function(options) {
        this.paused = false;
        this.debug = true;
        this.timer = 0;
        this.eventCounter = 0;
        this.warningLevel = 0;
        this.indicator = null;

        this.startingProtestors = 1;
        this.maxProtestors = 10;
        this.obstaclesOff = 0;
        this.loseScene = options.loseScene;

        gamejs.mixer.setNumChannels(1);

        this.music = new gamejs.mixer.Sound(Images.music);
        this._musicPlaying = false;

        this.portraits = {
            andrew: imgfy(Images.portrait1),
            2: imgfy(Images.portrait2),
            3: imgfy(Images.portrait3),
            4: imgfy(Images.portrait4),
            5: imgfy(Images.portrait5),
            6: imgfy(Images.portrait6),
            7: imgfy(Images.portrait7)
        };

        //Gotta init them spriteSheets
        this.spriteSheets = {
            police: [initSpriteSheet(imgfy(Images.cop01), 30, 30), 'andrew'],
            protester01: [initSpriteSheet(imgfy(Images.protester01), 30, 30), 'andrew'],
            protester02: [initSpriteSheet(imgfy(Images.protester02), 30, 30), 2],
            protester03: [initSpriteSheet(imgfy(Images.protester03), 30, 30), 3],
            protester04: [initSpriteSheet(imgfy(Images.protester04), 30, 30), 4],
            protester05: [initSpriteSheet(imgfy(Images.protester05), 30, 30), 5],
            protester06: [initSpriteSheet(imgfy(Images.protester06), 30, 30), 6],
            protester07: [initSpriteSheet(imgfy(Images.protester07), 30, 30), 7],
            protester08: [initSpriteSheet(imgfy(Images.protester08), 30, 30), 'andrew'],
            protester09: [initSpriteSheet(imgfy(Images.protester09), 30, 30), 2],
            protester10: [initSpriteSheet(imgfy(Images.protester10), 30, 30), 3],
            protester11: [initSpriteSheet(imgfy(Images.protester11), 30, 30), 4],
            protester12: [initSpriteSheet(imgfy(Images.protester12), 30, 30), 5],
            protester13: [initSpriteSheet(imgfy(Images.protester13), 30, 30), 6],
            protester14: [initSpriteSheet(imgfy(Images.protester14), 30, 30), 7],
            protester15: [initSpriteSheet(imgfy(Images.protester15), 30, 30), 'andrew']
            //gascloud: initSpriteSheet(imgfy(Images.gascloud), 60, 60)
        };

        this.topbar = new gameui.TopBar({
            color: [0,0,0],
            width: this.surface.getSize()[0],
            height: 40,
            x: 0,
            y:0,
            world: this,
            subBorderImage: imgfy(Images.border),
            subFont: "8px Ebit",
            portraits: this.portraits
        });

        this.terrain = new scrollables.AllTerrain({
            width: 1024,
            image: Images.terrain
        });

        var previousAdd = this.entities.add;
        this.entities.add = function(list) {
            previousAdd.apply(this, arguments);
            this._sprites.sort(function(a, b){
                return b.z-a.z;
            });
        };

        this.scrollGenerator = new scrollables.SceneryGenerator({
            world: this,
            images: [
                Images.tree_01//,
                //Images.staticcloud
            ]
        });

        // Handles world speed.
        this.velocity = new Vec2d(0, 0);
        this.speed = -10;
        this.accel = 5;
        this.runningPlane = this.surface.getSize()[1] - 50;

        // The front line of the protestors. Let's keep them grouped.
        this.frontLine = this.surface.getSize()[0] - 10;
        this.backLine = -25;
        this.createProtestors(this.startingProtestors);
        this.protestorGroupActive = false;
        this.protestorGroupDelay = 1; // in seconds.

        // Track the police pressure by using an imaginery line on the x-axis.
        this.policePressure = 50;
        this.policeRect = new gamejs.Rect(0,0,this.policePressure, 300);
        this.sirenColor = [255,0,0];
        this.reddening = false;

        this.startingPolice = 1;
        this.policeAdditionDelay = 5; // seconds.
        this.policeDelay = this.resetPoliceDelay();
        this.maxPolice = 15;

        // Police distraction is a "safe" zone in which while the active player
        // is in it, the police pressure does not increase. We keep track
        // of this so that when we're ahead of it, pressure increases!
        this.policeDistraction = this.policePressure + 50;
        this.createPolice(this.startingPolice);

        // Obstacles
        this.Obstacles = null;

        // Player management
        this.controller = new GameController({
            pause: gamejs.event.K_p,
            takeover: gamejs.event.K_t
        });
        this.player = null;
        this.spawnPlayer();

        this.eventable = new EventEmitter();
        this.eventBindings();
    },

    eventBindings: function() {
        var self = this;
        this.eventable.once("protestorsReady", this.joinProtestorGroup.bind(this));

        this.eventable.on("gameover", this.triggerGameOver.bind(this));
    },

    triggerGameOver: function() {
        this.dispatcher.push(this.loseScene);
    },

    pickProtestorSprite: function() {
        var randomNum = _.random(1,6);
        var zeroPadded = _s.pad(randomNum.toString(), 2, '0', 'left');
        var spriteId = 'protester' + zeroPadded;
        var spriteSheet = this.spriteSheets[spriteId];
        return spriteSheet;
    },

    createProtestors: function(limit, options) {
        options = (options || {});
        _.each(_.range(limit), function(i) {
            var x = (options.x || 80 + (i * 15));
            var sheet = this.pickProtestorSprite();
            var p = new entities.Protestor({
                x: x, y: this.runningPlane,
                width: 30, height: 30,
                world: this,
                portrait: sheet[1],
                spriteSheet: sheet[0],
                z: 0.5,
            });
            this.entities.add(p);
        }, this);
    },

    getObstacles: function() {
        return _.filter(this.entities._sprites, function(entity) {
            return entity.isObstacle === true;
        });
    },

    getPolice: function() {
        return _.filter(this.entities._sprites, function(entity) {
            return entity._alive === true && entity.isPolice === true;
        });
    },

    getProtestors: function() {
        return _.filter(this.entities._sprites, function(entity) {
            if (entity.isBeagleCarrier) return false;
            return entity.isProtestor === true;
        });
    },

    getBeagleCarrier: function() {
        return _.filter(this.entities._sprites, function(entity) {
            return entity.isBeagleCarrier === true;
        });
    },

    joinProtestorGroup: function() {
        _.each(_.range(this.maxProtestors - 1), function(i) {
            this.createProtestors(1, {
                x: (this.frontLine + 5 + (i * 5))
            });
        }, this);

        // Create the beagle carrier.
        var p = new entities.BeagleCarrier({
            x: this.frontLine, y: this.runningPlane,
            width: 30, height: 30,
            world: this,
            spriteSheet: this.spriteSheets.protester01[0], // TODO,
            portrait: this.spriteSheets.protester01[1],
            z: 0.5
        });

        var b = new entities.Beagle({
            guardian: p,
            image: Images.beagle
        });

        this.entities.add([p, b]);

        this.protestorGroupActive = true;
        // Don't show any obstacles while the group enters.
        this.obstaclesOff = 5; // in seconds.
    },

    resetPoliceDelay: function() {
        return this.policeAdditionDelay;
    },

    createPolice: function(limit, options) {
        options = (options || {});
        _.each(_.range(limit), function(i) {
            var x = (options.x || (i * 2));
            var p = new entities.Police({
                x: x, y: this.runningPlane,
                width: 30, height: 30,
                spriteSheet: this.spriteSheets.police[0],
                portrait: this.spriteSheets.police[1],
                world: this
            });
            this.entities.add(p);
        }, this);
    },

    // Pluck a random protestor from the group. The player will now control this
    // one.
    spawnPlayer: function() {
        var protestor = _.sample(this.getProtestors(), 1)[0];
        if (!protestor) {
            // Player is taking over th beagle carrier. Last remaining hope!
            protestor = this.getBeagleCarrier()[0];
        }

        if (!protestor) {
            // Game over man!
            this.eventable.emit("gameover");
            return;
        }

        this.player = new entities.Player({
            existing: protestor
        });

        if (!this.indicator) {
            this.indicator = new entities.PlayerIndicator({
                image: Images.indicator,
                follow: this.player
            });
            this.entities.add(this.indicator);
        } else {
            this.indicator.follow = this.player;
        }

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

        // As time goes up, we want to shrink the distraction box.
        var s = Math.round(this.timer / 10) * 10;
        if ((s / 20) % 1) {
            step -= (step * 0.3);
        }
        this.policeDistraction += step;

        if (this.policeDistraction >= (this.frontLine - 10)) {
            this.eventable.emit("gameover");
        }
    },

    policeGenerator: function(dt) {
        if (this.getPolice().length >= this.maxPolice) return;
        if (this.protestorGroupActive === false) return;

        dt = (dt / 1000);
        this.policeDelay -= dt;
        if (this.policeDelay <= 0) {
            var s = Math.round(this.policePressure / 10) * 10;
            var increase = Math.floor(s / 20);

            _.each(_.range(increase), function(i) {
                if (this.getPolice().length <= this.maxPolice) {
                    this.createPolice(increase, {x: (-5 + (i * 5))});
                }
            }, this);
            this.policeDelay = this.resetPoliceDelay();
        }
    },

    update: function(dt) {
        if (!this._musicPlaying) {
            this.music.play(true);
        }
        this.scrollGenerator.update(dt);
        this.terrain.update(dt);
        this.policeGenerator(dt);

        Scene.prototype.update.call(this, dt);

        dt = (dt / 1000); // Sane velocity mutations.

        this.timer += dt;

        // Await our group of protestors.
        this.protestorGroupDelay -= dt;
        if (this.protestorGroupDelay <= 0) {
            this.eventable.emit("protestorsReady");
        }

        var accel = new Vec2d(this.accel, 0);
        this.velocity.add(accel.mul(dt).mul(this.speed));

        this.obstaclesOff -= dt;
        // TODO: No obstacles while we test police distraction.
        if (false && this.obstaclesOff <= 0) {
            if (this.Obstacles && this.Obstacles.alive) {
                this.Obstacles.update(dt);
            } else if (this.Obstacles === null) {
                this.Obstacles = new obstacles.ObstacleEmitter({
                    world: this,
                    images: [Images.fence, Images.barricade]
                });
            } else if (!this.Obstacles.alive) {
                this.Obstacles = null;
            }
        }

        this.policeRect.width = this.policePressure;
        if (this.reddening) {
            var r = this.sirenColor[0] + 10;
            if (r > 255) {
                r = 255;
                this.reddening = false;
            }
            var b = this.sirenColor[2] - 20;
            if (b < 0) {
                b = 0;
            }
            this.sirenColor = [
                r,
                0,
                b
            ]
        } else {
            var r = this.sirenColor[0] - 20;
            if (r < 0) {
                r = 0;
            }
            var b = this.sirenColor[2] + 10;
            if (b > 255) {
                b = 255;
                this.reddening = true;
            }
            this.sirenColor = [
                r,
                0,
                b
            ]
        }

        //Event firings

        if (this.timer > 2 && this.eventCounter === 0) {
            this.eventCounter++;
            _.sample(this.getProtestors()).say(
                "We got one. We saved a dog.",
                true
            );
        }

        if (this.timer > 5 && this.eventCounter === 1) {
            this.eventCounter++;
            _.sample(this.getProtestors()).say(
                "Hang back and distract the police. Slow them down.",
                true
            );
        }

        if (this.timer > 20 && this.eventCounter === 2) {
            this.eventCounter++;
            _.sample(this.getProtestors()).say(
                "Keep running. We just have to get the dog to safety.",
                true
            );
        }

        if (this.timer > 40 && this.eventCounter === 3) {
            this.eventCounter++;
            _.sample(this.getProtestors()).say(
                "Not much further. They can't keep up forever.",
                true
            );
        }

        if (this.policePressure > 75 && this.warningLevel === 0) {
            this.warningLevel++;
            _.sample(this.getProtestors()).say(
                "They're gaining on us! Stay back!",
                true
            );
        }

    },

    draw: function(surface) {
        surface.clear();
        this.view.clear();

        this.surface.fill('rgb(0,20,80)');
        this.terrain.draw(this.view);
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
        
        _.range(0,this.policeRect.width,10).forEach(function(width){
            var tempRect = this.policeRect.clone();
            tempRect.width -= width;
            gamejs.draw.rect(this.view, "rgba(" + this.sirenColor.join(',') + ',0.1)', tempRect);
        }, this);        
        

        Scene.prototype.draw.call(this, surface, {clear: false});

    },

    event: function(ev) {
        if (this.player !== null) {
            this.player.event(ev);
        }

        // Placeholder. Need to send event and identify active protestor.
        var handled = this.controller.handle(ev);
        if (!handled) return;
        if (handled.value === this.controller.controls.pause) {
            if (handled.action === "keyDown") {
                this.paused = !this.paused;
            }
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
    var gameoverCutscene = new Cutscene({
        next: openingCutscene,
        borderImage: Images.border,
        images: [
            imgfy(Images.lose)
        ],
        text: [],
        duration: 5000,
        //portrait:
        pixelScale: 4
    });

    var game = new Game({
        pixelScale: 4,
        loseScene: gameoverCutscene
    });

    var openingCutscene = new Cutscene({
        next: game,
        borderImage: Images.border,
        images: [
            imgfy(Images.opening01),
            imgfy(Images.opening02),
            imgfy(Images.opening03)
        ],
        text: _.sample([[
            'I showed up to protest the beagle breeding mill.',
            'I didn\'t plan on breaking the law.',
            'When I saw the dog being handed down, the right thing was obvious.'
        ],[
            'They have the nerve to open a breeding mill in our community.',
            'The cops want to protect the right to kill these dogs?',
            "I'm sick of waiting for change."
        ],[
            'Beagles are the dog of choice for animal experiments.',
            'Because they don\'t really fight back.',
            'But I do.'
        ]]),
        //portrait: 
        pixelScale: 4
    });

    var titleScreen = new TitleScreen({
        image: Images.titlescreen,
        next: openingCutscene,
        pixelScale: 4
    });

    var d = new Dispatcher(gamejs, {
        initial: titleScreen,
        defaultTransition: FadeTransition,
        canvas: {flag: gamejs.display.DISABLE_SMOOTHING | gamejs.display.FULLSCREEN}
    });
};

gamejs.preload(_.values(Images));
gamejs.ready(main);

