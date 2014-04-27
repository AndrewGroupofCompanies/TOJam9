var _ = require('underscore'),
    gamejs = require('gamejs'),
    uielements = require('gramework').uielements;

var TopBar = function(world, borderImage) {
    var options = {
        color: [0,0,0],
        x: 0,
        y: 0,
        width: world.surface.getSize()[0],
        height: 35
    }

    var element = new uielements.Element(options);

    world.elements.add(element);

    return element;
};

_.extend(TopBar.prototype, uielements.Element.prototype, {
    initialize: function(options) {
        Element.prototype.initialize.apply(this, arguments);

        this.subelements = new gamejs.sprite.Group();
    },

    update: function(dt) {
        this.subelements.update(dt);
    },

    draw: function(surface) {
        Element.prototype.draw.apply(this, arguments);
        this.subelements.draw(surface);
    }
});

module.exports = {
    TopBar: TopBar
};