<?php // 変数のスコープ

$g; //undefined
Global $g; //set null
$g = 1;

var_dump($GLOBALS); //Super Global
var_dump($argv); //Special Global
$a = 1;          //Global
$c = 1;          //Global

$f = function() use ($a) {
    $c = 2;  //Local
    Global $c;
    echo '$f',PHP_EOL;
    $GLOBALS; //Super Global
    $argv;   //Local
    $a;      //Global
    $b;      //Local
    $c;      //Global
    $g;      //Local
};

function f() {
    $c = 2;  //Local
    Global $c;
    echo 'f()',PHP_EOL;
    $GLOBALS; //Super Global
    $argv;   //Local
    $a = 2;  //Local
    $b;      //Local
    $c;      //Global
    $g;      //Local
    function ff() {
        $a = 3;  //Local
        $c = 3;  //Local
        Global $a,$c;
        echo 'f()',PHP_EOL;
        $a;      //Global 1
        $c;      //Global 1
    }
    ff();
}

class c {
    public $b = 2;
    function m() {
        $c = 2;  //Local
        Global $c;
        echo 'm()',PHP_EOL;
        $GLOBALS; //Super Global
        $argv;   //Local
        $this;   //Class Local
        $this->b;//Class Local
        $a;      //Local
        $b;      //Local
        $c;      //Global
        $g;      //Local
    }
}

$f();
f();
(new c())->m();

/* TypeScript */
// let a = 'global a';
// let b = 'global b';
// function c() {
//     //function内でスコープは均一
//     //宣言なし -> Global (b)
//     //宣言あり -> Local  (a)
//     console.log(a); //undefined
//     console.log(b); //Global b
//     let a = 'local a'; //Local
//     console.log(a); //Local a
// }
// c();
// console.log(a); //Global a
// console.log(b); //Global b

/* PHP */
$f = function() use ($a) {
    $c = 2;  //Local
    Global $c;
    $a;      //Global
    $b;      //Local
    $c;      //Global
    $f = function() use ($a) {
        $c = 2;  //Local
        Global $c;
        $a;      //Global
        $b;      //Local
        $c;      //Global
    };
};
