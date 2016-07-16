<?php // 論理演算子

// http://php.net/manual/ja/language.operators.logical.php

$a and $b;   // 論理積   $a および $b が共に TRUE の場合に TRUE
$a && $b;    // 論理積   $a および $b が共に TRUE の場合に TRUE
$a or  $b;   // 論理和   $a または $b のどちらかが TRUE の場合に TRUE
$a || $b;    // 論理和   $a または $b のどちらかが TRUE の場合に TRUE
$a xor $b;   // 排他的論理和 $a または $b のどちらかが TRUE でかつ両方とも TRUE でない場合に TRUE
! $a;        // 否定 $a が TRUE でない場合 TRUE

// $e に代入されるのは、(false || true) の評価結果です
// これは、次の式と同様です: ($e = (false || true))
$e = false || true;

// $f に false を代入してから "or" 演算子を評価します
// これは、次の式と同様です: (($f = false) or true)
$f = false or true;

var_dump($e, $f);
// bool(true)
// bool(false)

// --------------------
// "&&" の優先順位は "and" より高くなります

// $g に代入されるのは、(true && false) の評価結果です
// これは、次の式と同様です: ($g = (true && false))
$g = true && false;

// $h に true を代入してから "and" 演算子を評価します
// これは、次の式と同様です: (($h = true) and false)
$h = true and false;

var_dump($g, $h);
// bool(false)
// bool(true)
