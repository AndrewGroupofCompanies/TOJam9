var _ = require('underscore'),
    gamejs = require('gamejs'),
    uielements = require('gramework').uielements;

var TopBar = uielements.Element.extend({
    initialize: function(options) {
        uielements.Element.prototype.initialize.apply(this, arguments);

        this.show();

        this.world = options.world;
        this.world.elements.add(this);

        this.subBorderImage = options.subBorderImage;
        this.subFont = options.subFont;

        this.subelements = new gamejs.sprite.Group();

        this.textBlock = new uielements.TextBlock({
            borderImage: this.subBorderImage,
            borderWidth: 3,
            borderImageSlice: 3,
            x: 50,
            y: 5,
            width: 200,
            height: 28,
            font: this.subFont,
            lineHeight: 12
        });

        this.textQueue = [];
        this.showingQueuedText = false;

        this.subelements.add(
            this.textBlock
        );
    },

    update: function(dt) {
        this.subelements.update(dt);
        if (this.textQueue.length > 0 && !this.showingQueuedText) {
            this.textBlock.show();
            this.textBlock.setText(this.textQueue.shift());
            this.showingQueuedText = true;
        }
        if (this.textBlock.doneDuration >= 600) {
            this.textBlock.hide();
            if (this.showingQueuedText) {
                this.showingQueuedText = false;
            }
        }
    },

    draw: function(surface) {
        uielements.Element.prototype.draw.apply(this, arguments);
        this.subelements.draw(surface);
    },

    displayText: function(text, priority) {
        // If priority is given, text will be added to queue, and displayed necessarily
        // (Won't be interrupted)
        // If priority if false, text is interruptable
        if(typeof(priority)==='undefined') {
            priority = false;
        }
        if (priority) {
            this.textQueue.push(text);
        } else if (!this.showingQueuedText) {
            this.textBlock.show();
            this.textBlock.setText(text);
        }
    }

});

module.exports = {
    TopBar: TopBar
};