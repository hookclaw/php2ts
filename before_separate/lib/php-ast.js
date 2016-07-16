"use strict";
var net = require('net');
var async = require('async');
var child_process = require('child_process');
var MIN_PORT = 10000;
var MAX_PORT = 60000;
var phpAst = (function () {
    function phpAst() {
    }
    phpAst.host = '127.0.0.1';
    phpAst.port = MIN_PORT;
    phpAst.childAlive = false;
    phpAst.child = null;
    phpAst.phpCommand = 'php';
    phpAst.serverFolder = './lib/php-ast';
    phpAst.serverName = 'server.php';
    phpAst.initialize = function (callback) {
        var cb = function () { };
        if (callback !== undefined) {
            cb = callback;
        }
        phpAst.spawn(cb);
    };
    phpAst.stopServer = function () {
        phpAst.stop();
    };
    phpAst.getConstants = function (callback) {
        async.waterfall([
            phpAst.spawn,
            async.apply(phpAst.exec, 'getConstants', '')
        ], callback);
    };
    phpAst.parse = function (code, callback) {
        async.waterfall([
            phpAst.spawn,
            async.apply(phpAst.exec, 'parse', code)
        ], callback);
    };
    phpAst.spawn = function (callback) {
        try {
            if (phpAst.childAlive) {
                callback(null, true);
                return;
            }
            if (phpAst.child != null) {
                if (phpAst.child.connected) {
                    phpAst.child.kill();
                }
                phpAst.child = null;
            }
            var report_1 = function (txt, output) {
                if (txt === undefined || txt == null) {
                    return;
                }
                var c = console.log;
                var msg = 'stdout';
                var hdr = 'OUT > ';
                if (output == 2) {
                    c = console.error;
                    msg = 'stderr';
                    hdr = 'ERR > ';
                }
                c('ast-server:' + msg);
                var lines = txt.split("\n");
                for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                    var t = lines_1[_i];
                    c(hdr + t);
                }
            };
            async.waterfall([
                async.apply(phpAst.empty_port, phpAst.port),
                function (port, callback) {
                    try {
                        phpAst.port = port;
                        var args = [phpAst.serverName, port.toString()];
                        var options = { cwd: phpAst.serverFolder };
                        phpAst.child = child_process.spawn(phpAst.phpCommand, args, options);
                        phpAst.child.stdout.on('data', function (data) {
                            phpAst.childAlive = true;
                            report_1(data.toString(), 1);
                        });
                        phpAst.child.stderr.on('data', function (data) {
                            report_1(data.toString(), 2);
                        });
                        phpAst.child.on('close', function (code) {
                            console.error("child process exited with code " + code);
                            phpAst.childAlive = false;
                        });
                        var waitingCount_1 = 100;
                        var waitingLoop_1 = function () {
                            if (phpAst.childAlive) {
                                callback(null, phpAst.childAlive);
                            }
                            else {
                                if (--waitingCount_1 < 0) {
                                    callback(null, phpAst.childAlive);
                                }
                                else {
                                    setTimeout(waitingLoop_1, 100);
                                }
                            }
                        };
                        setTimeout(waitingLoop_1, 100);
                    }
                    catch (e) {
                        callback(e, false);
                    }
                }
            ], callback);
        }
        catch (e) {
            callback(e, false);
        }
    };
    phpAst.empty_port = function (startPort, callback) {
        try {
            var socket_1 = new net.Socket();
            var server = net.createServer();
            var address_1 = phpAst.host;
            var port_1 = startPort - 1;
            var challenge_1 = function () {
                if (++port_1 > MAX_PORT) {
                    port_1 = MIN_PORT;
                }
                console.log('empty_port:try ' + port_1);
                socket_1.connect(port_1, address_1, function () {
                    socket_1.end();
                    socket_1.destroy();
                    challenge_1();
                });
            };
            socket_1.on('error', function (e) {
                try {
                    callback(null, port_1);
                }
                catch (e) {
                    challenge_1();
                }
                ;
            });
            challenge_1();
        }
        catch (e) {
            callback(e, -1);
        }
    };
    phpAst.exec = function (cmd, body, childAlive, callback) {
        if (!childAlive) {
            console.log('Child process がいない');
            var result = {
                status: false,
                message: 'Child process がいない'
            };
            callback(null, result);
            return;
        }
        var options = { host: phpAst.host, port: phpAst.port };
        var client = net.connect(options);
        var msg = '';
        client.on('error', function (err) {
            console.log('Connection Failed - ' + phpAst.host + ':' + phpAst.port);
            console.dir(err);
            msg = JSON.stringify({ parse_status: false, parse_message: 'Communication error(1)', parse_error: err });
            client.end();
        });
        client.on('connect', function () {
            try {
                console.log('Connected - ' + phpAst.host + ':' + phpAst.port);
                var len = Buffer.byteLength(body, 'utf8');
                process.stdout.write('[S]' + cmd + "\n");
                client.write(cmd + "\n");
                process.stdout.write('[S]' + len + "\n");
                client.write(len + "\n");
                if (len > 0) {
                    client.write(body);
                }
            }
            catch (e) {
                console.error(e);
                msg = JSON.stringify({ parse_status: false, parse_message: 'Communication error(2)', parse_exception: e });
                client.end();
            }
        });
        client.on('data', function (chunk) {
            msg += chunk;
        });
        client.on('end', function () {
            console.log('Connetion End - ' + phpAst.host + ':' + phpAst.port);
        });
        client.on('close', function (had_error) {
            console.log('Client Closed');
            var result = {
                status: (!had_error),
                message: '',
                body: JSON.parse(msg)
            };
            callback(null, result);
        });
    };
    phpAst.stop = function () {
        var options = { host: phpAst.host, port: phpAst.port };
        var client = net.connect(options);
        var msg = '';
        client.on('error', function (err) {
            console.log('Connection Failed - ' + phpAst.host + ':' + phpAst.port);
            console.dir(err);
            msg = JSON.stringify({ parse_status: false, parse_message: 'Communication error(1)', parse_error: err });
            client.end();
        });
        client.on('connect', function () {
            try {
                var cmd = 'stop';
                console.log('Connected - ' + phpAst.host + ':' + phpAst.port);
                process.stdout.write('[S]' + cmd + "\n");
                client.write(cmd + "\n");
            }
            catch (e) {
                console.error(e);
                client.end();
            }
        });
        client.on('end', function () {
            console.log('Connetion End - ' + phpAst.host + ':' + phpAst.port);
        });
        client.on('close', function (had_error) {
            console.log('Client Closed');
        });
    };
    return phpAst;
}());
exports.phpAst = phpAst;
//# sourceMappingURL=php-ast.js.map