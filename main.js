var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Dispatcher = gramework.Dispatcher,
    Scene = gramework.Scene,
    entities = require('./entities'),
    obstacles = require('./obstacles'),
    Vec2d = gramework.vectors.Vec2d,
    GameController = gramework.input.GameController;

var Game = Scene.extend({
    initialize: function(options) {
        this.gravity = new Vec2d(0, 50);

        // Handles world speed.
        this.velocity = new Vec2d(0, 0);
        this.speed = -10;
        this.accel = 5;

        // The front line of the protestors. Let's keep them grouped.
        this.frontLine = this.surface.getSize()[0] - 100;
        this.createProtestors(5);
        
        
        this.Obstacles = null;
        
        // Track the police pressure by using an imaginery line on the x-axis.

        this.policePressure = 100;
        //this.createPolice(10);
        this.controller = new GameController({
            pressure: gamejs.event.K_p,
            takeover: gamejs.event.K_t
        });

        this.player = null;
        this.pluckProtestor();
    },

    createProtestors: function(limit) {
        _.each(_.range(limit), function(i) {
            var p = new entities.Protestor({
                x: 200 + (i * 15), y: 0,
                width: 32, height: 32,
                world: this
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
        if (entity.rect.y >= (this.height() - entity.rect.height)) {
            return true;
        }
    },

    update: function(dt) {
        Scene.prototype.update.call(this, dt);

        dt = (dt / 1000); // Sane velocity mutations.

        var accel = new Vec2d(this.accel, 0);
        this.velocity.add(accel.mul(dt).mul(this.speed));
        
        if (this.Obstacles && this.Obstacles.alive) {
            this.Obstacles.update(dt);
        } else if (this.Obstacles === null) {
            this.Obstacles = new obstacles.ObstacleEmitter({
                world: this
            });
            console.log("obstacleemitter made")
        } else if (!this.Obstacles.alive) {
            this.Obstacles = null;
        }
    },

    draw: function(surface) {
        surface.clear();
        this.view.clear();

        this.view.fill("#ff22cc");
        surface.fill("#ff22cc");

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
        pixelScale: 2
    });
    var d = new Dispatcher(gamejs, {
        initial: game,
        canvas: {flag: gamejs.display.DISABLE_SMOOTHING}
    });
};

gamejs.ready(main);

