//Modules & set up =========================================================
var app          = require('express')();
var port         = process.env.PORT || 3000;
var bodyParser   = require('body-parser');
var morgan       = require('morgan');
var http         = require('http').Server(app);
var io           = require('socket.io')(http);
import mongoose from 'mongoose';

if(mongoose.connection.readyState === 0) {
    mongoose.connect("mongodb://localhost/iot");
}

import { checkToken } from './api/auth/auth-controller';

import * as ResourceController from './api/resources/resource-controller';

import authRouter from './api/auth/auth-router';
import resourceRouter from './api/resources/resource-router';
import userRouter from './api/users/user-router';

var sockets = [];

// var ledResource = {
//   uri: "/a/led",
//   power: 100,
//   state: 1
// };

// var deviceInfo = {
//   id: ""
// }

// var gatewaySocket;

//app middlewares
//only show logs with arent testing
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// set the view engine to ejs
app.set('views', __dirname + '/public');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Site - Routes ==================================================
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:4200");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

app.use('/api/auth/', authRouter());
app.use('/api/resources/', resourceRouter());
app.use('/api/users/', userRouter());

io.use(function(socket, next) {
  var token = socket.request.query.token;
  checkToken(token, function(err, user){
    if (err || !user) {
      next(new Error("not authorized"));
    }
    socket.user = user;
    next();
  });
});

io.on('connection', function(socket){
  console.log('a gateway connected');
  sockets[socket.user._id] = socket;

  socket.on("discovery", function(deviceId) {
    console.log("New device " + deviceId);
    socket.emit("get", {identifier: deviceId});
  });

  socket.on("get response", function(getResponse) {
    console.log("Get response");
    console.log(getResponse);
    ResourceController.registerResource()
  });

});

//Server ========================================================= 
http.listen(port, function() {
    console.log('Listenning on port: ' + port);
});
