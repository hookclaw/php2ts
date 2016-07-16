<?php // 定義済みの変数

// http://php.net/manual/ja/language.variables.predefined.php

// PHPは、実行する全てのスクリプトに定義済みの多くの変数を 提供します。
// しかし、これらの変数の多くは、 実行するサーバーの種類、サーバーのバージョンおよび設定、 
// その他の要素に依存しており、完全に記述することはできません。 
// これらの変数のいくつかは、PHPを コマンドライン で実行した場合には利用できません。 
// これらの変数の一覧については、 予約済みの定義済みの変数 のセクションを参照してください。

// 予約済みの定義済みの変数

// スーパーグローバル
$GLOBALS;
$_SERVER;
$_GET;
$_POST;
$_FILES;
$_COOKIE;
$_SESSION;
$_REQUEST;
$_ENV;

// その他のグローバル変数
$argc; // スクリプトに渡された引数の数
$argv; // スクリプトに渡された引数の配列
$php_errormsg;         // 直近のエラーメッセージ
$http_response_header; // HTTP レスポンスヘッダ

// 古いグローバル変数
$DOCUMENT_ROOT;         // like $_SERVER['DOCUMENT_ROOT'];
$ORIG_PATH_INFO;        // like $_SERVER['ORIG_PATH_INFO'];
$ORIG_PATH_TRANSLATED;
$ORIG_SCRIPT_FILENAME;
$ORIG_SCRIPT_NAME;
$PATH_INFO;             // like $_SERVER['PATH_INFO'];
$PATH_TRANSLATED;       // like $_SERVER['PATH_TRANSLATED'];
$SCRIPT_FILENAME;       // like $_SERVER['SCRIPT_FILENAME'];
$SCRIPT_NAME;           // like $_SERVER['SCRIPT_NAME'];

// 削除されたグローバル変数
$HTTP_RAW_POST_DATA; // PHP 7.0.0 で 削除 されました。like file_get_contents("php://input")
$HTTP_SERVER_VARS; // PHP 5.4.0 で削除されました。like $_SERVER;
$HTTP_GET_VARS;    // PHP 5.4.0 で削除されました。like $_GET;
$HTTP_POST_VARS;   // PHP 5.4.0 で削除されました。like $_POST;
$HTTP_POST_FILES;  // PHP 5.4.0 で削除されました。like $_FILES;
$HTTP_SESSION_VARS;// PHP 5.4.0 で削除されました。like $_SESSION;
$HTTP_ENV_VARS;    // PHP 5.4.0 で削除されました。like $_ENV;
$HTTP_COOKIE_VARS; // PHP 5.4.0 で削除されました。like $_COOKIE;
