<?php // 関数

// http://php.net/manual/ja/language.functions.php

// http://php.net/manual/ja/functions.arguments.php


// 引数の参照渡し 
// デフォルトで、関数の引数は値で渡されます。

function add_some_extra1($string)
{
    $string .= 'and something extra.';
}
function add_some_extra2(&$string)
{
    $string .= 'and something extra.';
}
$str = 'This is a string, ';
add_some_extra1($str);
echo $str;    // 出力は 'This is a string, ' となります
add_some_extra2($str);
echo $str;    // 出力は 'This is a string, and something extra.' となります


// デフォルト引数値

function makecoffee($type = "cappuccino")
{
    return "Making a cup of $type.\n";
}
echo makecoffee();           // Making a cup of cappuccino.
echo makecoffee(null);       // Making a cup of .
echo makecoffee("espresso"); // Making a cup of espresso.


// 型宣言 / タイプヒンティング
class C {
    function x(
        C       $cls,   // クラス・インタフェース
        self    $cls2,  // クラスCと同等
        array   $arr,   // 配列
        callable $f,    // 関数 ,callable
        bool    $b,     // boolean
        float   $fl,    // float
        int     $i,     // integer
        string $str // string
    ) {}
}


// 可変長引数リスト 

//  ... を使った、可変長引数へのアクセス
function sum(...$numbers) {
    $acc = 0;
    foreach ($numbers as $n) {
        $acc += $n;
    }
    return $acc;
}
echo sum(1, 2, 3, 4);

// 関数を呼び出すときに ... を使うと、 
// 配列変数や Traversable クラスを引数リストに含めることができます。
function add($a, $b, $c) {
    return $a + $b + $c;
}
echo add(...[1, 2, 3])."\n";
$a = [2, 3];
echo add(1, ...$a);

// func_get_args()
// func_num_args()
// func_get_arg()
function sum() {
    $acc = 0;
    foreach (func_get_args() as $n) {
        $acc += $n;
    }
    return $acc;
}
function sum2() {
    $acc = 0;
    for($i=0;$i<func_num_args();$i++){
        $acc += func_get_arg($i);
    }
    return $acc;
}
echo sum(1, 2, 3, 4),PHP_EOL;
echo sum2(1, 2, 3, 4),PHP_EOL;

