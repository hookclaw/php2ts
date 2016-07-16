/// <reference path="./browser.d.ts" />;
/// <reference path="./TypeScriptFormat.ts" />;
/// <reference path="./TypeScriptServices.1.8.10.d.ts" />;
function setup_select() {
    var selectbox = <HTMLSelectElement>document.getElementById("examples");
    var textarea = <HTMLTextAreaElement>document.getElementById("code");
    get_phpfiles(function(ok,files){
        if (ok) {
            for(var idx in files) {
                var file = files[idx];
                var opt = <HTMLOptionElement>document.createElement('option');
                opt.value = file;
                opt.text = file;
                selectbox.add(opt);
            }
        }
    });
    var run = function(e){
        if (e.target.value != "") {
            get_phpfile(e.target.value, function(ok,code){
                if (ok) {
                    textarea.value = code;
                }
            });
        }
    }
    selectbox.addEventListener("change", run, false);
}

function setup_translate() {
    var content = <HTMLTextAreaElement>document.getElementById("code"),
    result = <HTMLElement>document.getElementById("result"),
    // ast_dump = <HTMLElement>document.getElementById("ast_dump"),
    php_code = <HTMLElement>document.getElementById("php_code"),
    ts_code = <HTMLElement>document.getElementById("ts_code"),
    // js_code = <HTMLElement>document.getElementById("js_code"),
    transpile_result = <HTMLElement>document.getElementById("transpile_result"),
    loc = window.location,
    run = function(e){
        try {
            if ( e !== undefined ){
                e.preventDefault();
            }

            result.innerHTML = "parsing...";
            // ast_dump.innerHTML = "";
            php_code.innerHTML = content.value.replace(/</g,"&lt;").replace(/>/g,"&gt;");
            ts_code.innerHTML = "";
            // js_code.innerHTML = "";
            transpile_result.innerHTML = "";

            var ret:any = {};
            ret.path = loc.pathname;
            ret.php_code = content.value.replace(/\n/g,"\r\n");

            php2ts( ret.php_code, function(ok,rett){
                $.extend(ret,rett); //jquery
                console.log( ret );

                result.innerHTML = ret.message.replace(/</g,"&lt;").replace(/>/g,"&gt;");
                if(ok){
                    // ast_dump.innerHTML = ret.ast_dump.replace(/</g,"&lt;").replace(/>/g,"&gt;");
                    transpile_result.innerText = decolate_transpilecode(ret.formated_code,ret.transpile.diagnostics,ts_code);
                    // js_code.innerText = ret.transpile_result;
                }
                $('.prettyprinted').removeClass('prettyprinted'); //jquery
                PR.prettyPrint();
            });
        } catch(err) {
            console.log(err);
            result.innerHTML = "System error\n" + err.message;
        }
    };
    document.getElementById("run").addEventListener("click", run, false);
}

function php2ts(code, callback) {
    compile_phpfile( code, function(ok, compile_result){
        var ret:any = {};
        ret.message = 'Success';
        if(!ok){
            ret.message = "Communication error: ";
            return callback(false,ret);
        }
        $.extend(ret,compile_result); //jquery
        if(!ret.parse_status){
            ret.message = ret.parse_message;
            return callback(false,ret);
        }
        try {
            let compilerOptions:ts.CompilerOptions = {diagnostics:true,allowUnusedLabels:false};
            let formatResult = formatTypeScriptCode(ret.compile_result, '', bufferedReadFileSyncTS, compilerOptions);
            ret.transpile_result = formatResult.transpile_result;
            ret.formated_code = formatResult.formated_code;
            ret.transpile = {};
            ret.transpile.diagnostics = formatResult.ts_diag1;
            $.extend(ret.transpile.diagnostics,formatResult.ts_diag2); //jquery
            ret.ts_diag1 = formatResult.ts_diag1;
            ret.ts_diag2 = formatResult.ts_diag2;
        } catch( err ) {
            ret.message = "Format error: " + err.message;
            ret.format_error = err;
            return callback(false,ret);
        }
        return callback(true,ret);
    });
}

function decolate_transpilecode(src,diag,element) {
    element.innerHTML = '';
    if(diag.length == 0) {
        element.appendChild(document.createTextNode(src));
        return '';
    }
    //startで昇順ソート
    diag.sort(function(a,b){
        return a.start - b.start;
    });
    //行単位の診断情報を作成
    var errors = {};
    var messages = '';
    for(var i in diag){
        var d = diag[i];
        if(errors[d.line] === undefined){
            errors[d.line] = '';
        }
        var col = d.character + 1;
        var message1 = 'line ' + (d.line + 1) + ' character ' + col + ' code:' + d.code;
        var message2 = d.messageText + "\n";
        errors[d.line] += message1 + "\n" + message2;
        messages += message1 + " " + message2;
    }
    //行単位の処理
    var srces = src.split("\n");
    var nodes = [];
    var txt = '';
    for(var i in srces){
        var src = srces[i];
        if(errors[i] === undefined){
            txt += src + "\n";
        }else{
            if(txt != ''){
                var textnode = document.createTextNode(txt);
                nodes.push(textnode);
                txt = '';
            }
            var textnode = document.createTextNode(src);
            var snode = document.createElement('span');
            snode.appendChild(textnode);
            snode.className = 'ErrorLine';
            hover(snode,errors[i]);
            nodes.push(snode);
            nodes.push(document.createTextNode('\n'));
        }
    }
    if(txt != ''){
        var textnode = document.createTextNode(txt);
        nodes.push(textnode);
    }
    for(var i in nodes) {
        element.appendChild(nodes[i]);
    }
    return messages;
}

function hover(element,message) {
    var tooltip = document.createElement('pre');
    tooltip.className = 'ErrorToolTip';
    tooltip.innerText = message;
    document.body.appendChild(tooltip);
    tooltip.style.position = 'absolute';
    tooltip.style.visibility = 'hidden';
    element.onmouseover = (evt) => {
		//var left = window.pageXOffset || document.documentElement.scrollLeft;
		//var top = window.pageYOffset || document.documentElement.scrollTop;
		//var x = evt.offsetX || evt.layerX;
		//var y = evt.offsetY || evt.layerY;
		//chrome:pageX,pageY
        tooltip.style.left = evt.pageX + 'px';
        tooltip.style.top = evt.pageY + 'px';
        tooltip.style.visibility = 'visible';
    }
    element.onmouseout = (evt) => {
        tooltip.style.visibility = 'hidden';
    }
}

function get_phpfiles(callback) {
    request_send('GET','/php2ts/phpfiles',{},true,callback);
}

function get_phpfile(filename, callback) {
    request_send('GET','/php2ts/phpfiles/' + filename,{},false,callback);
}

function compile_phpfile(code, callback) {
    request_send('POST','/php2ts/compile',{code:code},true,callback);
}

function request_send(method, url, data, json, callback) {
    try {
        var xmlhttp = new XMLHttpRequest();
        var reported = false;
        xmlhttp.open(method, url, true);
        xmlhttp.onloadend = function(e) {
            if (!reported) {
                try {
                    var res = (json)?JSON.parse(xmlhttp.responseText):xmlhttp.responseText;
                    callback(xmlhttp.status < 400, res);
                }catch(e){
                    console.log(e);
                    window.alert("System error\n" + e.message);
                    callback(false);
                }
                reported = true;
            }
        };
        xmlhttp.ontimeout = function() {
            if (!reported) {
                window.alert("System error\n" + 'Time out');
                callback(false);
                reported = true;
            }
        };
        xmlhttp.onabort = function() {
            if (!reported) {
                window.alert("System error\n" + 'Time out');
                callback(false);
                reported = true;
            }
        };
        xmlhttp.timeout = 10000;//ms
        xmlhttp.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
        xmlhttp.send(EncodeHTMLForm(data));
    } catch(e) {
        console.log(e);
        window.alert("System error\n" + e.message);
        callback(false);
    }
}

// HTMLフォームの形式にデータを変換する
function EncodeHTMLForm( data )
{
    var params = [];

    for( var name in data )
    {
        var value = data[ name ];
        var param = encodeURIComponent( name ) + '=' + encodeURIComponent( value );

        params.push( param );
    }

    return params.join( '&' ).replace( /%20/g, '+' );
}

var fileBuffer = {};

function bufferedReadFileSyncTS(fileName) {
    console.log('test');
    //return bufferedReadFileSync('tsfiles/'+fileName);
    return readFileSync('tsfiles/'+fileName);
}

// バッファリングされた同期ファイル読み込み
function bufferedReadFileSync(fileName) {
    if(fileBuffer[fileName] === undefined) {
        var contents = readFileSync(fileName);
        fileBuffer[fileName] = contents;
        return contents;
    }
    return fileBuffer[fileName];
}

// 同期ファイル読み込み
function readFileSync(fileName) {
    var url = '/php2ts/' + fileName;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', url, false);
    xmlhttp.send(null);
    if(xmlhttp.status >= 400) {
        return null;
        //throw new Error('File get error "' + fileName + '"');
    }
    return xmlhttp.responseText;
}
