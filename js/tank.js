(function() {
  var Bullet, Tank, root;

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  _.mixin({
    degreesToRadians: function(angleInDegrees) {
      return angleInDegrees * Math.PI / 180;
    }
  });

  root.DIRECTIONS = {
    up: {
      dx: 0,
      dy: -1
    },
    down: {
      dx: 0,
      dy: 1
    },
    left: {
      dx: -1,
      dy: 0
    },
    right: {
      dx: 1,
      dy: 0
    }
  };

  root.keyPressList = {};

  document.onkeydown = function(ev) {
    if (ev == null) ev = window.event;
    return keyPressList[ev.keyCode] = true;
  };

  document.onkeyup = function(ev) {
    if (ev == null) ev = window.event;
    return keyPressList[ev.keyCode] = false;
  };

  Tank = (function() {

    function Tank(params) {
      var defaults;
      this.x = params.initialPosition.x;
      this.y = params.initialPosition.y;
      this.speed = params.initialSpeed;
      this.animationFrames = params.animationFrames;
      this.keyCodes = params.keyCodes;
      defaults = {
        animationFrames: [1, 2, 3, 4, 5, 6, 7, 8],
        frameIndex: 0,
        speed: 10,
        x: 50,
        y: 50,
        height: 32,
        width: 32,
        direction: {
          dx: 0,
          dy: 0,
          angle: 180
        },
        keyCodes: {
          up: 38,
          down: 40,
          left: 37,
          right: 39,
          fire: 13
        }
      };
      _.defaults(this, defaults);
    }

    Tank.prototype.draw = function(tileSheet, context) {
      var sourceX, sourceY;
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.translate(this.x + (this.width / 2), this.y + (this.height / 2));
      context.rotate(_.degreesToRadians(this.direction.angle));
      sourceX = Math.floor(this.getCurrentFrame() % this.animationFrames.length) * this.width;
      sourceY = Math.floor(this.getCurrentFrame() / this.animationFrames.length) * this.height;
      context.drawImage(tileSheet, sourceX, sourceY, this.width, this.height, 0 - this.width / 2, 0 - this.height / 2, this.width, this.height);
      context.restore();
      if (!this.isStationary()) return this.advanceFrame();
    };

    Tank.prototype.move = function() {
      this.direction = this.updateDirection();
      this.x += this.direction.dx * this.speed;
      this.y += this.direction.dy * this.speed;
      if (this.fireKeyIsPressed()) return this.fireBullet();
    };

    Tank.prototype.advanceFrame = function() {
      this.frameIndex++;
      if (this.frameIndex === this.animationFrames.length) {
        return this.frameIndex = 0;
      }
    };

    Tank.prototype.getCurrentFrame = function() {
      return this.animationFrames[this.frameIndex];
    };

    Tank.prototype.updateDirection = function() {
      var angle, deltas, newDirection;
      deltas = this.updateDeltas();
      angle = this.updateAngle();
      newDirection = {
        dx: deltas.dx,
        dy: deltas.dy,
        angle: _.isNull(angle) ? this.direction.angle : angle
      };
      return newDirection;
    };

    Tank.prototype.updateAngle = function() {
      if (keyPressList[this.keyCodes.up]) {
        if (keyPressList[this.keyCodes.left]) {
          return 315;
        } else if (keyPressList[this.keyCodes.right]) {
          return 45;
        } else {
          return 0;
        }
      } else if (keyPressList[this.keyCodes.down]) {
        if (keyPressList[this.keyCodes.left]) {
          return 225;
        } else if (keyPressList[this.keyCodes.right]) {
          return 135;
        } else {
          return 180;
        }
      } else if (keyPressList[this.keyCodes.left]) {
        return 270;
      } else if (keyPressList[this.keyCodes.right]) {
        return 90;
      } else {
        return null;
      }
    };

    Tank.prototype.updateDeltas = function() {
      var addToDeltas, deltas, direction, pressedDirections, _i, _len;
      deltas = {
        dx: 0,
        dy: 0
      };
      pressedDirections = this.pressedDirections();
      addToDeltas = function(direction) {
        var delta;
        delta = DIRECTIONS[direction];
        if (!_.isUndefined(delta)) {
          deltas.dx += delta.dx;
          return deltas.dy += delta.dy;
        }
      };
      for (_i = 0, _len = pressedDirections.length; _i < _len; _i++) {
        direction = pressedDirections[_i];
        addToDeltas(direction);
      }
      return deltas;
    };

    Tank.prototype.pressedDirections = function() {
      var pressedKeys,
        _this = this;
      pressedKeys = _(keyPressList).chain().keys().select(function(keyCode) {
        return keyPressList[keyCode];
      }).value();
      if (_.isEmpty(pressedKeys)) {
        return [];
      } else {
        return _(this.keyCodes).chain().keys().select(function(keyCode) {
          return _.include(pressedKeys, _this.keyCodes[keyCode].toString());
        }).value();
      }
    };

    Tank.prototype.isStationary = function() {
      return this.direction.dx === 0 && this.direction.dy === 0;
    };

    Tank.prototype.fireKeyIsPressed = function() {
      var fireKeyIsPressed;
      fireKeyIsPressed = keyPressList[this.keyCodes.fire];
      if (_.isUndefined(fireKeyIsPressed)) return false;
      return fireKeyIsPressed;
    };

    Tank.prototype.fireBullet = function() {
      var _this = this;
      return _.each(this.fireBulletHandlers, function(fireBulletHandler) {
        return fireBulletHandler(_this);
      });
    };

    Tank.prototype.addFireBulletHandler = function(fireBulletHandler) {
      this.fireBulletHandlers = this.fireBulletHandlers || [];
      return this.fireBulletHandlers.push(fireBulletHandler);
    };

    return Tank;

  })();

  Bullet = (function() {

    function Bullet(params) {
      var directions, frame;
      this.speed = params.speed || 20;
      frame = params.frame || 21;
      this.sourceX = Math.floor(frame % 8) * 32;
      this.sourceY = Math.floor(frame / 8) * 32;
      this.firedBy = params.firedBy;
      this.x = this.firedBy.x;
      this.y = this.firedBy.y;
      directions = this.firedBy.pressedDirections();
      this.deltas = this.getDeltas(directions);
    }

    Bullet.prototype.draw = function(tileSheet, context) {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.translate(this.x + 16, this.y + 16);
      context.drawImage(tileSheet, this.sourceX, this.sourceY, 32, 32, -16, -16, 32, 32);
      return context.restore();
    };

    Bullet.prototype.move = function() {
      this.x += this.deltas.dx * this.speed;
      return this.y += this.deltas.dy * this.speed;
    };

    Bullet.prototype.getDeltas = function(directions) {
      var addToDeltas, deltas, direction, _i, _len;
      deltas = {
        dx: 0,
        dy: 0
      };
      addToDeltas = function(direction) {
        var delta;
        delta = DIRECTIONS[direction];
        if (!_.isUndefined(delta)) {
          deltas.dx += delta.dx;
          return deltas.dy += delta.dy;
        }
      };
      for (_i = 0, _len = directions.length; _i < _len; _i++) {
        direction = directions[_i];
        addToDeltas(direction);
      }
      return deltas;
    };

    return Bullet;

  })();

  window.addEventListener('load', function() {
    var context, drawScreen, objects, tanks, theCanvas, tileSheet;
    if (!Modernizr.canvas) {
      return;
    } else {
      theCanvas = document.getElementById('canvas');
      context = theCanvas.getContext('2d');
    }
    tanks = [
      new Tank({
        initialPosition: {
          x: 50,
          y: 50
        }
      }), new Tank({
        initialPosition: {
          x: 450,
          y: 450
        },
        animationFrames: [9, 10, 11, 12, 13, 14, 15, 16],
        keyCodes: {
          up: 87,
          down: 83,
          left: 65,
          right: 68,
          fire: 32
        }
      })
    ];
    objects = tanks.slice(0);
    _.each(tanks, function(tank) {
      return tank.addFireBulletHandler(function(tank) {
        return objects.unshift(new Bullet({
          firedBy: tank
        }));
      });
    });
    tileSheet = new Image();
    tileSheet.addEventListener('load', function() {
      return setInterval(drawScreen, 100);
    }, false);
    tileSheet.src = 'images/tanks_sheet.png';
    return drawScreen = function() {
      _.each(objects, function(object) {
        return object.move();
      });
      context.fillStyle = "#aaaaaa";
      context.fillRect(0, 0, 500, 500);
      return _.each(objects, function(object) {
        return object.draw(tileSheet, context);
      });
    };
  }, false);

}).call(this);
