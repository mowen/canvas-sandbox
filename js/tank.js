(function(window, document) {

    window.addEventListener('load', function() { canvasApp(); }, false);

    var DIRECTIONS = {
        up: { dx: 0, dy: -1 },
        down: { dx: 0, dy: 1 },
        left: { dx: -1, dy: 0 },
        right: { dx: 1, dy: 0 }
    };

    var keyPressList = {};

    document.onkeydown = function(ev) {
        ev = ev || window.event;
        keyPressList[ev.keyCode] = true;
    };

    document.onkeyup = function(ev) {
        ev = ev || window.event;
        keyPressList[ev.keyCode] = false;
    };

    var Tank = function(params) {
        this.animationFrames = params.animationFrames || [1,2,3,4,5,6,7,8];
        this.frameIndex = 0;
        this.speed = params.initialSpeed || 5;
        this.x = params.initialPosition.x || 50;
        this.y = params.initialPosition.y || 50;
        this.direction = { dx: 0, dy: 0, angle: 180 };
        this.keyCodes = params.keyCodes || { up: 38, down: 40, left: 37, right: 39 };
    };

    Tank.prototype = {
        draw: function(tileSheet, context) {
	    context.save();

            context.setTransform(1, 0, 0, 1, 0, 0);
	    context.translate(this.x + 16, this.y + 16)

	    var angleInRadians = this.direction.angle * Math.PI / 180;
	    context.rotate(angleInRadians);

	    var sourceX = Math.floor(this.getCurrentFrame() % 8) * 32;
	    var sourceY = Math.floor(this.getCurrentFrame() / 8) * 32;	    
	    context.drawImage(tileSheet, sourceX, sourceY, 32, 32, -16, -16, 32, 32);

            context.restore();

            if (!this.isStationary()) {
	        this.advanceFrame();
            }
        },

        move: function() {
            this.direction = this.updateDirection();
            this.x += (this.direction.dx * this.speed);
            this.y += (this.direction.dy * this.speed);
        },

        advanceFrame: function() {
            this.frameIndex++;
	    if (this.frameIndex === this.animationFrames.length) {
	        this.frameIndex = 0;
	    }
        },

        getCurrentFrame: function() {
            return this.animationFrames[this.frameIndex];
        },

        updateDirection: function() {
            var deltas = this.updateDeltas();
            var angle = this.updateAngle();
            return {
                dx: deltas.dx,
                dy: deltas.dy,
                angle: _.isNull(angle) ? this.direction.angle : angle
            };
        },

        updateAngle: function() {
            if (keyPressList[this.keyCodes.up]) {
                if (keyPressList[this.keyCodes.left]) { return 315; }
                else if (keyPressList[this.keyCodes.right]) { return 45; }
                else { return 0; }
            }
            else if (keyPressList[this.keyCodes.down]) {
                if (keyPressList[this.keyCodes.left]) { return 225; }
                else if (keyPressList[this.keyCodes.right]) { return 135; }
                else { return 180; }
            }
            else if (keyPressList[this.keyCodes.left]) { return 270; }
            else if (keyPressList[this.keyCodes.right]) { return 90; }
            else return null;
        },

        updateDeltas: function() {
            var deltas = { dx: 0, dy: 0 };

            var pressedDirections = this.pressedDirections();
            _.each(pressedDirections, function(direction) {
                var delta = DIRECTIONS[direction];
                if (!_.isUndefined(delta)) {
                    deltas.dx += delta.dx;
                    deltas.dy += delta.dy;
                }
            });

            return deltas;
        },

        pressedDirections: function() {
            var pressedKeys = _.select(_.keys(keyPressList), function(keyCode) { return keyPressList[keyCode]; });
            if (_.isEmpty(pressedKeys))
                return [];
            else {
                var self = this;
                return _.select(_.keys(this.keyCodes), function(keyCode) { return _.include(pressedKeys, self.keyCodes[keyCode].toString()); });
            }
        },

        isStationary: function() {
            return (this.direction.dx === 0 && this.direction.dy === 0);
        }
    };

    function canvasApp() {
        if (!Modernizr.canvas) {
	    return;
        } else {
	    var theCanvas = document.getElementById('canvas');
	    var context = theCanvas.getContext('2d');
        }
        
        var tileSheet = new Image();
        tileSheet.addEventListener('load', function() { setInterval(drawScreen, 100); }, false);
        tileSheet.src = "images/tanks_sheet.png";
        
        var greenTank = new Tank({
            initialSpeed: 5,
            initialPosition: { x: 50, y: 50 },
            animationFrames: [1,2,3,4,5,6,7,8],
            keyCodes: { up: 38, down: 40, left: 37, right: 39 }
        });
        
        function drawScreen() {
            greenTank.move();

	    //draw a background so we can wee the Canvas edges
	    context.fillStyle = "#aaaaaa";
	    context.fillRect(0,0,500,500);	    

            greenTank.draw(tileSheet, context);
        }
    }
})(window, document);