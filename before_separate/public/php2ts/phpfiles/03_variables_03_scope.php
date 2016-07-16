<?php // 変数のスコープ

// http://php.net/manual/ja/language.variables.scope.php

// 変数のスコープは、その変数が定義されたコンテキストです。
// ほとんどの PHP 変数は、スコープを1つだけ有しています。
// このスコープの範囲は、 includeやrequireにより読みこまれたファイルも含みます。

$a = 1; /* グローバルスコープ */

// 変数$aはインクルードされた b.inc スクリプトの中でも利用可能です。
include 'b.inc';

// しかし、 ユーザー定義の関数の中では変数の有効範囲はローカル関数の中となります。
// 関数の中で使用された変数はデフォルトで有効範囲が関数内部に制限 されます。
function test() { 
    echo $a; /* ローカルスコープ変数の参照 */ 
}

$b = 2;
function Sum1() {
    global $a, $b;
    $b = $a + $b;
}
function Sum2() {
    $GLOBALS['b'] = $GLOBALS['a'] + $GLOBALS['b'];
}

function test_global() {
    // ほとんどの定義済み変数は"スーパー"ではなく、関数内の
    // ローカルスコープで有効とするには'global'をコールする必要があります。
    global $HTTP_POST_VARS;
    
    echo $HTTP_POST_VARS['name'];
    
    // スーパーグローバルはどのスコープでも有効であり
    // 'global'をコールする必要がありません。
    // スーパーグローバルはPHP4.1.0以降で利用できます。
    // HTTP_POST_VARS は今や非推奨とされています。
    echo $_POST['name'];
}

// global キーワードを関数の外部で使ってもエラーにはなりません。 
// そのファイルが関数の内部からインクルードされたときに使うことができます。
global $HTTP_POST_VARS;
echo $HTTP_POST_VARS['name'];


// static 静的変数
function test_static() {
    static $a = 0;
    echo $a;
    $a++;
}
