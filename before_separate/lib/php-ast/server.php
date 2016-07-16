<?php

error_reporting(E_ALL);

/* Allow the script to hang around waiting for connections. */
set_time_limit(0);

/* 自動フラッシュをオンにする */
ob_implicit_flush(true);

require __DIR__ . "/official_util.php";

server();
exit; // 異常終了

function server() {
    $address = '127.0.0.1';
    $port = 10000;
    if($_SERVER["argc"] > 1){
        $v = $_SERVER["argv"][1];
        if(is_numeric($v)){
            $port = +$v;
        }
    }

    if (($sock = socket_create(AF_INET, SOCK_STREAM, SOL_TCP)) === false) {
        fwrite(STDERR, "socket_create() failed: reason: " . socket_strerror(socket_last_error()) . PHP_EOL);
        exit;
    }

    if (socket_bind($sock, $address, $port) === false) {
        fwrite(STDERR, "socket_bind() failed: reason: " . socket_strerror(socket_last_error($sock)) . PHP_EOL);
        exit;
    }

    if (socket_listen($sock, 5) === false) {
        fwrite(STDERR, "socket_listen() failed: reason: " . socket_strerror(socket_last_error($sock)) . PHP_EOL);
        exit;
    }
    
    error_reporting(E_ALL);

    echo "Server start. " , $address , ":" , $port ,PHP_EOL;
    
    do {
        if (($msgsock = socket_accept($sock)) === false) {
            fwrite(STDERR, "socket_accept() failed: reason: " . socket_strerror(socket_last_error($sock)) . PHP_EOL);
            break;
        }
        echo "accept:",$msgsock,PHP_EOL;
        $request = read($msgsock);
        if ($request === true) {
            break;
        }
        if ($request === false) {
            write($msgsock,responseError('read error.'));
            echo "close:",PHP_EOL;
            socket_close($msgsock);
            continue;
        }
        
        cmdProcess($msgsock,$request);
        
        echo "close:",PHP_EOL;
        socket_close($msgsock);
    } while (true);

    socket_close($sock);
}

function read($msgsock){
    socket_set_nonblock($msgsock);
    $header = array();
    $cmd = socket_read($msgsock, 2048, PHP_NORMAL_READ);
    if($cmd == false){
        return false;
    }
    $cmd = substr($cmd,0,strlen($cmd)-1);
    if($cmd == 'stop') {
        return true;
    }
    $header['cmd'] = $cmd;
    $length = socket_read($msgsock, 2048, PHP_NORMAL_READ);
    if($length == false){
        return false;
    }
    $length = substr($length,0,strlen($length)-1);
    $header['length'] = $length;
    echo "read:",$cmd,"/",$length,PHP_EOL;
    $body = "";
    $length = intval(trim($length));
    $buf = "";
    // content
    while($length > 0){
        //echo $length,PHP_EOL;
        $len = ($length>2048)?2048:$length;
        $buf = socket_read($msgsock, $len, PHP_NORMAL_READ);
        if($buf === false) {
            break;
        }
        //echo "read:",strlen($buf),PHP_EOL;
        if($buf == "") {
            break;
        }
        $body .= $buf;
        $length -= strlen($buf);
    }
    if($buf === false){
        return false;
    }
    echo "read ok.",PHP_EOL;
    
    $request = [
        'header' => $header,
        'body'   => $body
    ];
    return $request;
}

function cmdProcess($msgsock,$request){
    switch($request['header']['cmd']){
        case 'getConstants':
            cmdGetConstants($msgsock);
            return;
        case 'parse':
            cmdParse($msgsock,$request['body']);
            return;
    }
    write($msgsock, responseError('unknown command.'));
}

function cmdGetConstants($msgsock){
    try {
        $constants = getConstants();
        write($msgsock, responseNormal([
            'constants'=>$constants
        ]));
    } catch (Exception $ex) {
        write($msgsock, responseError($ex->message));
    }
}

function getConstants(){
    $constants = array();
    $constants['flags'] = array();
    $constants['kinds'] = array();
    foreach(get_defined_constants(true)['ast'] as $name=>$number){
        if(substr($name,0,10) == 'ast\\flags\\'){
            $constants['flags'][substr($name,10)] = $number;
        }else{
            $constants['kinds'][substr($name,4)] = $number;
        }
    }
    return $constants;
}

function cmdParse($msgsock,$code){
    try {
        $ast = ast\parse_code($code, $version=30, "");
        $comments = getComments($code);
        write($msgsock, responseNormal([
            'comments'=>$comments,
            'ast'=>$ast,
            'ast_dump'=>ast_dump($ast)
        ]));
    } catch (ParseError $err) {
        $msg = $err->getMessage() . " on line " . $err->getLine();
        write($msgsock, responseError($msg));
    } catch (Exception $ex) {
        write($msgsock, responseError($ex->message));
    }
}

function getComments($code){
    static $number = -1;
    if($number == -1){
        $tokens = token_get_all('<?php //',TOKEN_PARSE);
        foreach($tokens as $token){
            if($token[1] == '//'){
                $number = $token[0];
                break;
            }
        }
    }
    $tokens = token_get_all($code,TOKEN_PARSE);
    $comments = array();
    foreach($tokens as $token) {
        if($token[0] == $number) {
            if(!array_key_exists($token[2],$comments)){
                $comments[$token[2]] = '';
            }
            $comments[$token[2]] .= $token[1];
        }
    }
    return $comments;
}

function responseNormal($res){
    $res['parse_status'] = true;
    $res['parse_message'] = '';
    return json_encode($res);
}

function responseError($message){
    return json_encode(['parse_status'=>false,'parse_message'=>$message]);
}

function write($msgsock,$response){
    $len = strlen($response);
    echo "write:",$len,PHP_EOL;
    //var_dump($response);
    return socket_write($msgsock, $response, $len);
}
