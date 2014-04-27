var _ = require('underscore'),
    gamejs = require('gamejs'),
    uielements = require('gramework').uielements;

var TopBar = uielements.Element.extend({
    initialize: function(options) {
        uielements.Element.prototype.initialize.apply(this, arguments);

        this.world = options.world;
        this.world.elements.add(this);

        this.subBorderImage = options.subBorderImage;
        this.subFont = options.subFont;

        this.subelements = new gamejs.sprite.Group();

        this.subelements.add(
            new uielements.Element({
                borderImage: this.subBorderImage,
                borderWidth: 3,
                borderImageSlice: 3,
                x: 50,
                y: 4,
                width: 200,
                height: 30
            })
        );

        this.subelements.add(
            new uielements.TextBlock({
                x: 50,
                y: 5,
                width: 200,
                height: 28,
                font: this.subFont,
                lineHeight: 12
            })
        );
    },

    update: function(dt) {
        this.subelements.update(dt);
    },

    draw: function(surface) {
        uielements.Element.prototype.draw.apply(this, arguments);
        this.subelements.draw(surface);
    }
});

module.exports = {
    TopBar: TopBar
};