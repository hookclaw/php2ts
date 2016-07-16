<?php // 制御構造

// http://php.net/manual/ja/language.control-structures.php

// http://php.net/manual/ja/control-structures.switch.php

switch ($i) {
    case 0:
        echo "iは0に等しい";
        break;
    case 1:
        echo "iは1に等しい";
        break;
    case 2:
        echo "iは2に等しい";
        break;
    default:
       echo "iは0,1,2に等しくない";
}
switch ($i):
    case 0:
        echo "iは0に等しい";
        break;
    case 1:
        echo "iは1に等しい";
        break;
    case 2:
        echo "iは2に等しい";
        break;
    default:
        echo "iは0でも1でも2でもない";
endswitch;
