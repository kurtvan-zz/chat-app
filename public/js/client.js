// client side code for messaging app
// controls listing messages and emitting outgoing
// ones to the socket

// create global socket onject
var socket = io();
var user = null;

// focus on the username field
$(document).ready(function() {
	$('#login-alert').hide();
	$('#username').focus();
	$('#m').val('');

	var messages_window_height = $(window).height() - $('#message-enter').height() - $('#messaging-topbar').height();
	$('#messages').css("height", messages_window_height.toString() + "px");


})

// when the user clicks the login button
$('#login-form button').click(function() {
	socket.emit('login', [$('#username').val(), $('#password').val()]);
	$('#password').val('');
	return false;
});

// when message is sent, emit to all sockets
$('#message-enter').submit(function() {
	socket.emit('chat message', [$('#m').val(), user]);
	$('#m').val('');

	// $('#messages').scrollTop($('#messages')[0].scrollHeight);


	$("#messages").animate({
		scrollTop: $("#messages").height()},
		"fast"
	);

	return false;
});

// when message is recieved, add to <ul>
socket.on('chat message', function(msg) {
	$('#messages').append($('<li>').text(msg));
});

socket.on('login-success', function(loginUser) {
	// transition from login page to chat page
	$('#login-alert').hide(200);
	$('#login-form').css('background-color', '#BFFFBD'); // green for success
	$('form p').css('color', 'black');
	//  animation for login transition
	$('#login-page').animate({
			top: '200%'
		}, 800, function() {
			$('#main-app').show();
			$('#m').focus();
			$('#curtain').fadeOut(200);
	});
	// set the clients user
	user = loginUser;
	$('#loggedin').text("Hi, " + user);
});

// when there is a login failure
socket.on('login-failure', function(loginUser) {
	$('#login-alert').show(200);
	$('#login-form').css('background-color', '#ffcccc');
	$('form p').css('color', 'white');
	$('#login-alert').css('color', 'red');
});

$('#logout').click(function() {
	socket.emit('logout', user);


	$('#login-form').css('background-color', 'white');

	$('#curtain').fadeIn(200, function() {
		$('#main-app').hide();
		$('#username').focus();
	});




	//  animation for login transition
	$('#login-page').animate({
			top: '50%'
		}, 800);
	// set the clients user
	user = null;
	$('#loggedin').text('');

});
