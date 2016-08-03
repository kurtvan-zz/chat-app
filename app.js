//	CHAT APP
//	A Simple messaging app made with node.js, express, and spcket.io
//	Written by Kurt van Bendegem, July 2016

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var path = require('path');
var fs = require('fs');
var bcrypt = require('bcrypt');

var data; // object to hold user JSON info
var online = [];

// put data into object (synchronous)
var data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// updates the JSON data file with the values in data
var updateData = function() {
		fs.writeFileSync('data.json', JSON.stringify(data, null, 4));
}
// user 'class' for creating new users
function User(username, password) {
	this.username = username;
	this.password = password;
	this.convos = [];
}

function Convo(users) {
	this.id = data['num_convos'] + 1;
	this.users = users;
	this.messages = [];
}

function Message(from_user, message_text) {
	this.from_user = from_user;
	this.message_text = message_text;
}

// add a user to the data set, with a blank set of
// conversations
var addUser = function(username, password) {
	var newUser = new User(username, password);
	data['users'].push(newUser);
}

// returns a user object given their username user
var getUser = function(user) {
	// loop through contents of the user array
	for (var i = 0; i < data["users"].length; i++) {
		if (user == data["users"][i]["username"]) {
			return data["users"][i];
		}
	}
	return -1;
}

// return true if user is registered
var userExists = function(user) {
	if (getUser(user) != -1) {
		return true;
	}
	else {
		return false;
	}
}

var addConvo = function(users) {
		var newConvo = new Convo(users);
		data['convos'].push(newConvo);
		data['num_convos'] += 1;

		for (var i = 0; i < users.length; i++) {
			getUser(users[i])["convos"].push(newConvo["id"]);
		}

		updateData();
}

var deleteAllConvos = function() {
	data["convos"] = [];
	for (var i = 0; i < data['users'].length; i++) {
		data["users"][i]["convos"] = [];
	}

	data["num_convos"] = 0;

	updateData();


}

addConvo(['kurt', 'george']);
addConvo(['kurt', 'george']);
addConvo(['kurt', 'george', 'bob']);
deleteAllConvos();

// ASYNCHRONOUS
// fs.readFile('users.json', 'utf8', function(err, data) {
// 	if(err) throw err;
// 	users = JSON.parse(data);
// });

// serve html on connection
app.get('/', function(req, res)  {
	res.sendFile(__dirname + '/views/index.html');
});

// join paths to serve css and js files
app.use(express.static(path.join(__dirname, 'public/css')));
app.use(express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public/images')));

// when a user connects to the socket, output stuff
io.on('connection', function(socket) {
	//console.log('a user connected');


	socket.on('chat-message', function(pair) {
		if (pair[0].length > 0) {
			io.emit('chat-message', pair[1] + ':	' + pair[0]);
			console.log(pair[1] + ' sent a message:' + pair[0]);
		}
	});

	// when a connected socket logs in as a user
	socket.on('login-attempt', function(inputs) {

		console.log("login attempt")

		if (getUser(inputs[0])["password"] == inputs[1]) {
			console.log("credentials match");
			console.log(inputs[0] + " has logged in!")
			online.push(inputs[0]);
			socket.emit('login-success', inputs[0]);
		}

		else {
			console.log("incorrect credentials for user" + inputs[0]);
			socket.emit('login-failure', inputs[0]);
		}
	});

	socket.on('signup-attempt', function(inputs) {

		if (userExists(inputs[0]) == false && inputs[0].length > 3) {
			socket.emit('signup-success');
			addUser(inputs[0], inputs[1]);
			updateData();
			console.log('new user ' + inputs[0]);
		}

		else {
			socket.emit('invalid-username');
		}
	});

	socket.on('user-verify', function(potentialUser) {
		if(userExists(potentialUser) || potentialUser.length < 4) {
			socket.emit('invalid-username');
		}
		else {
			socket.emit('valid-username');
		}
	});

	// output when the user disconnects from the socket as
	// well
	socket.on('disconnect', function() {
		console.log('a user disconnected');
	})

})

// listen for new connections
server.listen(3000, function() {
	console.log("listening on port 3000 ... ");
});
