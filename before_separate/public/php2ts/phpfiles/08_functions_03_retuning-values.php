<?php // 返り値

// http://php.net/manual/ja/language.functions.php

// http://php.net/manual/ja/functions.returning-values.php

// return を省略した場合は NULL を返します。

function f1() {}
echo f1(),PHP_EOL; // NULL

// 関数からリファレンスを返すには、リファレンス演算子 & を
// 関数宣言部および変数への返り値を代入する際の両方で使用する必要があります。

function &returns_reference(){
    return $someref;
}
$newref =& returns_reference();

// 戻り値の型宣言 
function sum($a, $b): float {
    return $a + $b;
}

// 戻り値が float となることに注目
var_dump(sum(1, 2)); // float(3)

