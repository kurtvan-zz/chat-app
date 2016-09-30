//	CHAT APP
//	A Simple messaging app made with node.js, express, and spcket.io
//	Written by Kurt van Bendegem, July 2016
"use strict";


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


// ----------------------------------------------------------------------------
// Book keeping functions and objects for all data
// ----------------------------------------------------------------------------

// updates the JSON data file with the values in data
var updateData = function() {
		fs.writeFileSync('data.json', JSON.stringify(data, null, 4));
}

// user object for creating new users
function User(username, password) {
	this.username = username;
	this.password = password;
	this.convos = [];
}
 // convo object
function Convo(users) {
	this.id = data.num_convos + 1;
	this.members = users;
	this.messages = [];
}

// message object
function Message(from_user, message_text) {
	this.id = data.num_messages + 1;
	this.sender = from_user;
	this.text = message_text;
}

// return the convo object with the given id
function getConvo(id) {
	var convo;
	for (var i = 0; i < data.convos.length; i++) {
		convo = data.convos[i].id;

		if (convo == id) {
			return data.convos[i];
		}
		return -1;
	}
}

// return all messages in the convo with the given id
function getConvoMessages(id) {
	return getConvo(id).messages;
}

// returns an array of all convo objects that user is a part of
function getUserConvos(user) {

	var userObj = getUser(user);
	var convos_ids = userObj.convos;

	var convos = [];

	// for all conversation objects
	for (var i = 0; i < data.convos.length; i++) {

		// if the conversation is in the users list of convos,
		// add to convos array
		if (convos_ids.indexOf(data.convos[i].id) > -1) {
			convos.push(data.convos[i]);
		}
	}

	return convos;

}



// add a user to the data set, with a blank set of
// conversations
var addUser = function(username, password) {
	var newUser = new User(username, password);
	data.users.push(newUser);
	updateData();
}

// return a user object given their username
var getUser = function(user) {
	// loop through contents of the user array
	for (var i = 0; i < data.users.length; i++) {
		if (user == data.users[i].username) {
			return data.users[i];
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

// add a new convo to the data structure, and update the users profiles who are
// part of the convo
var addConvo = function(users) {
		var newConvo = new Convo(users);
		data.convos.push(newConvo);
		data.num_convos += 1;

		for (var i = 0; i < users.length; i++) {
			getUser(users[i]).convos.push(newConvo.id);
		}

		updateData();
}

var deleteAllConvos = function() {
	data.convos = [];
	for (var i = 0; i < data.users.length; i++) {
		data.users[i].convos = [];
	}

	data.num_convos = 0;

	updateData();
}

var deleteAllMessages = function() {
	data.messages = [];
	data.num_messages = 0;
	updateData();

}

var addMessage = function(convo, sender, text) {

	var newMessage = new Message(sender, text);

	// add id to appropriate convo
	for (var i = 0; i < data.convos.length; i++) {
		if (data.convos[i].id == convo) {
			data.convos[i].messages.push(newMessage.id);
		}
	}

	// add message data to data
	data.messages.push(newMessage);
	data.num_messages = data.num_messages + 1;
	updateData();
}


// put debug function calls here ----------------------------------------------

deleteAllConvos();
deleteAllMessages();
addConvo(['kurt', 'george']);
addConvo(['kurt', 'nomi']);
addMessage(1, 'kurt', "test test test 123");

// ----------------------------------------------------------------------------

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

	// when a chat message is sent to the server, emit the message
	// to the conversation if the message has content in it
	socket.on('chat-message', function(message_data) {
		if (message_data[0].length > 0) {
			io.emit('chat-message', {
					"msg" : message_data[1] + ':    ' + message_data[0],
					"user" : message_data[1]
				}
			);
			console.log(message_data[1] + ' sent a message:' + message_data[0]);
		}
	});

	// when a client tries to login, verify that a valid username
	// and password are given, and login this user if so
	socket.on('login-attempt', function(inputs) {

		console.log("login attempt")

		var login_user = inputs[0];
		var login_password = inputs[1];

		// validate password for given user
		if (getUser(login_user)["password"] == login_password) {
			console.log("credentials match");
			console.log(login_user + " has logged in!")
			online.push(login_user);
			socket.emit('login-success', [login_user, getUserConvos(login_user)]);
		}

		// if password is incorrect
		else {
			console.log("incorrect credentials for user" + login_user);
			socket.emit('login-failure', login_user);
		}
	});

	// Verify that username is valid and create new user if
	// this is the case
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
