<?php // 関数

// http://php.net/manual/ja/language.functions.php

// http://php.net/manual/ja/functions.user-defined.php


// PHP では、関数は参照される前に定義されている必要はありません。 

baz();

function baz(){
}

// ただし、条件付きで関数が定義されている場合は、除きます。

baz2(); // エラー

if(true){
	function baz2(){
	}
}

baz2(); // 使用できます。

// 関数の中の関数

function foo() 
{
  function bar() 
  {
    echo "I don't exist until foo() is called.\n";
  }
}

/* ここでは関数bar()はまだ定義されていないので
   コールすることはできません。 */

foo();

/* foo()の実行によって bar()が
   定義されるためここではbar()を
   コールすることができます。*/

bar();

