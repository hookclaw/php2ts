/// <reference path="./php2ts-types.ts" />;

import _const = require('./php2ts-const');
import _code = require('./php2ts-code');
import _settings = require('./php2ts-settings');
import _scope = require('./php2ts-scope');

namespace compiler {
    type AstProperties = {[key:string]:any};
    type Ast = string | baseAst;
    type AstChildren = Array<Ast>;
    
    export let initialized = false;
    export let initialize = (settings:Settings, constants:Constants) => {
        _const.initialize(constants);
        _settings.initialize(settings);
        initialized = true;
    }
    
    // ブラケットで囲われていない namespace文をTypeScriptに合わせてブラケットで囲む
    // namespace a;
    // function a() {};  \a\a
    // namespace b;
    // function b() {};  \b\b
    export let convertNamespace = (ast:Array<baseAst>):void => {
        if(!Array.isArray(ast)){
            return;
        }
        let list:number[] = [];
        for(let key in ast) {
            if(ast[key] == null){
                continue;
            }
            if(ast[key].kind != _const.getOriginalKind(_const.AST.NAMESPACE)){
                continue;
            }
            if(ast[key].children == null){
                continue;
            }
            if(ast[key].children.stmts != null){
                // もともとネスト構造になっている namespace文
                continue;
            }
            // namespace xxx;を見つけた
            list.push(parseInt(key));
        }
        if(list.length == 0){
            return;
        }
        // 降順ソート
        list.sort(function(a,b){return b-a;});
        let tail = ast.length - 1;
        for(let key of list){
            let start = key + 1;
            let removed = ast.splice(start,tail - key);
            if(ast[key].children == null){
                ast[key].children = {};
            }
            let stmts:baseAst = {kind:_const.getOriginalKind(_const.AST.STMT_LIST), flags:0, lineno:ast[key].lineno,children:removed};
            ast[key].children.stmts = stmts;
            tail = key - 1;
        }
    }
    
    export module pass1 {
        type TypeSource = {flags:number,name:string,namespace:string};
        type spa = {relativePath:string,namespace:string[],
            use:{flags:number,name:string,alias:string,namespace:string}[],
            const:TypeSource[],
            class:TypeSource[],
            function:TypeSource[],
            return:boolean};
        export let pass1 = (ast:baseAst,relativePath:string):Pass1Result => {
            let spa:spa = {relativePath,namespace:[],
                use:[],const:[],class:[],function:[],return:false};
            pass1main(ast,spa);
            let spa2:Pass1Result = {relativePath,nameMap:{},aliasTable:{},return:spa.return};
            for(let key in spa.use) {
                let item = spa.use[key];
                if(item.alias == null) {
                    let pos = item.name.lastIndexOf('\\');
                    item.alias = item.name.substr(pos+1);
                }
                spa2.aliasTable[item.alias] = item.name.split('\\');
            }
            let f = (type:nameType, src:TypeSource[]) => {
                for(let key in src) {
                    let item = src[key];
                    if(spa2.nameMap[type] === undefined) {
                        spa2.nameMap[type] = {};
                    }
                    if(spa2.nameMap[type][item.namespace] === undefined) {
                        spa2.nameMap[type][item.namespace] = {};
                    }
                    spa2.nameMap[type][item.namespace][item.name] = relativePath;
                }
            };
            f(nameType.const,spa.const);
            f(nameType.class,spa.class);
            f(nameType.function,spa.function);
            return spa2;
        }
        
        let pass1main = (someAst:baseAst|baseAst[],spa:spa) => {
            if(someAst == null) {
                return;
            }
            if(typeof someAst !== 'object') {
                return;
            }
            let ast:baseAst = <baseAst>someAst;
            let pass1children = () => {
                if(Array.isArray(ast.children)) {
                    convertNamespace(ast.children);
                }
                for(let key in ast.children) {
                    pass1main(ast.children[key],spa);
                }
            }
            switch(_const.getLocalKind(ast.kind)) {
                case _const.AST.NAMESPACE:
                    spa.namespace.push(ast.children.name);
                    pass1children();
                    spa.namespace.pop();
                    break;
                case _const.AST.USE:
                    pass1_USE(ast,spa);
                    break;
                case _const.AST.CONST_ELEM:
                    pass1_CONST(ast,spa);
                    break;
                case _const.AST.CLASS:
                    pass1_CLASS(ast,spa);
                    break;
                case _const.AST.FUNC_DECL:
                    pass1_FUNCTION(ast,spa);
                    break;
                case _const.AST.RETURN:
                    spa.return = true;
                    break;
                default:
                    pass1children();
            }
        }
        
        let expandNamespace = (s:string[]):string => {
            return s.join('\\');
        }
        
        let pass1_USE = (ast:baseAst,spa:spa) => {
            let namespace = expandNamespace(spa.namespace);
            let flags = ast.flags;
            for(let elem of ast.children) {
                let name:string = elem.children[_const.CHILD_NAME];
                let alias:string = elem.children[_const.CHILD_ALIAS];
                spa.use.push({flags,name,alias,namespace});
            }
        }
        
        let pass1_CONST = (ast:baseAst,spa:spa) => {
            let namespace = expandNamespace(spa.namespace);
            let flags = ast.flags;
            let name = ast.children[_const.CHILD_NAME];
            spa.const.push({flags,name,namespace});
        }
        
        let pass1_CLASS = (ast:baseAst,spa:spa) => {
            let namespace = expandNamespace(spa.namespace);
            let flags = ast.flags;
            let name = ast.name;
            spa.class.push({flags,name,namespace});
        }
        
        let pass1_FUNCTION = (ast:baseAst,spa:spa) => {
            let namespace = expandNamespace(spa.namespace);
            let flags = ast.flags;
            let name = ast.name;
            spa.function.push({flags,name,namespace});
        }
    }

    //scope
    // 可変変数の判定
    let checkVariable = (cb:_code.CodeArray):boolean => {
        for(let code of cb) {
            if(code.causeEval){
                return true;
            }
            let subcode = code.code;
            if(subcode instanceof _code.CodeArray) {
                if(checkVariable(subcode)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    type Signals = {root?:boolean,toAssign?:boolean};
    type KindMethod = (ast:any,signals?:Signals)=> _code.CodeArray;
    type Namespace = {name:string,scope:Scope,scopeIndex:number};
    export class compiler {
        private KindMethods:{[key:number]:KindMethod} = {};
        private importStock:{[key:string]:string} = {};
        private astStack:baseAst[] = [];
        private useGlobal = false;
        private namespaceStack:Namespace[] = [];
        private classStack:{name:string,extends:string}[] = [];
        private Comments:Comments;
        private CommentsKey:number[];
        private moduleResolver:ModuleResolver;
        private outerFunction = true;
        public initialized = false;
        
        constructor() {
        }
        
        public initialize = () => {
            if(!this.initialized) {
                if(initialized) {
                    _const.KindsForeach((str:string,localNumber:number,originalNumber:number)=> {
                        this.KindMethods[originalNumber] = (<any>this)[str];
                    });
                    this.initialized = true;
                } else {
                    throw new Error('php2ts-compiler uninitialized.');
                }
            }
        }
        
        public compile = (moduleResolver:ModuleResolver,ast:baseAst,comments:Comments):CompileResult => {
            this.moduleResolver = moduleResolver;
            this.initialize();
            _scope.initialize(this.changeLocalVarname,this.changeSuperGlobal);
            this.importStock = {};
            this.astStack = [];
            this.useGlobal = false;
            this.namespaceStack = [];
            this.classStack = [];
            this.Comments = comments;
            this.CommentsKey = [];
            for(let key in comments) {
                this.CommentsKey.push(parseInt(key));
            }
            try {
                if(ast === undefined || ast == null){
                    return {code:''};
                }
                let scope = _scope.newScope();
                scope.globals = _settings.Globals;
                //処理本体
                let innerCode = _code.cbExpand(this.AST_STMT_LIST(ast,{root:true}));
                //popScope()より前に実行する
                let globalDeclare = this.useGlobal?"//let global:{[key:string]:any} = new Function('return this')();\n":'';
                let localDeclare = this.getLocalDeclare();
                _scope.popScope();
                let innerBlock = '';
                innerBlock += globalDeclare;
                innerBlock += localDeclare;
                innerBlock += innerCode;
                innerBlock += this.getComment(Number.MAX_VALUE);
                let code = '';
                code += _settings.InsertComments;
                code += this.moduleResolver.getImport();
                code += this.getImportDeclare();
                code += this.moduleResolver.getExport(innerBlock);
                let result:CompileResult = {code};
                return result;
            }catch(e){
                console.error('Target object:');
                console.dir(ast);
                console.dir(e);
                if(e.stack){
                    console.error(e.stack);
                }
                //TODO
                throw e;
                //return e.message;
            }
        }
        
        //scope
        // 変更されたローカル変数名を作って返す
        private changeLocalVarname = (varname:string):string => {
            if(varname == 'this') {
                return varname;
            }
            let tmpname = _settings.LocalVariableNamePre + varname + _settings.LocalVariableNamePost;
            if(tmpname == 'var'){
                tmpname = '/* autoRename */_var';
            }
            return tmpname;
        }
        
        private changeSuperGlobal = (varname:string):string => {
            if(varname in _settings.SuperGlobals){
                return _settings.SuperGlobals[varname];
            }
            return undefined;
        }
        
        //scope
        private getVar = (ast:any,pre:string):string => {
            if(ast.kind !== undefined){
                //TODO warning;
                // 可変変数
                let varname = this.part(ast);
                // 値の参照の場合は、以下で可能
                let pret = (pre == '')?'':"'"+pre+"'+";
                return 'eval(' + pret + varname + ')';
                // 代入の左辺の場合など、変数を参照したい場合は、方法を考える必要がある。AST_ASSIGNで対応済み
            }
            if(_scope.currentScope().inGlobal){
                _scope.pushGlobal(ast);
                return pre + ast;
            }
            let scope = _scope.currentScope();
            let r = _scope.getVariableTypeAndLocalPush(scope, ast);
            return pre + r.name;
        }
        
        // 関数内で使用されているローカル変数はすべて、letで宣言する。"getLocalDeclare"
        // 例外処理
        // 1.スーパーグローバル
        // 2.関数の引数
        // 3.useで参照(&)宣言された変数
        // 4.useで値渡し(&なし)宣言された変数は、テンポラリ変数を使用する。
        //   let tmpX = X;
        // 5.クラス内の$thisは、テンポラリ変数を使用する。または、アロー関数にしたうえで、letなしにする。
        //   let _this = this;
        // 6.global宣言された変数。ただし、global宣言より下のステップ。
        //   global宣言より上のステップは、ローカル変数扱いであること
        //   親階層でローカル定義されていなければ、そのまま使用可能。
        //   親階層でローカル定義されている場合、エスケープ処理が必要。
        //   let global = (_v999999:string):any => {
        //       return eval(_v999999);
        //       // 参照は可能だが、代入はできない。
        //       // isset()などの特殊な関数も正しく動作しない。
        //       // あとは手作業でお願い。
        //   }
        //   function () {
        //       let globalX = global('X');
        //       globalX;
        //   }
        
        //scope 関数内で使用されているローカル変数はすべて、letで宣言する。
        private getLocalDeclare = ():string => {
            let scope = _scope.currentScope();
            let code = '';
            //ローカル変数
            for(let varname in scope.locals) {
                if(varname == 'this') {
                    continue;
                }
                if(scope.ignores[varname] === undefined) {
                    if(code == ''){
                        code = 'let '+ scope.locals[varname];
                    }else{
                        code += ', '+ scope.locals[varname];
                    }
                }
            }
            if(code != ''){
                code += ";\n";
            }
            //テンポラリ変数
            for(let sentence of scope.temporaries) {
                code += sentence + "\n";
            }
            return code;
        }
        
        // インポートモジュールの登録
        private pushImportModule = (varName:string, moduleName:string):void => {
            if(this.importStock[varName] !== undefined) {
                //TODO warning
            }
            this.importStock[varName] = moduleName;
        }
        
        // インポート文を生成する
        private getImportDeclare = ():string => {
            let s = '';
            for(let varName in this.importStock) {
                let moduleName = this.importStock[varName];
                s += 'import ' + varName + ' = require("' + moduleName + '");\n';
            }
            return s;
        }
        
        // namespace
        private pushNamespace = (name:string):void => {
            this.namespaceStack.push({
                name:name,
                scope:_scope.currentScope(),
                scopeIndex:_scope.currentScopeIndex()
            });
        }
        
        // namespace
        // PHP7の時点で、namespaceのネストは許されない
        // よって、返す値は、添え字ゼロの値か、スタックが空の場合の２通りである。
        private currentNamespace = ():Namespace => {
            let pos = this.namespaceStack.length - 1;
            if(pos < 0) {
                return {name:'',scope:_scope.topScope(),scopeIndex:0};
            } else {
                return this.namespaceStack[pos];
            }
        }
        
        private getLabel = (depth:string):string => {
            let goal = (depth=='')?0:parseInt(depth);
            if(goal == 0){
                return '';
            }
            let pos = this.astStack.length - 1;
            let cnt = 0;
            let target:baseAst = null;
            while(pos>=0){
                let tmp = this.astStack[pos];
                if(tmp.label !== undefined){
                    cnt++;
                    if(cnt == goal){
                        target = tmp;
                        break;
                    }
                }
                pos--;
            }
            if(target == null){
                return depth + '/* Unknown label */';
            }
            if(target.label != ''){
                return target.label.slice(0,target.label.length - 1);
            }
            let label = 'L'+(_scope.currentScope().labelno++);
            target.label = label + ':';
            return label;
        }
        
        private getComment = (lno:number):string => {
            let comments = '';
            let clno = 0;
            while(this.CommentsKey.length > 0 && (clno = this.CommentsKey[0]) < lno) {
                let tmp = this.Comments[clno];
                if(tmp.charAt(0) == '#'){
                    tmp = '//' + tmp.slice(1,tmp.length - 1);
                }
                comments += tmp;
                if(tmp.charAt(1) == '*'){
                    comments += "\n";
                }
                this.CommentsKey.shift();
            }
            return comments;
        }
        
        private childExist = (children:{[key:string]:any},key:string):boolean => {
            let v = children[key];
            return (v !== undefined && v != null);
        }
        
        // for AST_MAGIC_CONST
        private replaceConstantName = (constName:string):string => {
            if(constName in _settings.Constants) {
                //TODO warning
                return _settings.Constants[constName];
            }
            return constName;
        }
        
        // for AST_CONST
        private replaceConstant = (ast:baseAst):string|_code.CodeArray => {
            let cst = this.part(ast);
            if(ast.kind == _const.getOriginalKind(_const.AST.NAME)) {
                // ex) \a\b, a\b, b
                let name = _code.cbExpand(cst);
                if(name in _settings.Constants) {
                    //TODO warning
                    return _settings.Constants[name];
                }
                if(ast.flags == _const.Flags[_const.FLAG.NAME_FQ]) {
                    name = '.' + name;
                }
                let result = this.moduleResolver.getConstReference(name);
                if(result !== null) {
                    return result;
                }
            }
            return cst;
        }
        
        // for AST_STATIC_CALL, AST_STATIC_PROP, AST_CLASS_CONST
        private replaceClassNameForStatic = (ast:baseAst):string|_code.CodeArray => {
            let cls = this.part(ast);
            if(ast.kind == _const.getOriginalKind(_const.AST.NAME)) {
                // ex) \a\b, a\b, b
                let name = _code.cbExpand(cls);
                if(name in _settings.Classes) {
                    //TODO warning
                    return _settings.Classes[name];
                } else if(name == 'parent') {
                    return '/*parent is '+this.classStack[this.classStack.length - 1].extends+'*/';
                } else if(name == 'static') {
                    return '/*static*/';
                } else if(name == 'self') {
                    return '/*self is '+this.classStack[this.classStack.length - 1].name+'*/';
                }
                if(ast.flags == _const.Flags[_const.FLAG.NAME_FQ]) {
                    name = '.' + name;
                }
                let result = this.moduleResolver.getClassReference(name);
                if(result !== null) {
                    return result;
                }
            }
            return cls;
        }
        
        // for AST_NEW, AST_INSTANCEOF, AST_CATCH
        private replaceClassName = (ast:baseAst):string|_code.CodeArray => {
            let cls = this.part(ast);
            if(ast.kind == _const.getOriginalKind(_const.AST.NAME)) {
                // ex) \a\b, a\b, b
                let name = _code.cbExpand(cls);
                if(name in _settings.Classes) {
                    //TODO warning
                    return _settings.Classes[name];
                }
                if(ast.flags == _const.Flags[_const.FLAG.NAME_FQ]) {
                    name = '.' + name;
                }
                let result = this.moduleResolver.getClassReference(name);
                if(result !== null) {
                    return result;
                }
            }
            return cls;
        }
        
        // for AST_CALL
        private replaceFunctionName = (ast:baseAst, args:baseAst):_code.CodeArray => {
            let fnc:_code.CodeArray = this.part(ast);
            let expr:string|_code.CodeArray = fnc;
            if(ast.kind == _const.getOriginalKind(_const.AST.NAME)) {
                // ex) \a\b, a\b, b
                let name = _code.cbExpand(fnc);
                if(name in _settings.Functions) {
                    //TODO warning
                    return this.replaceFunction(name,args);
                }
                if(ast.flags == _const.Flags[_const.FLAG.NAME_FQ]) {
                    name = '.' + name;
                }
                let result = this.moduleResolver.getFunctionReference(name);
                if(result !== null) {
                    expr = result;
                }
            }
            return _code.codeBuffer(expr, '(', this.part(args), ')');
        }
        
        // for (AST_CALL), AST_PRINT, AST_ECHO
        private replaceFunction = (name:string, args:baseAst):_code.CodeArray => {
            // ex) \a\b, a\b, b
            let expr:string|string[]|{cod:string|string[],mod:string[]} = _settings.Functions[name];
            if(typeof expr === 'string') {
                //固定の形式
                return this.replaceFunctionMain(expr,name,args);
            } else {
                if(Array.isArray(expr)) {
                    //引数の数に応じた形式
                    return this.replaceFunctionByCount(expr,name,args);
                } else {
                    //インポートモジュールつき
                    return this.replaceFunctionWithImport(expr,name,args);
                }
            }
        }
        private replaceFunctionWithImport = (expr:{cod:string|string[],mod:string[]}, name:string, args:baseAst):_code.CodeArray => {
            let varName = expr.mod[0];
            let moduleName = expr.mod[1];
            this.pushImportModule(varName, moduleName);
            let cod:string|string[] = expr.cod;
            if(typeof cod === 'string') {
                //固定の形式
                return this.replaceFunctionMain(cod,name,args);
            } else {
                //引数の数に応じた形式
                return this.replaceFunctionByCount(cod,name,args);
            }
        }
        private replaceFunctionByCount = (exprEx:string[], name:string, args:baseAst):_code.CodeArray => {
            let arglen = (args.kind === _const.getOriginalKind(_const.AST.ARG_LIST)) ? args.children.length : 1;
            let expr:string;
            if( arglen > exprEx.length) {
                //TODO warning
                expr = exprEx[exprEx.length - 1];
            } else {
                expr = exprEx[arglen];
            }
            return this.replaceFunctionMain(expr,name,args);
        }
        private replaceFunctionMain = (expr:string, name:string, args:baseAst):_code.CodeArray => {
            if(expr == '') {
                //置換用の式が空の場合
                let argsArr = this.part(args);
                return _code.codeBuffer(name + '(', argsArr, ')');
            }
            //置換用の式を解決する
            let regexp = /^[A-Z0-9_.]+$/i;
            if( regexp.test(expr) || args.kind !== _const.getOriginalKind(_const.AST.ARG_LIST)) {
                //関数名の置換だけ行う
                let argsArr = this.part(args);
                return _code.codeBuffer(expr + '(', argsArr, ')');
            }
            //引数の置換を行う
            let digit = /\d+/;
            let buf:_code.CodeArray = new _code.CodeArray();
            let pos = 0;
            let arg:(string|baseAst)[] = args.children;
            let push = (n:number, attr:string, comma:boolean):void => {
                if(comma) {
                    buf.push(_code.codeNormal(','));
                }
                if(n < arg.length) {
                    buf.append(this.part(arg[n]));
                    // if(attr == 'r') {
                    //     // preg_* 系の正規表現文字列の場合
                    //     if(typeof arg[n] === 'string') {
                    //         let re = <string>arg[n];
                    //         buf.push(_code.codeNormal(re));
                    //     } else {
                    //         //TODO warning
                    //         buf.append(this.statement(arg[n]));
                    //     }
                    // } else {
                    //     buf.append(this.statement(arg[n]));
                    // }
                } else {
                    buf.push(_code.codeNormal('undefined'));
                }
            };
            let split = (sn:string):{n:number,attr:string} => {
                let attr = '';
                if(!digit.test(sn.charAt(0))) {
                    attr = sn.charAt(0);
                    sn = sn.substr(1);
                }
                let n = parseInt(sn, 10) - 1;
                return {n:n, attr:attr};
            };
            let rep = (match:string, p1:string, p2:string, p3:string, p4:string, offset:number):string => {
                if(pos < offset) {
                    buf.push(_code.codeNormal(expr.substr(pos, offset-pos)));
                }
                if(p4 === '...') {
                    // ex) $1...
                    let sn = match.substr(1,match.length - 4);
                    let r = split(sn);
                    let n = r.n;
                    let attr = r.attr;
                    let first = true;
                    while(n < arg.length) {
                        push(n++, attr, !first);
                        attr = '';
                        first = false;
                    }
                } else if(p1 !== undefined) {
                    // ex) [,$1]
                    // ex) [,$3,$2]
                    let snArr = match.match(/\d+/g);
                    for(let sn of snArr) {
                        let r = split(sn);
                        if(r.n >= arg.length) {
                            break;
                        }
                        push(r.n, r.attr, true);
                    }
                } else {
                    // ex) $1
                    let sn = match.substr(1);
                    let r = split(sn);
                    push(r.n, r.attr, false);
                }
                pos = offset + match.length;
                return '';
            };
            //以下の正規表現を修正すると、関数 rep の引数が変わる可能性があるので注意
            expr.replace(/(\[(,\$[r]?\d)+)+\]|(\$[r]?\d+([.]{3})?)/g, rep);
            let len = expr.length;
            if(pos < len) {
                buf.push(_code.codeNormal(expr.substr(pos, len-pos)));
            }
            return buf;
        }
        private lists = (ast:baseAst[],signals:Signals={toAssign:false}):_code.CodeArray[] => {
            let codeA:_code.CodeArray[] = [];
            for (let item of ast) {
                codeA.push(this.part(item,signals));
            }
            return codeA;
        }
        
        private statements = (ast:baseAst[],signals:Signals={toAssign:false}):_code.CodeArray => {
            let code:_code.CodeArray = new _code.CodeArray();
            convertNamespace(ast);
            for (let item of ast) {
                if( item == null){
                    continue;
                }
                code.append(this.statement(item,signals));
            }
            return code;
        }
        
        private statement = (ast:baseAst,signals:Signals={toAssign:false}):_code.CodeArray => {
            let code:_code.CodeArray = new _code.CodeArray();
            if( ast == null){
                return code;
            }
            let semicolon = ';';
            let kind = ast.kind;
            let precomment = '';
            let postcomment = '';
            if(kind !== undefined) {
                if(_const.IgnoreSemicolon[kind] !== undefined){
                    semicolon = '';
                }
                precomment = this.getComment(ast.lineno);
                postcomment = this.getComment(ast.lineno + 1);
            }
            semicolon += postcomment;
            code.push_(_code.codeNormal(precomment));
            let stmts = this.part(ast,signals);
            let preCode = _scope.currentScope().preCodeStock.join('');
            _scope.currentScope().preCodeStock = [];
            code.push_(_code.codeNormal(preCode));
            code.append(stmts);
            code.push_(_code.codeNormal(semicolon));
            if((code.length > 0) && (((semicolon.length == 0) && (stmts !== null) && (stmts.length > 0)) || (semicolon.charAt(semicolon.length-1) != "\n"))) {
                code.push_(_code.codeNormal("\n"));
            }
            return code;
        }

        private part = (ast:Ast,signals:Signals={toAssign:false}):_code.CodeArray => {
            if(ast === undefined || ast == null) {
                return new _code.CodeArray();
            }
            if(typeof ast === 'string') {
                // php http://php.net/manual/ja/regexp.reference.escape.php
                // js  https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String
                return _code.codeBuffer(_code.stringify(ast));
            } else if(typeof ast === 'number') {
                return _code.codeBuffer(ast.toString());
            } else if(typeof ast === 'boolean') {
                return _code.codeBuffer(ast.toString());
            } else if(ast.kind !== undefined) {
                // type baseAst
                let comment = (ast.docComment !== undefined && ast.docComment != null)?ast.docComment+"\n":'';
                let method = this.KindMethods[ast.kind];
                let code:_code.CodeArray = new _code.CodeArray();
                if(method === undefined) {
                    console.error('php2ts:Unknown kind(' + ast.kind + ')');
                }else{
                    this.astStack.push(ast);
                    code = method(ast,signals);
                    this.astStack.pop();
                }
                return _code.codeBuffer(comment,code);
            }
            //あったら困る
            console.error('Unknown statement');
            console.dir(ast);
            return _code.codeBuffer('/* Unknown '+ast.toString()+' */');
        }
        
        private AST_base = (ast:baseAst):_code.CodeArray => {
            let code = '(kind:' + ast.kind + ')';
            code += (ast.name === undefined)?'':ast.name;
            code += _const.flagsString(ast.kind,ast.flags);
            code += "{\n";
            if(Array.isArray(ast.children)){
                let children:Array<Ast> = ast.children;
                for (let key in children) {
                    code += key + ':' + this.part(children[key]);
                }
            }else{
                let children:AstProperties = ast.children;
                for (let key in children) {
                    let inner = _code.cbExpand(this.part(children[key]));
                    if( key == _const.CHILD_STMTS){
                        if( inner.length > 0) {
                            inner = "{\n" + inner + "}"
                        }
                    }
                    code += key + ':' + inner + "\n";
                }
            }
            code += "};";
            return _code.codeBuffer(_code.codeComment(code));
        }
        
        // kind ( 0 )
        // flags type ( exclusive ) MAGIC_LINE,MAGIC_FILE,MAGIC_DIR,MAGIC_NAMESPACE,MAGIC_FUNCTION,MAGIC_METHOD,MAGIC_CLASS,MAGIC_TRAIT
        // child nodes (  )
        public AST_MAGIC_CONST = (ast:baseAst):_code.CodeArray => {
            let constName = '';
            switch(ast.flags){
            case _const.Flags[_const.FLAG.MAGIC_LINE]:
                constName = '__LINE__';
                break;
            case _const.Flags[_const.FLAG.MAGIC_FILE]:
                constName = '__FILE__';
                break;
            case _const.Flags[_const.FLAG.MAGIC_DIR]:
                constName = '__DIR__';
                break;
            case _const.Flags[_const.FLAG.MAGIC_NAMESPACE]:
                constName = '__NAMESPACE__';
                break;
            case _const.Flags[_const.FLAG.MAGIC_FUNCTION]:
                constName = '__FUNCTION__';
                break;
            case _const.Flags[_const.FLAG.MAGIC_METHOD]:
                constName = '__METHOD__';
                break;
            case _const.Flags[_const.FLAG.MAGIC_CLASS]:
                constName = '__CLASS__';
                break;
            case _const.Flags[_const.FLAG.MAGIC_TRAIT]:
                constName = '__TRAIT__';
                break;
            default:
                return this.AST_base(ast);
            }
            return _code.codeBuffer(this.replaceConstantName(constName));
        }

        // kind ( 1 )
        // flags type ( exclusive ) TYPE_NULL,TYPE_BOOL,TYPE_LONG,TYPE_DOUBLE,TYPE_STRING,TYPE_ARRAY,TYPE_OBJECT,TYPE_CALLABLE
        // child nodes (  )
        public AST_TYPE = (ast:baseAst):_code.CodeArray => {
            switch(ast.flags){
            case 0:
                return _code.codeBuffer('void');
            case _const.Flags[_const.FLAG.TYPE_NULL]:
                return _code.codeBuffer('null');
            case _const.Flags[_const.FLAG.TYPE_BOOL]:
                return _code.codeBuffer('boolean');
            case _const.Flags[_const.FLAG.TYPE_LONG]:
                return _code.codeBuffer('number','/* long */');
            case _const.Flags[_const.FLAG.TYPE_DOUBLE]:
                return _code.codeBuffer('number','/* double */');
            case _const.Flags[_const.FLAG.TYPE_STRING]:
                return _code.codeBuffer('string');
            case _const.Flags[_const.FLAG.TYPE_ARRAY]:
                return _code.codeBuffer('Array');
            case _const.Flags[_const.FLAG.TYPE_OBJECT]:
                return _code.codeBuffer('any','/* object */');
            case _const.Flags[_const.FLAG.TYPE_CALLABLE]:
                return _code.codeBuffer('any','/* callable */');
            }
            return this.AST_base(ast);
        }

        // kind ( 66 )
        // flags type ( combinable ) MODIFIER_PUBLIC,MODIFIER_PROTECTED,MODIFIER_PRIVATE,MODIFIER_STATIC,MODIFIER_ABSTRACT,MODIFIER_FINAL,RETURNS_REF
        // child nodes ( params, uses, stmts:AST_STMT_LIST(133), returnType )
        public AST_FUNC_DECL = (ast:baseAst):_code.CodeArray => {
            let tmp = this.outerFunction;
            this.outerFunction = false;
            _scope.newScope();
            let modifier = _const.getModifier(ast.flags);
            let name = (ast.name === undefined)?'':ast.name;
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            code.push_(_code.codeNormal('('));
            if(this.childExist(children,_const.CHILD_PARAMS)) {
                code.append(this.part(children[_const.CHILD_PARAMS]));
            }
            code.push_(_code.codeNormal(')'));
            if(this.childExist(children,_const.CHILD_RETURNTYPE)) {
                code.push_(_code.codeNormal(':'));
                code.append(this.part(children[_const.CHILD_RETURNTYPE]));
            }
            let uses:_code.CodeArray = new _code.CodeArray();
            if(this.childExist(children,_const.CHILD_USES)) {
                //TODO scope
                uses.push(_code.codeComment('// use(' + _code.cbExpand(this.part(children[_const.CHILD_USES])) + ")\n"));
            }
            let inner = this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
            let localDeclare = this.getLocalDeclare();
            _scope.popScope();
            this.outerFunction = tmp;
            let namespace_ = this.currentNamespace();
            //PHPのfunction文は、namespace空間に関数を定義する命令である
            //ただし、無名ファンクションは、この限りでない
            if(name == '') {
                return _code.codeBuffer(code, " => {\n", uses, localDeclare, inner, "}");
            } else if(_scope.currentScope().inIf || (_scope.currentScopeIndex() > namespace_.scopeIndex)) {
                _scope.pushLocal(namespace_.scope,name,false);
                return _code.codeBuffer(name + ' = ' , code, " => {\n", uses, localDeclare, inner, "}");
            } else {
                return _code.codeBuffer('export function ' + name, code, " {\n", uses, localDeclare, inner, "}");
            }
        }

        // kind ( 67 )
        // flags type ( combinable ) MODIFIER_PUBLIC,MODIFIER_PROTECTED,MODIFIER_PRIVATE,MODIFIER_STATIC,MODIFIER_ABSTRACT,MODIFIER_FINAL,RETURNS_REF
        // child nodes ( params, uses, stmts:AST_STMT_LIST(133), returnType )
        public AST_CLOSURE = (ast:baseAst):_code.CodeArray => {
            let tmp = this.outerFunction;
            this.outerFunction = false;
            _scope.newScope();
            let code:_code.CodeArray = new _code.CodeArray(_code.codeNormal(_const.getModifier(ast.flags) + ' ')); // ないはず？
            let children:{[key:string]:any} = ast.children;
            code.push_(_code.codeNormal(' ('));
            if(this.childExist(children,_const.CHILD_PARAMS)) {
                code.append(this.part(children[_const.CHILD_PARAMS]));
            }
            code.push_(_code.codeNormal(')'));
            if(this.childExist(children,_const.CHILD_RETURNTYPE)) {
                code.push_(_code.codeNormal(':'));
                code.append(this.part(children[_const.CHILD_RETURNTYPE]));
            }
            let uses:_code.CodeArray = new _code.CodeArray();
            if(this.childExist(children,_const.CHILD_USES)) {
                //TODO scope
                uses.push(_code.codeNormal('// use(' + _code.cbExpand(this.part(children[_const.CHILD_USES])) + ")\n"));
            }
            let inner = this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
            let localDeclare = this.getLocalDeclare();
            _scope.popScope();
            this.outerFunction = tmp;
            return _code.codeBuffer(code, " => {\n", uses, localDeclare, inner, "}");
        }

        // kind ( 68 )
        // flags type ( combinable ) MODIFIER_PUBLIC,MODIFIER_PROTECTED,MODIFIER_PRIVATE,MODIFIER_STATIC,MODIFIER_ABSTRACT,MODIFIER_FINAL,RETURNS_REF
        // child nodes ( params, uses, stmts:null|AST_STMT_LIST(133), returnType )
        public AST_METHOD = (ast:baseAst):_code.CodeArray => {
            let tmp = this.outerFunction;
            this.outerFunction = false;
            _scope.newScope();
            let code:_code.CodeArray = new _code.CodeArray();
            let modifier = _const.getModifier(ast.flags) + ' ';
            if(_scope.currentScope().inInterface){
                modifier = '/* ' + modifier + '*/';
            }
            code.push_(_code.codeNormal(modifier));
            let arrow = ' => ';
            if(ast.name !== undefined){
                if(ast.name == '__construct'){
                    arrow = '';
                    code.push_(_code.codeNormal('constructor'));
                }else{
                    if(_scope.currentScope().inInterface){
                        code.push_(_code.codeNormal(ast.name));
                    }else{
                        code.push_(_code.codeNormal(ast.name + '='));
                    }
                }
            }
            let children:{[key:string]:any} = ast.children;
            code.push_(_code.codeNormal(' ('));
            if(this.childExist(children,_const.CHILD_PARAMS)) {
                code.append(this.part(children[_const.CHILD_PARAMS]));
            }
            code.push_(_code.codeNormal(')'));
            if(this.childExist(children,_const.CHILD_RETURNTYPE)) {
                code.push_(_code.codeNormal(':'));
                code.append(this.part(children[_const.CHILD_RETURNTYPE]));
            }
            let uses:_code.CodeArray = new _code.CodeArray();
            if(this.childExist(children,_const.CHILD_USES)) {
                //TODO scope
                uses.push(_code.codeNormal('// use(' + _code.cbExpand(this.part(children[_const.CHILD_USES])) + ")\n"));
            }
            let stmts = children[_const.CHILD_STMTS];
            let inner:_code.CodeArray = (stmts == null)?new _code.CodeArray():this.AST_STMT_LIST(stmts);
            let localDeclare = this.getLocalDeclare();
            _scope.popScope();
            this.outerFunction = tmp;
            if(_scope.currentScope().inInterface){
                return code;
            }
            return _code.codeBuffer(code, arrow, "{\n", uses, localDeclare, inner, "}");
        }

        // kind ( 69 )
        // flags type ( exclusive ) CLASS_ABSTRACT,CLASS_FINAL,CLASS_TRAIT,CLASS_INTERFACE,CLASS_ANONYMOUS
        // child nodes ( extends, implements, stmts:AST_STMT_LIST(133) )
        public AST_CLASS = (ast:baseAst):_code.CodeArray => {
            let code:_code.CodeArray = new _code.CodeArray();
            let cls = 'unknown class';
            switch(ast.flags){
            case _const.Flags[_const.FLAG.CLASS_ABSTRACT]:
                cls = 'abstract class';
                break;
            case _const.Flags[_const.FLAG.CLASS_FINAL]:
                cls = '/* final */ class';
                break;
            case _const.Flags[_const.FLAG.CLASS_TRAIT]:
                cls = '/* trait */ class';
                break;
            case _const.Flags[_const.FLAG.CLASS_INTERFACE]:
                cls = 'interface';
                _scope.currentScope().inInterface = true;
                break;
            case _const.Flags[_const.FLAG.CLASS_ANONYMOUS]:
                cls = 'class';
                break;
            case 0:
                cls = 'class';
                break;
            }
            code.push_(_code.codeNormal('export ' + cls));
            let name = '';
            if(ast.name !== undefined) {
                name = ast.name;
                code.push_(_code.codeNormal(' ' + ast.name));
            }
            let children:{[key:string]:any} = ast.children;
            let extendsClass = '';
            if(this.childExist(children,_const.CHILD_EXTENDS)) {
                code.push_(_code.codeNormal(' extends '));
                let codeArr = this.replaceClassName(children[_const.CHILD_EXTENDS]);
                if(typeof codeArr === 'string') {
                    extendsClass = codeArr;
                    code.push(_code.codeNormal(codeArr));
                } else {
                    extendsClass = _code.cbExpand(codeArr);
                    code.append(codeArr);
                }
            }
            if(this.childExist(children,_const.CHILD_IMPLEMENTS)) {
                code.push_(_code.codeNormal(' implements '));
                let codeArr = this.replaceClassName(children[_const.CHILD_IMPLEMENTS]);
                if(typeof codeArr === 'string') {
                    code.push(_code.codeNormal(codeArr));
                } else {
                    code.append(codeArr);
                }
            }
            this.classStack.push({name:name,extends:extendsClass});
            let inner = this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
            _scope.currentScope().inInterface = false;
            this.classStack.pop();
            return _code.codeBuffer(code, "{\n", inner, "}");
        }

        // kind ( 128 )
        public AST_ARG_LIST = (ast:baseAst):_code.CodeArray => {
            return _code.codeJoin(this.lists(ast.children),',');
        }

        // kind ( 129 )
        public AST_LIST = (ast:baseAst):_code.CodeArray => {
            //TODO list関数
            return _code.codeBuffer('list(', _code.codeJoin(this.lists(ast.children),','), ')');
        }

        // kind ( 130 )
        public AST_ARRAY = (ast:baseAst):_code.CodeArray => {
            let codeA:_code.CodeArray[] = [];
            let children:Array<baseAst> = ast.children;
            let quote = '{';
            for (let item of children) {
                codeA.push(this.part(item));
                if(item.children.key == null){
                    quote = '[';
                }
            }
            return _code.codeBuffer(quote, _code.codeJoin(codeA,','), ((quote=='{')?'}':']'));
        }

        // kind ( 131 )
        // example : "$a\n"
        public AST_ENCAPS_LIST = (ast:baseAst):_code.CodeArray => {
            let codeA:_code.CodeArray[] = [];
            let children:Array<Ast> = ast.children;
            for (let item of children) {
                codeA.push(this.part(item));
            }
            return _code.codeJoin(codeA, '+');
        }

        // kind ( 132 )
        public AST_EXPR_LIST = (ast:baseAst):_code.CodeArray => {
            return _code.codeJoin(this.lists(ast.children,{toAssign:true}), ',');
        }

        // kind ( 133 )
        // (root==true)のとき astStack に積む
        public AST_STMT_LIST = (ast:baseAst,signals?:Signals):_code.CodeArray => {
            if(ast.kind != _const.getOriginalKind(_const.AST.STMT_LIST)){
                return this.statement(ast);
            }
            let root = false;
            if(signals !== undefined){
                if(signals.root !== undefined && signals.root){
                    root = true;
                }
            }
            if(root){
                this.astStack.push(ast);
            }
            let code = this.statements(ast.children,{toAssign:true});
            return code;
        }

        // kind ( 134 )
        // child nodes ( Array<AST_IF_ELEM(533)> )
        public AST_IF = (ast:baseAst):_code.CodeArray => {
            let tmp = _scope.currentScope().inIf;
            _scope.currentScope().inIf = true;
            let code:_code.CodeArray = new _code.CodeArray();
            let children:Array<Ast> = ast.children;
            let first = true;
            for (let item of children) {
                if(first){
                    first = false;
                }else{
                    code.push_(_code.codeNormal(' else '));
                }
                code.append(this.part(item));
            }
            _scope.currentScope().inIf = tmp;
            return code;
        }

        // kind ( 135 )
        // child nodes ( Array<AST_SWITCH_CASE(535)> )
        public AST_SWITCH_LIST = (ast:baseAst):_code.CodeArray => {
            return this.statements(ast.children);
        }

        // kind ( 137 )
        public AST_PARAM_LIST = (ast:baseAst):_code.CodeArray => {
            let codelist:_code.CodeArray[] = [];
            let children:Ast[] = ast.children;
            for(let child of children){
                codelist.push(this.part(child));
            }
            return _code.codeJoin(codelist, ',');
        }

        // kind ( 138 )
        public AST_CLOSURE_USES = (ast:baseAst):_code.CodeArray => {
            let codelist:_code.CodeArray[] = [];
            let children:Ast[] = ast.children;
            for(let child of children){
                codelist.push(this.part(child));
            }
            return _code.codeJoin(codelist, ',');
        }

        // kind ( 139 )
        // flags type ( combinable ) MODIFIER_PUBLIC,MODIFIER_PROTECTED,MODIFIER_PRIVATE,MODIFIER_STATIC,MODIFIER_ABSTRACT,MODIFIER_FINAL,RETURNS_REF
        public AST_PROP_DECL = (ast:baseAst):_code.CodeArray => {
            let modifier = _const.getModifier(ast.flags);
            let props = this.lists(ast.children);
            let code = new _code.CodeArray();
            let first = true;
            for(let prop of props) {
                if(first){
                    first = false;
                } else {
                    code.push_(_code.codeNormal(';\n'));
                }
                code.append(_code.codeBuffer(modifier,' ',prop));
            }
            return code;
        }

        // kind ( 140 )
        public AST_CONST_DECL = (ast:baseAst):_code.CodeArray => {
            return _code.codeBuffer('export const ',_code.codeJoin(this.lists(ast.children), ','));
        }

        // kind ( 141 )
        // flags type ( combinable ) MODIFIER_PUBLIC,MODIFIER_PROTECTED,MODIFIER_PRIVATE,MODIFIER_STATIC,MODIFIER_ABSTRACT,MODIFIER_FINAL,RETURNS_REF
        public AST_CLASS_CONST_DECL = (ast:baseAst):_code.CodeArray => {
            let modifier = _const.getModifier(ast.flags);
            if(modifier == ''){
                modifier = 'public';
            }
            let props = this.lists(ast.children);
            let code = new _code.CodeArray();
            let first = true;
            for(let prop of props) {
                if(first){
                    first = false;
                } else {
                    code.push_(_code.codeNormal(';\n'));
                }
                code.append(_code.codeBuffer(modifier,' /*const*/static ',prop));
            }
            return code;
        }

        // kind ( 142 )
        public AST_NAME_LIST = (ast:baseAst):_code.CodeArray => {
            let codelist:_code.CodeArray[] = [];
            let children:Ast[] = ast.children;
            for(let child of children){
                codelist.push(this.part(child));
            }
            return _code.codeJoin(codelist, ',');
        }

        // kind ( 143 )
        public AST_TRAIT_ADAPTATIONS = (ast:baseAst):_code.CodeArray => {
            return this.statements(ast.children);
        }

        // kind ( 256 )
        // child nodes ( name )
        public AST_VAR = (ast:baseAst):_code.CodeArray => {
            let name:string|baseAst = ast.children[_const.CHILD_NAME];
            if(typeof name === 'string') {
                if(_scope.currentScope().inGlobal){
                    _scope.pushGlobal(name);
                    return _code.codeBuffer(name);
                }
                let scope = _scope.currentScope();
                let r = _scope.getVariableTypeAndLocalPush(scope, name);
                return _code.codeBuffer(r.name);
            }
            // 可変変数
            let varname = this.part(name);
            // 値の参照の場合は、以下で可能
            return _code.codeBuffer(_code.codeEval(varname));
            // 代入の左辺の場合など、変数を参照したい場合は、AST_ASSIGNで対応済み
        }

        // kind ( 513 )
        // child nodes ( expr, prop )
        public AST_PROP = (ast:baseAst):_code.CodeArray => {
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            code.append(this.part(children[_const.CHILD_EXPR]));
            code.push_(_code.codeNormal('.'));
            let prop:string|baseAst = ast.children[_const.CHILD_PROP];
            if(typeof prop === 'string') {
                return _code.codeBuffer(code, prop);
            }
            // 可変変数
            let varname = this.part(prop);
            // 値の参照の場合は、以下で可能
            let preCodeList:string[] = [];
            let inner = this.cbExpandE(_code.codeBuffer(_code.codeNormal(code),_code.codeEval(varname)),preCodeList);
            let pre = preCodeList.join('');
            _scope.currentScope().preCodeStock.push(pre);
            return _code.codeBuffer(_code.codeEval(inner));
        }

        // kind ( 514 )
        // child nodes ( class, prop )
        public AST_STATIC_PROP = (ast:baseAst):_code.CodeArray => {
            let cls = this.replaceClassNameForStatic(ast.children[_const.CHILD_CLASS]);
            let prop:string|baseAst = ast.children[_const.CHILD_PROP];
            if(typeof prop === 'string') {
                return _code.codeBuffer(cls, '.', prop);
            }
            // 可変変数
            let varname = this.part(prop);
            // 値の参照の場合は、以下で可能
            let preCodeList:string[] = [];
            let inner = this.cbExpandE(_code.codeBuffer(cls, '.',_code.codeEval(varname)),preCodeList);
            let pre = preCodeList.join('');
            _scope.currentScope().preCodeStock.push(pre);
            return _code.codeBuffer(_code.codeEval(inner));
        }

        // kind ( 257 )
        // child nodes ( name )
        public AST_CONST = (ast:baseAst):_code.CodeArray => {
            return _code.codeBuffer(this.replaceConstant(ast.children[_const.CHILD_NAME]));
        }

        // kind ( 258 )
        // child nodes ( expr )
        public AST_UNPACK = (ast:baseAst):_code.CodeArray => {
            //TODO
            //let children:{[key:string]:any} = ast.children;
            //let expr = this.statement(children[php2ts_const.CHILD_EXPR]);
            return this.AST_base(ast);
        }

        // kind ( 259 )
        // child nodes ( expr  // prior to version 20 )
        public AST_UNARY_PLUS = (ast:baseAst):_code.CodeArray => {
            //TODO test
            let children:{[key:string]:any} = ast.children;
            let expr = this.part(children[_const.CHILD_EXPR]);
            return _code.codeBuffer("+(", expr, ")");
        }

        // kind ( 260 )
        // child nodes ( expr  // prior to version 20 )
        public AST_UNARY_MINUS = (ast:baseAst):_code.CodeArray => {
            //TODO test
            let children:{[key:string]:any} = ast.children;
            let expr = this.part(children[_const.CHILD_EXPR]);
            return _code.codeBuffer("-(", expr, ")");
        }

        // kind ( 261 )
        // flags type ( exclusive ) TYPE_NULL,TYPE_BOOL,TYPE_LONG,TYPE_DOUBLE,TYPE_STRING,TYPE_ARRAY,TYPE_OBJECT,TYPE_CALLABLE
        // child nodes ( expr )
        public AST_CAST = (ast:baseAst):_code.CodeArray => {
            let children:{[key:string]:any} = ast.children;
            let expr = this.part(children[_const.CHILD_EXPR]);
            switch(ast.flags){
            case _const.Flags[_const.FLAG.TYPE_LONG]:
                return _code.codeBuffer("/* to int */+(", expr, ")");
            case _const.Flags[_const.FLAG.TYPE_DOUBLE]:
                return _code.codeBuffer("/* to double */+(", expr, ")");
            case _const.Flags[_const.FLAG.TYPE_STRING]:
                return _code.codeBuffer("/* to string */(", expr, ").toString()");
            case _const.Flags[_const.FLAG.TYPE_BOOL]:
                return _code.codeBuffer("/* to bool */!(", expr, " in [0,'false','FALSE'])");
            case _const.Flags[_const.FLAG.TYPE_ARRAY]:
                return _code.codeBuffer('/* to array */',
                                "{let tmpArr = ", expr, ";",
                                "if(Array.isArray(tmpArr) tmpArr else [tmpArr];}"
                );
            case _const.Flags[_const.FLAG.TYPE_OBJECT]:
                return _code.codeBuffer("/* to object */(", expr, ")");
            case _const.Flags[_const.FLAG.TYPE_CALLABLE]: // ないはず
            case _const.Flags[_const.FLAG.TYPE_NULL]:     // ないはず
            }
            return this.AST_base(ast);
        }

        // kind ( 262 )
        // child nodes ( expr )
        public AST_EMPTY = (ast:baseAst):_code.CodeArray => {
            return this.AST_base(ast);
        }

        // kind ( 263 )
        // child nodes ( var )
        public AST_ISSET = (ast:baseAst):_code.CodeArray => {
            let children:{[key:string]:any} = ast.children;
            let v = this.part(children[_const.CHILD_VAR]);
            return _code.codeBuffer("(", v, " !== undefined)");
        }

        // kind ( 264 )
        // child nodes ( expr )
        public AST_SILENCE = (ast:baseAst):_code.CodeArray => {
            return this.AST_base(ast);
        }

        // kind ( 265 )
        // child nodes ( expr )
        public AST_SHELL_EXEC = (ast:baseAst):_code.CodeArray => {
            //child_process.execSync(command[, options])
            let children:{[key:string]:any} = ast.children;
            return _code.codeBuffer('child_process.execSync(',this.part(children[_const.CHILD_EXPR]),')');
        }

        // kind ( 266 )
        // child nodes ( expr )
        public AST_CLONE = (ast:baseAst):_code.CodeArray => {
            return this.AST_base(ast);
        }

        // kind ( 267 )
        // child nodes ( expr )
        public AST_EXIT = (ast:baseAst):_code.CodeArray => {
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_EXPR)) {
                code = _code.codeBuffer(
                'console.error(',
                this.part(children[_const.CHILD_EXPR]),
                ");\n");
            }
            return _code.codeBuffer(code, "exit()");
        }

        // kind ( 268 )
        // child nodes ( expr )
        public AST_PRINT = (ast:baseAst):_code.CodeArray => {
            let name = 'print';
            if(name in _settings.Functions) {
                return this.replaceFunction(name, ast.children[_const.CHILD_EXPR]);
            }
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_EXPR)) {
                code = this.part(children[_const.CHILD_EXPR]);
            }
            return _code.codeBuffer('console.log(', ")");
        }

        // kind ( 269 )
        // flags type ( exclusive ) EXEC_EVAL,EXEC_INCLUDE,EXEC_INCLUDE_ONCE,EXEC_REQUIRE,EXEC_REQUIRE_ONCE
        // child nodes ( expr )
        public AST_INCLUDE_OR_EVAL = (ast:baseAst):_code.CodeArray => {
            //TODO watning
            let code = '';
            let post = '';
            switch(ast.flags){
            case _const.Flags[_const.FLAG.EXEC_EVAL]:
                code += 'eval(';
                break;
            case _const.Flags[_const.FLAG.EXEC_INCLUDE]:
                code += 'require(';
                post = '/* include */';
                break;
            case _const.Flags[_const.FLAG.EXEC_INCLUDE_ONCE]:
                code += 'require(';
                post = '/* include_once */';
                break;
            case _const.Flags[_const.FLAG.EXEC_REQUIRE]:
                code += 'require(';
                post = '/* require */';
                break;
            case _const.Flags[_const.FLAG.EXEC_REQUIRE_ONCE]:
                code += 'require(';
                post = '/* require_once */';
                break;
            }
            let children:{[key:string]:any} = ast.children;
            let expr:_code.CodeArray = new _code.CodeArray();
            if(this.childExist(children,_const.CHILD_EXPR)) {
                expr = this.part(children[_const.CHILD_EXPR]);
            }
            return _code.codeBuffer(code, expr, ')', post);
        }

        // kind ( 270 ) 単項演算子
        // flags type ( exclusive ) UNARY_BOOL_NOT,UNARY_BITWISE_NOT,UNARY_MINUS,UNARY_PLUS,UNARY_SILENCE
        // child nodes ( expr )
        public AST_UNARY_OP = (ast:baseAst):_code.CodeArray => {
            let code = '';
            switch(ast.flags){
            case _const.Flags[_const.FLAG.UNARY_BOOL_NOT]:
                code += '!';
                break;
            case _const.Flags[_const.FLAG.UNARY_BITWISE_NOT]:
                code += '~';
                break;
            case _const.Flags[_const.FLAG.UNARY_MINUS]:
                code += '-';
                break;
            case _const.Flags[_const.FLAG.UNARY_PLUS]:
                code += '+';
                break;
            case _const.Flags[_const.FLAG.UNARY_SILENCE]:
                code += '/* @ */';
                break;
            }
            let children:{[key:string]:any} = ast.children;
            let expr:_code.CodeArray = new _code.CodeArray();
            if(this.childExist(children,_const.CHILD_EXPR)) {
                expr = this.part(children[_const.CHILD_EXPR]);
            }
            return _code.codeBuffer(code, expr);
        }

        // kind ( 271 )
        // child nodes ( var )
        public AST_PRE_INC = (ast:baseAst):_code.CodeArray => {
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_VAR)) {
                code = this.part(children[_const.CHILD_VAR]);
            }
            return _code.codeBuffer('++', code);
        }

        // kind ( 272 )
        // child nodes ( var )
        public AST_PRE_DEC = (ast:baseAst):_code.CodeArray => {
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_VAR)) {
                code = this.part(children[_const.CHILD_VAR]);
            }
            return _code.codeBuffer('--', code);
        }

        // kind ( 273 )
        // child nodes ( var )
        public AST_POST_INC = (ast:baseAst):_code.CodeArray => {
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_VAR)) {
                code = this.part(children[_const.CHILD_VAR]);
            }
            return _code.codeBuffer(code, '++');
        }

        // kind ( 274 )
        // child nodes ( var )
        public AST_POST_DEC = (ast:baseAst):_code.CodeArray => {
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_VAR)) {
                code = this.part(children[_const.CHILD_VAR]);
            }
            return _code.codeBuffer(code, '--');
        }

        // kind ( 275 )
        // child nodes ( expr )
        public AST_YIELD_FROM = (ast:baseAst):_code.CodeArray => {
            return this.AST_base(ast);
        }

        // kind ( 276 )
        // child nodes ( var )
        public AST_GLOBAL = (ast:baseAst):_code.CodeArray => {
            //TODO scope global
            this.useGlobal = true;
            let code = '//global ';
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_VAR)) {
                if(_scope.currentScope().inGlobal){
                    console.error('inGlobal nest.');
                    //TODO FATAL
                }
                _scope.currentScope().inGlobal = true;
                code += _code.cbExpand(this.part(children[_const.CHILD_VAR]));
                _scope.currentScope().inGlobal = false;
            }
            return _code.codeBuffer(code);
        }

        // kind ( 277 )
        // child nodes ( var )
        public AST_UNSET = (ast:baseAst):_code.CodeArray => {
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_VAR)) {
                code = this.part(children[_const.CHILD_VAR]);
            }
            return _code.codeBuffer('delete ', code);
        }

        // kind ( 278 )
        // child nodes ( expr )
        public AST_RETURN = (ast:baseAst):_code.CodeArray => {
            if(this.outerFunction) {
                this.moduleResolver.setReturn();
            }
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_EXPR)) {
                code = _code.codeBuffer(' ',this.part(children[_const.CHILD_EXPR]));
            }
            return _code.codeBuffer('return', code);
        }

        // kind ( 279 )
        // child nodes ( name )
        public AST_LABEL = (ast:baseAst):_code.CodeArray => {
            //TODO warning
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_NAME)) {
                code = _code.codeBuffer(children[_const.CHILD_NAME], ':');
            }
            return _code.codeBuffer(code);
        }

        // kind ( 280 )
        // child nodes ( var )
        public AST_REF = (ast:baseAst):_code.CodeArray => {
            //TODO warning
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_VAR)) {
                code = this.part(children[_const.CHILD_VAR]);
            }
            return _code.codeBuffer('/* reference */', code);
        }

        // kind ( 281 )
        // child nodes ( offset )
        public AST_HALT_COMPILER = (ast:baseAst):_code.CodeArray => {
            return this.AST_base(ast);
        }

        // kind ( 282 )
        // child nodes ( expr )
        public AST_ECHO = (ast:baseAst):_code.CodeArray => {
            let name = 'echo';
            if(name in _settings.Functions) {
                return this.replaceFunction(name, ast.children[_const.CHILD_EXPR]);
            }
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_EXPR)) {
                code = this.part(children[_const.CHILD_EXPR]);
            }
            return _code.codeBuffer('console.log(', code, ")");
        }

        // kind ( 283 )
        // child nodes ( expr )
        public AST_THROW = (ast:baseAst):_code.CodeArray => {
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_EXPR)) {
                code = this.part(children[_const.CHILD_EXPR]);
            }
            return _code.codeBuffer('throw ', code);
        }

        // kind ( 284 )
        // child nodes ( label )
        public AST_GOTO = (ast:baseAst):_code.CodeArray => {
            //TODO warning
            let code = '';
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_LABEL)) {
                code = children[_const.CHILD_LABEL];
            }
            return _code.codeBuffer('goto ', code);
        }

        // kind ( 285 )
        // child nodes ( depth )
        public AST_BREAK = (ast:baseAst):_code.CodeArray => {
            let code = '';
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_DEPTH)) {
                let depth = this.part(children[_const.CHILD_DEPTH]);
                code = ' ' + this.getLabel(_code.cbExpand(depth));
            }
            return _code.codeBuffer('break', code);
        }

        // kind ( 286 )
        // child nodes ( depth )
        public AST_CONTINUE = (ast:baseAst):_code.CodeArray => {
            let code = '';
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_DEPTH)) {
                let depth = this.part(children[_const.CHILD_DEPTH]);
                code = ' ' + this.getLabel(_code.cbExpand(depth));
            }
            return _code.codeBuffer('continue', code);
        }

        // kind ( 512 )
        // child nodes ( expr, dim )
        public AST_DIM = (ast:baseAst):_code.CodeArray => {
            let expr:_code.CodeArray = new _code.CodeArray();
            let dim:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_EXPR)) {
                expr = this.part(children[_const.CHILD_EXPR]);
            }
            if(this.childExist(children,_const.CHILD_DIM)) {
                dim = this.part(children[_const.CHILD_DIM]);
            }
            return _code.codeBuffer(expr, '[', dim, ']');
        }

        // kind ( 515 )
        // child nodes ( expr, args )
        public AST_CALL = (ast:baseAst):_code.CodeArray => {
            let children:{[key:string]:any} = ast.children;
            let expr = children[_const.CHILD_EXPR];
            let args = children[_const.CHILD_ARGS];
            return this.replaceFunctionName(expr,args);
        }
        
        // kind ( 516 )
        // child nodes ( class, const )
        public AST_CLASS_CONST = (ast:baseAst):_code.CodeArray => {
            let cls = this.replaceClassNameForStatic(ast.children[_const.CHILD_CLASS]);
            let cst = ast.children[_const.CHILD_CONST];
            return _code.codeBuffer(cls, '.', cst);
        }

        // kind ( 517 )
        // child nodes ( var, expr )
        public AST_ASSIGN = (ast:baseAst,signals:Signals):_code.CodeArray => {
            let left:_code.CodeArray = new _code.CodeArray();
            let right:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_VAR)) {
                left = this.part(children[_const.CHILD_VAR]);
            }
            let scope = _scope.currentScope();
            let tmpInAssign = scope.inAssign;
            scope.inAssign = true;
            if(this.childExist(children,_const.CHILD_EXPR)) {
                right = this.part(children[_const.CHILD_EXPR]);
            }
            //console.log('left:::'+cbToString(left));
            //console.log('right:::'+cbToString(right));
            scope.inAssign = tmpInAssign;/* true:代入文の右辺で代入する場合 */
            if(checkVariable(left)) {/* 代入文の左辺が可変変数の場合 */
                let preCodeList:string[] = [];
                let str = this.cbExpandE(_code.codeBuffer(left,"=",right), preCodeList);
                if(tmpInAssign /*|| !signals.toAssign*/){
                    let tmpName = _scope.newLocal(_scope.currentScope());
                    let pre = preCodeList.join('') + tmpName + " = eval(" +str +");\n";
                    _scope.currentScope().preCodeStock.push(pre);
                    return _code.codeBuffer(tmpName);
                } else {
                    let preCode = _scope.currentScope().preCodeStock.join('');
                    _scope.currentScope().preCodeStock = [];
                    return _code.codeBuffer(preCode + preCodeList.join('') + "eval(" +str +")");
                }
            } else if(tmpInAssign /*|| !signals.toAssign*/){
                return _code.codeBuffer('(', left, '=', right, ")");
            }
            let preCode = _scope.currentScope().preCodeStock.join('');
            _scope.currentScope().preCodeStock = [];
            return _code.codeBuffer(preCode, left, '=', right);
        }
        
        private cbExpandE = (cb:_code.CodeArray,preCodeList?:string[]):string => {
            let root = (preCodeList === undefined);
            if(root) {
                preCodeList = [];
            } 
            _code.cbFormat(cb);
            let str = this.cbExpandELoop(cb,preCodeList);
            if(root) {
                return preCodeList.join('') + str;
            }
            return str;
        }
        
        private cbExpandELoop = (cb:_code.CodeArray,preCodeList:string[]):string => {
            let str = '';
            let first = true;
            for(let code of cb) {
                if(first) {
                    first = false;
                } else {
                    str += " + ";
                }
                let subcode:string|_code.CodeArray = code.code;
                if(typeof subcode === 'string') {
                    if(code.causeEval) {
                        str += subcode;
                    } else {
                        str += _code.stringify(subcode);
                    }
                } else {
                    if(code.causeEval) {
                        if(checkVariable(subcode)) {
                            let tmpName = _scope.newLocal(_scope.currentScope());
                            preCodeList.push(tmpName + ' = ' + _code.cbExpandLoop(subcode,preCodeList) + ";\n");
                            str += tmpName;
                        } else {
                            str += _code.cbExpandLoop(subcode,preCodeList);
                        }
                    } else {
                        str += this.cbExpandELoop(subcode,preCodeList);
                    }
                }
            }
            return str;
        }

        // kind ( 518 ) 参照による代入
        // child nodes ( var, expr )
        public AST_ASSIGN_REF = (ast:baseAst):_code.CodeArray => {
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_VAR)) {
                code = this.part(children[_const.CHILD_VAR]);
            }
            //TODO
            code.push_(_code.codeNormal(' = /* Reference */'));
            let tmp = _scope.currentScope().inAssign;
            _scope.currentScope().inAssign = true;
            if(this.childExist(children,_const.CHILD_EXPR)) {
                code.append(this.part(children[_const.CHILD_EXPR]));
            }
            _scope.currentScope().inAssign = tmp;
            if(tmp){
                return _code.codeBuffer('(', code, ")");
            }
            return code;
        }

        // kind ( 519 )
        // flags type ( exclusive ) BINARY_BITWISE_OR,BINARY_BITWISE_AND,BINARY_BITWISE_XOR,BINARY_CONCAT,BINARY_ADD,BINARY_SUB,BINARY_MUL,BINARY_DIV,BINARY_MOD,BINARY_POW,BINARY_SHIFT_LEFT,BINARY_SHIFT_RIGHT,ASSIGN_BITWISE_OR,ASSIGN_BITWISE_AND,ASSIGN_BITWISE_XOR,ASSIGN_CONCAT,ASSIGN_ADD,ASSIGN_SUB,ASSIGN_MUL,ASSIGN_DIV,ASSIGN_MOD,ASSIGN_POW,ASSIGN_SHIFT_LEFT,ASSIGN_SHIFT_RIGHT
        // child nodes ( var, expr )
        public AST_ASSIGN_OP = (ast:baseAst):_code.CodeArray => {
            let _operator = '';
            let _var:_code.CodeArray = new _code.CodeArray();
            let expr:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_VAR)) {
                _var = this.part(children[_const.CHILD_VAR]);
            }
            if(this.childExist(children,_const.CHILD_EXPR)) {
                expr = this.part(children[_const.CHILD_EXPR]);
            }
            switch(ast.flags){
            case _const.Flags[_const.FLAG.ASSIGN_BITWISE_OR]:
            case _const.Flags[_const.FLAG.BINARY_BITWISE_OR]:
                _operator += '|=';break;
            case _const.Flags[_const.FLAG.BINARY_BITWISE_AND]:
            case _const.Flags[_const.FLAG.ASSIGN_BITWISE_AND]:
                _operator += '&=';break;
            case _const.Flags[_const.FLAG.BINARY_BITWISE_XOR]:
            case _const.Flags[_const.FLAG.ASSIGN_BITWISE_XOR]:
                _operator += '^=';break;
            case _const.Flags[_const.FLAG.BINARY_CONCAT]:
            case _const.Flags[_const.FLAG.ASSIGN_CONCAT]:
                _operator += '+=';break;
            case _const.Flags[_const.FLAG.BINARY_ADD]:
            case _const.Flags[_const.FLAG.ASSIGN_ADD]:
                _operator += '+=';break;
            case _const.Flags[_const.FLAG.BINARY_SUB]:
            case _const.Flags[_const.FLAG.ASSIGN_SUB]:
                _operator += '-=';break;
            case _const.Flags[_const.FLAG.BINARY_MUL]:
            case _const.Flags[_const.FLAG.ASSIGN_MUL]:
                _operator += '*=';break;
            case _const.Flags[_const.FLAG.BINARY_DIV]:
            case _const.Flags[_const.FLAG.ASSIGN_DIV]:
                _operator += '/=';break;
            case _const.Flags[_const.FLAG.BINARY_MOD]:
            case _const.Flags[_const.FLAG.ASSIGN_MOD]:
                _operator += '%=';break;
            case _const.Flags[_const.FLAG.BINARY_POW]:
            case _const.Flags[_const.FLAG.ASSIGN_POW]:
                _operator += '**=';break;
            case _const.Flags[_const.FLAG.BINARY_SHIFT_LEFT]:
            case _const.Flags[_const.FLAG.ASSIGN_SHIFT_LEFT]:
                _operator += '<<=';break;
            case _const.Flags[_const.FLAG.BINARY_SHIFT_RIGHT]:
            case _const.Flags[_const.FLAG.ASSIGN_SHIFT_RIGHT]:
                _operator += '>>=';break;
            }
            return _code.codeBuffer(_var, _operator, expr);
        }

        // kind ( 520 )
        // flags type ( exclusive ) BINARY_BITWISE_OR,BINARY_BITWISE_AND,BINARY_BITWISE_XOR,BINARY_CONCAT,BINARY_ADD,BINARY_SUB,BINARY_MUL,BINARY_DIV,BINARY_MOD,BINARY_POW,BINARY_SHIFT_LEFT,BINARY_SHIFT_RIGHT,BINARY_BOOL_AND,BINARY_BOOL_OR,BINARY_BOOL_XOR,BINARY_IS_IDENTICAL,BINARY_IS_NOT_IDENTICAL,BINARY_IS_EQUAL,BINARY_IS_NOT_EQUAL,BINARY_IS_SMALLER,BINARY_IS_SMALLER_OR_EQUAL,BINARY_IS_GREATER,BINARY_IS_GREATER_OR_EQUAL,BINARY_SPACESHIP
        // child nodes ( left, right )
        public AST_BINARY_OP = (ast:baseAst):_code.CodeArray => {
            let _operator = '';
            let left:_code.CodeArray = new _code.CodeArray();
            let right:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_LEFT)) {
                left = this.part(children[_const.CHILD_LEFT]);
            } else {
                left = new _code.CodeArray(_code.codeNormal('err/* left operand missing */'));
            }
            if(this.childExist(children,_const.CHILD_RIGHT)) {
                right = this.part(children[_const.CHILD_RIGHT]);
            } else {
                right = new _code.CodeArray(_code.codeNormal('err/* right operand missing */'));
            }
            switch(ast.flags){
            case _const.Flags[_const.FLAG.BINARY_BITWISE_OR]:
                _operator += '|';break;
            case _const.Flags[_const.FLAG.BINARY_BITWISE_AND]:
                _operator += '&';break;
            case _const.Flags[_const.FLAG.BINARY_BITWISE_XOR]:
                _operator += '^';break;
            case _const.Flags[_const.FLAG.BINARY_CONCAT]:
                _operator += '+';break;
            case _const.Flags[_const.FLAG.BINARY_ADD]:
                _operator += '+';break;
            case _const.Flags[_const.FLAG.BINARY_SUB]:
                _operator += '-';break;
            case _const.Flags[_const.FLAG.BINARY_MUL]:
                _operator += '*';break;
            case _const.Flags[_const.FLAG.BINARY_DIV]:
                _operator += '/';break;
            case _const.Flags[_const.FLAG.BINARY_MOD]:
                _operator += '%';break;
            case _const.Flags[_const.FLAG.BINARY_POW]:
                _operator += '**';break;
            case _const.Flags[_const.FLAG.BINARY_SHIFT_LEFT]:
                _operator += '<<';break;
            case _const.Flags[_const.FLAG.BINARY_SHIFT_RIGHT]:
                _operator += '>>';break;
            case _const.Flags[_const.FLAG.BINARY_BOOL_AND]:
                _operator += '&&';break;
            case _const.Flags[_const.FLAG.BINARY_BOOL_OR]:
                _operator += '||';break;
            case _const.Flags[_const.FLAG.BINARY_BOOL_XOR]:
                return _code.codeBuffer('{let tmpL=',left,';/* xor */let tmpR=',right,';(tmpL&&!tmpR)||(!tmpL&&tmpR)}');
            case _const.Flags[_const.FLAG.BINARY_IS_IDENTICAL]:
                _operator += '===';break;
            case _const.Flags[_const.FLAG.BINARY_IS_NOT_IDENTICAL]:
                _operator += '!==';break;
            case _const.Flags[_const.FLAG.BINARY_IS_EQUAL]:
                _operator += '==';break;
            case _const.Flags[_const.FLAG.BINARY_IS_NOT_EQUAL]:
                _operator += '!=';break;
            case _const.Flags[_const.FLAG.BINARY_IS_SMALLER]:
                _operator += '<';break;
            case _const.Flags[_const.FLAG.BINARY_IS_SMALLER_OR_EQUAL]:
                _operator += '<=';break;
            case _const.Flags[_const.FLAG.BINARY_IS_GREATER]:
                _operator += '>';break;
            case _const.Flags[_const.FLAG.BINARY_IS_GREATER_OR_EQUAL]:
                _operator += '>=';break;
            case _const.Flags[_const.FLAG.BINARY_SPACESHIP]:
                return _code.codeBuffer('{let tmpL=',left,';/* <=> */let tmpR=',right,';((tmpL==tmpR)?0:(tmpL>tmpR?1:-1))}');
            }
            return _code.codeBuffer('(', left, _operator, right, ')');
        }

        // kind ( 521 )
        // child nodes ( left, right )
        public AST_GREATER = (ast:baseAst):_code.CodeArray => {
            return this.AST_base(ast);
        }

        // kind ( 522 )
        // child nodes ( left, right )
        public AST_GREATER_EQUAL = (ast:baseAst):_code.CodeArray => {
            return this.AST_base(ast);
        }

        // kind ( 523 )
        // child nodes ( left, right )
        public AST_AND = (ast:baseAst):_code.CodeArray => {
            return this.AST_base(ast);
        }

        // kind ( 524 )
        // child nodes ( left, right )
        public AST_OR = (ast:baseAst):_code.CodeArray => {
            return this.AST_base(ast);
        }

        // kind ( 525 )
        // flags type ( exclusive ) by-reference
        // child nodes ( value, key )
        public AST_ARRAY_ELEM = (ast:baseAst):_code.CodeArray => {
            //TODO
            // switch(ast.flags){
            // case php2ts_const.Flags[php2ts_const.FLAG.BY_REFERENCE]:
            // }
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_KEY)) {
                code.append(this.part(children[_const.CHILD_KEY]));
                code.push_(_code.codeNormal(':'));
            }
            if(this.childExist(children,_const.CHILD_VALUE)) {
                code.append(this.part(children[_const.CHILD_VALUE]));
            }
            return code;
        }

        // kind ( 526 )
        // child nodes ( class, args )
        public AST_NEW = (ast:baseAst):_code.CodeArray => {
            let cls = this.replaceClassName(ast.children[_const.CHILD_CLASS]);
            let args = this.part(ast.children[_const.CHILD_ARGS]);
            return _code.codeBuffer('new ', cls, '(', args, ')');
        }

        // kind ( 527 )
        // child nodes ( expr, class )
        public AST_INSTANCEOF = (ast:baseAst):_code.CodeArray => {
            let expr = this.part(ast.children[_const.CHILD_EXPR]);
            let cls = this.replaceClassName(ast.children[_const.CHILD_CLASS]);
            return _code.codeBuffer(expr, ' instanceof ', cls);
        }

        // kind ( 528 )
        // child nodes ( value, key )
        public AST_YIELD = (ast:baseAst):_code.CodeArray => {
            return this.AST_base(ast);
        }

        // kind ( 529 ) NULL合体
        // child nodes ( left, right )
        public AST_COALESCE = (ast:baseAst):_code.CodeArray => {
            let children:{[key:string]:any} = ast.children;
            let left:_code.CodeArray = new _code.CodeArray();
            let right:_code.CodeArray = new _code.CodeArray();
            if(this.childExist(children,_const.CHILD_LEFT)) {
                left = this.part(children[_const.CHILD_LEFT]);
            } else {
                left = new _code.CodeArray(_code.codeNormal('err/* left operand missing */'));
            }
            if(this.childExist(children,_const.CHILD_RIGHT)) {
                right = this.part(children[_const.CHILD_RIGHT]);
            } else {
                right = new _code.CodeArray(_code.codeNormal('err/* right operand missing */'));
            }
            let tmp = _scope.newLocal(_scope.currentScope());
            return _code.codeBuffer('{', tmp, '=', left, ';', tmp, '!=null?', tmp, ':', right, '}');
        }

        // kind ( 530 )
        // child nodes ( var, default )
        public AST_STATIC = (ast:baseAst):_code.CodeArray => {
            //TODO scope
            let code = 'static ';
            let def:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_VAR)) {
                let varname = _code.cbExpand(this.part(children[_const.CHILD_VAR]));
                _scope.pushIgnore(varname);
                code += varname;
            }
            if(this.childExist(children,_const.CHILD_DEFAULT)) {
                def = _code.codeBuffer('=', this.part(children[_const.CHILD_DEFAULT]));
            }
            return _code.codeBuffer(code, def);
        }

        // kind ( 531 )
        // child nodes ( cond, stmts:AST_STMT_LIST(133) )
        public AST_WHILE = (ast:baseAst):_code.CodeArray => {
            ast.label = '';
            let children:{[key:string]:any} = ast.children;
            let inner = this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
            let cond = this.part(children[_const.CHILD_COND]);
            return _code.codeBuffer(ast.label, "while(", cond, ") {\n", inner, "}");
        }

        // kind ( 532 )
        // child nodes ( stmts:AST_STMT_LIST(133), cond )
        public AST_DO_WHILE = (ast:baseAst):_code.CodeArray => {
            ast.label = '';
            let children:{[key:string]:any} = ast.children;
            let inner = this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
            let cond = this.part(children[_const.CHILD_COND]);
            return _code.codeBuffer(ast.label, "do {\n", inner, "} while(", cond, ");");
        }

        // kind ( 533 )
        // child nodes ( cond, stmts )
        public AST_IF_ELEM = (ast:baseAst):_code.CodeArray => {
            let children:{[key:string]:any} = ast.children;
            let cond:_code.CodeArray = new _code.CodeArray();
            if(children[_const.CHILD_COND] !== null){
                cond = _code.codeBuffer("if(", this.part(children[_const.CHILD_COND]), ")");
            }
            let inner = this.statement(children[_const.CHILD_STMTS]);
            return _code.codeBuffer(cond, " {\n", inner, "}");
        }

        // kind ( 534 )
        // child nodes ( cond, stmts:AST_SWITCH_LIST(135) )
        public AST_SWITCH = (ast:baseAst):_code.CodeArray => {
            let tmp = _scope.currentScope().inIf;
            _scope.currentScope().inIf = true;
            ast.label = '';
            let children:{[key:string]:any} = ast.children;
            let cond = this.part(children[_const.CHILD_COND]);
            let inner = this.AST_SWITCH_LIST(children[_const.CHILD_STMTS]);
            _scope.currentScope().inIf = tmp;
            return _code.codeBuffer(ast.label, "switch(", cond, ") {\n", inner, "}");
        }

        // kind ( 535 )
        // child nodes ( cond, stmts:AST_STMT_LIST(133) )
        public AST_SWITCH_CASE = (ast:baseAst):_code.CodeArray => {
            let children:{[key:string]:any} = ast.children;
            let label:_code.CodeArray = new _code.CodeArray();
            if(children[_const.CHILD_COND] == null){
                label = new _code.CodeArray(_code.codeNormal('default:'+"\n"));
            }else{
                let cond = this.part(children[_const.CHILD_COND]);
                label = _code.codeBuffer('case ', cond, ":\n");
            }
            let inner = this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
            return _code.codeBuffer(label, inner);
        }

        // kind ( 536 )
        // child nodes ( declares, stmts )
        public AST_DECLARE = (ast:baseAst):_code.CodeArray => {
            return this.AST_base(ast);
        }

        // kind ( 537 )
        // child nodes ( name, value )
        public AST_CONST_ELEM = (ast:baseAst):_code.CodeArray => {
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_NAME)) {
                code = new _code.CodeArray(_code.codeNormal(children[_const.CHILD_NAME]));
            }
            if(this.childExist(children,_const.CHILD_VALUE)) {
                code.push_(_code.codeNormal(' = '));
                code.append(this.part(children[_const.CHILD_VALUE]));
            }
            return code;
        }

        // kind ( 538 )
        // child nodes ( traits, adaptations )
        public AST_USE_TRAIT = (ast:baseAst):_code.CodeArray => {
            //TODO static な解決方法は難しい。
            //TODO PHP仕様で、当該クラスにメソッドをmixinするライブラリを作ることで回避できるか？
            //TODO insteadof や as の壁が高い
            _scope.currentScope().inUseTrait = true;
            let code:_code.CodeArray = new _code.CodeArray(_code.codeNormal('use '));
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_TRAITS)) {
                code.append(this.part(children[_const.CHILD_TRAITS]));
            }
            if(this.childExist(children,_const.CHILD_ADAPTATIONS)) {
                code.push_(_code.codeNormal("{\n"));
                code.append(this.part(children[_const.CHILD_ADAPTATIONS]));
                code.push_(_code.codeNormal("}"));
            }else{
                code.push_(_code.codeNormal(';'));
            }
            _scope.currentScope().inUseTrait = false;
            return new _code.CodeArray(_code.codeComment(code));
        }

        // kind ( 539 )
        // child nodes ( method, insteadof )
        public AST_TRAIT_PRECEDENCE = (ast:baseAst):_code.CodeArray => {
            //TODO 538
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_METHOD)) {
                code = this.part(children[_const.CHILD_METHOD]);
            }
            if(this.childExist(children,_const.CHILD_INSTEADOF)) {
                code.push_(_code.codeNormal(' inteadof '));
                code.append(this.part(children[_const.CHILD_INSTEADOF]));
            }
            return code;
        }

        // kind ( 540 )
        // child nodes ( class, method )
        public AST_METHOD_REFERENCE = (ast:baseAst):_code.CodeArray => {
            if(_scope.currentScope().inUseTrait){
                //TODO 538
                let code:_code.CodeArray = new _code.CodeArray();
                let children:{[key:string]:any} = ast.children;
                if(this.childExist(children,_const.CHILD_CLASS)) {
                    code = _code.codeBuffer(this.part(children[_const.CHILD_CLASS]), '::');
                }
                if(this.childExist(children,_const.CHILD_METHOD)) {
                    code.push_(_code.codeNormal(children[_const.CHILD_METHOD]));
                }
                return code;
            }else{
                let code:_code.CodeArray = new _code.CodeArray();
                let children:{[key:string]:any} = ast.children;
                if(this.childExist(children,_const.CHILD_CLASS)) {
                    code = _code.codeBuffer(this.part(children[_const.CHILD_CLASS]), '.');
                }
                if(this.childExist(children,_const.CHILD_METHOD)) {
                    code.push_(_code.codeNormal(children[_const.CHILD_METHOD]));
                }
                return code;
            }
        }

        // kind ( 541 )
        // child nodes ( name:string, stmts:null|AST_STMT_LIST(133) )
        public AST_NAMESPACE = (ast:baseAst):_code.CodeArray => {
            _scope.newScope();
            let children:{[key:string]:any} = ast.children;
            let name = children[_const.CHILD_NAME];
            this.pushNamespace(name);
            let newname = this.moduleResolver.pushNamespace(name);
            let inner = this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
            let localDeclare = this.getLocalDeclare();
            this.moduleResolver.popNamespace();
            this.namespaceStack.pop();
            _scope.popScope();
            return _code.codeBuffer("namespace ", newname, " {\n", localDeclare, inner, "}");
        }

        // kind ( 144 )
        // flags type ( exclusive ) USE_NORMAL,USE_FUNCTION,USE_CONST
        public AST_USE = (ast:baseAst):_code.CodeArray => {
            switch(ast.flags){
            case _const.Flags[_const.FLAG.USE_NORMAL]:
                return this.statements(ast.children);
            case _const.Flags[_const.FLAG.USE_FUNCTION]:
            case _const.Flags[_const.FLAG.USE_CONST]:
            }
            return this.AST_base(ast);
        }

        // kind ( 542 )
        // flags type ( exclusive ) USE_NORMAL,USE_FUNCTION,USE_CONST
        // child nodes ( name, alias )
        public AST_USE_ELEM = (ast:baseAst):_code.CodeArray => {
            switch(ast.flags){
            case _const.Flags[_const.FLAG.USE_NORMAL]:
            case _const.Flags[_const.FLAG.USE_FUNCTION]:
            case _const.Flags[_const.FLAG.USE_CONST]:
                return this.AST_base(ast);
            }
            // pass1 で処理するため、ここでは何もしない
            return null;
        }

        // kind ( 543 )
        // flags type ( combinable ) MODIFIER_PUBLIC,MODIFIER_PROTECTED,MODIFIER_PRIVATE,MODIFIER_STATIC,MODIFIER_ABSTRACT,MODIFIER_FINAL,RETURNS_REF
        // child nodes ( method, alias )
        public AST_TRAIT_ALIAS = (ast:baseAst):_code.CodeArray => {
            //TODO 538
            let code:_code.CodeArray = new _code.CodeArray();
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_METHOD)) {
                code = this.part(children[_const.CHILD_METHOD]);
            }
            if(this.childExist(children,_const.CHILD_ALIAS)) {
                code.push_(_code.codeNormal(' as ' + _const.getModifier(ast.flags) + ' '));
                code.append(this.part(children[_const.CHILD_ALIAS]));
            }
            return code;
        }

        // kind ( 544 )
        // flags type ( exclusive ) USE_NORMAL,USE_FUNCTION,USE_CONST
        // child nodes ( prefix, uses )
        public AST_GROUP_USE = (ast:baseAst):_code.CodeArray => {
            switch(ast.flags){
            case _const.Flags[_const.FLAG.USE_NORMAL]:
            case _const.Flags[_const.FLAG.USE_FUNCTION]:
            case _const.Flags[_const.FLAG.USE_CONST]:
            }
            return this.AST_base(ast);
        }

        // kind ( 768 )
        // child nodes ( expr, method, args )
        public AST_METHOD_CALL = (ast:baseAst):_code.CodeArray => {
            let expr = this.part(ast.children[_const.CHILD_EXPR]);
            let name:string|baseAst = ast.children[_const.CHILD_METHOD];
            let args = this.part(ast.children[_const.CHILD_ARGS]);
            if(typeof name === 'string') {
                return _code.codeBuffer(expr, '.' + name, '(', args, ')');
            }
            // 可変変数
            let varname = this.part(name);
            // 値の参照の場合は、以下で可能
            let preCodeList:string[] = [];
            let inner = this.cbExpandE(_code.codeBuffer(expr,'.',_code.codeEval(varname),'(', args, ')'),preCodeList);
            let pre = preCodeList.join('');
            _scope.currentScope().preCodeStock.push(pre);
            return _code.codeBuffer(_code.codeEval(inner));
        }

        // kind ( 769 )
        // child nodes ( class, method, args )
        public AST_STATIC_CALL = (ast:baseAst):_code.CodeArray => {
            let cls = this.replaceClassNameForStatic(ast.children[_const.CHILD_CLASS]);
            let name:string|baseAst = ast.children[_const.CHILD_METHOD];
            let args = this.part(ast.children[_const.CHILD_ARGS]);
            if(typeof name === 'string') {
                return _code.codeBuffer(cls, '.' + name + '(', args, ')');
            }
            // 可変変数
            let varname = this.part(name);
            // 値の参照の場合は、以下で可能
            let preCodeList:string[] = [];
            let inner = this.cbExpandE(_code.codeBuffer(cls,'.',_code.codeEval(varname),'(', args, ')'),preCodeList);
            let pre = preCodeList.join('');
            _scope.currentScope().preCodeStock.push(pre);
            return _code.codeBuffer(_code.codeEval(inner));
        }

        // kind ( 770 )
        // child nodes ( cond, true, false )
        public AST_CONDITIONAL = (ast:baseAst):_code.CodeArray => {
            let children:{[key:string]:any} = ast.children;
            let cond = this.part(children[_const.CHILD_COND]);
            let true_ = this.part(children[_const.CHILD_TRUE]);
            let false_ = this.part(children[_const.CHILD_FALSE]);
            return _code.codeBuffer("(", cond, "?", true_, ":", false_, ")");
        }

        // kind ( 771 )
        // child nodes ( try:AST_STMT_LIST(133), catches:AST_CATCH_LIST(136), finally:AST_STMT_LIST(133) )
        public AST_TRY = (ast:baseAst):_code.CodeArray => {
            let children:Ast[] = ast.children;
            let try_ = this.AST_STMT_LIST(ast.children[_const.CHILD_TRY]);
            let catches_:_code.CodeArray = new _code.CodeArray();
            if (ast.children[_const.CHILD_CATCHES] != null) {
                catches_ = this.part(ast.children[_const.CHILD_CATCHES]);
            }
            if(ast.children[_const.CHILD_FINALLY] != null) {
                let finally_ = this.part(ast.children[_const.CHILD_FINALLY]);
                return _code.codeBuffer("try {\n", try_, "} ", catches_, " finally {\n", finally_, "}");
            }
            return _code.codeBuffer("try {\n", try_, "} ", catches_);
        }

        // kind ( 136 )
        public AST_CATCH_LIST = (ast:baseAst):_code.CodeArray => {
            let codelist:_code.CodeArray[] = [];
            let children:baseAst[] = ast.children;
            if(children.length == 1) {
                return this.AST_CATCH(children[0]);
            }
            for(let child of children){
                codelist.push(this.AST_CATCH2(child));
            }
            return _code.codeBuffer("catch( tmpE ) {\n", _code.codeJoin(codelist,' else '), "}");
        }

        // kind ( 772 )
        // child nodes ( class:AST_NAME, var:AST_VAR, stmts:AST_STMT_LIST(133) )
        public AST_CATCH = (ast:baseAst):_code.CodeArray => {
            let cls = this.replaceClassName(ast.children[_const.CHILD_CLASS]);
            let var_ = this.part(ast.children[_const.CHILD_VAR]);
            let stmts_ = this.AST_STMT_LIST(ast.children[_const.CHILD_STMTS]);
            return _code.codeBuffer("catch (", var_, "/* ", cls, " */) {\n", stmts_, "}");
        }
        // kind ( 772 )
        // child nodes ( class:AST_NAME, var:AST_VAR, stmts:AST_STMT_LIST(133) )
        public AST_CATCH2 = (ast:baseAst):_code.CodeArray => {
            let cls = this.replaceClassName(ast.children[_const.CHILD_CLASS]);
            let var_ = this.part(ast.children[_const.CHILD_VAR]);
            let stmts_ = this.AST_STMT_LIST(ast.children[_const.CHILD_STMTS]);
            return _code.codeBuffer("if (tmpE instanceof ", cls, ") {\nlet ", var_, ":", cls, " = tmpE", stmts_, "}");
        }

        // kind ( 773 )
        // flags type ( exclusive ) PARAM_REF,PARAM_VARIADIC
        // child nodes ( type, name, default )
        public AST_PARAM = (ast:baseAst):_code.CodeArray => {
            let code = '';
            //TODO warning message
            switch(ast.flags){
            case _const.Flags[_const.FLAG.PARAM_REF]:
                // TypeScript Standard
                code += '/* ref */';
                break;
            case _const.Flags[_const.FLAG.PARAM_VARIADIC]:
                // TypeScript not support
                code += '/* val */';
                break;
            }
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_NAME)) {
                let varname = children[_const.CHILD_NAME];
                code += _scope.pushParam(varname,ast.flags == _const.Flags[_const.FLAG.PARAM_REF]);
            }
            let _type:_code.CodeArray = new _code.CodeArray()
            if(this.childExist(children,_const.CHILD_TYPE)) {
                _type = _code.codeBuffer(':', this.part(children[_const.CHILD_TYPE]));
            }
            let _def:_code.CodeArray = new _code.CodeArray()
            if(this.childExist(children,_const.CHILD_DEFAULT)) {
                _def = _code.codeBuffer(' = ', this.part(children[_const.CHILD_DEFAULT]));
            }
            return _code.codeBuffer(code, _type, _def);
        }

        // kind ( 774 )
        // child nodes ( name, default )
        public AST_PROP_ELEM = (ast:baseAst):_code.CodeArray => {
            let code = '';
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_NAME)) {
                code += children[_const.CHILD_NAME];
            }
            let def:_code.CodeArray = new _code.CodeArray();
            if(this.childExist(children,_const.CHILD_DEFAULT)) {
                def = _code.codeBuffer(' = ', this.part(children[_const.CHILD_DEFAULT]));
            }
            return _code.codeBuffer(code, def);
        }

        // kind ( 1024 )
        // child nodes ( init, cond, loop, stmts:AST_STMT_LIST(133) )
        public AST_FOR = (ast:baseAst):_code.CodeArray => {
            ast.label = '';
            let children:{[key:string]:any} = ast.children;
            let init = this.part(children[_const.CHILD_INIT]);
            let cond = this.part(children[_const.CHILD_COND]);
            let loop = this.part(children[_const.CHILD_LOOP]);
            let inner = this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
            return _code.codeBuffer(ast.label, "for(", init, ";", cond, ";", loop, ") {\n", inner, "}");
        }

        // kind ( 1025 )
        // child nodes ( expr, value, key, stmts:AST_STMT_LIST(133) )
        public AST_FOREACH = (ast:baseAst):_code.CodeArray => {
            ast.label = '';
            let code:_code.CodeArray = new _code.CodeArray();
            let key:_code.CodeArray = null;
            let value:_code.CodeArray = null;
            let array:_code.CodeArray = new _code.CodeArray();
            let list:_code.CodeArray[] = [];
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_KEY)) {
                key = this.part(children[_const.CHILD_KEY]);
            }
            if(this.childExist(children,_const.CHILD_VALUE)) {
                let kind = children[_const.CHILD_VALUE].kind;
                if(kind !== undefined && kind == _const.getOriginalKind(_const.AST.LIST)) {
                    list = this.lists(children[_const.CHILD_VALUE].children);
                }else{
                    value = this.part(children[_const.CHILD_VALUE]);
                }
            }
            if(this.childExist(children,_const.CHILD_EXPR)) {
                array = this.part(children[_const.CHILD_EXPR]);
            }
            let stmts = this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
            if(key == null && value != null) {
                // for(array as value)
                code = _code.codeBuffer(ast.label, 'for(', value, ' of ', array, ") {\n", stmts, "}");
            } else {
                // for(array as key=>value)
                // for(array as list(...))
                // for(array as key=>list(...))
                if(key == null) {
                    key = new _code.CodeArray(_code.codeNormal(_scope.newLocal(_scope.currentScope())));
                }
                let tmpArr = new _code.CodeArray(_code.codeNormal(_scope.newLocal(_scope.currentScope())));
                code.append(_code.codeBuffer('{' + tmpArr + ' = ', array, ";\n"));
                code.push_(_code.codeNormal(ast.label));
                code.append(_code.codeBuffer('for(', key, ' in ' + tmpArr + '){'+"\n"));
                if(value != null){
                    code.append(_code.codeBuffer(value, ' = ', tmpArr, '[', key, '];'+"\n"));
                }else{
                    for(let i in list){
                        code.append(_code.codeBuffer(list[i], ' = ', tmpArr, '[',key,']['+i+'];'+"\n"));
                    }
                }
                code.append(stmts);
                code.push_(_code.codeNormal('}}'));
            }
            return code;
        }

        // kind ( 2048 )
        // flags type ( exclusive ) NAME_FQ,NAME_NOT_FQ,NAME_RELATIVE
        // child nodes ( name )
        public AST_NAME = (ast:baseAst):_code.CodeArray => {
            let name:string = ast.children[_const.CHILD_NAME];
            name = name.replace(/\\/g,'.');
            switch(ast.flags){
            case _const.Flags[_const.FLAG.NAME_FQ]:
            case _const.Flags[_const.FLAG.NAME_NOT_FQ]:
                return _code.codeBuffer(name);
            case _const.Flags[_const.FLAG.NAME_RELATIVE]:
            }
            return this.AST_base(ast);
        }

        // kind ( 2049 )
        // flags type ( exclusive ) by-reference
        // child nodes ( name )
        public AST_CLOSURE_VAR = (ast:baseAst):_code.CodeArray => {
            let code = '';
            //TODO
            switch(ast.flags){
            case _const.Flags[_const.FLAG.BY_REFERENCE]:
                code += '/* ref */';
            }
            let children:{[key:string]:any} = ast.children;
            if(this.childExist(children,_const.CHILD_NAME)) {
                let varname = children[_const.CHILD_NAME];
                _scope.pushUse(varname,ast.flags == _const.Flags[_const.FLAG.PARAM_REF]);
                code += varname;
            }
            return _code.codeBuffer(code);
        }
    }
}

export = compiler;
