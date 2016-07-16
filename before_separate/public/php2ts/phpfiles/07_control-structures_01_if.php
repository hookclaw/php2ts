<?php // 制御構造

// http://php.net/manual/ja/language.control-structures.php

// http://php.net/manual/ja/control-structures.if.php

if(true){
}elseif(true){
}else if(true){
}else{
}

if ($a > $b) {
    echo "aはbより大きい";
} elseif ($a == $b) {
    echo "aはbと等しい";
} else {
    echo "aはbより小さい";
}

if($a > $b):
    echo $a." is greater than ".$b;
elseif($a == $b):
    echo $a." equals ".$b;
else:
    echo $a." is neither greater than or equal to ".$b;
endif;
