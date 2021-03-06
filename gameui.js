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
        this.portraits = options.portraits;

        this.doneDuration = options.doneDuration || 600;

        this.subelements = new gamejs.sprite.Group();

        this.textBlock = new uielements.TextBlock({
            borderImage: this.subBorderImage,
            borderWidth: 3,
            borderImageSlice: 3,
            x: 75,
            y: 5,
            width: 200,
            height: 28,
            font: this.subFont,
            lineHeight: 12
        });

        this.portraitBox = new uielements.Element({
            borderImage: this.subBorderImage,
            borderWidth: 3,
            borderImageSlice: 3,
            x: 40,
            y: 5,
            width: 28,
            height: 28
        });

        //this.portraitBox.setImage(this.portraits.andrew);

        this.textQueue = [];
        this.showingQueuedText = false;

        this.subelements.add(
            [this.textBlock,
            this.portraitBox]
        );
    },

    update: function(dt) {
        this.subelements.update(dt);
        if (this.textQueue.length > 0 && !this.showingQueuedText) {
            
            this.textBlock.show();
            var nextText = this.textQueue.shift();
            this.textBlock.setText(nextText[0]);
            if (nextText[1]) {
                this.portraitBox.image = this.portraits[nextText[1]];
                this.portraitBox.show();
            }
            this.showingQueuedText = true;
        }
        if (this.textBlock.doneDuration >= this.doneDuration) {
            this.portraitBox.hide();
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

    displayText: function(text, portrait, priority) {
        // If priority is given, text will be added to queue, and displayed necessarily
        // (Won't be interrupted)
        // If priority if false, text is interruptable
        if(typeof(portrait)==='undefined') {
            var portrait = null;
        }
        if(typeof(priority)==='undefined') {
            var priority = false;
        }
        if (priority) {
            this.textQueue.push([text, portrait]);
        } else if (!this.showingQueuedText) {
            if (portrait) {
                this.portraitBox.setImage(this.portraits[portrait]);
                this.portraitBox.show();
                console.log('okay');
            }
            this.textBlock.show();
            this.textBlock.setText(text);
        }
    }

});

module.exports = {
    TopBar: TopBar
};