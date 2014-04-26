var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Entity = gramework.Entity,
    animate = gramework.animate,
    Vec2d = gramework.vectors.Vec2d,
    GameController = gramework.input.GameController;

var randomHex = function() {
    return '#' + (function co(lor){   return (lor += [0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'][Math.floor(Math.random()*16)]) && (lor.length == 6) ?  lor : co(lor); })('');
};

var blueHex = function() {
  var blues = Math.floor(Math.random()*3);
  var blueColour;
  switch (blues){
    case 1:
      blueColour="#0033CC";
      break;
    case 2:
      blueColour="#002EB8";
      break;
    case 3:
      blueColour="#0029A3";
      break;
  }
  return blueColour;
};

var Citizen = Entity.extend({
    initialize: function(options) {
        options = (options || {});

        this.world = options.world;
        this.velocity = new Vec2d(0, 0);
        this.speed = 0;
        this.onGround = false;

        if (options.spriteSheet) {
            this.spriteSheet = options.spriteSheet;
            this.anim = new animate.Animation(this.spriteSheet, "running", {
                running: {frames: _.range(40), rate: 30}
            });

            this.image = this.anim.update(0);
            this.anim.setFrame(_.random(0,23));
        }

        this.hex = randomHex();
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
        dt = (dt / 1000); // Sanity.
        var vec = new Vec2d().add(this.world.gravity);
        this.velocity.add(vec.mul(dt));
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
        this.adjustVector(dt);
        this.rect.x += this.velocity.getX();
        this.rect.y += this.velocity.getY();
        this.decideNextMovement(dt);

        if (this.image) {
            this.image = this.anim.update(dt);
        }
    },

    draw: function(surface) {
        if (this.image) {
            Entity.prototype.draw.apply(this, arguments);
        } else {
            gamejs.draw.rect(surface, this.hex, this.rect);
        }
    }

});

var Protestor = Citizen.extend({
    initialize: function(options) {
        Citizen.prototype.initialize.call(this, options);

        this.isProtestor = true; // Identifier.

        this.runSpeed = 1.5; // Our speed modifier.
        this.speed = this.runSpeed;
        this.accel = 1.5;
        this.maxSpeed = 2;

        // Police padding. If we get too near the police and are aware of them,
        // we should
        this.awarenessDistance = 20;

        // Eventually police can advance, and we won't be aware of this. This is
        // where we can get captured.
        this.aware = true;

        this.decideCounterStart = 3;
        this.decideCounter = this.resetDecision();
    },

    makeDecision: function() {
        return _.random(0, 10) > 7;
    },

    resetDecision: function() {
        return this.decideCounterStart;
    },

    adjustVector: function(dt) {
        Citizen.prototype.adjustVector.call(this, dt);

        dt = (dt / 1000);

        // If we're near police we should ensure that the movement is positive.
        if (this.nearPolice()) {
            //console.log(this.hex, " is near the police!");
            this.speed = this.runSpeed;
        } else if (this.nearFront()) {
            //console.log(this.hex, " is near the front!");
            this.speed = -(this.runSpeed);
        }

        // Every now and then, let's decide what to do. Stay at our speed,
        // or adjust it slightly.
        this.decideCounter -= dt;
        if (this.decideCounter <= 0) {
            //console.log(this.hex, " is deciding what to do");
            // Generally, we'll stay where we are.
            if (this.makeDecision()) {
                this.speed += _.first(_.sample(
                    [-(this.runSpeed), this.runSpeed]
                , 1));
            } else {
                this.speed = 0;
            }
            this.decideCounter = this.resetDecision();
        }

        // Adjust accel and speed because we may be sprinting forward.
        var accel = new Vec2d(this.accel, 0);
        this.velocity.add(accel.mul(dt).mul(this.speed));
        this.velocity = this.velocity.truncate(this.maxSpeed);
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
    }
});

var Player = Protestor.extend({
    initialize: function(options) {
        Protestor.prototype.initialize.call(this, options);

        if (options.existing) {
            this.createFromProtestor(options.existing);
        }

        this.controller = new GameController({
            sprint: gamejs.event.K_SPACE
        });
    },

    // A player just takes over a protestor.
    createFromProtestor: function(p) {
        this.speed = p.speed;
        this.velocity = p.velocity;
        this.world = p.world;
        this.rect = p.rect;
        this.hex = "#000000";
        this.isProtestor = false;
        this.spriteSheet = p.spriteSheet;
        this.anim = p.anim;
        this.image = this.anim.update(0);
    },

    adjustVector: function(dt) {
        dt = (dt / 1000); // Sanity.
        var vec = new Vec2d().add(this.world.gravity);
        this.velocity.add(vec.mul(dt));

        // If we're near police we should warn the active Player.
        if (this.nearPolice()) {
            // TODO
        }

        // Adjust speed based on input.
        if (this.isPushing) {
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
                this.isPushing = true;
            }

        } else if (key.action === "keyUp") {

        }
    },

    draw: function(surface) {
        var surf = new gamejs.Surface(12, 12);
        gamejs.draw.circle(surf, "rgb(255,0,0)", [6,6], 6, 2);

        surface.blit(surf, new gamejs.Rect([this.rect.left + 5, this.rect.bottom - 2, 12, 5]));

        Protestor.prototype.draw.apply(this, arguments);
    }
});

var Police = Citizen.extend({
   initialize: function(options){
    Citizen.prototype.initialize.call(this, options);

    this.hex = blueHex();
    this.speed = _.random(0, 3);
   }
});

module.exports = {
    Protestor: Protestor,
    Police: Police,
    Player: Player
};
