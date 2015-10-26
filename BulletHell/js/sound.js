 // sound.js
"use strict";
// if app exists use the existing copy
// else create a new object literal
var app = app || {};

// define the .sound module and immediately invoke it in an IIFE
app.sound = (function(){
	//console.log("sound.js module loaded");
	var bgAudio = undefined;
	var gunShotAudio = undefined;
	var sniperShotAudio = undefined;
	var rocketShotAudio = undefined;
	var effectSounds = ["gunshot.mp3","snipershot.mp3"];
	

	function init(){
		bgAudio = document.querySelector("#bgAudio");
		bgAudio.volume=0.3;
		
		//audio for gunshots
		gunShotAudio = document.querySelector("#gunshotAudio");
		gunShotAudio.volume = 0.2;
		gunShotAudio.src = "media/gunshot.mp3";
		//audio for sniper
		sniperShotAudio = document.querySelector("#sniperAudio");
		sniperShotAudio.volume = 0.2;
		sniperShotAudio.src = "media/snipershot.mp3";
		//audio for rocket
		rocketShotAudio = document.querySelector("#rocketAudio");
		rocketShotAudio.volume = 0.3;
		
	}
		
	function stopBGAudio(){
		bgAudio.volume = 0.1;
	}
	
	//Gunshot Soundsd
	function playGunshot(){
		gunShotAudio.currentTime = 0; //used so the sound byte replays everytime a new bullet shoots
		gunShotAudio.play();
	}
	function playSniper(){
		sniperShotAudio.currentTime = 0;
		sniperShotAudio.play();
	}
	function playRocket(){
		rocketShotAudio.src = "media/rocketshot.mp3";
		rocketShotAudio.currentTime = 0;
		rocketShotAudio.play();
	}
	function playExplosion(){
		rocketShotAudio.src = "media/rocketexplosion.mp3";
		rocketShotAudio.currentTime = 0;
		rocketShotAudio.play();
	}
	
	function playBGAudio(){
		bgAudio.volume=0.3;
		bgAudio.play();
	}
		
	// export a public interface to this module
	return{
		init: init,
		stopBGAudio: stopBGAudio,
		playBGAudio: playBGAudio, 
		gunShot: playGunshot,
		sniperShot: playSniper,
		rocketShot: playRocket,
		explosion: playExplosion,
	};
}());