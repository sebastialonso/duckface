var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Instagram = require('instagram-node-lib');
var winston = require('winston');
var config = require('config');

//Winston setting
winston.add(winston.transports.File, { filename: 'duckface.log'});
winston.remove(winston.transports.Console);

//Instagram setting
Instagram.set('client_id', config.get('clientId'));
Instagram.set('client_secret', config.get('clientSecret'));
Instagram.set('callback_url', config.get('callback'));
winston.debug('client_id:' + config.get('clientId'));
winston.debug('client_secret:' + config.get('clientSecret'));
winston.debug('callback:' + config.get('callback'));

app.get('/', function(req, res){
  res.sendfile('index.html');
});

app.post('/callback', function(req, res){
  io.emit('callback reached', req.body);
  res.end();
});

io.on('connection', function(socket){
  winston.info('Connected');
  io.emit('connected');
  Instagram.tags.info({
    name: 'lollapalooza',
    complete: function(data){
      io.emit('tag data', data);
      winston.info('Tag data successfully returned');
    },
    error: function(errorMessage, errorObject, caller){
      winston.error('Couldnt get tag data');
      winston.error(errorMessage)
      winston.error(errorObject);
      winston.error(caller);
    }
  });

  
  //Desconectar
  io.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});