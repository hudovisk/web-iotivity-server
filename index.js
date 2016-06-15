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
  res.setHeader('Access-Control-Allow-Origin', "*");

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
  next();
});

app.get('/', function(req, res, next) {
  return res.status(200).json({
    attr: "Qualquer merda",
    outraKey: "Outra merda",
    array: ["Varias merdas", "1", "2"]
  });
});

app.use('/api/auth/', authRouter());
app.use('/api/resources/', resourceRouter());
app.use('/api/users/', userRouter());

io.set('origins', '*:*');
io.use(function(socket, next) {
  var token = socket.request._query.token;
  checkToken(token, function(err, user){
    if (err || !user) {
      next(new Error("not authorized"));
    }
    console.log(token);
    socket.user = user;
    next();
  });
});

io.on('connection', function(socket){
  console.log('a gateway connected');
  //TODO(Hudo): Use Socket .join instead of array
  socket.join(String(socket.user._id));

  io.to(String(socket.user._id)).emit("discovery");

  socket.on("discovery response", function(resource) {
    console.log("New device " + resource.id);
    io.to(String(socket.user._id)).emit("discovery response", resource);
    socket.emit("get", {identifier: resource.id});
  });

  socket.on("get response", function(getResponse) {
    console.log("Get response");
    io.to(String(socket.user._id)).emit("get response", getResponse);
    ResourceController.registerResource(socket.user._id, getResponse)
      .then(() => {
        console.log(getResponse.identifier + " registered successfuly");
      }, (reason) => {
        console.log("Failed to register resource: " + getResponse.identifier);
        console.log(reason);
      });
  });

  socket.on("disconnect", function() {
    ResourceController.deregisterAllResources(socket.user._id)
      .then(() => {
        console.log("Deregistered all resources successfuly.");
      }, (reason) => {
        console.log("Failed to deregister all resources.");
      });
  });

});

//Server ========================================================= 
http.listen(port, function() {
    console.log('Listenning on port: ' + port);
});

export default io;
