namespace _const {

    let Kinds:{[key:number]:number};
    let LocalKinds:{[key:number]:number};
    export let Flags:{[key:number]:number};
    export let ExclusiveFlags:{[key:number]:{[key:number]:string}};
    export let CombinableFlags:{[key:number]:{[key:number]:string}};
    export let IgnoreSemicolon:{[key:number]:string};
    let constants:Constants;
    
    export function initialize(p_constants:Constants):void {
        constants = p_constants;
        setKinds();
        setFlags();
    }
    
    export let getOriginalKind = (kind:number):number => {
        return Kinds[kind];
    }
    
    export let getLocalKind = (kind:number):number => {
        return LocalKinds[kind];
    }
    
    export let flagsString = (kind:number, flags:number):string => {
        if(ExclusiveFlags[kind] !== undefined){
            let f = ExclusiveFlags[kind][flags];
            if(f === undefined){
                f = '';
            }
            return '(' + flags + ':' + f + ')';
        }
        if(CombinableFlags[kind] === undefined){
            return '';
        }
        let str = '';
        for(let key in CombinableFlags[kind]) {
            let fno = +key; // to number
            if(flags & fno) {
                if(str != ''){
                    str += ',';
                }
                str += CombinableFlags[kind][fno];
            }
        }
        return '(' + flags + ':' + str + ')';
    }
    
    export let getModifier = (flags:number):string => {
        let code:string[] = [];
        if(flags & Flags[FLAG.MODIFIER_PUBLIC]){
            code.push('public');
        }
        if(flags & Flags[FLAG.MODIFIER_PROTECTED]){
            code.push('protected');
        }
        if(flags & Flags[FLAG.MODIFIER_PRIVATE]){
            code.push('private');
        }
        if(flags & Flags[FLAG.MODIFIER_STATIC]){
            code.push('static');
        }
        if(flags & Flags[FLAG.MODIFIER_ABSTRACT]){
            code.push('abstract');
        }
        if(flags & Flags[FLAG.MODIFIER_FINAL]){
            code.push('/* final */');
        }
        if(flags & Flags[FLAG.RETURNS_REF]){
            code.push('/* & */');
        }
        return code.join(' ');
    }
    
    export function KindsForeach(callback:(str:string,localNumber:number,originalNumber:number)=>void) {
        for(let v in AST) {
            if(isNaN(<any>v)) {
                let localNumber:number = <any>AST[v];
                let str:string = 'AST_' + v;
                callback(str,localNumber,Kinds[localNumber]);
            }
        }
    }
    
    function setKinds():void {
        let kinds = constants['kinds'];
        let originalKind = (name:string):number => {
            let n = kinds[name];
            if(n === undefined) {
                console.error('Undefined kind "' + name + '"');
            }
            return n;
        };
        Kinds = [];
        LocalKinds = [];
        for(let v in AST) {
            if(isNaN(<any>v)) {
                let localNUmber:number = <any>AST[v];
                let str:string = 'AST_' + v;
                LocalKinds[Kinds[localNUmber] = originalKind(str)] = localNUmber;
            }
        }
        
        IgnoreSemicolon = [];
        IgnoreSemicolon[Kinds[AST.FUNC_DECL]] = 'AST_FUNC_DECL';
        IgnoreSemicolon[Kinds[AST.CLOSURE]] = 'AST_CLOSURE';
        IgnoreSemicolon[Kinds[AST.CLASS]] = 'AST_CLASS';
        IgnoreSemicolon[Kinds[AST.STMT_LIST]] = 'AST_STMT_LIST';
        IgnoreSemicolon[Kinds[AST.IF]] = 'AST_IF';
        IgnoreSemicolon[Kinds[AST.TRAIT_ADAPTATIONS]] = 'AST_TRAIT_ADAPTATIONS';
        IgnoreSemicolon[Kinds[AST.WHILE]] = 'AST_WHILE';
        IgnoreSemicolon[Kinds[AST.DO_WHILE]] = 'AST_DO_WHILE';
        IgnoreSemicolon[Kinds[AST.SWITCH]] = 'AST_SWITCH';
        IgnoreSemicolon[Kinds[AST.SWITCH_CASE]] = 'AST_SWITCH_CASE';
        IgnoreSemicolon[Kinds[AST.USE_TRAIT]] = 'AST_USE_TRAIT';
        IgnoreSemicolon[Kinds[AST.NAMESPACE]] = 'AST_NAMESPACE';
        IgnoreSemicolon[Kinds[AST.FOR]] = 'AST_FOR';
        IgnoreSemicolon[Kinds[AST.FOREACH]] = 'AST_FOREACH';
        IgnoreSemicolon[Kinds[AST.TRY]] = 'AST_TRY';
        IgnoreSemicolon[Kinds[AST.CATCH]] = 'AST_CATCH';
        IgnoreSemicolon[Kinds[AST.USE]] = 'AST_USE';
        IgnoreSemicolon[Kinds[AST.USE_ELEM]] = 'AST_USE_ELEM';
    }

    function setFlags ():void {
        let flags = constants['flags'];
        let originalFlag = (name:string):number => {
            let n = flags[name];
            if(n === undefined) {
                if(name == 'BY_REFERENCE') {
                    n = 1;
                } else {
                    console.error('Undefined flag "' + name + '"');
                }
            }
            return n;
        };
        Flags = [];
        for(let v in FLAG) {
            if(isNaN(<any>v)) {
                let n:number = <any>FLAG[v];
                let s:string = v;
                Flags[n] = originalFlag(s);
            }
        }
        
        ExclusiveFlags = [];
        ExclusiveFlags[Kinds[AST.MAGIC_CONST]] = [];
        ExclusiveFlags[Kinds[AST.MAGIC_CONST]][Flags[FLAG.MAGIC_LINE]] = "MAGIC_LINE";
        ExclusiveFlags[Kinds[AST.MAGIC_CONST]][Flags[FLAG.MAGIC_FILE]] = "MAGIC_FILE";
        ExclusiveFlags[Kinds[AST.MAGIC_CONST]][Flags[FLAG.MAGIC_DIR]] = "MAGIC_DIR";
        ExclusiveFlags[Kinds[AST.MAGIC_CONST]][Flags[FLAG.MAGIC_CLASS]] = "MAGIC_CLASS";
        ExclusiveFlags[Kinds[AST.MAGIC_CONST]][Flags[FLAG.MAGIC_TRAIT]] = "MAGIC_TRAIT";
        ExclusiveFlags[Kinds[AST.MAGIC_CONST]][Flags[FLAG.MAGIC_METHOD]] = "MAGIC_METHOD";
        ExclusiveFlags[Kinds[AST.MAGIC_CONST]][Flags[FLAG.MAGIC_FUNCTION]] = "MAGIC_FUNCTION";
        ExclusiveFlags[Kinds[AST.MAGIC_CONST]][Flags[FLAG.MAGIC_NAMESPACE]] = "MAGIC_NAMESPACE";
        ExclusiveFlags[Kinds[AST.TYPE]] = [];
        ExclusiveFlags[Kinds[AST.TYPE]][Flags[FLAG.TYPE_NULL]] = "TYPE_NULL";
        ExclusiveFlags[Kinds[AST.TYPE]][Flags[FLAG.TYPE_LONG]] = "TYPE_LONG";
        ExclusiveFlags[Kinds[AST.TYPE]][Flags[FLAG.TYPE_DOUBLE]] = "TYPE_DOUBLE";
        ExclusiveFlags[Kinds[AST.TYPE]][Flags[FLAG.TYPE_STRING]] = "TYPE_STRING";
        ExclusiveFlags[Kinds[AST.TYPE]][Flags[FLAG.TYPE_ARRAY]] = "TYPE_ARRAY";
        ExclusiveFlags[Kinds[AST.TYPE]][Flags[FLAG.TYPE_OBJECT]] = "TYPE_OBJECT";
        ExclusiveFlags[Kinds[AST.TYPE]][Flags[FLAG.TYPE_BOOL]] = "TYPE_BOOL";
        ExclusiveFlags[Kinds[AST.TYPE]][Flags[FLAG.TYPE_CALLABLE]] = "TYPE_CALLABLE";
        ExclusiveFlags[Kinds[AST.CLASS]] = [];
        ExclusiveFlags[Kinds[AST.CLASS]][Flags[FLAG.CLASS_FINAL]] = "CLASS_FINAL";
        ExclusiveFlags[Kinds[AST.CLASS]][Flags[FLAG.CLASS_ABSTRACT]] = "CLASS_ABSTRACT";
        ExclusiveFlags[Kinds[AST.CLASS]][Flags[FLAG.CLASS_INTERFACE]] = "CLASS_INTERFACE";
        ExclusiveFlags[Kinds[AST.CLASS]][Flags[FLAG.CLASS_TRAIT]] = "CLASS_TRAIT";
        ExclusiveFlags[Kinds[AST.CLASS]][Flags[FLAG.CLASS_ANONYMOUS]] = "CLASS_ANONYMOUS";
        ExclusiveFlags[Kinds[AST.USE]] = [];
        ExclusiveFlags[Kinds[AST.USE]][Flags[FLAG.USE_FUNCTION]] = "USE_FUNCTION";
        ExclusiveFlags[Kinds[AST.USE]][Flags[FLAG.USE_CONST]] = "USE_CONST";
        ExclusiveFlags[Kinds[AST.USE]][Flags[FLAG.USE_NORMAL]] = "USE_NORMAL";
        ExclusiveFlags[Kinds[AST.CAST]] = [];
        ExclusiveFlags[Kinds[AST.CAST]][Flags[FLAG.TYPE_NULL]] = "TYPE_NULL";
        ExclusiveFlags[Kinds[AST.CAST]][Flags[FLAG.TYPE_LONG]] = "TYPE_LONG";
        ExclusiveFlags[Kinds[AST.CAST]][Flags[FLAG.TYPE_DOUBLE]] = "TYPE_DOUBLE";
        ExclusiveFlags[Kinds[AST.CAST]][Flags[FLAG.TYPE_STRING]] = "TYPE_STRING";
        ExclusiveFlags[Kinds[AST.CAST]][Flags[FLAG.TYPE_ARRAY]] = "TYPE_ARRAY";
        ExclusiveFlags[Kinds[AST.CAST]][Flags[FLAG.TYPE_OBJECT]] = "TYPE_OBJECT";
        ExclusiveFlags[Kinds[AST.CAST]][Flags[FLAG.TYPE_BOOL]] = "TYPE_BOOL";
        ExclusiveFlags[Kinds[AST.CAST]][Flags[FLAG.TYPE_CALLABLE]] = "TYPE_CALLABLE";
        ExclusiveFlags[Kinds[AST.INCLUDE_OR_EVAL]] = [];
        ExclusiveFlags[Kinds[AST.INCLUDE_OR_EVAL]][Flags[FLAG.EXEC_EVAL]] = "EXEC_EVAL";
        ExclusiveFlags[Kinds[AST.INCLUDE_OR_EVAL]][Flags[FLAG.EXEC_INCLUDE]] = "EXEC_INCLUDE";
        ExclusiveFlags[Kinds[AST.INCLUDE_OR_EVAL]][Flags[FLAG.EXEC_INCLUDE_ONCE]] = "EXEC_INCLUDE_ONCE";
        ExclusiveFlags[Kinds[AST.INCLUDE_OR_EVAL]][Flags[FLAG.EXEC_REQUIRE]] = "EXEC_REQUIRE";
        ExclusiveFlags[Kinds[AST.INCLUDE_OR_EVAL]][Flags[FLAG.EXEC_REQUIRE_ONCE]] = "EXEC_REQUIRE_ONCE";
        ExclusiveFlags[Kinds[AST.UNARY_OP]] = [];
        ExclusiveFlags[Kinds[AST.UNARY_OP]][Flags[FLAG.UNARY_BITWISE_NOT]] = "UNARY_BITWISE_NOT";
        ExclusiveFlags[Kinds[AST.UNARY_OP]][Flags[FLAG.UNARY_BOOL_NOT]] = "UNARY_BOOL_NOT";
        ExclusiveFlags[Kinds[AST.UNARY_OP]][Flags[FLAG.UNARY_SILENCE]] = "UNARY_SILENCE";
        ExclusiveFlags[Kinds[AST.UNARY_OP]][Flags[FLAG.UNARY_PLUS]] = "UNARY_PLUS";
        ExclusiveFlags[Kinds[AST.UNARY_OP]][Flags[FLAG.UNARY_MINUS]] = "UNARY_MINUS";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]] = [];
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.BINARY_ADD]] = "BINARY_ADD";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.BINARY_SUB]] = "BINARY_SUB";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.BINARY_MUL]] = "BINARY_MUL";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.BINARY_DIV]] = "BINARY_DIV";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.BINARY_MOD]] = "BINARY_MOD";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.BINARY_SHIFT_LEFT]] = "BINARY_SHIFT_LEFT";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.BINARY_SHIFT_RIGHT]] = "BINARY_SHIFT_RIGHT";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.BINARY_CONCAT]] = "BINARY_CONCAT";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.BINARY_BITWISE_OR]] = "BINARY_BITWISE_OR";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.BINARY_BITWISE_AND]] = "BINARY_BITWISE_AND";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.BINARY_BITWISE_XOR]] = "BINARY_BITWISE_XOR";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.ASSIGN_ADD]] = "ASSIGN_ADD";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.ASSIGN_SUB]] = "ASSIGN_SUB";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.ASSIGN_MUL]] = "ASSIGN_MUL";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.ASSIGN_DIV]] = "ASSIGN_DIV";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.ASSIGN_MOD]] = "ASSIGN_MOD";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.ASSIGN_SHIFT_LEFT]] = "ASSIGN_SHIFT_LEFT";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.ASSIGN_SHIFT_RIGHT]] = "ASSIGN_SHIFT_RIGHT";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.ASSIGN_CONCAT]] = "ASSIGN_CONCAT";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.ASSIGN_BITWISE_OR]] = "ASSIGN_BITWISE_OR";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.ASSIGN_BITWISE_AND]] = "ASSIGN_BITWISE_AND";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.ASSIGN_BITWISE_XOR]] = "ASSIGN_BITWISE_XOR";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.BINARY_POW]] = "BINARY_POW";
        ExclusiveFlags[Kinds[AST.ASSIGN_OP]][Flags[FLAG.ASSIGN_POW]] = "ASSIGN_POW";
        ExclusiveFlags[Kinds[AST.BINARY_OP]] = [];
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_ADD]] = "BINARY_ADD";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_SUB]] = "BINARY_SUB";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_MUL]] = "BINARY_MUL";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_DIV]] = "BINARY_DIV";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_MOD]] = "BINARY_MOD";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_SHIFT_LEFT]] = "BINARY_SHIFT_LEFT";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_SHIFT_RIGHT]] = "BINARY_SHIFT_RIGHT";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_CONCAT]] = "BINARY_CONCAT";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_BITWISE_OR]] = "BINARY_BITWISE_OR";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_BITWISE_AND]] = "BINARY_BITWISE_AND";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_BITWISE_XOR]] = "BINARY_BITWISE_XOR";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_BOOL_XOR]] = "BINARY_BOOL_XOR";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_IS_IDENTICAL]] = "BINARY_IS_IDENTICAL";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_IS_NOT_IDENTICAL]] = "BINARY_IS_NOT_IDENTICAL";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_IS_EQUAL]] = "BINARY_IS_EQUAL";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_IS_NOT_EQUAL]] = "BINARY_IS_NOT_EQUAL";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_IS_SMALLER]] = "BINARY_IS_SMALLER";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_IS_SMALLER_OR_EQUAL]] = "BINARY_IS_SMALLER_OR_EQUAL";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_POW]] = "BINARY_POW";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_SPACESHIP]] = "BINARY_SPACESHIP";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_IS_GREATER]] = "BINARY_IS_GREATER";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_IS_GREATER_OR_EQUAL]] = "BINARY_IS_GREATER_OR_EQUAL";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_BOOL_OR]] = "BINARY_BOOL_OR";
        ExclusiveFlags[Kinds[AST.BINARY_OP]][Flags[FLAG.BINARY_BOOL_AND]] = "BINARY_BOOL_AND";
        ExclusiveFlags[Kinds[AST.ARRAY_ELEM]] = [];
        ExclusiveFlags[Kinds[AST.ARRAY_ELEM]][Flags[FLAG.BY_REFERENCE]] = "BY_REFERENCE";
        ExclusiveFlags[Kinds[AST.USE_ELEM]] = [];
        ExclusiveFlags[Kinds[AST.USE_ELEM]][Flags[FLAG.USE_FUNCTION]] = "USE_FUNCTION";
        ExclusiveFlags[Kinds[AST.USE_ELEM]][Flags[FLAG.USE_CONST]] = "USE_CONST";
        ExclusiveFlags[Kinds[AST.USE_ELEM]][Flags[FLAG.USE_NORMAL]] = "USE_NORMAL";
        ExclusiveFlags[Kinds[AST.GROUP_USE]] = [];
        ExclusiveFlags[Kinds[AST.GROUP_USE]][Flags[FLAG.USE_FUNCTION]] = "USE_FUNCTION";
        ExclusiveFlags[Kinds[AST.GROUP_USE]][Flags[FLAG.USE_CONST]] = "USE_CONST";
        ExclusiveFlags[Kinds[AST.GROUP_USE]][Flags[FLAG.USE_NORMAL]] = "USE_NORMAL";
        ExclusiveFlags[Kinds[AST.PARAM]] = [];
        ExclusiveFlags[Kinds[AST.PARAM]][Flags[FLAG.PARAM_REF]] = "PARAM_REF";
        ExclusiveFlags[Kinds[AST.PARAM]][Flags[FLAG.PARAM_VARIADIC]] = "PARAM_VARIADIC";
        ExclusiveFlags[Kinds[AST.NAME]] = [];
        ExclusiveFlags[Kinds[AST.NAME]][Flags[FLAG.NAME_FQ]] = "NAME_FQ";
        ExclusiveFlags[Kinds[AST.NAME]][Flags[FLAG.NAME_NOT_FQ]] = "NAME_NOT_FQ";
        ExclusiveFlags[Kinds[AST.NAME]][Flags[FLAG.NAME_RELATIVE]] = "NAME_RELATIVE";
        ExclusiveFlags[Kinds[AST.CLOSURE_VAR]] = [];
        ExclusiveFlags[Kinds[AST.CLOSURE_VAR]][Flags[FLAG.BY_REFERENCE]] = "BY_REFERENCE";
        CombinableFlags = [];
        CombinableFlags[Kinds[AST.FUNC_DECL]] = [];
        CombinableFlags[Kinds[AST.FUNC_DECL]][Flags[FLAG.MODIFIER_STATIC]] = "MODIFIER_STATIC";
        CombinableFlags[Kinds[AST.FUNC_DECL]][Flags[FLAG.MODIFIER_ABSTRACT]] = "MODIFIER_ABSTRACT";
        CombinableFlags[Kinds[AST.FUNC_DECL]][Flags[FLAG.MODIFIER_FINAL]] = "MODIFIER_FINAL";
        CombinableFlags[Kinds[AST.FUNC_DECL]][Flags[FLAG.MODIFIER_PUBLIC]] = "MODIFIER_PUBLIC";
        CombinableFlags[Kinds[AST.FUNC_DECL]][Flags[FLAG.MODIFIER_PROTECTED]] = "MODIFIER_PROTECTED";
        CombinableFlags[Kinds[AST.FUNC_DECL]][Flags[FLAG.MODIFIER_PRIVATE]] = "MODIFIER_PRIVATE";
        CombinableFlags[Kinds[AST.FUNC_DECL]][Flags[FLAG.RETURNS_REF]] = "RETURNS_REF";
        CombinableFlags[Kinds[AST.CLOSURE]] = [];
        CombinableFlags[Kinds[AST.CLOSURE]][Flags[FLAG.MODIFIER_STATIC]] = "MODIFIER_STATIC";
        CombinableFlags[Kinds[AST.CLOSURE]][Flags[FLAG.MODIFIER_ABSTRACT]] = "MODIFIER_ABSTRACT";
        CombinableFlags[Kinds[AST.CLOSURE]][Flags[FLAG.MODIFIER_FINAL]] = "MODIFIER_FINAL";
        CombinableFlags[Kinds[AST.CLOSURE]][Flags[FLAG.MODIFIER_PUBLIC]] = "MODIFIER_PUBLIC";
        CombinableFlags[Kinds[AST.CLOSURE]][Flags[FLAG.MODIFIER_PROTECTED]] = "MODIFIER_PROTECTED";
        CombinableFlags[Kinds[AST.CLOSURE]][Flags[FLAG.MODIFIER_PRIVATE]] = "MODIFIER_PRIVATE";
        CombinableFlags[Kinds[AST.CLOSURE]][Flags[FLAG.RETURNS_REF]] = "RETURNS_REF";
        CombinableFlags[Kinds[AST.METHOD]] = [];
        CombinableFlags[Kinds[AST.METHOD]][Flags[FLAG.MODIFIER_STATIC]] = "MODIFIER_STATIC";
        CombinableFlags[Kinds[AST.METHOD]][Flags[FLAG.MODIFIER_ABSTRACT]] = "MODIFIER_ABSTRACT";
        CombinableFlags[Kinds[AST.METHOD]][Flags[FLAG.MODIFIER_FINAL]] = "MODIFIER_FINAL";
        CombinableFlags[Kinds[AST.METHOD]][Flags[FLAG.MODIFIER_PUBLIC]] = "MODIFIER_PUBLIC";
        CombinableFlags[Kinds[AST.METHOD]][Flags[FLAG.MODIFIER_PROTECTED]] = "MODIFIER_PROTECTED";
        CombinableFlags[Kinds[AST.METHOD]][Flags[FLAG.MODIFIER_PRIVATE]] = "MODIFIER_PRIVATE";
        CombinableFlags[Kinds[AST.METHOD]][Flags[FLAG.RETURNS_REF]] = "RETURNS_REF";
        CombinableFlags[Kinds[AST.PROP_DECL]] = [];
        CombinableFlags[Kinds[AST.PROP_DECL]][Flags[FLAG.MODIFIER_STATIC]] = "MODIFIER_STATIC";
        CombinableFlags[Kinds[AST.PROP_DECL]][Flags[FLAG.MODIFIER_ABSTRACT]] = "MODIFIER_ABSTRACT";
        CombinableFlags[Kinds[AST.PROP_DECL]][Flags[FLAG.MODIFIER_FINAL]] = "MODIFIER_FINAL";
        CombinableFlags[Kinds[AST.PROP_DECL]][Flags[FLAG.MODIFIER_PUBLIC]] = "MODIFIER_PUBLIC";
        CombinableFlags[Kinds[AST.PROP_DECL]][Flags[FLAG.MODIFIER_PROTECTED]] = "MODIFIER_PROTECTED";
        CombinableFlags[Kinds[AST.PROP_DECL]][Flags[FLAG.MODIFIER_PRIVATE]] = "MODIFIER_PRIVATE";
        CombinableFlags[Kinds[AST.PROP_DECL]][Flags[FLAG.RETURNS_REF]] = "RETURNS_REF";
        CombinableFlags[Kinds[AST.CLASS_CONST_DECL]] = [];
        CombinableFlags[Kinds[AST.CLASS_CONST_DECL]][Flags[FLAG.MODIFIER_STATIC]] = "MODIFIER_STATIC";
        CombinableFlags[Kinds[AST.CLASS_CONST_DECL]][Flags[FLAG.MODIFIER_ABSTRACT]] = "MODIFIER_ABSTRACT";
        CombinableFlags[Kinds[AST.CLASS_CONST_DECL]][Flags[FLAG.MODIFIER_FINAL]] = "MODIFIER_FINAL";
        CombinableFlags[Kinds[AST.CLASS_CONST_DECL]][Flags[FLAG.MODIFIER_PUBLIC]] = "MODIFIER_PUBLIC";
        CombinableFlags[Kinds[AST.CLASS_CONST_DECL]][Flags[FLAG.MODIFIER_PROTECTED]] = "MODIFIER_PROTECTED";
        CombinableFlags[Kinds[AST.CLASS_CONST_DECL]][Flags[FLAG.MODIFIER_PRIVATE]] = "MODIFIER_PRIVATE";
        CombinableFlags[Kinds[AST.CLASS_CONST_DECL]][Flags[FLAG.RETURNS_REF]] = "RETURNS_REF";
        CombinableFlags[Kinds[AST.TRAIT_ALIAS]] = [];
        CombinableFlags[Kinds[AST.TRAIT_ALIAS]][Flags[FLAG.MODIFIER_STATIC]] = "MODIFIER_STATIC";
        CombinableFlags[Kinds[AST.TRAIT_ALIAS]][Flags[FLAG.MODIFIER_ABSTRACT]] = "MODIFIER_ABSTRACT";
        CombinableFlags[Kinds[AST.TRAIT_ALIAS]][Flags[FLAG.MODIFIER_FINAL]] = "MODIFIER_FINAL";
        CombinableFlags[Kinds[AST.TRAIT_ALIAS]][Flags[FLAG.MODIFIER_PUBLIC]] = "MODIFIER_PUBLIC";
        CombinableFlags[Kinds[AST.TRAIT_ALIAS]][Flags[FLAG.MODIFIER_PROTECTED]] = "MODIFIER_PROTECTED";
        CombinableFlags[Kinds[AST.TRAIT_ALIAS]][Flags[FLAG.MODIFIER_PRIVATE]] = "MODIFIER_PRIVATE";
        CombinableFlags[Kinds[AST.TRAIT_ALIAS]][Flags[FLAG.RETURNS_REF]] = "RETURNS_REF";
    }
    
    export enum AST {
        MAGIC_CONST,
        TYPE,
        FUNC_DECL,
        CLOSURE,
        METHOD,
        CLASS,
        ARG_LIST,
        LIST,
        ARRAY,
        ENCAPS_LIST,
        EXPR_LIST,
        STMT_LIST,
        IF,
        SWITCH_LIST,
        CATCH_LIST,
        PARAM_LIST,
        CLOSURE_USES,
        PROP_DECL,
        CONST_DECL,
        CLASS_CONST_DECL,
        NAME_LIST,
        TRAIT_ADAPTATIONS,
        USE,
        VAR,
        CONST,
        UNPACK,
        UNARY_PLUS,
        UNARY_MINUS,
        CAST,
        EMPTY,
        ISSET,
        SILENCE,
        SHELL_EXEC,
        CLONE,
        EXIT,
        PRINT,
        INCLUDE_OR_EVAL,
        UNARY_OP,
        PRE_INC,
        PRE_DEC,
        POST_INC,
        POST_DEC,
        YIELD_FROM,
        GLOBAL,
        UNSET,
        RETURN,
        LABEL,
        REF,
        HALT_COMPILER,
        ECHO,
        THROW,
        GOTO,
        BREAK,
        CONTINUE,
        DIM,
        PROP,
        STATIC_PROP,
        CALL,
        CLASS_CONST,
        ASSIGN,
        ASSIGN_REF,
        ASSIGN_OP,
        BINARY_OP,
        GREATER,
        GREATER_EQUAL,
        AND,
        OR,
        ARRAY_ELEM,
        NEW,
        INSTANCEOF,
        YIELD,
        COALESCE,
        STATIC,
        WHILE,
        DO_WHILE,
        IF_ELEM,
        SWITCH,
        SWITCH_CASE,
        DECLARE,
        CONST_ELEM,
        USE_TRAIT,
        TRAIT_PRECEDENCE,
        METHOD_REFERENCE,
        NAMESPACE,
        USE_ELEM,
        TRAIT_ALIAS,
        GROUP_USE,
        METHOD_CALL,
        STATIC_CALL,
        CONDITIONAL,
        TRY,
        CATCH,
        PARAM,
        PROP_ELEM,
        FOR,
        FOREACH,
        NAME,
        CLOSURE_VAR,
    }

    export enum FLAG {
        BY_REFERENCE,
        NAME_FQ,
        NAME_NOT_FQ,
        NAME_RELATIVE,
        MODIFIER_PUBLIC,
        MODIFIER_PROTECTED,
        MODIFIER_PRIVATE,
        MODIFIER_STATIC,
        MODIFIER_ABSTRACT,
        MODIFIER_FINAL,
        RETURNS_REF,
        CLASS_ABSTRACT,
        CLASS_FINAL,
        CLASS_TRAIT,
        CLASS_INTERFACE,
        CLASS_ANONYMOUS,
        PARAM_REF,
        PARAM_VARIADIC,
        TYPE_NULL,
        TYPE_BOOL,
        TYPE_LONG,
        TYPE_DOUBLE,
        TYPE_STRING,
        TYPE_ARRAY,
        TYPE_OBJECT,
        TYPE_CALLABLE,
        UNARY_BOOL_NOT,
        UNARY_BITWISE_NOT,
        UNARY_SILENCE,
        UNARY_PLUS,
        UNARY_MINUS,
        BINARY_BOOL_AND,
        BINARY_BOOL_OR,
        BINARY_BOOL_XOR,
        BINARY_BITWISE_OR,
        BINARY_BITWISE_AND,
        BINARY_BITWISE_XOR,
        BINARY_CONCAT,
        BINARY_ADD,
        BINARY_SUB,
        BINARY_MUL,
        BINARY_DIV,
        BINARY_MOD,
        BINARY_POW,
        BINARY_SHIFT_LEFT,
        BINARY_SHIFT_RIGHT,
        BINARY_IS_IDENTICAL,
        BINARY_IS_NOT_IDENTICAL,
        BINARY_IS_EQUAL,
        BINARY_IS_NOT_EQUAL,
        BINARY_IS_SMALLER,
        BINARY_IS_SMALLER_OR_EQUAL,
        BINARY_IS_GREATER,
        BINARY_IS_GREATER_OR_EQUAL,
        BINARY_SPACESHIP,
        ASSIGN_BITWISE_OR,
        ASSIGN_BITWISE_AND,
        ASSIGN_BITWISE_XOR,
        ASSIGN_CONCAT,
        ASSIGN_ADD,
        ASSIGN_SUB,
        ASSIGN_MUL,
        ASSIGN_DIV,
        ASSIGN_MOD,
        ASSIGN_POW,
        ASSIGN_SHIFT_LEFT,
        ASSIGN_SHIFT_RIGHT,
        EXEC_EVAL,
        EXEC_INCLUDE,
        EXEC_INCLUDE_ONCE,
        EXEC_REQUIRE,
        EXEC_REQUIRE_ONCE,
        USE_NORMAL,
        USE_FUNCTION,
        USE_CONST,
        MAGIC_LINE,
        MAGIC_FILE,
        MAGIC_DIR,
        MAGIC_NAMESPACE,
        MAGIC_FUNCTION,
        MAGIC_METHOD,
        MAGIC_CLASS,
        MAGIC_TRAIT,
    }

    export const CHILD_ADAPTATIONS = 'adaptations';
    export const CHILD_ALIAS = 'alias';
    export const CHILD_ARGS = 'args';
    export const CHILD_CATCHES = 'catches';
    export const CHILD_CLASS = 'class';
    export const CHILD_COND = 'cond';
    export const CHILD_CONST = 'const';
    export const CHILD_DECLARES = 'declares';
    export const CHILD_DEFAULT = 'default';
    export const CHILD_DEPTH = 'depth';
    export const CHILD_DIM = 'dim';
    export const CHILD_EXPR = 'expr';
    export const CHILD_EXTENDS = 'extends';
    export const CHILD_FINALLY = 'finally';
    export const CHILD_IMPLEMENTS = 'implements';
    export const CHILD_INIT = 'init';
    export const CHILD_INSTEADOF = 'insteadof';
    export const CHILD_KEY = 'key';
    export const CHILD_LABEL = 'label';
    export const CHILD_LEFT = 'left';
    export const CHILD_LOOP = 'loop';
    export const CHILD_METHOD = 'method';
    export const CHILD_NAME = 'name';
    export const CHILD_OFFSET = 'offset';
    export const CHILD_PARAMS = 'params';
    export const CHILD_PREFIX = 'prefix';
    export const CHILD_PROP = 'prop';
    export const CHILD_RETURNTYPE = 'returnType';
    export const CHILD_RIGHT = 'right';
    export const CHILD_STMTS = 'stmts';
    export const CHILD_TRAITS = 'traits';
    export const CHILD_TRY = 'try';
    export const CHILD_TYPE = 'type';
    export const CHILD_USES = 'uses';
    export const CHILD_VALUE = 'value';
    export const CHILD_VAR = 'var';
    export const CHILD_FALSE = 'false';
    export const CHILD_TRUE = 'true';
}
export = _const;
