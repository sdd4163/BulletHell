 // main.js
// Dependencies: 
// Description: singleton object
// This object will be our main "controller" class and will contain references
// to most of the other objects in the game.

"use strict";

// if app exists use the existing copy
// else create a new object literal
var app = app || {};

/*
 .main is an object literal that is a property of the app global
 This object literal has its own properties and methods (functions)
 
 */
app.main = {
	//  properties
    WIDTH : 800, 
    HEIGHT: 600,
	BULLET: Object.freeze({
		NUM_BULLETS_START: 10,
		NUM_BULLETS_END : 40,
		START_RADIUS : 10,
		MAX_SPEED : 140,
		PERCENT_BULLETS_TO_ADVANCE: 0.25,
	}),
    canvas: undefined,
    ctx: undefined,
   	lastTime: 0, // used by calculateDeltaTime() 
    debug: false,
	paused: false,
	animationID: 0,
	gameState: undefined,
	totalScore: 0,
	totalTime: 0,
	bulletTimer: 0.6,
	lineTimer: 0.4,
	currentBullet: 0,
	startWaitTime: 3,
	
	sound : undefined, // required - loaded by main.js 
	
	BULLET_STATE: Object.freeze({ // fake enumeration, actually an object literal
		NORMAL : 0,
		AIMING : 1,
		WAITING: 2,
		EXPLODED: 3,
		DONE : 4
	}),
	
	GAME_STATE: Object.freeze({ // another fake enumeration
		BEGIN : 0,
		DEFAULT : 1,
		WAITING : 2,
		ROUND_OVER : 3,
		REPEAT_LEVEL : 4,
		END : 5
	}),
	
	bullets : [],
	numBullets: this.NUM_BULLETS_START,
	
	player : {},
	bulletImg: undefined,
	shipImg: undefined,
	rocketImg: undefined,
    
    // methods
	init : function() {
		//console.log("app.main.init() called");
		// initialize properties
		this.canvas = document.querySelector('canvas');
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');
		
		this.numBullets = this.BULLET.NUM_BULLETS_START;
		this.bullets = this.makeBullets(this.numBullets);
		this.player = this.makePlayer();
		//console.log("this.bullets = " + this.bullets);
		
		this.bulletImg = document.querySelector('#bullet');
		this.shipImg = document.querySelector('#ship');
		this.rocketImg = document.querySelector('#rocket');
		
		//console.log(this.bulletImg);
		
		this.gameState = this.GAME_STATE.DEFAULT;
		
		//Hookup Events
		this.canvas.onmousedown = this.doMousedown.bind(this);
		
		//Load level
		this.reset();
		
		// start the game loop
		this.update();
	},
	
	update: function(){
		// 1) LOOP
		// schedule a call to update()
		this.animationID = requestAnimationFrame(this.update.bind(this));
	 	
	 	// 2) PAUSED?
	 	// if so, bail out of loop
		if (this.paused){
			this.drawPauseScreen(this.ctx);
			return;
		}
	 	
	 	// 3) HOW MUCH TIME HAS GONE BY?
	 	var dt = this.calculateDeltaTime();
	 	 
	 	// 4) UPDATE
	 	//Move bullets
		this.moveBullets(dt);
		
		//CHECK FOR COLLISIONS
		this.checkForCollisions();
 
		// 5) DRAW	
		// i) draw background
		this.ctx.fillStyle = "black"; 
		this.ctx.fillRect(0,0,this.WIDTH,this.HEIGHT);
		
		// ii) draw bullets
		this.ctx.globalAlpha = 0.9;
		this.drawBullets(this.ctx);
		
		this.ctx.globalAlpha = 1.0;
		this.player.draw(this.ctx);
		this.player.move();
		
		// iii) draw HUD
		this.drawHUD(this.ctx);
		
		this.ctx.save();
		this.ctx.lineWidth = 20;
		this.ctx.strokeStyle = "blue";
		this.ctx.strokeRect(0, 0, this.WIDTH, this.HEIGHT);
		this.ctx.restore();
		
		// iv) draw debug info
		if (this.debug){
			// draw dt in bottom right corner
			this.fillText(this.ctx, "dt: " + dt.toFixed(3), this.WIDTH - 150, this.HEIGHT - 10, "18pt courier", "white");
		}
		this.totalTime += dt;
	},
	
	fillText: function(ctx, string, x, y, css, color) {
		ctx.save();
		// https://developer.mozilla.org/en-US/docs/Web/CSS/font
		ctx.font = css;
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
		ctx.restore();
	},
	
	calculateDeltaTime: function(){
		// what's with (+ new Date) below?
		// + calls Date.valueOf(), which converts it from an object to a 	
		// primitive (number of milliseconds since January 1, 1970 local time)
		var now,fps;
		now = (+new Date); 
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now; 
		return 1/fps;
	},
	
	makePlayer: function(){
		var playerMove = function(){
			if (myKeys.keydown[myKeys.KEYBOARD.KEY_W]){
				this.y -= 2.5;
			}
			if (myKeys.keydown[myKeys.KEYBOARD.KEY_A]){
				this.x -= 2.5;
			}
			if (myKeys.keydown[myKeys.KEYBOARD.KEY_S]){
				this.y += 2.5;
			}
			if (myKeys.keydown[myKeys.KEYBOARD.KEY_D]){
				this.x += 2.5;
			}
			if (this.x - this.radius < 10){
				this.x = 10 + this.radius;
			}
			if (this.y - this.radius < 10){
				this.y = 10 + this.radius;
			}
			if (this.x + this.radius > app.main.WIDTH - 10){
				this.x = app.main.WIDTH - 10 - this.radius;
			}
			if (this.y + this.radius > app.main.HEIGHT - 10){
				this.y = app.main.HEIGHT - 10 - this.radius;
			}
		}
		
		var playerDraw = function(ctx){
			ctx.save();
			ctx.drawImage(app.main.shipImg, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
			ctx.restore();
		}
		
		var p = {};
		
		p.x = this.WIDTH / 2;
		p.y = this.HEIGHT / 2;
		p.radius = 25;
		
		p.draw = playerDraw;
		p.move = playerMove;
		
		return p;
	},
	
	makeBullets: function(num){
		//A function that we will soon use as a "method"
		var bulletMove = function(dt){
			this.x += this.xSpeed * this.speed * dt;
			this.y += this.ySpeed * this.speed * dt;
		};
		
		var shootBullet = function(){
			var attackVector = getVectorToPlayer(this.x, this.y);
			//console.log(attackVector);
			if (this.isSniper){
				this.xSpeed = attackVector.x * 3;
				this.ySpeed = attackVector.y * 3;
			}
			else if(this.isRocket){
				this.xSpeed = attackVector.x * .5;
				this.ySpeed = attackVector.y * .5;
			}
			else{
				this.xSpeed = attackVector.x;
				this.ySpeed = attackVector.y;
			}
			this.state = app.main.BULLET_STATE.NORMAL;
		};
		
		var drawLine  = function(color, ctx){
			var attackVector = getLineVectorToPlayer(this.x, this.y);
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			ctx.lineTo(this.x + attackVector.x, this.y + attackVector.y);
			ctx.closePath();
			ctx.strokeStyle = color;
			ctx.stroke();
			ctx.restore();
		};
		
		var bulletDraw = function(ctx){
			//Draw BULLET
			ctx.save();
			if(this.isRocket){
				ctx.drawImage(app.main.rocketImg, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
			}else{
				ctx.drawImage(app.main.bulletImg, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
			}
			ctx.restore();
		};
		
		var array = [];
		for(var i = 0; i < num; i++){
			//Make a new object literal
			var b = {};
			
			//Add x and y properties
			//x and y are somewhere on the canvas, with a minimum margin of START_RADIUS
			//getRandom() is from utilities.js
			var randomVal = getRandom(0, 1);
			if (randomVal <= 0.25){
				b.x = getRandom(this.BULLET.START_RADIUS * 2, this.WIDTH - this.BULLET.START_RADIUS * 2);
				b.y = this.BULLET.START_RADIUS * 2;
			}
			else if (randomVal <= 0.50){
				b.x = getRandom(this.BULLET.START_RADIUS * 2, this.WIDTH - this.BULLET.START_RADIUS * 2);
				b.y = this.HEIGHT - this.BULLET.START_RADIUS * 2;
			}
			else if (randomVal <= 0.75){
				b.x = this.BULLET.START_RADIUS * 2;
				b.y = getRandom(this.BULLET.START_RADIUS * 2, this.HEIGHT - this.BULLET.START_RADIUS * 2);
			}
			else{
				b.x = this.WIDTH - this.BULLET.START_RADIUS * 2;
				b.y = getRandom(this.BULLET.START_RADIUS * 2, this.HEIGHT - this.BULLET.START_RADIUS * 2);
			}
			
			b.xSpeed = 0;
			b.ySpeed = 0;
			
			//Add a radius property
			b.radius = this.BULLET.START_RADIUS;
			
			//Special Bullet Bools
			b.isSniper = false;
			b.isRocket = false;
			
			if (Math.random() <= 0.25){
				b.isSniper = true;
			}
			else if (Math.random() > 0.25 && Math.random() <= 0.30){
				b.isRocket = true;
				b.radius = this.BULLET.START_RADIUS + 10;
			}
			
			//Make more properties
			b.speed = this.BULLET.MAX_SPEED;
			b.state = this.BULLET_STATE.AIMING;
			b.timer = 0;
			
			b.draw = bulletDraw;
			b.move = bulletMove;
			b.shoot = shootBullet;
			b.drawLine = drawLine;
			
			//No more properties can be added!
			Object.seal(b);
			array.push(b);
		}
		return array;
	},
	
	drawBullets: function(ctx){
		if (this.gameState == this.GAME_STATE.ROUND_OVER || this.gameState == this.GAME_STATE.END || this.gameState == this.GAME_STATE.REPEAT_LEVEL) {
			this.ctx.globalAlpha = 0.25;
		}
		for(var i = 0; i < this.bullets.length; i++){
			var b = this.bullets[i];
			var attackVector = getVectorToPlayer(b.x, b.y);
			if (!b.isSniper && b.state == this.BULLET_STATE.AIMING && i == this.currentBullet){
				b.state = app.main.BULLET_STATE.WAITING;
			}
			else if (b.state == this.BULLET_STATE.AIMING && this.totalTime < (this.currentBullet * this.lineTimer) + this.bulletTimer + (this.currentBullet * 0.2) + this.startWaitTime && 
																		this.totalTime > ((this.currentBullet - 1) * this.bulletTimer) + this.startWaitTime && i == this.currentBullet && b.isSniper){
				b.drawLine('blue', ctx);
			}
			if (b.isSniper && b.state == this.BULLET_STATE.AIMING && this.totalTime >= (this.currentBullet * this.bulletTimer) + this.lineTimer + 0.2 + this.startWaitTime){
				b.state = app.main.BULLET_STATE.WAITING;
			}
			
			if(b.state == this.BULLET_STATE.EXPLODED){
				if((this.totalTime - b.timer) > 3){
					console.log("Shrinking");
					b.radius = b.radius - 2;
					if(b.radius <= 0){
						console.log("done")
						b.state = this.BULLET_STATE.DONE;
					}
				}
			}
			if (b.state == this.BULLET_STATE.WAITING && this.totalTime >= (this.currentBullet * this.bulletTimer) + this.startWaitTime && i == this.currentBullet){
				this.currentBullet++;
				b.shoot();
			}
			else if (b.state == this.BULLET_STATE.DONE || b.state == this.BULLET_STATE.WAITING || b.state == this.BULLET_STATE.AIMING){
				continue;
			}
			b.draw(ctx);
		}
	},

	moveBullets: function(dt){
		for(var i=0;i<this.bullets.length; i++){
			var b = this.bullets[i];
			if(b.state === this.BULLET_STATE.DONE || b.state === this.BULLET_STATE.WAITING || b.state === this.BULLET_STATE.AIMING) continue;
		    
			// move bullets
			b.move(dt);
		
			// did bullets leave screen?
			if(this.bulletHitLeftRight(b)){
				b.state = this.BULLET_STATE.DONE;
			}
			
			if(this.bulletHitTopBottom(b)){
				b.state = this.BULLET_STATE.DONE;
			}
	
		} // end for loop
	},
	
    bulletHitLeftRight: function(b){
		if (b.x <= -b.radius || b.x >= this.WIDTH + b.radius){
			return true;
		}
	},
	
	bulletHitTopBottom: function(b){
		if (b.y <= -b.radius || b.y >= this.HEIGHT + b.radius){
			return true;
		}
	},
	
	drawPauseScreen: function(ctx){
		ctx.save();
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
		ctx.textAlign = 'center';
		ctx.textBaseLine = "middle";
		this.fillText(this.ctx, "...PAUSED...", this.WIDTH / 2, this.HEIGHT / 2, "40pt courier", 'white');
		ctx.restore();
	},
	
	doMousedown: function(e){		
		this.sound.playBGAudio()
		//Unpause on a click
		//Just to make sure we never get stuck in a paused state
		if (this.paused){
			this.paused = false;
			this.update();
			return;
		};
		
		if (this.gameState == this.GAME_STATE.BEGIN){
			
		}
		
		//If the round is over, reset and add 5 more bullets
		if (this.gameState == this.GAME_STATE.ROUND_OVER){
			this.gameState = this.GAME_STATE.DEFAULT;
			this.reset();
			return;
		}
		
		if (this.gameState == this.GAME_STATE.REPEAT_LEVEL){
			this.gameState = this.GAME_STATE.DEFAULT;
		}
		
		if (this.gameState == this.GAME_STATE.END){
			this.gameState = this.GAME_STATE.DEFAULT;
			this.numBullets = this.BULLET.NUM_BULLETS_START;
			this.reset();
		}
		
		var mouse = getMouse(e);
	},
	
	//Creates a new level of bullets
	reset: function(){
		this.totalTime = 0;
		this.currentBullet = 0;
		this.numBullets += 5;
		this.bullets = this.makeBullets(this.numBullets);
		this.player = this.makePlayer();
	},
	
	checkForCollisions: function(){
		if(this.gameState == this.GAME_STATE.DEFAULT){
			var isOver;
			// check for collisions between bullets
			for(var i = 0; i < this.currentBullet; i++){
				var b = this.bullets[i];
				// only check for collisions if c1 is WAITING 
				if (b.state === this.BULLET_STATE.DONE) continue;
				if (bulletsIntersect(b, this.player)){
					this.gameState = this.GAME_STATE.END;
				}
				for(var j = 0; j<this.currentBullet; j++){
					var b2 = this.bullets[j];
					if(b2.isRocket && b2.state != this.BULLET_STATE.EXPLODED){
						if(c != b2 && bulletsIntersect(b,b2) && !b.isRocket){
							b2.radius = 60;
							b2.xSpeed = 0;
							b2.ySpeed = 0;
							b2.timer = this.totalTime;
							b.state = this.BULLET_STATE.DONE;
							b2.state = this.BULLET_STATE.EXPLODED;
						}
					}
				}
			} // end for
			
			// round over?
			var isOver = true;
			for(var i=0;i<this.bullets.length; i++){
				var c = this.bullets[i];
				if(c.state != this.BULLET_STATE.DONE ){
				 isOver = false;
				 break;
				}
			} // end for
		
			if(isOver){
				this.stopBGAudio();
				this.gameState = this.GAME_STATE.ROUND_OVER
			 }
				
		} // end if GAME_STATE_WAITING
	},
	
	drawHUD: function(ctx){
		ctx.save(); // NEW
		
      	// fillText(string, x, y, css, color)
		this.fillText(this.ctx, "Move with WASD", 20, 30, "18pt courier", "#ddd");

		// NEW
		if(this.gameState == this.GAME_STATE.BEGIN){
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			this.fillText(this.ctx, "To begin, click a BULLET", this.WIDTH/2, this.HEIGHT/2, "30pt courier", "white");
		} // end if
	
		// NEW
		if(this.gameState == this.GAME_STATE.ROUND_OVER){
			ctx.save();
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			this.fillText(this.ctx, "Round Over", this.WIDTH/2, this.HEIGHT/2 - 40, "30pt courier", "red");
			this.fillText(this.ctx, "Click to continue", this.WIDTH/2, this.HEIGHT/2, "30pt courier", "red");
		} // end if
		
		if (this.gameState == this.GAME_STATE.REPEAT_LEVEL){
			
		}
		
		if (this.gameState == this.GAME_STATE.END){
			ctx.save();
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			this.fillText(this.ctx, "Game Over", this.WIDTH/2, this.HEIGHT/2 - 50, "48pt courier", "white");
			this.fillText(this.ctx, "You Suck!", this.WIDTH/2, this.HEIGHT/2, "30pt courier", "red");
			this.fillText(this.ctx, "Click to play again", this.WIDTH/2 , this.HEIGHT/2 + 40, "20pt courier", "#ddd");
		}
		
		ctx.restore(); // NEW
	},
	
	pauseGame: function(){
		this.paused = true;
		
		//Stop the animation loop
		cancelAnimationFrame(this.animationID);
		
		//this.stopBGAudio();
		
		//Call update() once so that our paused screen gets drawn
		this.update();
	},
	
	resumeGame: function(){
		//Stop the animation loop, just in case it's running
		cancelAnimationFrame(this.animationID);
		
		this.paused = false;
		
		this.sound.playBGAudio()
		
		//Restart the loop
		this.update();
	},
	
	stopBGAudio: function(){
		this.sound.stopBGAudio() 
	},
	
	toggleDebug: function(){
		this.debug = !this.debug;
	}
    
}; // end app.main