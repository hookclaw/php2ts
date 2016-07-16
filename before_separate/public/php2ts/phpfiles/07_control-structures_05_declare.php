<?php // 制御構造

// http://php.net/manual/ja/language.control-structures.php

// http://php.net/manual/ja/control-structures.declare.php

//パースすると停止する。
//declare(encoding='ISO-8859-1');

//厳密な型チェック
declare(strict_types=1);

declare(ticks=1) {
    // ここにすべてのスクリプトを書きます
}

// or

declare(ticks=1);

// tick イベントごとにコールされる関数
function tick_handler()
{
    echo "tick_handler() called\n";
}

register_tick_function('tick_handler');

$a = 1;

if ($a > 0) {
    $a += 2;
    print($a);
}
