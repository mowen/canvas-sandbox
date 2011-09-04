window.addEventListener('load', function() { canvasApp(); }, false);

var KEYS = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39
};

var DIRECTIONS = {
    38: { dx: 0, dy: -1 }, // UP
    40: { dx: 0, dy: 1 },  // DOWN
    37: { dx: -1, dy: 0 }, // LEFT
    39: { dx: 1, dy: 0 }   // RIGHT
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

function getAngle() {
    if (keyPressList[KEYS.UP]) {
        if (keyPressList[KEYS.LEFT]) { return 315; }
        else if (keyPressList[KEYS.RIGHT]) { return 45; }
        else { return 0; }
    }
    else if (keyPressList[KEYS.DOWN]) {
        if (keyPressList[KEYS.LEFT]) { return 225; }
        else if (keyPressList[KEYS.RIGHT]) { return 135; }
        else { return 180; }
    }
    else if (keyPressList[KEYS.LEFT]) { return 270; }
    else if (keyPressList[KEYS.RIGHT]) { return 90; }
    else return null;
}

function getDeltas() {
    var deltas = { dx: 0, dy: 0 };

    var pressedKeys = _.select(_.keys(keyPressList), function(key) { return keyPressList[key]; });
    _.each(pressedKeys, function(key) {
        var delta = DIRECTIONS[key];
        deltas.dx += delta.dx;
        deltas.dy += delta.dy;
    });

    return deltas;
}

function getDirection(currentDirection) {
    var deltas = getDeltas();
    var angle = getAngle();
    return {
        dx: deltas.dx,
        dy: deltas.dy,
        angle: _.isNull(angle) ? currentDirection.angle : angle
    };
}

function tankIsStationary(direction) {
    return (direction.dx === 0 && direction.dy === 0);
}

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
    
    var animationFrames = [1,2,3,4,5,6,7,8];
    var frameIndex = 0;
    var x = 50;
    var y = 50;
    var direction = { dx: 0, dy: 0, angle: 180 };
    
    function drawScreen() {
        direction = getDirection(direction);

        var speed = 5;

	x = x + (direction.dx * speed);
	y = y + (direction.dy * speed);
	
	//draw a background so we can wee the Canvas edges
	context.fillStyle = "#aaaaaa";
	context.fillRect(0,0,500,500);
	
	context.save();
	context.setTransform(1, 0, 0, 1, 0, 0);
        var rotation = direction.angle;
	var angleInRadians = rotation * Math.PI / 180;
	context.translate(x+16, y+16)
	context.rotate(angleInRadians);
	var sourceX = Math.floor(animationFrames[frameIndex] % 8) *32;
	var sourceY = Math.floor(animationFrames[frameIndex] / 8) *32;
	
	context.drawImage(tileSheet, sourceX, sourceY, 32, 32, -16, -16, 32, 32);
	context.restore();

        if (!tankIsStationary(direction)) {
	    frameIndex++;
	    if (frameIndex == animationFrames.length) {
	        frameIndex=0;
	    }
        }
    }
}