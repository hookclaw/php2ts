<?php // 配列演算子

// http://php.net/manual/ja/language.operators.array.php

$a + $b;     // 結合     $a および $b を結合する。
$a == $b;    // 同等     $a および $b のキー/値のペアが等しい場合に TRUE。
$a === $b;   // 同一     $a および $b のキー/値のペアが等しく、その並び順が等しく、 
             //          かつデータ型も等しい場合に TRUE。
$a != $b;    // 等しくない   $a が $b と等しくない場合に TRUE。
$a <> $b;    // 等しくない   $a が $b と等しくない場合に TRUE。
$a !== $b;   // 同一でない   $a が $b と同一でない場合に TRUE。

// + 演算子は、右側の配列を左側の配列に追加したものを返します。 
// 両方の配列に存在するキーについては左側の配列の要素が優先され、 
// 右側の配列にあった同じキーの要素は無視されます。

$a = array("a" => "apple", "b" => "banana");
$b = array("a" => "pear", "b" => "strawberry", "c" => "cherry");

$c = $a + $b; // Union of $a and $b
var_dump($c);
//array(3) {
//  ["a"]=>  string(5) "apple"
//  ["b"]=>  string(6) "banana"
//  ["c"]=>  string(6) "cherry"
//}

$c = $b + $a; // Union of $b and $a
var_dump($c);
//array(3) {
//  ["a"]=>  string(4) "pear"
//  ["b"]=>  string(10) "strawberry"
//  ["c"]=>  string(6) "cherry"
//}

$a += $b; // Union of $a += $b is $a and $b
var_dump($a);
//array(3) {
//  'a' =>  string(5) "apple"
//  'b' =>  string(6) "banana"
//  'c' =>  string(6) "cherry"
//}

// 同じキーと値を保持している場合に、配列が等しいとみなされます。
$a = array("apple", "banana");
$b = array(1 => "banana", "0" => "apple");

var_dump($a == $b); // bool(true)
var_dump($a === $b); // bool(false)
