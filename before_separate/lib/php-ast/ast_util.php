<?php
error_reporting(E_ALL);

/* Allow the script to hang around waiting for connections. */
set_time_limit(0);

/* 自動フラッシュをオンにする */
ob_implicit_flush(true);

require __DIR__ . "/official_util.php";

$cmd = "";
if(count($argv)>1) {
	$cmd = $argv[1];
}
if($cmd == "functions"){
	var_dump(functions());
	exit(0);
}
if($cmd == "constants"){
	var_dump(constants());
	exit(0);
}
if($cmd == "create"){
	create();
	exit(0);
}
echo "Unknown command".PHP_EOL;
exit(0);

function create() {
	$constants = constants();
	
	$flag_info = get_flag_info();
	$flag_info[0][ast\AST_ARRAY_ELEM][1] = 'BY_REFERENCE';
	$flag_info[0][ast\AST_CLOSURE_VAR][1] = 'BY_REFERENCE';
	
	$kinds_children = kinds_children();
	
	$kinds = $constants['kinds'];
	ksort($kinds);
	$flags = $constants['flags'];
	
	// enum
	echo 'export enum AST {',PHP_EOL;
	foreach($kinds as $number=>$kind){
		echo "\t",substr($kind,4),",",PHP_EOL;
	}
	echo '}',PHP_EOL;
	echo PHP_EOL;
	echo 'export enum FLAG {',PHP_EOL;
	foreach($flags as $name=>$number){
		echo "\t",$name,',',PHP_EOL;
	}
	echo '}',PHP_EOL;
	
	// echo "\tKinds = [];",PHP_EOL;
	// foreach($kinds as $number=>$kind){
	// 	echo "\t",'Kinds[AST.',substr($kind,4),"] = f('",$kind,"');",PHP_EOL;
	// }
	// echo "\tKindMethods = {};",PHP_EOL;
	// foreach($kinds as $number=>$kind){
	// 	echo "\tKindMethods[Kinds[AST.",substr($kind,4),"]] = c['",$kind,"';",PHP_EOL;
	// }
	// foreach($flags as $name=>$number){
	// 	echo 'this.Flags[FLAG_',$name,"] = f('",$name,"');",PHP_EOL;
	// }
	
	// 'this.ExclusiveFlags'
	// 'this.CombinableFlags'
	$newinfo = [];
	foreach($flag_info as $k=>$v){
		$newinfo[$k] = array();
		foreach($flag_info[$k] as $number=>$value){
			foreach($flag_info[$k][$number] as $fno=>$name){
				$newinfo[$k][intval($number)][intval($fno)] = $name;
			}
			ksort($newinfo[$k][intval($number)]);
		}
		ksort($newinfo[$k]);
		$vname = ($k==0)?'ExclusiveFlags':'CombinableFlags';
		echo "\t",$vname,' = [];',PHP_EOL;
		foreach($newinfo[$k] as $kind => $flags){
			$kname = substr(ast\get_kind_name($kind),4);
			echo "\t",$vname,'[Kinds[AST.',$kname,']] = [];',PHP_EOL;
			foreach($flags as $fno => $name){
				echo "\t",$vname,'[Kinds[AST.',$kname,']][Flags[FLAG.',$name,']] = "',$name,'";',PHP_EOL;
			}
		}
	}
	
	// 関数
	foreach($kinds as $number=>$kind){
		echo PHP_EOL;
		echo '// kind ( ',$number,' )',PHP_EOL;
		if(isset($flag_info[0][$number])){
			echo '// flags type ( exclusive ) ',implode(',',$flag_info[0][$number]),PHP_EOL;
		}elseif(isset($flag_info[1][$number])){
			echo '// flags type ( combinable ) ',implode(',',$flag_info[1][$number]),PHP_EOL;
		}
		if(isset($kinds_children[$number])){
			echo '// child nodes ( ',$kinds_children[$number],' )',PHP_EOL;
		}
		echo 'private ',$kind,' = (ast:baseAst):string => {',PHP_EOL;
		if(isset($flag_info[0][$number])){
			echo '    switch(ast.flags){',PHP_EOL;
			foreach($flag_info[0][$number] as $flag){
				echo '    case this.Flags[FLAG.',$flag,']:',PHP_EOL;
			}
			echo '    }',PHP_EOL;
		}
		echo '    return this.AST_base(ast);',PHP_EOL;
		echo '}',PHP_EOL;
	}
	
}

function functions(){
	$list = array();
	foreach(get_defined_functions()['internal'] as $f){
		if(substr($f,0,4) == 'ast\\'){
			$list[] = $f;
		}
	}
	return $list;
}

function constants(){
	$constants = array();
	$constants['flags'] = array();
	$constants['kind'] = array();
    $kinds = array();
	foreach(get_defined_constants(true)['ast'] as $name=>$number){
		if(substr($name,0,10) == 'ast\\flags\\'){
			$constants['flags'][substr($name,10)] = $number;
		}else{
			$constants['kind'][substr($name,4)] = $number;
            $n = ast\get_kind_name($number);
            $kinds[$number] = substr($name,4);
		}
	}
    $constants['kinds'] = $kinds;
	return $constants;
}

function kinds_children(){
	$s = array();
	$s[ast\AST_AND] ='left, right';
	$s[ast\AST_ARRAY_ELEM] ='value, key';
	$s[ast\AST_ASSIGN] ='var, expr';
	$s[ast\AST_ASSIGN_OP] ='var, expr';
	$s[ast\AST_ASSIGN_REF] ='var, expr';
	$s[ast\AST_BINARY_OP] ='left, right';
	$s[ast\AST_BREAK] ='depth';
	$s[ast\AST_CALL] ='expr, args';
	$s[ast\AST_CAST] ='expr';
	$s[ast\AST_CATCH] ='class, var, stmts';
	$s[ast\AST_CLASS] ='extends, implements, stmts';
	$s[ast\AST_CLASS_CONST] ='class, const';
	$s[ast\AST_CLONE] ='expr';
	$s[ast\AST_CLOSURE] ='params, uses, stmts, returnType';
	$s[ast\AST_CLOSURE_VAR] ='name';
	$s[ast\AST_COALESCE] ='left, right';
	$s[ast\AST_CONDITIONAL] ='cond, true, false';
	$s[ast\AST_CONST] ='name';
	$s[ast\AST_CONST_ELEM] ='name, value';
	$s[ast\AST_CONTINUE] ='depth';
	$s[ast\AST_DECLARE] ='declares, stmts';
	$s[ast\AST_DIM] ='expr, dim';
	$s[ast\AST_DO_WHILE] ='stmts, cond';
	$s[ast\AST_ECHO] ='expr';
	$s[ast\AST_EMPTY] ='expr';
	$s[ast\AST_EXIT] ='expr';
	$s[ast\AST_FOR] ='init, cond, loop, stmts';
	$s[ast\AST_FOREACH] ='expr, value, key, stmts';
	$s[ast\AST_FUNC_DECL] ='params, uses, stmts, returnType';
	$s[ast\AST_GLOBAL] ='var';
	$s[ast\AST_GOTO] ='label';
	$s[ast\AST_GREATER] ='left, right';
	$s[ast\AST_GREATER_EQUAL] ='left, right';
	$s[ast\AST_GROUP_USE] ='prefix, uses';
	$s[ast\AST_HALT_COMPILER] ='offset';
	$s[ast\AST_IF_ELEM] ='cond, stmts';
	$s[ast\AST_INCLUDE_OR_EVAL] ='expr';
	$s[ast\AST_INSTANCEOF] ='expr, class';
	$s[ast\AST_ISSET] ='var';
	$s[ast\AST_LABEL] ='name';
	$s[ast\AST_MAGIC_CONST] ='';
	$s[ast\AST_METHOD] ='params, uses, stmts, returnType';
	$s[ast\AST_METHOD_CALL] ='expr, method, args';
	$s[ast\AST_METHOD_REFERENCE] ='class, method';
	$s[ast\AST_NAME] ='name';
	$s[ast\AST_NAMESPACE] ='name, stmts';
	$s[ast\AST_NEW] ='class, args';
	$s[ast\AST_OR] ='left, right';
	$s[ast\AST_PARAM] ='type, name, default';
	$s[ast\AST_POST_DEC] ='var';
	$s[ast\AST_POST_INC] ='var';
	$s[ast\AST_PRE_DEC] ='var';
	$s[ast\AST_PRE_INC] ='var';
	$s[ast\AST_PRINT] ='expr';
	$s[ast\AST_PROP] ='expr, prop';
	$s[ast\AST_PROP_ELEM] ='name, default';
	$s[ast\AST_REF] ='var';
	$s[ast\AST_RETURN] ='expr';
	$s[ast\AST_SHELL_EXEC] ='expr';
	$s[ast\AST_SILENCE] ='expr';
	$s[ast\AST_STATIC] ='var, default';
	$s[ast\AST_STATIC_CALL] ='class, method, args';
	$s[ast\AST_STATIC_PROP] ='class, prop';
	$s[ast\AST_SWITCH] ='cond, stmts';
	$s[ast\AST_SWITCH_CASE] ='cond, stmts';
	$s[ast\AST_THROW] ='expr';
	$s[ast\AST_TRAIT_ALIAS] ='method, alias';
	$s[ast\AST_TRAIT_PRECEDENCE] ='method, insteadof';
	$s[ast\AST_TRY] ='try, catches, finally';
	$s[ast\AST_TYPE] ='';
	$s[ast\AST_UNARY_MINUS] ='expr                   // prior to version 20';
	$s[ast\AST_UNARY_OP] ='expr';
	$s[ast\AST_UNARY_PLUS] ='expr                   // prior to version 20';
	$s[ast\AST_UNPACK] ='expr';
	$s[ast\AST_UNSET] ='var';
	$s[ast\AST_USE_ELEM] ='name, alias';
	$s[ast\AST_USE_TRAIT] ='traits, adaptations';
	$s[ast\AST_VAR] ='name';
	$s[ast\AST_WHILE] ='cond, stmts';
	$s[ast\AST_YIELD] ='value, key';
	$s[ast\AST_YIELD_FROM] ='expr';
	return $s;
}