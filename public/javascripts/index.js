"use strict"
$(document).ready(function() {
    // load socket client, which exposes a global io and then connects
    // do not need to specify any URL when calling io() since it defaults to trying to connect to the host that serves the page
    var socket = io();
    // user that is logged in
    var currentUser;
    // other user that is currently selected by logged in user
    var selectedUser;
    // Click on an online user
    $('#users').on('click', 'a', function() {
        if (currentUser != null) {
            selectedUser = $(this).text();
            socket.emit('selected user', {toUser: currentUser, fromUser: selectedUser});
            $('#chatTitle').text('Messages from ' + selectedUser);
            $('#chatMessages').html('');
            $('#messageGroup').show();
        } else {
            createAlert('div.alert', $('#alertPanel'), true, 'Username is required to send a message.');
        }
    });
    // User clicking on a message from another user (displays message details in modal if successful)
    $('#chatMessages').on('click', 'a', function(e) {
        if (currentUser != null) {
            var messageId = $(this).attr('data-id');
            if (messageId != null) {
                $.ajax({
                    type: 'GET',
                    url: '/chat/' + messageId,
                    error : function(resp) {
                        createAlert('div.alert', $('#alertPanel'), true, resp.responseJSON["error"]);
                    },
                    success : function(resp) {
                        if (resp != null) {
                            $('#modalLabel').text('Message for: ' +resp.toUser);
                            $('#modalFromUser').text(resp.fromUser);
                            $('#modalText').text(resp.text);
                            $('#modalExpireDate').text(resp.expirationDate);
                            $('#exampleModal').modal('show');
                        } else {
                            createAlert('div.alert', $('#alertPanel'), true, 'Server error: Empty response');
                        }
                    }
                });
            } else {
                createAlert('div.alert', $('#alertPanel'), true, 'Could not retrieve message id.');
            }

        } else {
            createAlert('div.alert', $('#alertPanel'), true, 'Username is required to send a message.');
        }
    });

    // POST request to send new message
    $('#messageForm').submit(function(e){
        e.preventDefault();
        var timeoutStr = $('#timeout').val().trim();
        var timeoutInt;
        if (timeoutStr == null || timeoutStr == '') {
            // default is 60 seconds if no timeout provided
            timeoutInt = 60;
        } else {
            timeoutInt = Math.floor(Number(timeoutStr));
            // Check if timeout field is a integer is between 0 to 31536000 seconds inclusive
            if (!(String(timeoutInt) === timeoutStr) || timeoutInt < 0 || timeoutInt > 60*60*24*365) {
                createAlert('div.alert', $('#alertPanel'), true, 'Timeout value must be an integer from 0 to 31536000.');
                return false;
            }
        }
        var message = $('#message').val().trim();
        if (message == null || message == '') {
            createAlert('div.alert', $('#alertPanel'), true, 'Message field is empty.');
            return false;
        }
        if (currentUser != null && selectedUser != null) {
            $.ajax({
                type: 'POST',
                url: '/chat',
                data: {fromUser: currentUser,
                       toUser: selectedUser,
                       text: message,
                       timeout: timeoutInt
                   },
                error : function(resp) {
                    createAlert('div.alert', $('#alertPanel'), true, resp.responseJSON["error"]);
                    $('#messageGroup').hide();
                },
                success : function(resp) {
                    createAlert('div.alert', $('#alertPanel'), false, 'Message (' + resp.id + ') was sent!');
                }
            });
            $('#message').val('');
        } else {
            console.log("Need to be logged in");
        }
    });

    // user chooses a username to start chatting
    $('#loginForm').submit(function(e){
        e.preventDefault();
        var username = $('#username').val().trim();
        // check if username is alphanumeric
        if (username.match(/^[a-z0-9]+$/i) == null) {
            createAlert('div.alert', $('#alertPanel'), true, 'Username must me alphanumeric without spaces.');
        } else {
        // notify other users that new user has joined
            if (username != null && username != '') {
                socket.emit('new user', username, function(confirmation) {
                    if (confirmation) {
                        currentUser = username;
                        $('#loginForm').css('visibility', 'hidden');
                        $('#loggedInTitle').text("Logged in as " + currentUser);
                        $('#username').val('');
                    } else {
                        createAlert('div.alert', $('#alertPanel'), true, 'Username has already been taken.');
                    }
                });
            }
        }
    });

    // update online users when a user disconnects or connects
    socket.on('update users', function(data) {
        $('#users').html('');
        for (var i = 0; i < data.length; i++) {
            if (data[i] != currentUser) {
                $('#users').append('<a href="#" class="list-group-item">' + data[i] + '</li>');
            }
        }
    });

    // current user received a message from another user
    socket.on('new message', function(data) {
        // if current user has the sender's conversation open then append to current user's chat box
        if (data.toUser == currentUser && data.fromUser == selectedUser) {
            $('#chatMessages').append('<a href="#" class="list-group-item" data-id=' + data.messageId + '>' + data.text + '</li>');
        }
    });

    // Appending messages from one other user
    socket.on('retrieve messages', function(data) {
        for (var i = data.length-1; i >= 0; i--) {
            $('#chatMessages').append('<a href="#" class="list-group-item" data-id=' + data[i]._id + '>' + data[i].text + '</li>');
        }
    });

    // Create success or error alert (false for success, true for error)
    function createAlert(alert, alertPanel, isError, errorMessage) {
	    $(alert).remove();
        var alertType = "";
        if (isError) {
            alertType = '<div class="alert alert-danger alert-dismissible" role="alert" >';
        } else {
            alertType = '<div class="alert alert-success alert-dismissible" role="alert" >';
        }
	    $(alertPanel).append(
		alertType +
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
			    '<span >' + '&times;' + '</span>' +
            '</button>' +
		    '<h5><strong>' + errorMessage + '</strong><h5>' +
	    '</div>'
	   );
       $(alert).fadeOut(4000, function() {
           $(this).remove();
       });
   }

   // allow user to send message by pressing 'enter' key
   $("#message").keypress(function (e) {
        if(e.which == 13) {
            e.preventDefault();
            $("#messageForm").submit();
        }
    });

});
