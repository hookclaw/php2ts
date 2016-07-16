<?php // 型演算子

// http://php.net/manual/ja/language.operators.type.php

// instanceof を使用して、 
// ある PHP 変数が特定の クラス のオブジェクトのインスタンスであるかどうかを調べます。

class MyClass {}
class NotMyClass {}

$a = new MyClass;
var_dump($a instanceof MyClass);    //true
var_dump($a instanceof NotMyClass); //false

interface MyInterface {}
class NewClass extends MyClass implements MyInterface {}

$b = new NewClass;
var_dump($b instanceof MyClass);     //true
var_dump($b instanceof NewClass);    //true
var_dump($b instanceof MyInterface); //true

$c1 = 'MyClass';
$c2 = 'NotMyClass';
var_dump($a instanceof $c1); //true
var_dump($a instanceof $c2); //false
