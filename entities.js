var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Entity = gramework.Entity,
    animate = gramework.animate,
    Vec2d = gramework.vectors.Vec2d,
    dampenVector = gramework.vectors.dampenVector,
    dampen = gramework.vectors.dampen,
    GameController = gramework.input.GameController;

var randomHex = function() {
    return '#' + (function co(lor){   return (lor += [0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'][Math.floor(Math.random()*16)]) && (lor.length == 6) ?  lor : co(lor); })('');
};

var font = new gamejs.font.Font('6px monospace');

var Citizen = Entity.extend({
    animSpec: {
        running: {frames: _.range(40), rate: 30, loop: true},
        deke: {frames: _.range(81, 90), rate: 30},
        duck: {frames: _.range(41, 50), rate: 30},
        stumble: {frames: _.range(121, 145), rate: 30},
        captured: {frames: _.range(240, 260), rate: 30}
    },

    initialize: function(options) {
        options = (options || {});

        this.world = options.world;
        this.velocity = new Vec2d(0, 0);
        this.accel = new Vec2d(1.5, 0);
        this.maxSpeed = 2;
        this.speed = 0;
        this.onGround = false;
        this.hex = randomHex();
        this.z = 0;

        // Default collision rect is nothing different.
        this.collisionRect = this.rect.clone();

        if (options.spriteSheet) {
            this.spriteSheet = options.spriteSheet;
            this.anim = new animate.Animation(this.spriteSheet, "running", this.animSpec);
            this.image = this.anim.update(0);
            this.anim.setFrame(0);
        }

        if (options.portrait) {
            this.portrait = options.portrait;
        }

    },

    // Velocity handling.
    adjustVector: function(dt) {
        return;
    },

    restoreMotion: function() {
        this.isDeking = false;
        this.isDucking = false;
        this.isStumbling = false;
        this.canDeke = true;
    },

    deke: function() {
        this.isDeking = true;
        this.canDeke = false;
        this.setAnimation("deke");
        this.dekeCounter = 300;
        this.accel = new Vec2d(1, 0);
    },

    endDeke: function() {
        this.restoreMotion();
    },

    duck: function() {
        this.setAnimation("duck");
        this.isDucking = true;
        this.duckCounter = 500;
        this.canDeke = false;

        // When they duck and going backwards, just push them a little so they
        // don't get stuck with the fence.
        if (this.velocity.getX() < 0) {
            this.accel = new Vec2d(1.5, 0);
            this.speed = 1;
        }
    },

    endDuck: function() {
        this.restoreMotion();
    },

    stumble: function() {
        this.setAnimation("stumble");
        this.stumbleCounter = 500;
        this.accel = new Vec2d(1.5, 0);
        this.speed = 3;
        this.isStumbling = true;
        this.canDeke = false;
    },

    endStumble: function() {
        this.restoreMotion();
    },

    // No-op for citizens. Cops don't get clothes lined!
    clothesline: function() {
        return;
    },

    update: function(dt) {
        if (this.world.paused) return;

        this.adjustVector(dt);
        this.rect.x += this.velocity.getX();
        this.rect.y += this.velocity.getY();
        this.collisionRect.x = this.rect.x;
        this.collisionRect.y = this.rect.y;

        if (this.image && !this.anim.isFinished()) {
            this.image = this.anim.update(dt);
        }

        // Don't adjust any other animations post-capture
        if (this.isCaptured) {
            return;
        }

        if (this.duckCounter > 0) {
            this.duckCounter -= dt;
        }

        if (this.duckCounter <= 0 && this.isDucking) {
            this.endDuck();
        }

        if (this.dekeCounter > 0) {
            this.dekeCounter -= dt;
        }

        if (this.dekeCounter <= 0 && this.isDeking) {
            this.endDeke();
        }

        if (this.stumbleCounter > 0) {
            this.stumbleCounter -= dt;
        }

        if (this.stumbleCounter <= 0 && this.isStumbling) {
            this.endStumble();
        }

        // Identify obstacles and deke them out if necessary.
        this.world.getObstacles().forEach(function(o) {
            if (this.collisionRect.collideRect(o.collisionRect)) {
                this.collidingWithObstacle(o);
            }
        }, this);

        if (this.anim && this.anim.isFinished()) {
            this.anim.start('running');
        }
    },

    collidingWithObstacle: function(obstacle) {
        if (obstacle.high) {
            this.duck();
        } else if (obstacle.low) {
            this.deke();
        }
    },


    draw: function(surface) {
        if (this.image) {
            Entity.prototype.draw.apply(this, arguments);
        } else {
            gamejs.draw.rect(surface, this.hex, this.rect);
        }

        if (this.world.debug) {
            // Draw some useful info above the head!
            /*
            var fAccel = font.render("a" + String(this.accel.x));
            surface.blit(fAccel, [this.rect.x + 5, this.rect.y - 10]);

            var fSpeed = font.render("o" + String(this.speed));
            surface.blit(fSpeed, [this.rect.x + 25, this.rect.y - 10]);
            */
        }
    },

    setAnimation: function(animation) {
        if (this.anim.currentAnimation !== animation) {
            this.anim.start(animation);
        }
    },

    say: function(text, priority) {
        if (typeof(priority)==='undefined'){
            var priority = false;
        }
        console.log(this.portrait);
        this.world.topbar.displayText(text, this.portrait, priority);
    }

});

var Protestor = Citizen.extend({
    initialize: function(options) {
        Citizen.prototype.initialize.call(this, options);

        this.isProtestor = true; // Identifier.

        this.runSpeed = 1.0; // Our speed modifier.
        this.accel = new Vec2d(1, 0);
        this.speed = this.runSpeed;
        this.maxspeed = 1.0;

        this.canDeke = true;
        this.stumbleCounter = 0;
        this.duckCounter = 0;
        // A lot of states to manage....
        this.isDeking = false;
        this.isDucking = false;
        this.isCaptured = false;
        this.isStumbling = false;

        // Police padding. If we get too near the police and are aware of them,
        // we should
        this.awarenessDistance = 40;

        // Eventually police can advance, and we won't be aware of this. This is
        // where we can get captured.
        this.aware = true;

        this.decideCounterStart = 1.5;
        this.decideCounter = this.resetDecision();

        this.collisionRect.width = this.rect.width / 2;

        // We create player without an anim right away, so need to be careful.
        if (this.anim) {
            this.anim.setFrame(_.random(0,23));
        }

        this.safetyCounterStart = 1.5;
        this.safetyCounter = this.resetSafetyCounter();
    },

    makeDecision: function() {
        if (this.isDeking) return false;
        if (this.isCaptured) return false;
        if (this.accel.getX() !== 0) return false;
        return _.random(0, 10) > 7;
    },

    resetDecision: function() {
        return this.decideCounterStart;
    },

    resetSafetyCounter: function() {
        this.safetyCounter = this.safetyCounterStart;
        return this.safetyCounter;
    },

    // Is captured by the cops, just get off the screen.
    isBeingCaptured: function() {
        this.velocity.setX(-1);
        this.isCaptured = true;
        this.setAnimation('captured');
        this.say('I\'m caught!');
    },

    adjustVector: function(dt) {
        Citizen.prototype.adjustVector.call(this, dt);
        dt = (dt / 1000);

        // No movement exept for normal speed adjustment.
        if (this.isCaptured) {
            return;
        }

        // Adjust accel and speed because we may be sprinting forward.
        var accel = new Vec2d(this.accel.x, 0);
        this.velocity.add(accel.mul(dt).mul(this.speed));
        this.velocity = this.velocity.truncate(this.maxSpeed);

        var decel = Math.abs(this.speed / 1.2 * dt);
        if (accel.isZero()) {
            dampenVector(this.velocity, decel);
        } else {
            // Otherwise, we still have acceleration, so slowly get rid of it.
            dampenVector(this.accel, decel);
        }

        // If we're near police we should ensure that the movement is positive.
        if (this.nearPolice()) {
            //console.log(this.hex, " is near the police!");
            this.speed = this.runSpeed;
            this.accel = new Vec2d(0.5, 0);
            return;
        } else if (this.nearFront()) {
            //console.log(this.hex, " is near the front!");
            this.speed = -(this.runSpeed);
            this.accel = new Vec2d(0.5, 0);
            return;
        }

        // Every now and then, let's decide what to do. Stay at our speed,
        // or adjust it slightly.
        this.decideCounter -= dt;
        if (this.decideCounter <= 0) {
            // Generally, we'll stay where we are.
            if (this.makeDecision()) {
                this.accel = new Vec2d(1, 0);
                this.speed += _.first(_.sample(
                    [-(this.runSpeed), (this.runSpeed)]
                , 1));
            }
            this.decideCounter = this.resetDecision();
        }
    },

    // Protestor is getting awfully close to the police!
    nearPolice: function() {
        if ((this.rect.x - this.awarenessDistance) <= this.world.policePressure) {
            return true;
        }
        return false;
    },

    // We're near the front of the pack, just hold back.
    nearFront: function() {
        if ((this.rect.x + this.rect.width) >= this.world.frontLine) {
            return true;
        }
        return false;
    },

    update: function(dt) {
        Citizen.prototype.update.apply(this, arguments);

        dt = (dt / 1000);
        this.safetyCounter -= dt;

        // Protestors collision rect is a bit above rect x;
        this.collisionRect.x = this.rect.x + 10;
    },

    draw: function(surface) {
        if (this.world.debug) {
            //gamejs.draw.rect(surface, "#ffcc00", this.collisionRect);
            /*
            gamejs.draw.line(surface, "#ffcc00",
                [this.rect.x - this.awarenessDistance, 0],
                [this.rect.x - this.awarenessDistance, surface.getSize()[1]]);
            */
        }

        Citizen.prototype.draw.call(this, surface);
    }
});

var Police = Citizen.extend({
    animSpec: {
        running: {frames: _.range(40), rate: 30, loop: true},
        diving: {frames: _.range(21, 40), rate: 30, loop: false},
        deke: {frames: _.range(81, 91), rate: 30, loop: false},
        duck: {frames: _.range(41, 50), rate: 30, loop: false},
        reaching: {frames: _.range(281, 305), rate: 30, loop: false},
        falling: {frames: _.range(321, 340), rate: 30, loop: false},
        capturing: {frames: _.range(361, 400), rate: 30, loop: false}
    },

    initialize: function(options) {
        Citizen.prototype.initialize.call(this, options);

        this.isPolice = true; // identifier

        this.collisionRect = this.rect.clone();
        this.collisionRect.width = 30 / 2;

        this.hex = "#0033CC";
        this.speed = 0.5;

        this.pressurePadding = 35;

        // States
        this.isCapturing = false;
        this.completedCapture = false;
        this.canCapture = false;
        this.captureCountdownStart = 1.5;
        this.captureCountdown = this.resetCaptureCountdown();

        this.anim.setFrame(_.random(0,7));

        this.decideCounterStart = 1.5;
        this.decideCounter = this.resetDecision();
    },

    resetCaptureCountdown: function() {
        return this.captureCountdownStart;
    },

    resetDecision: function() {
        return this.decideCounterStart;
    },

    isDistracted: function() {
        this.canCapture = false;
    },

    notDistracted: function() {
        this.canCapture = true;
    },

    // Police won't always pass the pressure line, but we also want them to have
    // some variable movement.
    nearPoliceLine: function() {
        if ((this.collisionRect.x + this.collisionRect.width + this.pressurePadding) >= this.world.policePressure) {
            return true;
        }
        return false;
    },

    nearBack: function() {
        if (this.collisionRect.x <= (this.world.backLine)) {
            return true;
        }
        return false;
    },

    executeCapture: function(entity) {
        var self = this;
        // Don't double lap cops due to the time delay on this function.
        if (entity.isCaptured) return;

        //console.log("executeCapture", entity.isDeking);
        if (entity.isDeking) {
            entity.resetSafetyCounter();
            this.velocity.setX(-1);
            _.delay(function() {
                self.setAnimation("falling");
                if (self.rect.x <= -50) {
                    self.kill();
                }
            }, 500);
            this.shouldFall = true;
        } else {
            this.setAnimation("capturing");
            this.completedCapture = true;
            entity.isBeingCaptured();
            // Set speed to negative, so the two go off the screen.
            this.velocity.setX(-1);
            _.delay(function() {
                if (self.rect.x <= -50) {
                    self.kill();
                }
            }, 1000);
        }
    },

    // This cop is busy capturing someone now.
    actionCapture: function(entity) {
        this.isCapturing = true;
        this.captureCountdown = this.resetCaptureCountdown();

        this.setAnimation("reaching");
        this.accel = new Vec2d(0.5, 0);
        this.speed = 1;

        // We now give the user a split second to react to the police.
        _.delay(this.executeCapture.bind(this), 500, entity);
    },

    adjustVector: function(dt) {
        Citizen.prototype.adjustVector.call(this, dt);
        dt = (dt / 1000);

        if (this.isCapturing) return;

        // Adjust accel and speed because we may be sprinting forward.
        var accel = new Vec2d(this.accel.x, 0);
        this.velocity.add(accel.mul(dt).mul(this.speed));
        this.velocity = this.velocity.truncate(this.maxSpeed);

        var decel = Math.abs(this.speed / 1.2 * dt);
        if (accel.isZero()) {
            dampenVector(this.velocity, decel);
        } else {
            // Otherwise, we still have acceleration, so slowly get rid of it.
            dampenVector(this.accel, decel);
        }

        if (this.nearPoliceLine()) {
            this.accel = new Vec2d(0.25, 0);
            this.speed = -1;
        } else if (this.nearBack()) {
            this.accel = new Vec2d(0.25, 0);
            this.speed = 1;
            this.velocity.setX(0.25);
        } else {
            this.decideCounter -= dt;
            if (this.decideCounter <= 0) {
                this.accel = new Vec2d(1, 0);
                this.speed += _.first(_.sample([-1, 1], 1));
                this.decideCounter = this.resetDecision();
            }
        }
    },

    update: function(dt) {
        Citizen.prototype.update.call(this, dt);

        dt = (dt / 1000);

        if (this.isCapturing === true) {
            this.captureCountdown -= dt;
            if (this.captureCountdown <= 0) {
                this.isCapturing = false;
                this.captureCountdown = this.resetCaptureCountdown();
            }
        }

        // Police identify when they sense a protestor within their graps. When
        // they do, they make a lounge for them, and may potentially capture
        // them!
        if (this.isCapturing === false && this.completedCapture === false) {
            this.world.getProtestors().forEach(function(entity) {
                if (entity.isCaptured) return;
                if (entity.safetyCounter > 0) return;
                if (this.canCapture === false) {
                    // If the entity is not the player, they can't be captured if
                    // canCapture is true, but if they are the player, still
                    // possible.
                    if (entity.isPlayer === false) {
                        return;
                    }
                }
                if (this.collisionRect.collideRect(entity.rect)) {
                    this.actionCapture(entity);
                }
            }, this);
        }

        this.collisionRect.x = this.rect.x;
        this.collisionRect.y = this.rect.y;
    },

    draw: function(surface) {
        if (this.isCapturing) {
            gamejs.draw.circle(surface, "rgb(100, 0, 100)",
                [this.rect.left + 30, this.rect.bottom - 2], 4, 2);
        }

        if (this.world.debug) {
            //gamejs.draw.rect(surface, "#ffcccc", this.collisionRect);
        }

        Citizen.prototype.draw.apply(this, arguments);
    }
});

// Doesn't do much different, but we need to identify the beagle carrier
// and keep them up front.
var BeagleCarrier = Protestor.extend({
    isBeagleCarrier: true,

    nearFront: function() {
        return true;
    },

    // Carrier doesn't move. Just stays in place until we take them over.
    adjustVector: function(dt) {
        Protestor.prototype.adjustVector.call(this, dt);
        if (this.rect.x <= (this.world.frontLine - 12)) {
            this.velocity.setX(0);
        }
    },
});


var Player = Protestor.extend({
    initialize: function(options) {
        Protestor.prototype.initialize.call(this, options);

        this.isPlayer = true; // identifier;

        if (options.existing) {
            this.createFromProtestor(options.existing);
        }

        this.controller = new GameController({
            sprint: gamejs.event.K_SPACE
        });

        this.tapCountdown = 0;
        this.pressureCount = 0;
        this.pressureDelay = 80; // in milliseconds.

        this.doubleTapSpeed = 200; // in milliseconds
    },

    // A player just takes over a protestor.
    createFromProtestor: function(p) {
        this.speed = p.speed;
        this.velocity = p.velocity;
        this.world = p.world;
        this.rect = p.rect;
        this.hex = "#000000";
        this.isProtestor = true;
        this.spriteSheet = p.spriteSheet;
        this.anim = p.anim;
        this.image = this.anim.update(0);
    },

    isBeingCaptured: function() {
        Protestor.prototype.isBeingCaptured.call(this);

        // We no longer control this player. We should make the player a new
        // protestor.
        this.world.spawnPlayer();
    },

    adjustVector: function(dt) {
        dt = (dt / 1000); // Sanity.

        if (this.isCaptured) {
            return;
        }

        // Adjust accel and speed because we may be sprinting forward.
        var accel = new Vec2d(this.accel.x, 0);
        this.velocity.add(accel.mul(dt).mul(this.speed));
        this.velocity = this.velocity.truncate(this.maxSpeed);

        // Adjust speed based on input.
        if (this.isDeking) {
            this.speed = this.runSpeed * 2;
        } else if (this.isPushing) {
            this.speed = this.runSpeed;
        } else {
            this.speed = -1;
        }
    },

    event: function(ev) {
        var key = this.controller.handle(ev);

        this.isPushing = false;

        if (!key) return;
        if (key.action === "keyDown") {
            if (key.value === this.controller.controls.sprint) {
                if (this.tapCountdown > 0 && this.canDeke) {
                    //double-tap event!
                    this.deke();
                }
                this.isPushing = true;
            }

        } else if (key.action === "keyUp") {
            if (key.value === this.controller.controls.sprint) {
                if (this.tapCountdown <= 0) {
                    this.tapCountdown = this.doubleTapSpeed;
                }
            }
        }
    },

    // In policeDistraction zone.
    isDistractingPolice: function() {
        //console.log(this.rect.x, this.world.policeDistraction);
        if (this.rect.x <= this.world.policeDistraction) {
            return true;
        }
        return false;
    },

    // Player has custom functionality for avoiding obstacles
    collidingWithObstacle: function(obstacle) {
        if (this.isCaptured === true) return;

        // If we hit a high obstacle and we're not doing anything, we duck, but
        // if we were pushing forward or trying to deke, we get clothes lined.
        if (obstacle.high) {
            if (this.isDeking || this.isPushing) {
                this.clothesLine();
            } else {
                // We're safe!
                this.duck();
            }
        } else if (obstacle.low) {
            if (this.isDeking) {
                this.deke();
            } else {
                this.stumble();
            }
        }
    },

    // Oh dear!
    clothesLine: function() {
        this.isBeingCaptured();
        this.canDele = false;
    },


    update: function(dt) {
        if (this.world.paused) return;

        if (this.tapCountdown > 0) {
            this.tapCountdown -= dt;
        }

        if (this.rect.x <= 0) {
            if (this.isCaptured === false) {
                this.kill();
                this.world.spawnPlayer();
            }
        }

        // If we're near police we should warn the active Player.
        if (this.nearPolice()) {
            // TODO
        }

        // Check if we are inside the police distraction zone. If we are, we're
        // doing a good job. We only check this every second, as to not go
        // insane on increasing pressure.
        this.pressureCount += dt;
        if (this.pressureCount >= this.pressureDelay) {
            this.pressureCount = 0;
            if (this.isDistractingPolice()) {
                this.world.getPolice().forEach(function(p) {
                    p.isDistracted();
                });
            } else {
                this.world.increasePolicePressure();
                this.world.getPolice().forEach(function(p) {
                    p.notDistracted();
                });
            }
        }

        Protestor.prototype.update.apply(this, arguments);
    },

    draw: function(surface) {
        Protestor.prototype.draw.apply(this, arguments);

        if (this.isCaptured === false) {
            gamejs.draw.circle(surface, "rgb(255, 0, 0)",
                [this.rect.left + 14, this.rect.bottom - 2], 4, 2);
        }
        if (this.world.debug) {
            //gamejs.draw.rect(surface, "#ffcccc", this.collisionRect);
        }
    }
});

var Beagle = Entity.extend({
    initialize: function(options) {
        this.image = gamejs.image.load(options.image);
        this.guardian = options.guardian;
        this.z = -1;
    },

    update: function(dt) {
        var pos = this.guardian.topLeft();
        this.setPos(Math.floor(pos[0]) + 6, Math.floor(pos[1] - 20));
    }
});

var PlayerIndicator = Entity.extend({
    initialize: function(options) {
        this.image = gamejs.image.load(options.image);
        this.follow = options.follow;
        this.z = -1;
    },

    update: function(dt) {
        var pos = this.follow.topLeft();
        this.setPos(Math.floor(pos[0]) + 6, Math.floor(pos[1] - 20));
    }
});

module.exports = {
    Protestor: Protestor,
    Police: Police,
    Player: Player,
    BeagleCarrier: BeagleCarrier,
    Beagle: Beagle,
    PlayerIndicator: PlayerIndicator
};
