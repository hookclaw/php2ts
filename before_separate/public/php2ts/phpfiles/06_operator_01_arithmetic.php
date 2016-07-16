<?php // 代数演算子

// http://php.net/manual/ja/language.operators.arithmetic.php
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators

$x = -$a;       // 負にする $a の逆
$x = $a + $b;   // 加算     $a および $b の合計
$x = $a - $b;   // 減算     $a と $b の差
$x = $a * $b;   // 乗算     $a および $b の積
$x = $a / $b;   // 除算     $a および $b の商
$x = $a % $b;   // 剰余     $a を $b で割った余り
$x = $a ** $b;  // 累乗     $a の $b 乗。PHP 5.6 で導入されました。

echo (5 % 3)."\n";           // 2
echo (5 % -3)."\n";          // 2
echo (-5 % 3)."\n";          // -2
echo (-5 % -3)."\n";         // -2
