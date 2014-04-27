var _ = require('underscore'),
    gamejs = require('gamejs'),
    uielements = require('gramework').uielements;

var TopBar = function(world) {
    var options = {
        color: [0,0,0],
        x: 0,
        y: 0,
        width: world.surface.getSize()[0],
        height: 35
    }

    world.elements.add(new uielements.Element(options));
};

_.extend(TopBar.prototype, uielements.Element.prototype, {

});

module.exports = {
    TopBar: TopBar
};