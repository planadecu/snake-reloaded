
// This uses require.js to structure javascript:
// http://requirejs.org/docs/api.html#define

// A cross-browser requestAnimationFrame
// See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

define(function(require) {
    //var brick = require('brick');
    var $ = require('zepto');
    
    var input = require('./input');
    //require('receiptverifier');
    //require('./install-button');
    
    var toggle = function(){
	$('#flipbox').get(0).toggle();
    };
    
    $('#single').click(toggle);
    $('#multi').click(toggle);
    $('#back').click(toggle);
    $('#restart').click(reset);
    
    // Create the canvas
    var canvas = $("#canvas").get(0);
    var ctx = canvas.getContext("2d");
    
    var DEBUG = true;
    
    var TOTAL_WIDTH = 1024;
    var TOTAL_HEIGHT = 800;
    var START_SPEED = 0.151;
    var START_ANGULAR_SPEED = 0.0042;
    var SIZE = 30;
    
    canvas.width = TOTAL_WIDTH;
    canvas.height = TOTAL_HEIGHT;
    

    // The player's state
    var player = {
        p:[{x: 0,y: 0,dir: 0},{x: 0,y: 0,dir: 0},{x: 0,y: 0,dir: 0},{x: 0,y: 0,dir: 0},{x: 0,y: 0,dir: 0},{x: 0,y: 0,dir: 0},{x: 0,y: 0,dir: 0},{x: 0,y: 0,dir: 0}],
	s:[{
	  x: 0,
	  y: 0
	}],
	speed: START_SPEED,
	angularSpeed: START_ANGULAR_SPEED,
        size: SIZE,
	grow: function(){
	  var point = {};
	  
	  p.push(point);
	}
    };

    // Reset game to original state
    function reset() {
	console.log("RESET");
        player.p=[{x: 0,y: 0,dir: 0},{x: 0,y: 0,dir: 0},{x: 0,y: 0,dir: 0},{x: 0,y: 0,dir: 0},{x: 0,y: 0,dir: 0},{x: 0,y: 0,dir: 0},{x: 0,y: 0,dir: 0},{x: 0,y: 0,dir: 0}];
	s:[{x: 0,y: 0}];
	player.speed = START_SPEED;
	player.angularSpeed = START_ANGULAR_SPEED;
    };

    // Pause and unpause
    function pause() {
	console.log("PAUSE");
        running = false;
    }

    function unpause() {
	console.log("UNPAUSE");
        running = true;
        then = Date.now();
        main();
    }

    // Update game objects
    function update(dt) {

        var dirChange = false;
        if(input.isDown('LEFT') || input.isDown('A') || input.isDown('Z')) {
           player.p[0].dir-=dt*player.angularSpeed;
	   dirChange = true;
        }

        if(input.isDown('RIGHT') || input.isDown('D') || input.isDown('M') || input.isDown('X')) {
           player.p[0].dir+=dt*player.angularSpeed;
	   dirChange = true;
        }
	
	var dx = dt*player.speed * Math.cos(player.p[0].dir);
	var dy = dt*player.speed * Math.sin(player.p[0].dir)
	
	player.p[0].x += dx;
	player.p[0].y += dy;
	
	if(dirChange) player.s.push({x:player.p[0].x,y:player.p[0].y});
	
	var j = player.s.length-1;
	for(var i=1;i<player.p.length;i++){
	  var left = SIZE*1.5;
	  var cx = player.p[i-1].x;
	  var cy = player.p[i-1].y;
	  var d = -1;
	  for(j; j>=0 && left > 0;j--){
	    var dcx = cx-player.s[j].x;
	    var dcy = cy-player.s[j].y;
	    d = Math.sqrt(dcx*dcx+dcy*dcy);
	    left -= d;
	    cx = player.s[j].x;
	    cy = player.s[j].y;
	  }
	  j++;
	  if(d>0){
	    player.p[i].dir = Math.acos(dcx/d);
	    var a = Math.PI - player.p[i].dir;
	    player.p[i].x = cx + left * Math.cos(a);
	    player.p[i].y = cy +(dcy>0?-1:1) * left * Math.sin(a);
	  }
	}

    };

    // Draw everything
    function render() {

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for(var i=player.p.length-1;i>=0;i--){
	  var radgrad = ctx.createRadialGradient(player.p[i].x,player.p[i].y,player.size*.3,player.p[i].x+7*Math.cos(player.p[i].dir),player.p[i].y+5*Math.sin(player.p[i].dir),player.size);
	  radgrad.addColorStop(0, '#A7D30C');
	  radgrad.addColorStop(0.9, '#019F62');
	  radgrad.addColorStop(1, 'rgba(1,159,98,0)');
	  ctx.fillStyle = radgrad;
          ctx.fillRect(0,0,canvas.width,canvas.height);
	}
	
	if(DEBUG){
	  
	  ctx.strokeStyle = 'white';
	  ctx.lineWidth = 2;
	  ctx.beginPath();
	  ctx.moveTo(player.s[0].x,player.s[0].y);
	  for(var i=1;i<player.s.length;i++){
            ctx.lineTo(player.s[i].x,player.s[i].y);
	  }
	  ctx.lineTo(player.p[0].x,player.p[0].y);
	  ctx.stroke();
	}

	

    };

    // The main game loop
    function main() {
        if(!running) {
            return;
        }

        var now = Date.now();
        var dt = now - then;

        update(dt);
	

        render();

        then = now;
        requestAnimFrame(main);
    };

    // Don't run the game when the tab isn't visible
    window.addEventListener('focus', function() {
        unpause();
    });

    window.addEventListener('blur', function() {
        pause();
    });

    // Let's play this game!
    reset();
    var then = Date.now();
    var running = true;
    main();
});
