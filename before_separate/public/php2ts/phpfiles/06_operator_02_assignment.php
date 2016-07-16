<?php // 代入演算子

// http://php.net/manual/ja/language.operators.assignment.php
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators

$a = ($b = 4) + 5; // $a は 9 に等しくなり、$b には 4 が代入されます
$a = 3;
$a += 5; // $a を 8 にセットします。$a = $a + 5; と同じです。
$a -= 5;
$a *= 5;
$a /= 5;
$a %= 5;
$a **= 5;
$a &= 5;
$a |= 5;
$a ^= 5;
$a <<= 5;
$a >>= 5;

$b = "Hello ";
$b .= "There!"; // $bを"Hello There!"にセットします。$b = $b . "There!";と同じです。

// 参照による代入
$a = 3;
$b = &$a; // $b は $a への参照です

print "$a\n"; // 表示: 3
print "$b\n"; // 表示: 3

$a = 4; // change $a

print "$a\n"; // 表示: 4
print "$b\n"; // 表示: 4
// $b の参照先は $a であり、その値が変わったからです
