<?php // 実行演算子

// http://php.net/manual/ja/language.operators.execution.php

// PHP は 1 種類の実行演算子、バッククォート (``) をサポートします。
// シングルクォートではないことに注意してください! 
// PHP は、バッククォートの 中身をシェルコマンドとして実行しようとします。
// 出力が返されます (すなわち、出力を単にダンプするのではなく、変数に代入することが できます) 。
// バッククォート演算子の使用は shell_exec() と等価です。

$output = `ls -al`;
echo "<pre>$output</pre>";

$output = `dir`;
echo "<pre>$output</pre>";

// バッククォート演算子は、セーフモード が有効な場合 もしくは shell_exec() が無効な場合は無効となります。
