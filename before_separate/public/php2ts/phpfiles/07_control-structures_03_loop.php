<?php // 制御構造

// http://php.net/manual/ja/language.control-structures.php

// http://php.net/manual/ja/control-structures.while.php

$i = 1;
while ($i <= 10) {
    echo $i++;
}

$i = 1;
while ($i <= 10):
    echo $i++;
endwhile;

// http://php.net/manual/ja/control-structures.do.while.php

$i = 0;
do {
    echo $i;
} while ($i > 0);

// http://php.net/manual/ja/control-structures.for.php

for ($i = 1; $i <= 10; $i++) {
    echo $i;
}

for ($i = 1; ; $i++) {
    if ($i > 10) {
        break;
    }
    echo $i;
}

$i = 1;
for (; ; ) {
    if ($i > 10) {
        break;
    }
    echo $i;
    $i++;
}

for ($i = 1, $j = 0; $i <= 10; $j += $i, print $i, $i++);

// http://php.net/manual/ja/control-structures.break.php
// http://php.net/manual/ja/control-structures.continue.php

for($i = 0;;$i++){
	switch($i){
	case 1: continue;   // breakと同じ
	case 2: continue 2; // for文の次のループに入る
	}
	for(;;){
		break;
	}
	echo "1";
	for(;;){
		break 1;
	}
	echo "2"; //実行される
	for(;;){
		break 2;
	}
	echo "3"; //実行されない
}

for(;;){
	while(true){
		do{
			switch(1){
			case 1:
				break 1;
				break 2;
				break 3;
				break 4;
				continue 2;
			}
		} while(true);
	}
	foreach($a as $b){
		break 2;
	}
	foreach($a as $k=>$b){
		break 2;
	}
	foreach($a as list($b)){
		break 2;
	}
	foreach($a as $k=>list($b)){
		break 2;
	}
}
