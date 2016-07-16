<?php // 制御構造

// http://php.net/manual/ja/language.control-structures.php

// http://php.net/manual/ja/control-structures.foreach.php

$arr = array(1, 2, 3, 4);
foreach ($arr as &$value) {
    $value = $value * 2;
}
// $arr は array(2, 4, 6, 8) となります
unset($value); // 最後の要素への参照を解除します

foreach ($arr as $key => $value) {
    echo "Key: $key; Value: $value<br />\n";
}

$arr1 = [
    [1, 2],
    [3, 4],
];

foreach ($arr1 as list($a, $b)) {
    // $a にはネストした配列の最初の要素が含まれ、
    // $b には二番目の要素が含まれます。
    echo "A: $a; B: $b\n";
}
//A: 1; B: 2
//A: 3; B: 4

foreach ($arr1 as $i => list($a, $b)) {
    echo "index: $i; A: $a; B: $b\n";
}
//index: 0; A: 1; B: 2
//index: 1; A: 3; B: 4
