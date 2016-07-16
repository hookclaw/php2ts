/// <reference path="../typings/main.d.ts" />;
import net = require('net');
import async = require('async');
import child_process = require('child_process');

export type ResultArray = {status:boolean, message:string, body?:any};

const MIN_PORT = 10000;
const MAX_PORT = 60000;

export class phpAst {
    public static host:string = '127.0.0.1';
    public static port:number = MIN_PORT;
    public static childAlive:boolean = false;
    public static child:child_process.ChildProcess = null;
    public static phpCommand:string = 'php';
    public static serverFolder:string = '../php-server';
    public static serverName:string = 'server.php';
    
    public static initialize = (callback?:AsyncResultCallback<any>):void => {
        let cb:AsyncResultCallback<any> = ()=>{};
        if(callback !== undefined) {
            cb = callback;
        }
        phpAst.spawn(cb);
    }
    
    public static stopServer = () => {
        phpAst.stop();
    }
    
    /**
      * out prm (err,result)
      */
    public static getConstants = (callback:AsyncResultCallback<ResultArray>):void => {
        async.waterfall( [
            phpAst.spawn,
            async.apply(phpAst.exec,'getConstants','')
        ], callback );
    };
    
    /**
      * in  prm (code:string)
      * out prm (err,result)
      */
    public static parse = (code:string, callback:AsyncResultCallback<ResultArray>):void => {
        async.waterfall( [
            phpAst.spawn,
            async.apply(phpAst.exec,'parse',code)
        ], callback );
    };
    
    /**
      * out prm (childAlive:boolean)
      */
    private static spawn = (callback:AsyncResultCallback<boolean>):void => {
        try {
            if (phpAst.childAlive) {
                callback(null,true);
                return;
            }
            if(phpAst.child != null){
                if(phpAst.child.connected){
                    phpAst.child.kill();
                }
                phpAst.child = null;
            }
            let report = (txt:string,output:number):void => {
                if(txt === undefined || txt == null) {
                    return;
                }
                let c = console.log;
                let msg = 'stdout';
                let hdr = 'OUT > ';
                if(output == 2) {
                    c = console.error;
                    msg = 'stderr';
                    hdr = 'ERR > ';
                }
                c('ast-server:' + msg);
                let lines = txt.split("\n");
                for(let t of lines) {
                    c(hdr + t);
                }
            };
            async.waterfall(
                [
                    async.apply(phpAst.empty_port,phpAst.port),
                    (port:number,callback:AsyncResultCallback<boolean>) => {
                        try {
                            phpAst.port = port;
                            let args:string[] = [phpAst.serverName,port.toString()];
                            let options = {cwd:phpAst.serverFolder};
                            phpAst.child = child_process.spawn(phpAst.phpCommand,args,options);
                            phpAst.child.stdout.on('data', (data:Buffer) => {
                                phpAst.childAlive = true;
                                report(data.toString(),1);
                            });
                            phpAst.child.stderr.on('data', (data:Buffer) => {
                                report(data.toString(),2);
                            });
                            phpAst.child.on('close', (code:number) => {
                                console.error(`child process exited with code ${code}`);
                                phpAst.childAlive = false;
                            });
                            let waitingCount = 100;
                            let waitingLoop = () => {
                                if(phpAst.childAlive) {
                                    callback(null,phpAst.childAlive);
                                } else {
                                    if(--waitingCount < 0) {
                                        callback(null,phpAst.childAlive);
                                    } else {
                                        setTimeout(waitingLoop,100);
                                    }
                                }
                            };
                            setTimeout(waitingLoop,100);
                        } catch(e) {
                            callback(e,false);
                        }
                    }
                ],
                callback
            );
        } catch(e) {
            callback(e,false);
        }
    };
    
    /**
      * in  prm (port:number)
      * out prm (port:number)
      */
    private static empty_port = (startPort:number,callback:AsyncResultCallback<number>):void => {
        try {
            let socket = new net.Socket();
            let server = net.createServer();
            let address = phpAst.host;
            let port = startPort - 1;
            let challenge = () => {
                if (++port > MAX_PORT) {
                    port = MIN_PORT;
                }
                console.log('empty_port:try ' + port);
                socket.connect(port, address, () => {
                    socket.end();
                    socket.destroy();
                    challenge();
                });
            };
            socket.on('error', (e:NodeJS.ErrnoException) => {
                try {
                    //TODO listen状態が開放されないので、とりあえずコメントアウト
                    //server.listen(port, address);
                    //server.close();
                    //server.unref();
                    callback(null,port);
                } catch(e) {
                    challenge();
                };
            });
            challenge();
        } catch (e) {
            callback(e,-1);
        }
    };
    
    /**
      * in  prm (body:string)
      * in  prm (childAlive:boolean)
      * out prm (result:AsyncResultCallback<ResultArray>)
      */
    private static exec = (cmd:string,body:string,childAlive:boolean,callback:AsyncResultCallback<ResultArray>) => {
        if(!childAlive){
            console.log('Child process がいない');
            let result:ResultArray = {
                status: false,
                message: 'Child process がいない'
            }
            callback(null,result);
            return;
        }
        let options = {host:phpAst.host,port:phpAst.port}
        let client = net.connect(options);
        let msg = '';
        
        client.on('error', (err:Error) => {
            //エラーが発生した場合に生成されます。'close' イベントはこのイベントの後に直接呼び出されます。
            //ただし、サーバーとの接続が切れた場合、'close' イベントが先行する場合もある。
            console.log('Connection Failed - ' + phpAst.host + ':' + phpAst.port);
            console.dir(err);
            msg = JSON.stringify({parse_status:false, parse_message:'Communication error(1)', parse_error:err});
            client.end();
        });

        client.on('connect', () => {
            try {
                console.log('Connected - ' + phpAst.host + ':' + phpAst.port);
                let len = Buffer.byteLength(body, 'utf8');
                process.stdout.write('[S]' + cmd + "\n");
                client.write(cmd + "\n");
                process.stdout.write('[S]' + len + "\n");
                client.write(len + "\n");
                if(len > 0) {
                    //process.stdout.write('[S]' + body + "\n");
                    // net.socket.write(data[,encoding][,callback])
                    // The second parameter specifies the encoding in the case of a string--it defaults to UTF8 encoding.
                    client.write(body);
                }
            } catch(e) {
                console.error(e);
                msg = JSON.stringify({parse_status:false, parse_message:'Communication error(2)',parse_exception:e});
                client.end();
            }
        });

        client.on('data', (chunk:Buffer) => {
            //console.log('receive : ' + chunk.length);
            //console.log(chunk.toString());
            msg += chunk;
        });

        client.on('end', () => {
            console.log('Connetion End - ' + phpAst.host + ':' + phpAst.port);
        });

        client.on('close', (had_error:boolean) => {
            console.log('Client Closed');
            let result:ResultArray = {
                status: (!had_error),
                message: '',
                body : JSON.parse(msg)
            };
            callback(null,result);
        });
    };
    private static stop = () => {
        let options = {host:phpAst.host,port:phpAst.port}
        let client = net.connect(options);
        let msg = '';
        
        client.on('error', (err:Error) => {
            //エラーが発生した場合に生成されます。'close' イベントはこのイベントの後に直接呼び出されます。
            //ただし、サーバーとの接続が切れた場合、'close' イベントが先行する場合もある。
            console.log('Connection Failed - ' + phpAst.host + ':' + phpAst.port);
            console.dir(err);
            msg = JSON.stringify({parse_status:false, parse_message:'Communication error(1)', parse_error:err});
            client.end();
        });

        client.on('connect', () => {
            try {
                let cmd = 'stop';
                console.log('Connected - ' + phpAst.host + ':' + phpAst.port);
                process.stdout.write('[S]' + cmd + "\n");
                client.write(cmd + "\n");
            } catch(e) {
                console.error(e);
                client.end();
            }
        });

        client.on('end', () => {
            console.log('Connetion End - ' + phpAst.host + ':' + phpAst.port);
        });

        client.on('close', (had_error:boolean) => {
            console.log('Client Closed');
        });
    };
}
