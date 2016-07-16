<?php
error_reporting(E_ALL);

/* Allow the script to hang around waiting for connections. */
set_time_limit(0);

/* Turn on implicit output flushing so we see what we're getting
 * as it comes in. */
ob_implicit_flush();

function server() {
	$address = '127.0.0.1';
	$port = 10000;

	if (($sock = socket_create(AF_INET, SOCK_STREAM, SOL_TCP)) === false) {
	    echo "socket_create() failed: reason: " . socket_strerror(socket_last_error()) . PHP_EOL;
	    exit;
	}

	if (socket_bind($sock, $address, $port) === false) {
	    echo "socket_bind() failed: reason: " . socket_strerror(socket_last_error($sock)) . PHP_EOL;
	    exit;
	}

	if (socket_listen($sock, 5) === false) {
	    echo "socket_listen() failed: reason: " . socket_strerror(socket_last_error($sock)) . PHP_EOL;
	    exit;
	}

	do {
	    if (($msgsock = socket_accept($sock)) === false) {
	        echo "socket_accept() failed: reason: " . socket_strerror(socket_last_error($sock)) . PHP_EOL;
	        break;
	    }
	    echo "accept:".$msgsock.PHP_EOL;
	    
        if (false === ($request = read($msgsock))) {
		    echo "close:".PHP_EOL;
		    socket_close($msgsock);
        	continue;
            //break;
        }
        var_dump($request);
        
        $talkback = response("PHP: You said '".$request['body']."'.");
        echo "write:".PHP_EOL;
        socket_write($msgsock, $talkback, strlen($talkback));
	    echo "close:".PHP_EOL;
	    socket_close($msgsock);
	} while (true);

	socket_close($sock);
}

function read($msgsock){
	$headers = array();
	$body = "";
	$l = 0;
	$pre_eol = "";
	$tmp = "";
	$crlf = false;
	$contentlength = 0;
	socket_set_nonblock($msgsock);
	while(false !== ($buf = socket_read($msgsock, 2048, PHP_NORMAL_READ))) {
		if($buf == ""){
			echo "readend:".PHP_EOL;
			break;
		}
		$len = strlen($buf);
		$eol = substr($buf,$len -1,1);
		echo ++$l.':'.substr($buf,0,$len - 1).PHP_EOL;
		if($eol != "\r" && $eol != "\n"){
			$tmp = $buf;
			continue;
		}
		if($pre_eol != "" && $eol != $pre_eol){
			$pre_eol = "";
			$crlf = true;
			continue;
		}
		$pre_eol = $eol;
		if( $len > 1 || $tmp != "") {
			//TODO
			$s = $tmp.substr($buf,0,$len - 1);
			$headers[] = $s;
			if('Content-Length:' == substr($s,0,15)){
				$contentlength = intval(trim(substr($s,15)),10);
			}
			$tmp = "";
		} else {
			if($crlf){
				$dummy = socket_read($msgsock, 1);
			}
			// content
			while($contentlength > 0) {
				$readlen = ($contentlength > 2048)?2048:$contentlength;
				//echo $contentlength.":".$readlen.PHP_EOL;
				if(false === ($buf = socket_read($msgsock, $readlen))){
					break;
				}
				if($buf == ""){
					echo "readend2:".PHP_EOL;
					break 2;
				}
				$body .= $buf;
				$contentlength -= strlen($buf);
			}
			break;
		}
	}
	if($buf === false){
        echo "socket_read() failed: reason: " . socket_strerror(socket_last_error($msgsock)) . PHP_EOL;
		return false;
	}
	if($buf == ""){
		return false;
	}
	
	$request = [
		'headers'    => $headers,
		'body'       => $body,
		'bodylength' => strlen($body)
	];
	return $request;
}

function response($body){
	$response = "HTTP/1.1 200 OK\r\n";
	$response .= "Server: php-ast\r\n";
	$response .= "Access-Control-Allow-Origin: *\r\n";
	$response .= "Content-Type: text/html; charset=UTF-8\r\n";
	//$response .= "Content-Length: ".strlen($body)."\r\n";
	$response .= "Connection: close\r\n";
	$response .= "\r\n" . $body;
	return $response;
}

server();
