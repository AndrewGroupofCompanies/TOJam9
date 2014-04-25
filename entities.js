var gamejs = require('gamejs'),
    gramework = require('gramework'),
    Entity = gramework.Entity;

var Protestor = Entity.extend({
    draw: function(surface) {
        gamejs.draw.circle(surface, "#ffcc00", [100, 100], 100);
    }
});

module.exports = {
    Protestor: Protestor
};
