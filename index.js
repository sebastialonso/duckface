var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Instagram = require('instagram-node-lib');

// var clientID = '69ab5b749fa34effb61d546762bf2c02',
//     clientSecret = 'd32dba127b4a424a8c093ce08e7c282b';

Instagram.set('client_id', process.env.INSTA_CLIENT_ID);
Instagram.set('client_secret', process.env.INSTA_CLIENT_SECRET);
Instagram.set('callback_url', process.env.INSTA_CALLBACK);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

app.post('/callback', function(req, res){
  io.emit('callback reached', req.body);
  res.end();
});

io.on('connection', function(socket){
  Instagram.tags.info({
    name: 'lollapalooza',
    complete: function(data){
      io.emit('tag data', data);
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