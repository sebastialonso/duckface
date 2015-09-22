var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var Instagram = require('instagram-node-lib');
var winston = require('winston');
var config = require('config');


app.use(bodyParser.json()); // for parsing application/json

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

/**
 * Uses the library "instagram-node-lib" to Subscribe to the Instagram API Real Time
 * with the tag "hashtag" lollapalooza2013
 * @type {String}
 */
Instagram.subscriptions.subscribe({
  object: 'tag',
  object_id: 'lollapalooza2013',
  aspect: 'media',
  type: 'subscription',
  id: '#'
});

app.get('/', function(req, res){
  res.sendfile('index.html');
});

/**
 * Needed to receive the handshake
 */
app.get('/callback', function(req, res){
  winston.info("Callback GET detected");
  winston.info(req.body);
  var handshake =  Instagram.subscriptions.handshake(req, res);
});

app.post('/callback', function(req, res){
  var data = req.body;
  winston.info(data);
  // Grab the hashtag "tag.object_id"
  // concatenate to the url and send as a argument to the client side
  data.forEach(function(tag) {
    var url = 'https://api.instagram.com/v1/tags/' + tag.object_id + '/media/recent?client_id='+config.get('clientId');
    io.emit('callback detected', url );
  });
  
  res.end();
});

io.on('connection', function(socket){
  socket.setMaxListeners(10);
  winston.info('Connected');
  io.emit('connected');
  Instagram.tags.recent({
    name: 'holamundo',
    complete: function(data){
      io.emit('tag data', data);
      winston.info('#holamundo pics returned successfully');
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