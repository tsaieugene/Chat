const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const index = require('./routes/index');
const chat = require('./routes/chat');
const chats = require('./routes/chats');

const Chat = require('./models/chatModel');

const socket_io = require("socket.io");

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost/ChatApp', function(err) {
    if (err) {
        throw err;
    } else {
        console.log("Successfully connected to MongoDB");
    }
});
const db = mongoose.connection;

// holds currently connected users
// key: user's name, value: user's socket object
const users = {};

io.on('connection', function(socket){
    updateUsers();

    // User disconnect
    socket.on('disconnect', function(data){
        if (socket.currentUser != null){
            delete users[socket.currentUser];
            updateUsers();
        }
    });

    // User login
    socket.on('new user', function(data, callback) {
        socket.currentUser = data;
        if (!(socket.currentUser in users)){
            users[socket.currentUser] = socket;
            callback(true);
            updateUsers();
        } else {
            callback(false);
        }
    });

    // Selected user conversation (limited to 20 messages)
    socket.on('selected user', function(data, callback) {
        Chat.find({'toUser': data.toUser, 'fromUser': data.fromUser, 'expireAt': { $gt: new Date() }})
            .sort("-expireAt")
            .limit(20)
            .exec(function (err, docs) {
            if (err) {
                return next(err);
            } else if (docs != null && docs.length > 0) {
                users[data.toUser].emit('retrieve messages', docs);
            }
        });
    });

    // Emit to all connected sockets that a user has connected/disconnected
    function updateUsers(){
        io.sockets.emit('update users', Object.keys(users));
    }
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// add socket.io to response object in event loop
app.use(function(req, res, next){
  req.io = io;
  req.db = db;
  req.users = users;
  next();
});

app.use('/', index);
app.use('/chat', chat);
app.use('/chats', chats);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = {app: app, server: server};
//module.exports = app;
