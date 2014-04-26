var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    Entity = gramework.Entity;

var Scrollable = Entity.extend({
    initialize: function(options) {
        options = (options || {});
        this.z = options.z || 0;
        this.world = options.world || null;

        if (options.image){
            this.image = gamejs.image.load(options.image);
        }

        var scale_factor = 1 / Math.pow(Math.E, (this.z / 5));
        this.rect.width = Math.floor(this.rect.width * scale_factor);
        this.rect.height = Math.floor(this.rect.height * scale_factor);
        this.rect.top += this.z * 2.7;
    },

    update: function(dt) {
        var scale_factor = 1 / Math.pow(Math.E, (this.z / 5));
        if (this.world) {
            this.move(this.world.speed * scale_factor / 5, 0);
        }
    }
});

var SceneryGenerator = function(options) {
    this.world = options.world || null;
    this.nextScrollable = _.random(100, 1000);
    this.timer = 0;
    this.initialize(options);
};

_.extend(SceneryGenerator.prototype, {
    initialize: function(options) {
        this.images = options.images;
    },

    generateScenery: function(image, z) {
        var s = new Scrollable({
            height: 64,
            width: 64,
            x:256,
            y:50,
            z:z,
            image: image,
            world: this.world
        });
        this.world.entities.add(s);
    },

    update: function(dt) {
        this.timer += dt;
        if (this.timer >= this.nextScrollable) {
            this.nextScrollable = _.random(100, 1000);
            this.timer = 0;
            this.generateScenery(_.sample(this.images), _.random(9.9,9.9));
        }
    }
});

module.exports = {
    SceneryGenerator: SceneryGenerator
};
