(function(window, document) {

    _.mixin({
        degreesToRadians: function(angleInDegrees) {
            return angleInDegrees * Math.PI / 180;
        }
    });

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
        this.x = params.initialPosition.x;
        this.y = params.initialPosition.y;
        this.speed = params.initialSpeed;

        _.extend(this, {
            animationFrames: params.animationFrames,
            keyCodes: params.keyCodes           
        });

        _.defaults(this, {
            animationFrames: [1,2,3,4,5,6,7,8],
            frameIndex: 0,
            speed: 10,
            x: 50,
            y: 50,
            direction: { dx: 0, dy: 0, angle: 180 },
            keyCodes: { up: 38, down: 40, left: 37, right: 39, fire: 13 }
        });
    };

    Tank.prototype = {
        draw: function(tileSheet, context) {
	    context.save();

            context.setTransform(1, 0, 0, 1, 0, 0);
	    context.translate(this.x + (this.width/2), this.y + (this.height/2))

	    context.rotate(_.degreesToRadians(this.direction.angle));

	    var sourceX = Math.floor(this.getCurrentFrame() % this.animationFrames.length) * this.width;
	    var sourceY = Math.floor(this.getCurrentFrame() / this.animationFrames.length) * this.height;	    
	    context.drawImage(tileSheet, sourceX, sourceY, this.width, this.height, 0 - this.width/2, 0 - this.height/2, this.width, this.height);

            context.restore();

            if (!this.isStationary()) {
	        this.advanceFrame();
            }
        },

        move: function() {
            this.direction = this.updateDirection();
            this.x += (this.direction.dx * this.speed);
            this.y += (this.direction.dy * this.speed);
            if (this.fireKeyIsPressed()) this.fireBullet();
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
            var pressedKeys = _(keyPressList).chain().keys().select(function(keyCode) {
                return keyPressList[keyCode];
            }).value();
            
            if (_.isEmpty(pressedKeys))
                return [];
            else {
                var self = this;
                return _(this.keyCodes).chain().keys().select(function(keyCode) {
                    return _.include(pressedKeys, self.keyCodes[keyCode].toString());
                }).value();
            }
        },

        isStationary: function() {
            return (this.direction.dx === 0 && this.direction.dy === 0);
        },

        fireKeyIsPressed: function() {
            var fireKeyIsPressed = keyPressList[this.keyCodes.fire];
            if (_.isUndefined(fireKeyIsPressed)) return false;
            return fireKeyIsPressed;
        },

        fireBullet: function() {
            var self = this;
            _.each(this.fireBulletHandlers, function(fireBulletHandler) {
                fireBulletHandler(self);
            });
        },

        addFireBulletHandler: function(fireBulletHandler) {
            this.fireBulletHandlers = this.fireBulletHandlers || [];
            this.fireBulletHandlers.push(fireBulletHandler);
        }
    };

    var Bullet = function(params) {
        this.speed = params.speed || 20;
        
        var frame = params.frame || 21;
        this.sourceX = Math.floor(frame % 8) * 32;
	this.sourceY = Math.floor(frame / 8) * 32;

        this.firedBy = params.firedBy;
        this.x = this.firedBy.x;
        this.y = this.firedBy.y;

        var directions = this.firedBy.pressedDirections();
        this.deltas = this.getDeltas(directions);
    };

    Bullet.prototype = {
        draw: function(tileSheet, context) {
	    context.save();

            context.setTransform(1, 0, 0, 1, 0, 0);
	    context.translate(this.x + 16, this.y + 16)

	    context.drawImage(tileSheet, this.sourceX, this.sourceY, 32, 32, -16, -16, 32, 32);

            context.restore();
        },

        move: function() {
            this.x += this.deltas.dx * this.speed;
            this.y += this.deltas.dy * this.speed;
        },

        getDeltas: function(directions) {
            var deltas = { dx: 0, dy: 0 };

            _.each(directions, function(direction) {
                var delta = DIRECTIONS[direction];
                if (!_.isUndefined(delta)) {
                    deltas.dx += delta.dx;
                    deltas.dy += delta.dy;
                }
            });

            return deltas;
        }        
    };

    window.addEventListener('load', function() {
        if (!Modernizr.canvas) {
	    return;
        } else {
	    var theCanvas = document.getElementById('canvas');
	    var context = theCanvas.getContext('2d');
        }
        
        var tanks = [
            new Tank({
                initialPosition: { x: 50, y: 50 }
            }),

            new Tank({
                initialPosition: { x: 450, y: 450 },
                animationFrames: [9,10,11,12,13,14,15,16],
                keyCodes: { up: 87, down: 83, left: 65, right: 68, fire: 32 }
            })
        ];

        var objects = tanks.slice(0);

        _.each(tanks, function(tank) {
            tank.addFireBulletHandler(function(tank) {
                // use unshift so that the bullet will go to the
                // front of the array and be drawn underneath the tanks
                objects.unshift(new Bullet({ firedBy: tank }));
            });
        });

        var tileSheet = new Image();
        tileSheet.addEventListener('load', function() { setInterval(drawScreen, 100); }, false);
        tileSheet.src = "images/tanks_sheet.png";
        
        function drawScreen() {
            _.each(objects, function(object) { object.move(); });

	    context.fillStyle = "#aaaaaa";
	    context.fillRect(0, 0, 500, 500);

            _.each(objects, function(object) { object.draw(tileSheet, context); });
        }
    }, false);
})(window, document);