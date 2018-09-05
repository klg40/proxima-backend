var express = require('express');
var app = express();
const WebSocket = require('ws');
const wss = new WebSocket.Server({
  port: 8081,
  perMessageDeflate: {
    zlibDeflateOptions: { // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 30,
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    clientMaxWindowBits: 10,       // Defaults to negotiated value.
    serverMaxWindowBits: 10,       // Defaults to negotiated value.
    // Below options specified as default values.
    concurrencyLimit: 10,          // Limits zlib concurrency for perf.
    threshold: 1024,               // Size (in bytes) below which messages
                                   // should not be compressed.
  }
});

var client = [];
var key = [];

app.get('/test', function (req, res) {
  res.send('TEST MESSAGE!');
});

app.listen(3000, function () {
  console.log('Сервер запущен! Порт 3000');
});

wss.on('connection', function (ws) {
  const id = generateID();
  var clientConnect = 0;
  var req;
  client[id] = ws;
  key.push({
    id : id,
    principal : null,
    password : null,
  });

  client[id].send(JSON.stringify(['confirm', id]));

  client[id].on('message', function (data) {
    req = JSON.parse(data);
    var type = req.type;
    switch ( type ) {
      case 'newpass' : NewPass(); break;
      case 'connect' : Connect( req.pass ); break;
      case 'coords' : Coords( req.coords ); break;
      case 'click' : ClickElement( req.coordsElement ); break;
      case 'clientWidth' : ClientWidth( req.value, id ); break;
      case 'scroll' : ScrollWindow( req.value ); break;
    }
    // client[id].send(JSON.stringify(['info', key]));
  });

  function NewPass() {
    key.forEach( 
      item => { 
        item.id == id ? item.password = req.pass : false 
      }
    )
  }

  function ClickElement( coordsElement ) {
    client[clientConnect].send(JSON.stringify(['click', coordsElement]))
  }

  function Connect( pass ) {
    key.forEach( item => {
      if ( item.password == pass ) {
        client[id].send(JSON.stringify(['success',item.id]));
        clientConnect = item.id;
        item.principal = id;
        console.log(key)
      }
    })
  }

  function ClientWidth( clientWidth, id ) {
    let principal;
    key.forEach( item => {
      item.id == id ? principal = item.principal : false;
    });
    client[principal].send(JSON.stringify(['clientWidth', clientWidth]))
  }

  function ScrollWindow( sizeScroll ){
    client[clientConnect].send(JSON.stringify(['scroll', sizeScroll]))
  }

  function Coords( coords ) {
    client[clientConnect].send(JSON.stringify(['coords', coords]))
  }

  function generateID() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4()
  }
})

