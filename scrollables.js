var _ = require('underscore'),
    gamejs = require('gamejs'),
    gramework = require('gramework'),
    animate = gramework.animate;
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
            this.move(-scale_factor, 0);
        }
    }
});

var AnimScrollable = Entity.extend({
    animSpec: {
        normal: {frames: _.range(30), rate: 20, loop: true}
    },
    
    initialize: function(options) {
        options = (options || {});
        this.z = options.z || 0;
        this.world = options.world || null;
        
        if (options.spriteSheet){
            this.spriteSheet = options.spriteSheet;
            this.anim = new animate.Animation(this.spriteSheet, "normal", this.animSpec);
            this.image = this.anim.update(0);
            this.anim.setFrame(0);
        };
        
        var scale_factor = 1 / Math.pow(Math.E, (this.z / 5));
        this.rect.width = Math.floor(this.rect.width * scale_factor);
        this.rect.height = Math.floor(this.rect.height * scale_factor);
        this.rect.top += this.z * 2.7;
    },
    
    update: function(dt) {
        var scale_factor = 1 / Math.pow(Math.E, (this.z / 5));
        if (this.world) {
            this.move(this.world.speed * scale_factor / 5, 0);
        };
        
        if (this.image && !this.anim.isFinished()) {
            this.image = this.anim.update(dt);
        };
        
        if (this.anim && this.anim.isFinished()) {
            this.anim.start('normal');
        }
        
    }
});

var AnimScrollableGenerator = function(options){
    this.world = options.world || null;
    this.nextAnimScrollable = _.random(100, 2000);
    this.timer = 0;
    this.initialize(options);
};

_.extend(AnimScrollableGenerator.prototype, {
    initialize: function(options) {
        this.spriteSheet = options.spriteSheet;
    },
    
    generateAnimScrollable: function(spriteSheet, z) {
        var as = new AnimScrollable({
            height:60,
            width: 60,
            x: 256,
            y: 50,
            z:z,
            spriteSheet: spriteSheet,
            world: this.world
        });
        this.world.entities.add(as);
        console.log("gas zem!");
    },
    
    update: function(dt) {
        this.timer += dt;
        if (this.timer >= this.nextAnimScrollable) {
            this.nextScrollable = _.random(100, 2000);
            this.timer = 0;
            this.generateAnimScrollable(_.sample(this.spriteSheet), _.random(-9.9,9.9));
        };
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
            this.generateScenery(_.sample(this.images), _.random(1,9.9));
        }
    }
});

var TerrainLayer = Entity.extend({
    initialize: function(options) {
        this.z = options.z;
        this.scale_factor = 1 / Math.pow(Math.E, (this.z / 5));
        this.image = new gamejs.Surface(this.rect);
        this.rect.height = Math.floor((this.rect.height * this.scale_factor)/3.5);
        this.rect.top += Math.floor(this.scale_factor * 20);
        this.imageFile = gamejs.image.load(options.image);
        this.image = new gamejs.Surface(this.rect);
        this.baseImage = this.image.clone();
        this.rect01 = this.rect.clone();
        this.rect01.top = 0;
        this.rect02 = this.rect01.move(this.w, 0);
        var dims = this.imageFile.getSize();
        var newDims = [Math.floor((dims[0] * this.scale_factor)/3.5), this.rect.height];
        this.imageFile = gamejs.transform.scale(this.imageFile, newDims);

        for(var i = 0; i * newDims[0] < this.rect.width; i++) {
            var rect = new gamejs.Rect([i * newDims[0]], newDims);
            this.baseImage.blit(this.imageFile, rect);
        }
    },

    update: function(dt) {
        if (this.rect01.left < -1024) {
            this.rect01.left = 0;
        }

        this.rect01.moveIp(-this.scale_factor, 0);
        this.rect02 = this.rect01.move(this.w, 0);

        this.image.blit(this.baseImage, this.rect01);
        this.image.blit(this.baseImage, this.rect02);

        //Entity.prototype.update.apply(this, arguments);
    },

    draw: function(surface) {
        //this.image.fill('rgb('+ ((this.z + 3) * 10) +',0,0)');
        Entity.prototype.draw.apply(this, arguments);
    }
});

var AllTerrain = function(options) {
    this.layers = new gamejs.sprite.Group();
    _.range(-3,9).forEach(function(zVal){
        this.layers.add(new TerrainLayer({
            z: zVal,
            width: options.width,
            height: 32,
            x: 0,
            y: 80,
            image: options.image
        }));
    }, this);
};

_.extend(AllTerrain.prototype, {
    draw: function(surface) {
        this.layers.draw(surface);
    },

    update: function(dt) {
        this.layers.update(dt);
    }
});

module.exports = {
    SceneryGenerator: SceneryGenerator,
    AnimScrollableGenerator: AnimScrollableGenerator,
    TerrainLayer: TerrainLayer,
    AllTerrain: AllTerrain
};
