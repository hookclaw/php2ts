<?php // 変数

// http://php.net/manual/ja/language.variables.basics.php


// 変数名のルール
// '[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*'

//$4site = 'not yet';     // 無効：数字で始まっている。
$_4site = 'not yet';    // 有効：アンダースコアで始まっている。
$täyte = 'mansikka';    // 有効：'ä' はアスキーコード228です。


$var = 'Bob';
$Var = 'Joe';    // 大文字小文字は区別される

$Bob = &$var;    // 参照による代入
$Joe = $Var;     // 値を代入

$var = 'var';   // $Bobも変更される
$Var = 'Var';

echo $Bob;      // "var"
echo $Joe;      // "Joe"


// 初期化されていない変数のデフォルト値

// 設定も参照もされていない (使用中のコンテキストではない) 変数は NULL となります
var_dump($unset_var);

// boolean として使用すると、出力は 'false' となります (この構文の詳細は三項演算子を参照ください)
echo($unset_bool ? "true\n" : "false\n");

// 文字列として使用すると、出力は 'string(3) "abc"' となります
$unset_str .= 'abc';
var_dump($unset_str);

// integer として使用すると、出力は 'int(25)' となります
$unset_int += 25; // 0 + 25 => 25
var_dump($unset_int);

// float/double として使用すると、出力は 'float(1.25)' となります
$unset_float += 1.25;
var_dump($unset_float);

// 配列として使用すると、出力は array(1) {  [3]=>  string(3) "def" } となります
$unset_arr[3] = "def"; // array() + array(3 => "def") => array(3 => "def")
var_dump($unset_arr);

// オブジェクトとして使用し、新しい stdClass オブジェクト (http://www.php.net/manual/ja/reserved.classes.php を参照ください)
// を作成すると、出力は object(stdClass)#1 (1) {  ["foo"]=>  string(3) "bar" } となります
$unset_obj->foo = 'bar';
var_dump($unset_obj);
