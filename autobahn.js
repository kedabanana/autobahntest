
// Player class... 
function Player(id, color, size, location) {
	console.log("Creating new player at");
	console.log(location);
	this.color = color;
	this.size = size
	this.location = location;
	this.id = id;
	this.path = new Path.Circle(new Point(this.location), this.size);
}

// the method to redraw a players location
Player.prototype.draw = function() {
	this.path.remove();
	console.log("Player.draw at location");
	console.log(this.location);
	this.path = new Path.Circle(new Point(this.location), this.size);
	this.path.fillColor = this.color;
	
}

Player.prototype.clean = function() {
	this.path.remove();
}

// Our game world. Provides handy functions for maniuplating players
function World(){
	this.players = [];
}

// Adds a new player to the world
World.prototype.addplayer = function(id, color, size, loc) {
	console.log("Adding new player");
	console.log(id)
	p = new Player(id, color, size, loc);
	p.draw();
	this.players.push(p);
}

// Updates a players position
World.prototype.updateplayer = function(id, loc) {
	console.log("World.updateplayer");
	console.log(this.players[0].id );
	var player= this.players.filter(function(val) {
					 return val.id === id; });
	// TODO: check if player exists or not. at present nothing happens if the ID is invalid
	var arraylen = this.players.length;
	for (var i = 0; i < arraylen; i++) {
		player = this.players[i];
		if (player.id === id) {
			player.location = loc;
			player.draw();
		}
	}
}


// mostly stolen from http://autobahn.ws/js/ with noob comments added
//
//
// This opens an Autobahn WAMP connection using the crossbar.io router running on localhost with default settingsv
var connection = new autobahn.Connection({
	url: 'ws://127.0.0.1:8080/ws',
	realm: 'realm1'
});


theworld = new World();

// Creating the onopen method which will be called when a successful WAMP session is established
connection.onopen = function (session) {
	// Adding callbacks for the updateplayer and playerarrived events
	function updateplayer(args) {
		console.log("UPDATING PLAYER LOCATION TO");
		console.log(args[0][1]);
		//TODO: Messy calling with args like this, find a neater way
		theworld.updateplayer(args[0][0], args[0][1]);
	}
	session.subscribe('com.autobahntest.updateplayer', updateplayer);


	function newplayer(args) {
		console.log("NEW PLAYER ARRIVED");
		theworld.addplayer(args[0][0], args[0][1], args[0][2], args[0][3]);
	}

	function removeplayer(args) {
		console.log("A player has left");
		newplayers = [];
		players_len = theworld.players.length;
		for (var i = 0; i < players_len; i++) {
			player = theworld.players[i]
			if (player.id !== args[0]) {
				newplayers.push(player);
			} else {
				// Remove the player path we don't need
				player.clean();
			}

		}
		theworld.players = newplayers;
	}


	//Register this session with the server to create a new player
	console.log("Registering with server");
	session.call('com.autobahntest.register', [session.id]).then(
		function (response) {
			players_len = response.length;
			for (var i = 0; i < players_len; i++) {
				// Player info stored in array with order:
				// id, color, size, location
				// TODO: must be a better way to do this. dicts or **response?
				player = response[i];
				theworld.addplayer(player[0], player[1], player[2], player[3]);
			}
		}
	);

	// Listen for newplayer arriving events. Doing this after registration so we don't add ourself twice
	session.subscribe('com.autobahntest.playerarrived', newplayer);
	session.subscribe('com.autobahntest.playerleft', removeplayer);

};

connection.onclose = function (session) {
	//Tell the server we have left
	session.publish('com.autobahntest.playerleft', [session.id]);
};

function onKeyDown(event) {
		var pos = 0
		session = connection.session;
		if (event.key == 'w') {
			pos = "up";
			session.publish('com.autobahntest.playermove', [session.id, pos]);
		}
		if (event.key == 'a') {
			pos = "left";
			session.publish('com.autobahntest.playermove', [session.id, pos]);
		}
		if (event.key == 's') {
			pos = "down";
			session.publish('com.autobahntest.playermove', [session.id, pos]);
		}
		if (event.key == 'd') {
			pos = "right";
			session.publish('com.autobahntest.playermove', [session.id, pos]);
		}

	}


// Open the WAMP connection.. Nothing executes after this line until the conneciton closes
connection.open();




