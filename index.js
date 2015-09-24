var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var Instagram = require('instagram-node-lib');
var winston = require('winston');
var config = require('config');
var limit = 2;

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
 * with the tag "hashtag" instachile
 * @type {String}
 */
Instagram.subscriptions.subscribe({
  object: 'tag',
  object_id: 'instachile',
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
  winston.info(req.query);
  var handshake =  Instagram.subscriptions.handshake(req, res);
  console.log(req.query);
  winston.log('info', req.query["hub.challenge"]);
  //res.send(req.query["hub.challenge"]);
});


app.post('/callback', function(req, res){
  if (limit == 0) {
    limit = 2;
    var data = req.body;
    winston.info(data);
    
    Instagram.tags.recent({
      name: 'instachile',
      count: 2,
      complete: function(data) {
        io.emit('tag limit reached', data);
      },
      error: function(data){
        winston.error("Algo sucedio")
        winston.error(errorMessage)
        winston.error(errorObject);
        winston.error(caller);
      }
    })
    
    res.end();
  } else{
    limit -= 1;
  };
});

io.on('connection', function(socket){
  socket.setMaxListeners(10);
  winston.info('Connected');
  io.emit('connected');
  Instagram.tags.recent({
    name: 'instachile',
    count: 5,
    complete: function(data){
      io.emit('tag data', data);
      winston.info('#instachile pics returned successfully');
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