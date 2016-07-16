<?php // エラー制御演算子

// http://php.net/manual/ja/language.operators.errorcontrol.php
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators

// PHP はエラー制御演算子(@)をサポートしています。
// PHP の式の前に付けた場合、 その式により生成されたエラーメッセージは無視されます。


/* 意図的なエラー */
$my_file = @file ('non_existent_file') or
    die ("Failed opening file: error was '$php_errormsg'");

// この演算子は関数だけでなく、全ての式で動作します。
$value = @$cache[$key];
// インデックス $key が存在しない場合でも、警告を発生しません。
