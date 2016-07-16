"use strict";
var _const;
(function (_const) {
    var Kinds;
    var LocalKinds;
    var constants;
    function initialize(p_constants) {
        constants = p_constants;
        setKinds();
        setFlags();
    }
    _const.initialize = initialize;
    _const.getOriginalKind = function (kind) {
        return Kinds[kind];
    };
    _const.getLocalKind = function (kind) {
        return LocalKinds[kind];
    };
    _const.flagsString = function (kind, flags) {
        if (_const.ExclusiveFlags[kind] !== undefined) {
            var f = _const.ExclusiveFlags[kind][flags];
            if (f === undefined) {
                f = '';
            }
            return '(' + flags + ':' + f + ')';
        }
        if (_const.CombinableFlags[kind] === undefined) {
            return '';
        }
        var str = '';
        for (var key in _const.CombinableFlags[kind]) {
            var fno = +key;
            if (flags & fno) {
                if (str != '') {
                    str += ',';
                }
                str += _const.CombinableFlags[kind][fno];
            }
        }
        return '(' + flags + ':' + str + ')';
    };
    _const.getModifier = function (flags) {
        var code = [];
        if (flags & _const.Flags[FLAG.MODIFIER_PUBLIC]) {
            code.push('public');
        }
        if (flags & _const.Flags[FLAG.MODIFIER_PROTECTED]) {
            code.push('protected');
        }
        if (flags & _const.Flags[FLAG.MODIFIER_PRIVATE]) {
            code.push('private');
        }
        if (flags & _const.Flags[FLAG.MODIFIER_STATIC]) {
            code.push('static');
        }
        if (flags & _const.Flags[FLAG.MODIFIER_ABSTRACT]) {
            code.push('abstract');
        }
        if (flags & _const.Flags[FLAG.MODIFIER_FINAL]) {
            code.push('/* final */');
        }
        if (flags & _const.Flags[FLAG.RETURNS_REF]) {
            code.push('/* & */');
        }
        return code.join(' ');
    };
    function KindsForeach(callback) {
        for (var v in AST) {
            if (isNaN(v)) {
                var localNumber = AST[v];
                var str = 'AST_' + v;
                callback(str, localNumber, Kinds[localNumber]);
            }
        }
    }
    _const.KindsForeach = KindsForeach;
    function setKinds() {
        var kinds = constants['kinds'];
        var originalKind = function (name) {
            var n = kinds[name];
            if (n === undefined) {
                console.error('Undefined kind "' + name + '"');
            }
            return n;
        };
        Kinds = [];
        LocalKinds = [];
        for (var v in AST) {
            if (isNaN(v)) {
                var localNUmber = AST[v];
                var str = 'AST_' + v;
                LocalKinds[Kinds[localNUmber] = originalKind(str)] = localNUmber;
            }
        }
        _const.IgnoreSemicolon = [];
        _const.IgnoreSemicolon[Kinds[AST.FUNC_DECL]] = 'AST_FUNC_DECL';
        _const.IgnoreSemicolon[Kinds[AST.CLOSURE]] = 'AST_CLOSURE';
        _const.IgnoreSemicolon[Kinds[AST.CLASS]] = 'AST_CLASS';
        _const.IgnoreSemicolon[Kinds[AST.STMT_LIST]] = 'AST_STMT_LIST';
        _const.IgnoreSemicolon[Kinds[AST.IF]] = 'AST_IF';
        _const.IgnoreSemicolon[Kinds[AST.TRAIT_ADAPTATIONS]] = 'AST_TRAIT_ADAPTATIONS';
        _const.IgnoreSemicolon[Kinds[AST.WHILE]] = 'AST_WHILE';
        _const.IgnoreSemicolon[Kinds[AST.DO_WHILE]] = 'AST_DO_WHILE';
        _const.IgnoreSemicolon[Kinds[AST.SWITCH]] = 'AST_SWITCH';
        _const.IgnoreSemicolon[Kinds[AST.SWITCH_CASE]] = 'AST_SWITCH_CASE';
        _const.IgnoreSemicolon[Kinds[AST.USE_TRAIT]] = 'AST_USE_TRAIT';
        _const.IgnoreSemicolon[Kinds[AST.NAMESPACE]] = 'AST_NAMESPACE';
        _const.IgnoreSemicolon[Kinds[AST.FOR]] = 'AST_FOR';
        _const.IgnoreSemicolon[Kinds[AST.FOREACH]] = 'AST_FOREACH';
        _const.IgnoreSemicolon[Kinds[AST.TRY]] = 'AST_TRY';
        _const.IgnoreSemicolon[Kinds[AST.CATCH]] = 'AST_CATCH';
        _const.IgnoreSemicolon[Kinds[AST.USE]] = 'AST_USE';
        _const.IgnoreSemicolon[Kinds[AST.USE_ELEM]] = 'AST_USE_ELEM';
    }
    function setFlags() {
        var flags = constants['flags'];
        var originalFlag = function (name) {
            var n = flags[name];
            if (n === undefined) {
                if (name == 'BY_REFERENCE') {
                    n = 1;
                }
                else {
                    console.error('Undefined flag "' + name + '"');
                }
            }
            return n;
        };
        _const.Flags = [];
        for (var v in FLAG) {
            if (isNaN(v)) {
                var n = FLAG[v];
                var s = v;
                _const.Flags[n] = originalFlag(s);
            }
        }
        _const.ExclusiveFlags = [];
        _const.ExclusiveFlags[Kinds[AST.MAGIC_CONST]] = [];
        _const.ExclusiveFlags[Kinds[AST.MAGIC_CONST]][_const.Flags[FLAG.MAGIC_LINE]] = "MAGIC_LINE";
        _const.ExclusiveFlags[Kinds[AST.MAGIC_CONST]][_const.Flags[FLAG.MAGIC_FILE]] = "MAGIC_FILE";
        _const.ExclusiveFlags[Kinds[AST.MAGIC_CONST]][_const.Flags[FLAG.MAGIC_DIR]] = "MAGIC_DIR";
        _const.ExclusiveFlags[Kinds[AST.MAGIC_CONST]][_const.Flags[FLAG.MAGIC_CLASS]] = "MAGIC_CLASS";
        _const.ExclusiveFlags[Kinds[AST.MAGIC_CONST]][_const.Flags[FLAG.MAGIC_TRAIT]] = "MAGIC_TRAIT";
        _const.ExclusiveFlags[Kinds[AST.MAGIC_CONST]][_const.Flags[FLAG.MAGIC_METHOD]] = "MAGIC_METHOD";
        _const.ExclusiveFlags[Kinds[AST.MAGIC_CONST]][_const.Flags[FLAG.MAGIC_FUNCTION]] = "MAGIC_FUNCTION";
        _const.ExclusiveFlags[Kinds[AST.MAGIC_CONST]][_const.Flags[FLAG.MAGIC_NAMESPACE]] = "MAGIC_NAMESPACE";
        _const.ExclusiveFlags[Kinds[AST.TYPE]] = [];
        _const.ExclusiveFlags[Kinds[AST.TYPE]][_const.Flags[FLAG.TYPE_NULL]] = "TYPE_NULL";
        _const.ExclusiveFlags[Kinds[AST.TYPE]][_const.Flags[FLAG.TYPE_LONG]] = "TYPE_LONG";
        _const.ExclusiveFlags[Kinds[AST.TYPE]][_const.Flags[FLAG.TYPE_DOUBLE]] = "TYPE_DOUBLE";
        _const.ExclusiveFlags[Kinds[AST.TYPE]][_const.Flags[FLAG.TYPE_STRING]] = "TYPE_STRING";
        _const.ExclusiveFlags[Kinds[AST.TYPE]][_const.Flags[FLAG.TYPE_ARRAY]] = "TYPE_ARRAY";
        _const.ExclusiveFlags[Kinds[AST.TYPE]][_const.Flags[FLAG.TYPE_OBJECT]] = "TYPE_OBJECT";
        _const.ExclusiveFlags[Kinds[AST.TYPE]][_const.Flags[FLAG.TYPE_BOOL]] = "TYPE_BOOL";
        _const.ExclusiveFlags[Kinds[AST.TYPE]][_const.Flags[FLAG.TYPE_CALLABLE]] = "TYPE_CALLABLE";
        _const.ExclusiveFlags[Kinds[AST.CLASS]] = [];
        _const.ExclusiveFlags[Kinds[AST.CLASS]][_const.Flags[FLAG.CLASS_FINAL]] = "CLASS_FINAL";
        _const.ExclusiveFlags[Kinds[AST.CLASS]][_const.Flags[FLAG.CLASS_ABSTRACT]] = "CLASS_ABSTRACT";
        _const.ExclusiveFlags[Kinds[AST.CLASS]][_const.Flags[FLAG.CLASS_INTERFACE]] = "CLASS_INTERFACE";
        _const.ExclusiveFlags[Kinds[AST.CLASS]][_const.Flags[FLAG.CLASS_TRAIT]] = "CLASS_TRAIT";
        _const.ExclusiveFlags[Kinds[AST.CLASS]][_const.Flags[FLAG.CLASS_ANONYMOUS]] = "CLASS_ANONYMOUS";
        _const.ExclusiveFlags[Kinds[AST.USE]] = [];
        _const.ExclusiveFlags[Kinds[AST.USE]][_const.Flags[FLAG.USE_FUNCTION]] = "USE_FUNCTION";
        _const.ExclusiveFlags[Kinds[AST.USE]][_const.Flags[FLAG.USE_CONST]] = "USE_CONST";
        _const.ExclusiveFlags[Kinds[AST.USE]][_const.Flags[FLAG.USE_NORMAL]] = "USE_NORMAL";
        _const.ExclusiveFlags[Kinds[AST.CAST]] = [];
        _const.ExclusiveFlags[Kinds[AST.CAST]][_const.Flags[FLAG.TYPE_NULL]] = "TYPE_NULL";
        _const.ExclusiveFlags[Kinds[AST.CAST]][_const.Flags[FLAG.TYPE_LONG]] = "TYPE_LONG";
        _const.ExclusiveFlags[Kinds[AST.CAST]][_const.Flags[FLAG.TYPE_DOUBLE]] = "TYPE_DOUBLE";
        _const.ExclusiveFlags[Kinds[AST.CAST]][_const.Flags[FLAG.TYPE_STRING]] = "TYPE_STRING";
        _const.ExclusiveFlags[Kinds[AST.CAST]][_const.Flags[FLAG.TYPE_ARRAY]] = "TYPE_ARRAY";
        _const.ExclusiveFlags[Kinds[AST.CAST]][_const.Flags[FLAG.TYPE_OBJECT]] = "TYPE_OBJECT";
        _const.ExclusiveFlags[Kinds[AST.CAST]][_const.Flags[FLAG.TYPE_BOOL]] = "TYPE_BOOL";
        _const.ExclusiveFlags[Kinds[AST.CAST]][_const.Flags[FLAG.TYPE_CALLABLE]] = "TYPE_CALLABLE";
        _const.ExclusiveFlags[Kinds[AST.INCLUDE_OR_EVAL]] = [];
        _const.ExclusiveFlags[Kinds[AST.INCLUDE_OR_EVAL]][_const.Flags[FLAG.EXEC_EVAL]] = "EXEC_EVAL";
        _const.ExclusiveFlags[Kinds[AST.INCLUDE_OR_EVAL]][_const.Flags[FLAG.EXEC_INCLUDE]] = "EXEC_INCLUDE";
        _const.ExclusiveFlags[Kinds[AST.INCLUDE_OR_EVAL]][_const.Flags[FLAG.EXEC_INCLUDE_ONCE]] = "EXEC_INCLUDE_ONCE";
        _const.ExclusiveFlags[Kinds[AST.INCLUDE_OR_EVAL]][_const.Flags[FLAG.EXEC_REQUIRE]] = "EXEC_REQUIRE";
        _const.ExclusiveFlags[Kinds[AST.INCLUDE_OR_EVAL]][_const.Flags[FLAG.EXEC_REQUIRE_ONCE]] = "EXEC_REQUIRE_ONCE";
        _const.ExclusiveFlags[Kinds[AST.UNARY_OP]] = [];
        _const.ExclusiveFlags[Kinds[AST.UNARY_OP]][_const.Flags[FLAG.UNARY_BITWISE_NOT]] = "UNARY_BITWISE_NOT";
        _const.ExclusiveFlags[Kinds[AST.UNARY_OP]][_const.Flags[FLAG.UNARY_BOOL_NOT]] = "UNARY_BOOL_NOT";
        _const.ExclusiveFlags[Kinds[AST.UNARY_OP]][_const.Flags[FLAG.UNARY_SILENCE]] = "UNARY_SILENCE";
        _const.ExclusiveFlags[Kinds[AST.UNARY_OP]][_const.Flags[FLAG.UNARY_PLUS]] = "UNARY_PLUS";
        _const.ExclusiveFlags[Kinds[AST.UNARY_OP]][_const.Flags[FLAG.UNARY_MINUS]] = "UNARY_MINUS";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]] = [];
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.BINARY_ADD]] = "BINARY_ADD";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.BINARY_SUB]] = "BINARY_SUB";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.BINARY_MUL]] = "BINARY_MUL";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.BINARY_DIV]] = "BINARY_DIV";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.BINARY_MOD]] = "BINARY_MOD";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.BINARY_SHIFT_LEFT]] = "BINARY_SHIFT_LEFT";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.BINARY_SHIFT_RIGHT]] = "BINARY_SHIFT_RIGHT";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.BINARY_CONCAT]] = "BINARY_CONCAT";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.BINARY_BITWISE_OR]] = "BINARY_BITWISE_OR";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.BINARY_BITWISE_AND]] = "BINARY_BITWISE_AND";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.BINARY_BITWISE_XOR]] = "BINARY_BITWISE_XOR";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.ASSIGN_ADD]] = "ASSIGN_ADD";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.ASSIGN_SUB]] = "ASSIGN_SUB";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.ASSIGN_MUL]] = "ASSIGN_MUL";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.ASSIGN_DIV]] = "ASSIGN_DIV";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.ASSIGN_MOD]] = "ASSIGN_MOD";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.ASSIGN_SHIFT_LEFT]] = "ASSIGN_SHIFT_LEFT";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.ASSIGN_SHIFT_RIGHT]] = "ASSIGN_SHIFT_RIGHT";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.ASSIGN_CONCAT]] = "ASSIGN_CONCAT";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.ASSIGN_BITWISE_OR]] = "ASSIGN_BITWISE_OR";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.ASSIGN_BITWISE_AND]] = "ASSIGN_BITWISE_AND";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.ASSIGN_BITWISE_XOR]] = "ASSIGN_BITWISE_XOR";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.BINARY_POW]] = "BINARY_POW";
        _const.ExclusiveFlags[Kinds[AST.ASSIGN_OP]][_const.Flags[FLAG.ASSIGN_POW]] = "ASSIGN_POW";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]] = [];
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_ADD]] = "BINARY_ADD";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_SUB]] = "BINARY_SUB";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_MUL]] = "BINARY_MUL";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_DIV]] = "BINARY_DIV";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_MOD]] = "BINARY_MOD";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_SHIFT_LEFT]] = "BINARY_SHIFT_LEFT";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_SHIFT_RIGHT]] = "BINARY_SHIFT_RIGHT";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_CONCAT]] = "BINARY_CONCAT";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_BITWISE_OR]] = "BINARY_BITWISE_OR";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_BITWISE_AND]] = "BINARY_BITWISE_AND";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_BITWISE_XOR]] = "BINARY_BITWISE_XOR";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_BOOL_XOR]] = "BINARY_BOOL_XOR";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_IS_IDENTICAL]] = "BINARY_IS_IDENTICAL";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_IS_NOT_IDENTICAL]] = "BINARY_IS_NOT_IDENTICAL";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_IS_EQUAL]] = "BINARY_IS_EQUAL";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_IS_NOT_EQUAL]] = "BINARY_IS_NOT_EQUAL";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_IS_SMALLER]] = "BINARY_IS_SMALLER";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_IS_SMALLER_OR_EQUAL]] = "BINARY_IS_SMALLER_OR_EQUAL";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_POW]] = "BINARY_POW";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_SPACESHIP]] = "BINARY_SPACESHIP";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_IS_GREATER]] = "BINARY_IS_GREATER";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_IS_GREATER_OR_EQUAL]] = "BINARY_IS_GREATER_OR_EQUAL";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_BOOL_OR]] = "BINARY_BOOL_OR";
        _const.ExclusiveFlags[Kinds[AST.BINARY_OP]][_const.Flags[FLAG.BINARY_BOOL_AND]] = "BINARY_BOOL_AND";
        _const.ExclusiveFlags[Kinds[AST.ARRAY_ELEM]] = [];
        _const.ExclusiveFlags[Kinds[AST.ARRAY_ELEM]][_const.Flags[FLAG.BY_REFERENCE]] = "BY_REFERENCE";
        _const.ExclusiveFlags[Kinds[AST.USE_ELEM]] = [];
        _const.ExclusiveFlags[Kinds[AST.USE_ELEM]][_const.Flags[FLAG.USE_FUNCTION]] = "USE_FUNCTION";
        _const.ExclusiveFlags[Kinds[AST.USE_ELEM]][_const.Flags[FLAG.USE_CONST]] = "USE_CONST";
        _const.ExclusiveFlags[Kinds[AST.USE_ELEM]][_const.Flags[FLAG.USE_NORMAL]] = "USE_NORMAL";
        _const.ExclusiveFlags[Kinds[AST.GROUP_USE]] = [];
        _const.ExclusiveFlags[Kinds[AST.GROUP_USE]][_const.Flags[FLAG.USE_FUNCTION]] = "USE_FUNCTION";
        _const.ExclusiveFlags[Kinds[AST.GROUP_USE]][_const.Flags[FLAG.USE_CONST]] = "USE_CONST";
        _const.ExclusiveFlags[Kinds[AST.GROUP_USE]][_const.Flags[FLAG.USE_NORMAL]] = "USE_NORMAL";
        _const.ExclusiveFlags[Kinds[AST.PARAM]] = [];
        _const.ExclusiveFlags[Kinds[AST.PARAM]][_const.Flags[FLAG.PARAM_REF]] = "PARAM_REF";
        _const.ExclusiveFlags[Kinds[AST.PARAM]][_const.Flags[FLAG.PARAM_VARIADIC]] = "PARAM_VARIADIC";
        _const.ExclusiveFlags[Kinds[AST.NAME]] = [];
        _const.ExclusiveFlags[Kinds[AST.NAME]][_const.Flags[FLAG.NAME_FQ]] = "NAME_FQ";
        _const.ExclusiveFlags[Kinds[AST.NAME]][_const.Flags[FLAG.NAME_NOT_FQ]] = "NAME_NOT_FQ";
        _const.ExclusiveFlags[Kinds[AST.NAME]][_const.Flags[FLAG.NAME_RELATIVE]] = "NAME_RELATIVE";
        _const.ExclusiveFlags[Kinds[AST.CLOSURE_VAR]] = [];
        _const.ExclusiveFlags[Kinds[AST.CLOSURE_VAR]][_const.Flags[FLAG.BY_REFERENCE]] = "BY_REFERENCE";
        _const.CombinableFlags = [];
        _const.CombinableFlags[Kinds[AST.FUNC_DECL]] = [];
        _const.CombinableFlags[Kinds[AST.FUNC_DECL]][_const.Flags[FLAG.MODIFIER_STATIC]] = "MODIFIER_STATIC";
        _const.CombinableFlags[Kinds[AST.FUNC_DECL]][_const.Flags[FLAG.MODIFIER_ABSTRACT]] = "MODIFIER_ABSTRACT";
        _const.CombinableFlags[Kinds[AST.FUNC_DECL]][_const.Flags[FLAG.MODIFIER_FINAL]] = "MODIFIER_FINAL";
        _const.CombinableFlags[Kinds[AST.FUNC_DECL]][_const.Flags[FLAG.MODIFIER_PUBLIC]] = "MODIFIER_PUBLIC";
        _const.CombinableFlags[Kinds[AST.FUNC_DECL]][_const.Flags[FLAG.MODIFIER_PROTECTED]] = "MODIFIER_PROTECTED";
        _const.CombinableFlags[Kinds[AST.FUNC_DECL]][_const.Flags[FLAG.MODIFIER_PRIVATE]] = "MODIFIER_PRIVATE";
        _const.CombinableFlags[Kinds[AST.FUNC_DECL]][_const.Flags[FLAG.RETURNS_REF]] = "RETURNS_REF";
        _const.CombinableFlags[Kinds[AST.CLOSURE]] = [];
        _const.CombinableFlags[Kinds[AST.CLOSURE]][_const.Flags[FLAG.MODIFIER_STATIC]] = "MODIFIER_STATIC";
        _const.CombinableFlags[Kinds[AST.CLOSURE]][_const.Flags[FLAG.MODIFIER_ABSTRACT]] = "MODIFIER_ABSTRACT";
        _const.CombinableFlags[Kinds[AST.CLOSURE]][_const.Flags[FLAG.MODIFIER_FINAL]] = "MODIFIER_FINAL";
        _const.CombinableFlags[Kinds[AST.CLOSURE]][_const.Flags[FLAG.MODIFIER_PUBLIC]] = "MODIFIER_PUBLIC";
        _const.CombinableFlags[Kinds[AST.CLOSURE]][_const.Flags[FLAG.MODIFIER_PROTECTED]] = "MODIFIER_PROTECTED";
        _const.CombinableFlags[Kinds[AST.CLOSURE]][_const.Flags[FLAG.MODIFIER_PRIVATE]] = "MODIFIER_PRIVATE";
        _const.CombinableFlags[Kinds[AST.CLOSURE]][_const.Flags[FLAG.RETURNS_REF]] = "RETURNS_REF";
        _const.CombinableFlags[Kinds[AST.METHOD]] = [];
        _const.CombinableFlags[Kinds[AST.METHOD]][_const.Flags[FLAG.MODIFIER_STATIC]] = "MODIFIER_STATIC";
        _const.CombinableFlags[Kinds[AST.METHOD]][_const.Flags[FLAG.MODIFIER_ABSTRACT]] = "MODIFIER_ABSTRACT";
        _const.CombinableFlags[Kinds[AST.METHOD]][_const.Flags[FLAG.MODIFIER_FINAL]] = "MODIFIER_FINAL";
        _const.CombinableFlags[Kinds[AST.METHOD]][_const.Flags[FLAG.MODIFIER_PUBLIC]] = "MODIFIER_PUBLIC";
        _const.CombinableFlags[Kinds[AST.METHOD]][_const.Flags[FLAG.MODIFIER_PROTECTED]] = "MODIFIER_PROTECTED";
        _const.CombinableFlags[Kinds[AST.METHOD]][_const.Flags[FLAG.MODIFIER_PRIVATE]] = "MODIFIER_PRIVATE";
        _const.CombinableFlags[Kinds[AST.METHOD]][_const.Flags[FLAG.RETURNS_REF]] = "RETURNS_REF";
        _const.CombinableFlags[Kinds[AST.PROP_DECL]] = [];
        _const.CombinableFlags[Kinds[AST.PROP_DECL]][_const.Flags[FLAG.MODIFIER_STATIC]] = "MODIFIER_STATIC";
        _const.CombinableFlags[Kinds[AST.PROP_DECL]][_const.Flags[FLAG.MODIFIER_ABSTRACT]] = "MODIFIER_ABSTRACT";
        _const.CombinableFlags[Kinds[AST.PROP_DECL]][_const.Flags[FLAG.MODIFIER_FINAL]] = "MODIFIER_FINAL";
        _const.CombinableFlags[Kinds[AST.PROP_DECL]][_const.Flags[FLAG.MODIFIER_PUBLIC]] = "MODIFIER_PUBLIC";
        _const.CombinableFlags[Kinds[AST.PROP_DECL]][_const.Flags[FLAG.MODIFIER_PROTECTED]] = "MODIFIER_PROTECTED";
        _const.CombinableFlags[Kinds[AST.PROP_DECL]][_const.Flags[FLAG.MODIFIER_PRIVATE]] = "MODIFIER_PRIVATE";
        _const.CombinableFlags[Kinds[AST.PROP_DECL]][_const.Flags[FLAG.RETURNS_REF]] = "RETURNS_REF";
        _const.CombinableFlags[Kinds[AST.CLASS_CONST_DECL]] = [];
        _const.CombinableFlags[Kinds[AST.CLASS_CONST_DECL]][_const.Flags[FLAG.MODIFIER_STATIC]] = "MODIFIER_STATIC";
        _const.CombinableFlags[Kinds[AST.CLASS_CONST_DECL]][_const.Flags[FLAG.MODIFIER_ABSTRACT]] = "MODIFIER_ABSTRACT";
        _const.CombinableFlags[Kinds[AST.CLASS_CONST_DECL]][_const.Flags[FLAG.MODIFIER_FINAL]] = "MODIFIER_FINAL";
        _const.CombinableFlags[Kinds[AST.CLASS_CONST_DECL]][_const.Flags[FLAG.MODIFIER_PUBLIC]] = "MODIFIER_PUBLIC";
        _const.CombinableFlags[Kinds[AST.CLASS_CONST_DECL]][_const.Flags[FLAG.MODIFIER_PROTECTED]] = "MODIFIER_PROTECTED";
        _const.CombinableFlags[Kinds[AST.CLASS_CONST_DECL]][_const.Flags[FLAG.MODIFIER_PRIVATE]] = "MODIFIER_PRIVATE";
        _const.CombinableFlags[Kinds[AST.CLASS_CONST_DECL]][_const.Flags[FLAG.RETURNS_REF]] = "RETURNS_REF";
        _const.CombinableFlags[Kinds[AST.TRAIT_ALIAS]] = [];
        _const.CombinableFlags[Kinds[AST.TRAIT_ALIAS]][_const.Flags[FLAG.MODIFIER_STATIC]] = "MODIFIER_STATIC";
        _const.CombinableFlags[Kinds[AST.TRAIT_ALIAS]][_const.Flags[FLAG.MODIFIER_ABSTRACT]] = "MODIFIER_ABSTRACT";
        _const.CombinableFlags[Kinds[AST.TRAIT_ALIAS]][_const.Flags[FLAG.MODIFIER_FINAL]] = "MODIFIER_FINAL";
        _const.CombinableFlags[Kinds[AST.TRAIT_ALIAS]][_const.Flags[FLAG.MODIFIER_PUBLIC]] = "MODIFIER_PUBLIC";
        _const.CombinableFlags[Kinds[AST.TRAIT_ALIAS]][_const.Flags[FLAG.MODIFIER_PROTECTED]] = "MODIFIER_PROTECTED";
        _const.CombinableFlags[Kinds[AST.TRAIT_ALIAS]][_const.Flags[FLAG.MODIFIER_PRIVATE]] = "MODIFIER_PRIVATE";
        _const.CombinableFlags[Kinds[AST.TRAIT_ALIAS]][_const.Flags[FLAG.RETURNS_REF]] = "RETURNS_REF";
    }
    (function (AST) {
        AST[AST["MAGIC_CONST"] = 0] = "MAGIC_CONST";
        AST[AST["TYPE"] = 1] = "TYPE";
        AST[AST["FUNC_DECL"] = 2] = "FUNC_DECL";
        AST[AST["CLOSURE"] = 3] = "CLOSURE";
        AST[AST["METHOD"] = 4] = "METHOD";
        AST[AST["CLASS"] = 5] = "CLASS";
        AST[AST["ARG_LIST"] = 6] = "ARG_LIST";
        AST[AST["LIST"] = 7] = "LIST";
        AST[AST["ARRAY"] = 8] = "ARRAY";
        AST[AST["ENCAPS_LIST"] = 9] = "ENCAPS_LIST";
        AST[AST["EXPR_LIST"] = 10] = "EXPR_LIST";
        AST[AST["STMT_LIST"] = 11] = "STMT_LIST";
        AST[AST["IF"] = 12] = "IF";
        AST[AST["SWITCH_LIST"] = 13] = "SWITCH_LIST";
        AST[AST["CATCH_LIST"] = 14] = "CATCH_LIST";
        AST[AST["PARAM_LIST"] = 15] = "PARAM_LIST";
        AST[AST["CLOSURE_USES"] = 16] = "CLOSURE_USES";
        AST[AST["PROP_DECL"] = 17] = "PROP_DECL";
        AST[AST["CONST_DECL"] = 18] = "CONST_DECL";
        AST[AST["CLASS_CONST_DECL"] = 19] = "CLASS_CONST_DECL";
        AST[AST["NAME_LIST"] = 20] = "NAME_LIST";
        AST[AST["TRAIT_ADAPTATIONS"] = 21] = "TRAIT_ADAPTATIONS";
        AST[AST["USE"] = 22] = "USE";
        AST[AST["VAR"] = 23] = "VAR";
        AST[AST["CONST"] = 24] = "CONST";
        AST[AST["UNPACK"] = 25] = "UNPACK";
        AST[AST["UNARY_PLUS"] = 26] = "UNARY_PLUS";
        AST[AST["UNARY_MINUS"] = 27] = "UNARY_MINUS";
        AST[AST["CAST"] = 28] = "CAST";
        AST[AST["EMPTY"] = 29] = "EMPTY";
        AST[AST["ISSET"] = 30] = "ISSET";
        AST[AST["SILENCE"] = 31] = "SILENCE";
        AST[AST["SHELL_EXEC"] = 32] = "SHELL_EXEC";
        AST[AST["CLONE"] = 33] = "CLONE";
        AST[AST["EXIT"] = 34] = "EXIT";
        AST[AST["PRINT"] = 35] = "PRINT";
        AST[AST["INCLUDE_OR_EVAL"] = 36] = "INCLUDE_OR_EVAL";
        AST[AST["UNARY_OP"] = 37] = "UNARY_OP";
        AST[AST["PRE_INC"] = 38] = "PRE_INC";
        AST[AST["PRE_DEC"] = 39] = "PRE_DEC";
        AST[AST["POST_INC"] = 40] = "POST_INC";
        AST[AST["POST_DEC"] = 41] = "POST_DEC";
        AST[AST["YIELD_FROM"] = 42] = "YIELD_FROM";
        AST[AST["GLOBAL"] = 43] = "GLOBAL";
        AST[AST["UNSET"] = 44] = "UNSET";
        AST[AST["RETURN"] = 45] = "RETURN";
        AST[AST["LABEL"] = 46] = "LABEL";
        AST[AST["REF"] = 47] = "REF";
        AST[AST["HALT_COMPILER"] = 48] = "HALT_COMPILER";
        AST[AST["ECHO"] = 49] = "ECHO";
        AST[AST["THROW"] = 50] = "THROW";
        AST[AST["GOTO"] = 51] = "GOTO";
        AST[AST["BREAK"] = 52] = "BREAK";
        AST[AST["CONTINUE"] = 53] = "CONTINUE";
        AST[AST["DIM"] = 54] = "DIM";
        AST[AST["PROP"] = 55] = "PROP";
        AST[AST["STATIC_PROP"] = 56] = "STATIC_PROP";
        AST[AST["CALL"] = 57] = "CALL";
        AST[AST["CLASS_CONST"] = 58] = "CLASS_CONST";
        AST[AST["ASSIGN"] = 59] = "ASSIGN";
        AST[AST["ASSIGN_REF"] = 60] = "ASSIGN_REF";
        AST[AST["ASSIGN_OP"] = 61] = "ASSIGN_OP";
        AST[AST["BINARY_OP"] = 62] = "BINARY_OP";
        AST[AST["GREATER"] = 63] = "GREATER";
        AST[AST["GREATER_EQUAL"] = 64] = "GREATER_EQUAL";
        AST[AST["AND"] = 65] = "AND";
        AST[AST["OR"] = 66] = "OR";
        AST[AST["ARRAY_ELEM"] = 67] = "ARRAY_ELEM";
        AST[AST["NEW"] = 68] = "NEW";
        AST[AST["INSTANCEOF"] = 69] = "INSTANCEOF";
        AST[AST["YIELD"] = 70] = "YIELD";
        AST[AST["COALESCE"] = 71] = "COALESCE";
        AST[AST["STATIC"] = 72] = "STATIC";
        AST[AST["WHILE"] = 73] = "WHILE";
        AST[AST["DO_WHILE"] = 74] = "DO_WHILE";
        AST[AST["IF_ELEM"] = 75] = "IF_ELEM";
        AST[AST["SWITCH"] = 76] = "SWITCH";
        AST[AST["SWITCH_CASE"] = 77] = "SWITCH_CASE";
        AST[AST["DECLARE"] = 78] = "DECLARE";
        AST[AST["CONST_ELEM"] = 79] = "CONST_ELEM";
        AST[AST["USE_TRAIT"] = 80] = "USE_TRAIT";
        AST[AST["TRAIT_PRECEDENCE"] = 81] = "TRAIT_PRECEDENCE";
        AST[AST["METHOD_REFERENCE"] = 82] = "METHOD_REFERENCE";
        AST[AST["NAMESPACE"] = 83] = "NAMESPACE";
        AST[AST["USE_ELEM"] = 84] = "USE_ELEM";
        AST[AST["TRAIT_ALIAS"] = 85] = "TRAIT_ALIAS";
        AST[AST["GROUP_USE"] = 86] = "GROUP_USE";
        AST[AST["METHOD_CALL"] = 87] = "METHOD_CALL";
        AST[AST["STATIC_CALL"] = 88] = "STATIC_CALL";
        AST[AST["CONDITIONAL"] = 89] = "CONDITIONAL";
        AST[AST["TRY"] = 90] = "TRY";
        AST[AST["CATCH"] = 91] = "CATCH";
        AST[AST["PARAM"] = 92] = "PARAM";
        AST[AST["PROP_ELEM"] = 93] = "PROP_ELEM";
        AST[AST["FOR"] = 94] = "FOR";
        AST[AST["FOREACH"] = 95] = "FOREACH";
        AST[AST["NAME"] = 96] = "NAME";
        AST[AST["CLOSURE_VAR"] = 97] = "CLOSURE_VAR";
    })(_const.AST || (_const.AST = {}));
    var AST = _const.AST;
    (function (FLAG) {
        FLAG[FLAG["BY_REFERENCE"] = 0] = "BY_REFERENCE";
        FLAG[FLAG["NAME_FQ"] = 1] = "NAME_FQ";
        FLAG[FLAG["NAME_NOT_FQ"] = 2] = "NAME_NOT_FQ";
        FLAG[FLAG["NAME_RELATIVE"] = 3] = "NAME_RELATIVE";
        FLAG[FLAG["MODIFIER_PUBLIC"] = 4] = "MODIFIER_PUBLIC";
        FLAG[FLAG["MODIFIER_PROTECTED"] = 5] = "MODIFIER_PROTECTED";
        FLAG[FLAG["MODIFIER_PRIVATE"] = 6] = "MODIFIER_PRIVATE";
        FLAG[FLAG["MODIFIER_STATIC"] = 7] = "MODIFIER_STATIC";
        FLAG[FLAG["MODIFIER_ABSTRACT"] = 8] = "MODIFIER_ABSTRACT";
        FLAG[FLAG["MODIFIER_FINAL"] = 9] = "MODIFIER_FINAL";
        FLAG[FLAG["RETURNS_REF"] = 10] = "RETURNS_REF";
        FLAG[FLAG["CLASS_ABSTRACT"] = 11] = "CLASS_ABSTRACT";
        FLAG[FLAG["CLASS_FINAL"] = 12] = "CLASS_FINAL";
        FLAG[FLAG["CLASS_TRAIT"] = 13] = "CLASS_TRAIT";
        FLAG[FLAG["CLASS_INTERFACE"] = 14] = "CLASS_INTERFACE";
        FLAG[FLAG["CLASS_ANONYMOUS"] = 15] = "CLASS_ANONYMOUS";
        FLAG[FLAG["PARAM_REF"] = 16] = "PARAM_REF";
        FLAG[FLAG["PARAM_VARIADIC"] = 17] = "PARAM_VARIADIC";
        FLAG[FLAG["TYPE_NULL"] = 18] = "TYPE_NULL";
        FLAG[FLAG["TYPE_BOOL"] = 19] = "TYPE_BOOL";
        FLAG[FLAG["TYPE_LONG"] = 20] = "TYPE_LONG";
        FLAG[FLAG["TYPE_DOUBLE"] = 21] = "TYPE_DOUBLE";
        FLAG[FLAG["TYPE_STRING"] = 22] = "TYPE_STRING";
        FLAG[FLAG["TYPE_ARRAY"] = 23] = "TYPE_ARRAY";
        FLAG[FLAG["TYPE_OBJECT"] = 24] = "TYPE_OBJECT";
        FLAG[FLAG["TYPE_CALLABLE"] = 25] = "TYPE_CALLABLE";
        FLAG[FLAG["UNARY_BOOL_NOT"] = 26] = "UNARY_BOOL_NOT";
        FLAG[FLAG["UNARY_BITWISE_NOT"] = 27] = "UNARY_BITWISE_NOT";
        FLAG[FLAG["UNARY_SILENCE"] = 28] = "UNARY_SILENCE";
        FLAG[FLAG["UNARY_PLUS"] = 29] = "UNARY_PLUS";
        FLAG[FLAG["UNARY_MINUS"] = 30] = "UNARY_MINUS";
        FLAG[FLAG["BINARY_BOOL_AND"] = 31] = "BINARY_BOOL_AND";
        FLAG[FLAG["BINARY_BOOL_OR"] = 32] = "BINARY_BOOL_OR";
        FLAG[FLAG["BINARY_BOOL_XOR"] = 33] = "BINARY_BOOL_XOR";
        FLAG[FLAG["BINARY_BITWISE_OR"] = 34] = "BINARY_BITWISE_OR";
        FLAG[FLAG["BINARY_BITWISE_AND"] = 35] = "BINARY_BITWISE_AND";
        FLAG[FLAG["BINARY_BITWISE_XOR"] = 36] = "BINARY_BITWISE_XOR";
        FLAG[FLAG["BINARY_CONCAT"] = 37] = "BINARY_CONCAT";
        FLAG[FLAG["BINARY_ADD"] = 38] = "BINARY_ADD";
        FLAG[FLAG["BINARY_SUB"] = 39] = "BINARY_SUB";
        FLAG[FLAG["BINARY_MUL"] = 40] = "BINARY_MUL";
        FLAG[FLAG["BINARY_DIV"] = 41] = "BINARY_DIV";
        FLAG[FLAG["BINARY_MOD"] = 42] = "BINARY_MOD";
        FLAG[FLAG["BINARY_POW"] = 43] = "BINARY_POW";
        FLAG[FLAG["BINARY_SHIFT_LEFT"] = 44] = "BINARY_SHIFT_LEFT";
        FLAG[FLAG["BINARY_SHIFT_RIGHT"] = 45] = "BINARY_SHIFT_RIGHT";
        FLAG[FLAG["BINARY_IS_IDENTICAL"] = 46] = "BINARY_IS_IDENTICAL";
        FLAG[FLAG["BINARY_IS_NOT_IDENTICAL"] = 47] = "BINARY_IS_NOT_IDENTICAL";
        FLAG[FLAG["BINARY_IS_EQUAL"] = 48] = "BINARY_IS_EQUAL";
        FLAG[FLAG["BINARY_IS_NOT_EQUAL"] = 49] = "BINARY_IS_NOT_EQUAL";
        FLAG[FLAG["BINARY_IS_SMALLER"] = 50] = "BINARY_IS_SMALLER";
        FLAG[FLAG["BINARY_IS_SMALLER_OR_EQUAL"] = 51] = "BINARY_IS_SMALLER_OR_EQUAL";
        FLAG[FLAG["BINARY_IS_GREATER"] = 52] = "BINARY_IS_GREATER";
        FLAG[FLAG["BINARY_IS_GREATER_OR_EQUAL"] = 53] = "BINARY_IS_GREATER_OR_EQUAL";
        FLAG[FLAG["BINARY_SPACESHIP"] = 54] = "BINARY_SPACESHIP";
        FLAG[FLAG["ASSIGN_BITWISE_OR"] = 55] = "ASSIGN_BITWISE_OR";
        FLAG[FLAG["ASSIGN_BITWISE_AND"] = 56] = "ASSIGN_BITWISE_AND";
        FLAG[FLAG["ASSIGN_BITWISE_XOR"] = 57] = "ASSIGN_BITWISE_XOR";
        FLAG[FLAG["ASSIGN_CONCAT"] = 58] = "ASSIGN_CONCAT";
        FLAG[FLAG["ASSIGN_ADD"] = 59] = "ASSIGN_ADD";
        FLAG[FLAG["ASSIGN_SUB"] = 60] = "ASSIGN_SUB";
        FLAG[FLAG["ASSIGN_MUL"] = 61] = "ASSIGN_MUL";
        FLAG[FLAG["ASSIGN_DIV"] = 62] = "ASSIGN_DIV";
        FLAG[FLAG["ASSIGN_MOD"] = 63] = "ASSIGN_MOD";
        FLAG[FLAG["ASSIGN_POW"] = 64] = "ASSIGN_POW";
        FLAG[FLAG["ASSIGN_SHIFT_LEFT"] = 65] = "ASSIGN_SHIFT_LEFT";
        FLAG[FLAG["ASSIGN_SHIFT_RIGHT"] = 66] = "ASSIGN_SHIFT_RIGHT";
        FLAG[FLAG["EXEC_EVAL"] = 67] = "EXEC_EVAL";
        FLAG[FLAG["EXEC_INCLUDE"] = 68] = "EXEC_INCLUDE";
        FLAG[FLAG["EXEC_INCLUDE_ONCE"] = 69] = "EXEC_INCLUDE_ONCE";
        FLAG[FLAG["EXEC_REQUIRE"] = 70] = "EXEC_REQUIRE";
        FLAG[FLAG["EXEC_REQUIRE_ONCE"] = 71] = "EXEC_REQUIRE_ONCE";
        FLAG[FLAG["USE_NORMAL"] = 72] = "USE_NORMAL";
        FLAG[FLAG["USE_FUNCTION"] = 73] = "USE_FUNCTION";
        FLAG[FLAG["USE_CONST"] = 74] = "USE_CONST";
        FLAG[FLAG["MAGIC_LINE"] = 75] = "MAGIC_LINE";
        FLAG[FLAG["MAGIC_FILE"] = 76] = "MAGIC_FILE";
        FLAG[FLAG["MAGIC_DIR"] = 77] = "MAGIC_DIR";
        FLAG[FLAG["MAGIC_NAMESPACE"] = 78] = "MAGIC_NAMESPACE";
        FLAG[FLAG["MAGIC_FUNCTION"] = 79] = "MAGIC_FUNCTION";
        FLAG[FLAG["MAGIC_METHOD"] = 80] = "MAGIC_METHOD";
        FLAG[FLAG["MAGIC_CLASS"] = 81] = "MAGIC_CLASS";
        FLAG[FLAG["MAGIC_TRAIT"] = 82] = "MAGIC_TRAIT";
    })(_const.FLAG || (_const.FLAG = {}));
    var FLAG = _const.FLAG;
    _const.CHILD_ADAPTATIONS = 'adaptations';
    _const.CHILD_ALIAS = 'alias';
    _const.CHILD_ARGS = 'args';
    _const.CHILD_CATCHES = 'catches';
    _const.CHILD_CLASS = 'class';
    _const.CHILD_COND = 'cond';
    _const.CHILD_CONST = 'const';
    _const.CHILD_DECLARES = 'declares';
    _const.CHILD_DEFAULT = 'default';
    _const.CHILD_DEPTH = 'depth';
    _const.CHILD_DIM = 'dim';
    _const.CHILD_EXPR = 'expr';
    _const.CHILD_EXTENDS = 'extends';
    _const.CHILD_FINALLY = 'finally';
    _const.CHILD_IMPLEMENTS = 'implements';
    _const.CHILD_INIT = 'init';
    _const.CHILD_INSTEADOF = 'insteadof';
    _const.CHILD_KEY = 'key';
    _const.CHILD_LABEL = 'label';
    _const.CHILD_LEFT = 'left';
    _const.CHILD_LOOP = 'loop';
    _const.CHILD_METHOD = 'method';
    _const.CHILD_NAME = 'name';
    _const.CHILD_OFFSET = 'offset';
    _const.CHILD_PARAMS = 'params';
    _const.CHILD_PREFIX = 'prefix';
    _const.CHILD_PROP = 'prop';
    _const.CHILD_RETURNTYPE = 'returnType';
    _const.CHILD_RIGHT = 'right';
    _const.CHILD_STMTS = 'stmts';
    _const.CHILD_TRAITS = 'traits';
    _const.CHILD_TRY = 'try';
    _const.CHILD_TYPE = 'type';
    _const.CHILD_USES = 'uses';
    _const.CHILD_VALUE = 'value';
    _const.CHILD_VAR = 'var';
    _const.CHILD_FALSE = 'false';
    _const.CHILD_TRUE = 'true';
})(_const || (_const = {}));
module.exports = _const;
//# sourceMappingURL=php2ts-const.js.map