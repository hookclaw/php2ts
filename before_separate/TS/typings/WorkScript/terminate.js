let child_process = require('child_process');
let net = require('net');
let async = require('async');
let f = () => {console.log(0);};
setTimeout(f,0);
async.waterfall([],f);

//let socket = new net.Socket();
//socket.connect(10000, '127.0.0.1', () => {
//	socket.write('stop\n');
//	setTimeout(f,3000);
//    //socket.end();
//    //socket.destroy();
//});
//socket.on('error', (e) => {
//	console.dir(e);
//});
//socket.on('end', (e) => {
//	console.log('end');
//});

let child = child_process.spawn('php',['-v'],{});
