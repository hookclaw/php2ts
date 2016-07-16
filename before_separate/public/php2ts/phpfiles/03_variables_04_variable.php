<?php // 可変変数

// http://php.net/manual/ja/language.variables.variable.php

// 変数名を可変にできると便利なことが時々あります。
// 可変変数では、変数名を動的にセットし使用できます。
$a = 'b';   // $aに'b'を代入
$$a = 'c';  // $bに'c'を代入
$c = $$a;   // $cに$bを代入

// 可変変数は、変数の値をとり、変数の名前として扱います。
// 上の例では、 hello は、ドル記号を二つ使用することにより、 
// 変数の名前として使用することができます。

// 以下の命令は同等です。
$a = 'hello';
echo "$a ${$a}";
echo "$a $hello";

// $$a[1] では曖昧。{}でプロパティ名の区切りを明確にすることができます。
${$a[1]};  // $h
${$a}[1];  // $hello[1]

// PHP5とPHP7で解釈が変更されています。
// http://php.net/manual/ja/migration70.incompatible.php#migration70.incompatible.variable-handling.indirect
//式                       PHP5の解釈               PHP7の解釈
$$foo['bar']['baz'];    // ${$foo['bar']['baz']}    ($$foo)['bar']['baz']
$foo->$bar['baz'];      // $foo->{$bar['baz']}      ($foo->$bar)['baz']
$foo->$bar['baz']();    // $foo->{$bar['baz']}()    ($foo->$bar)['baz']()
Foo::$bar['baz']();     // Foo::{$bar['baz']}()     (Foo::$bar)['baz']()


// 複雑な例
$a = 'this.a';
$b = 'c.b';
$x = 'b';
$$a = $$b + $c::$$x + c::$$x;
c::$$$x = $$b + c::$$x + $c::$$x + 1 + ($$b = 4) + ($$$x = 1);

//期待する答え
//（テンポラリ変数を使用して再現している為、PHPと同じ実行順序になることは保証できません）

//c::$$$x       eval('c.' + eval(pre_x))

//$$b           eval(pre_b)
//c::$$x        eval('c.' + pre_x)
//$c::$$x       eval('pre_c.' + pre_x)
//($$b = 4)     eval('(' + pre_b + '=4)')
//($$$x = 1)    eval('(' + eval(pre_x) + '=1)')

//eval(
//  'c.' + eval(pre_x) 
//      + '=' + 
//  pre_b
//      + '+' + 
//  'c.' + pre_x 
//      + '+' + 
//  'pre_c.' + pre_x
//      + '+' + 
//  '1'
//      + '+' + 
//  '(' + pre_b + '=4)'
//      + '+' + 
//  '(' + eval(pre_x) + '=1)'
//  )
