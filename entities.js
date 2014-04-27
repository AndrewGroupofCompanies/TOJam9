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
        this.accel = 1.5;
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

    },

    canMove: function(dx, dy) {
        var collidedX = false,
            collidedY = false,
            start;

        // Moving to the right! Endless runner style.
        if (dx > 0) {
            start = this.rect.x;
            this.rect.x += dx;
        }

        if (dy > 0) {
            start = this.rect.y;
            this.rect.y += dy;
            this.rect.y = Math.floor(this.rect.y);
            if (this.world.collides(this)) {
                this.rect.y = Math.floor(this.rect.y);
                while (this.world.collides(this)) {
                    collidedY = true;
                    this.rect.y -= 1;
                }
            }
        }

        return [collidedX, collidedY];
    },

    // Velocity handling.
    adjustVector: function(dt) {
        return;
    },

    // Collision code!
    decideNextMovement: function(dt) {
        dt = (dt / 1000);

        // Decide next movement.
        var delta = new Vec2d(0, 0);
        delta.add(this.velocity).mul(dt);

        var collided = this.canMove.apply(this, delta.unpack()),
            collidedX = collided[0],
            collidedY = collided[1];

        if (collidedY) {
            this.velocity.setY(0);
            if (delta.getY() > 0) {
                this.onGround = true;
            }
        } else {
            // We're moving up or down, probably not on ground.
            if (Math.floor(delta.getY()) !== 0) {
                this.onGround = false;
            }
        }
    },

    update: function(dt) {
        if (this.world.paused) return;

        this.adjustVector(dt);
        this.rect.x += this.velocity.getX();
        this.rect.y += this.velocity.getY();
        this.collisionRect.x = this.rect.x;
        this.collisionRect.y = this.rect.y;

        this.decideNextMovement(dt);

        if (this.image && !this.anim.isFinished()) {
            this.image = this.anim.update(dt);
        }

        // Don't adjust any other animations post-capture
        if (this.isCaptured) {
            return;
        }

        if (this.anim && this.anim.isFinished()) {
            this.anim.start('running');
        }

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
    }

});

var Protestor = Citizen.extend({
    initialize: function(options) {
        Citizen.prototype.initialize.call(this, options);

        this.isProtestor = true; // Identifier.

        this.runSpeed = 1.0; // Our speed modifier.
        this.accel = 1.0;
        this.speed = this.runSpeed;
        this.maxspeed = 2.0;

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
        this.awarenessDistance = 90;

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
    },

    makeDecision: function() {
        return _.random(0, 10) > 7;
    },

    resetDecision: function() {
        return this.decideCounterStart;
    },

    // Is captured by the cops, just get off the screen.
    isBeingCaptured: function() {
        this.speed = -10;
        this.accel = 2;
        this.isCaptured = true;
        this.setAnimation('captured');
    },

    adjustVector: function(dt) {
        Citizen.prototype.adjustVector.call(this, dt);
        dt = (dt / 1000);

        // Adjust accel and speed because we may be sprinting forward.
        var accel = new Vec2d(this.accel, 0);
        this.velocity.add(accel.mul(dt).mul(this.speed));
        this.velocity = this.velocity.truncate(this.maxSpeed);

        // No movement exept for normal speed adjustment.
        if (this.isCaptured) {
            return;
        }

        var decel = this.speed / 1.5 * dt;
        if (accel.isZero()) {
            dampenVector(this.velocity, decel);
        } else {
            if (accel.x === 0) {
                console.log("dampenVector X");
                this.accel.x = dampen(this.accel.x, decel);
            }
        }

        // If we're near police we should ensure that the movement is positive.
        if (this.nearPolice()) {
            //console.log(this.hex, " is near the police!");
            this.speed = this.runSpeed;
            this.accel = 1;
            return;
        } else if (this.nearFront()) {
            //console.log(this.hex, " is near the front!");
            this.speed = -(this.runSpeed);
            this.accel = 1;
            return;
        } else {
            this.accel = 0;
        }

        // Every now and then, let's decide what to do. Stay at our speed,
        // or adjust it slightly.
        this.decideCounter -= dt;
        if (this.decideCounter <= 0) {
            //console.log(this.hex, " is deciding what to do");
            // Generally, we'll stay where we are.
            if (this.makeDecision()) {
                this.accel = 1.5;
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

    restoreMotion: function() {
        this.isDeking = false;
        this.isDucking = false;
        this.isStumbling = false;
        this.accel = 1.5;
        this.canDeke = true;
    },

    deke: function() {
        this.isDeking = true;
        this.canDeke = false;
        this.setAnimation("deke");
        this.dekeCounter = 300;
        this.accel = 3;
    },

    endDeke: function() {
        this.restoreMotion();
    },

    duck: function() {
        this.setAnimation("duck");
        this.isDucking = true;
        this.duckCounter = 500;
        this.canDeke = false;
    },

    endDuck: function() {
        this.restoreMotion();
    },

    stumble: function() {
        this.setAnimation("stumble");
        this.stumbleCounter = 500;
        this.accel = -1.5;
        this.isStumbling = true;
        this.canDeke = false;
    },

    endStumble: function() {
        this.restoreMotion();
    },

    clothesline: function() {

    },

    endClothesline: function() {

    },

    update: function(dt) {
        Citizen.prototype.update.apply(this, arguments);

        // Protestors collision rect is a bit above rect x;
        this.collisionRect.x = this.rect.x + 10;

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
            console.log("alas, my deke has finished");
            this.endDeke();
        }

        if (this.stumbleCounter > 0) {
            this.stumbleCounter -= dt;
        }

        if (this.stumbleCounter <= 0 && this.isStumbling) {
            this.endStumble();
        }

        // NPC-specific behaviour
        if (this.isProtestor) {
            // Identify obstacles and deke them out if necessary.
            this.world.getObstacles().forEach(function(o) {
                if (this.collisionRect.collideRect(o.collisionRect)) {
                    this.collidingWithObstacle(o);
                }
            }, this);
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
        //gamejs.draw.rect(surface, "#ffcc00", this.collisionRect);
        Citizen.prototype.draw.call(this, surface);
    }
});

var Police = Citizen.extend({
    animSpec: {
        running: {frames: _.range(8), rate: 30, loop: true},
        diving: {frames: _.range(21, 40), rate: 30, loop: false},
        capturing: {frames: _.range(41, 55), rate: 30, loop: false}
    },

    initialize: function(options) {
        Citizen.prototype.initialize.call(this, options);

        this.isPolice = true; // identifier

        this.collisionRect = this.rect.clone();
        this.collisionRect.width = 30;

        this.hex = "#0033CC";
        this.speed = 0.5;

        this.pressurePadding = 15;

        // States
        this.isCapturing = false;
        this.canCapture = false;

        this.anim.setFrame(_.random(0,7));
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
        if (this.collisionRect.x <= this.world.backLine) {
            return true;
        }
        return false;
    },

    // This cop is busy capturing someone now.
    actionCapture: function(entity) {
        console.log("actionCapture", entity);

        this.accel = 5;
        this.isCapturing = true;
        entity.isBeingCaptured();

        this.setAnimation("diving");

        // Set speed to negative, so the two go off the screen.
        this.speed = -10;
    },

    adjustVector: function(dt) {
        Citizen.prototype.adjustVector.call(this, dt);
        dt = (dt / 1000);

        // Adjust accel and speed because we may be sprinting forward.
        var accel = new Vec2d(this.accel, 0);
        this.velocity.add(accel.mul(dt).mul(this.speed));
        this.velocity = this.velocity.truncate(this.maxSpeed);

        if (this.isCapturing) return;

        if (this.nearPoliceLine()) {
            this.speed = -0.5;
        } else if (this.nearBack()) {
            this.speed = 0.5;
        }
    },

    update: function(dt) {
        Citizen.prototype.update.call(this, dt);

        // Police identify when they sense a protestor within their graps. When
        // they do, they make a lounge for them, and may potentially capture
        // them!
        if (this.isCapturing === false) {
            this.world.getProtestors().forEach(function(entity) {
                // If the entity is not the player, they can't be captured if
                // canCapture is true, but if they are the player, still
                // possible.
                if (entity.isCaptured) return;
                if (this.canCapture === false && entity.isPlayer === false) return;
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

        Citizen.prototype.draw.apply(this, arguments);
    }
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
        this.pressureDelay = 1000; // in milliseconds.

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


        // Adjust speed based on input.
        if (this.isDeking) {
            this.speed = this.runSpeed * 2;
        } else if (this.isPushing) {
            this.speed = this.runSpeed;
        } else {
            this.speed = -1;
        }

        // Adjust accel and speed because we may be sprinting forward.
        var accel = new Vec2d(this.accel, 0);
        this.velocity.add(accel.mul(dt).mul(this.speed));
        this.velocity = this.velocity.truncate(this.maxSpeed);
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

    draw: function(surface) {
        if (this.isCaptured === false) {
            gamejs.draw.circle(surface, "rgb(255, 0, 0)",
                [this.rect.left + 14, this.rect.bottom - 2], 4, 2);
        }
        Protestor.prototype.draw.apply(this, arguments);
    },

    // In policeDistraction zone.
    isDistractingPolice: function() {
        //console.log(this.rect.x, this.world.policeDistraction);
        if (this.rect.x <= this.world.policeDistraction) {
            return true;
        }
        return false;
    },

    collidingWithObstacle: function(obstacle) {
        if (this.isCaptured === true) return;

        if (this.isPushing) {
            this.stumble();
        } else {
            if (obstacle.high) {
                this.duck();
            } else if (obstacle.low) {
                this.deke();
            }
        }
    },

    update: function(dt) {
        if (this.world.paused) return;

        if (this.tapCountdown > 0) {
            this.tapCountdown -= dt;
        }

        if (this.rect.x <= 0) {
            this.kill();
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
    }
});

module.exports = {
    Protestor: Protestor,
    Police: Police,
    Player: Player
};
