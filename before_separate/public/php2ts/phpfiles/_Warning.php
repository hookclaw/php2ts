
Warningの仕組み
	ソースコードに埋め込む
	行番号つきで一覧表を作る。
		return Object('if(',Object(WARNING,'A'),')');



<?php
// ビルトイン関数・ビルトイン変数はすべて、出力コードをカスタマイズ可能とし、警告の有無も制御できるようにする予定。
// 変数名がTypeScript(Javascript)の予約後に一致するときも同様。

// 以下の機能を検出したときに、警告を表示する予定。

$n = 1;
$b = settype($n,"string");
$s = gettype($n);
$s = get_resource_type($handle);
eval('');
import_request_variables(); //この関数は PHP 5.4.0 で削除されました
//register_globals を使う方法：この機能は PHP 5.4.0 で削除されました。


// 以下の機能は、関数名や呼び出し方法を置換する予定。

is_array([]);
is_float(1.1);
is_int(1);
is_object(new a());
is_string("");

trait trt {}
class cls {
    use trt;
}

echo "";
print "";
exit();

array();
empty('');
isset('');
list('');
unset('');

setcookie();

//NULLの取り扱い
//PHPでは、設定も参照もされていない (使用中のコンテキストではない) 変数は NULL となります

$a = 'a';echo ++$a; //JabaScriptでは、実装されていない機能。Stringに、mixinでもすれば解決できる。
{ 'a':'apple'} + { 'b':'banana' } //配列の演算や比較。Arrayに、mixinでもすれば解決できる。
