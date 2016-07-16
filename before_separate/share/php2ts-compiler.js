"use strict";
var _const = require('./php2ts-const');
var _code = require('./php2ts-code');
var _settings = require('./php2ts-settings');
var _scope = require('./php2ts-scope');
var compiler;
(function (compiler_1) {
    compiler_1.initialized = false;
    compiler_1.initialize = function (settings, constants) {
        _const.initialize(constants);
        _settings.initialize(settings);
        compiler_1.initialized = true;
    };
    compiler_1.convertNamespace = function (ast) {
        if (!Array.isArray(ast)) {
            return;
        }
        var list = [];
        for (var key in ast) {
            if (ast[key] == null) {
                continue;
            }
            if (ast[key].kind != _const.getOriginalKind(_const.AST.NAMESPACE)) {
                continue;
            }
            if (ast[key].children == null) {
                continue;
            }
            if (ast[key].children.stmts != null) {
                continue;
            }
            list.push(parseInt(key));
        }
        if (list.length == 0) {
            return;
        }
        list.sort(function (a, b) { return b - a; });
        var tail = ast.length - 1;
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var key = list_1[_i];
            var start = key + 1;
            var removed = ast.splice(start, tail - key);
            if (ast[key].children == null) {
                ast[key].children = {};
            }
            var stmts = { kind: _const.getOriginalKind(_const.AST.STMT_LIST), flags: 0, lineno: ast[key].lineno, children: removed };
            ast[key].children.stmts = stmts;
            tail = key - 1;
        }
    };
    var pass1;
    (function (pass1_1) {
        pass1_1.pass1 = function (ast, relativePath) {
            var spa = { relativePath: relativePath, namespace: [],
                use: [], const: [], class: [], function: [], return: false };
            pass1main(ast, spa);
            var spa2 = { relativePath: relativePath, nameMap: {}, aliasTable: {}, return: spa.return };
            for (var key in spa.use) {
                var item = spa.use[key];
                if (item.alias == null) {
                    var pos = item.name.lastIndexOf('\\');
                    item.alias = item.name.substr(pos + 1);
                }
                spa2.aliasTable[item.alias] = item.name.split('\\');
            }
            var f = function (type, src) {
                for (var key in src) {
                    var item = src[key];
                    if (spa2.nameMap[type] === undefined) {
                        spa2.nameMap[type] = {};
                    }
                    if (spa2.nameMap[type][item.namespace] === undefined) {
                        spa2.nameMap[type][item.namespace] = {};
                    }
                    spa2.nameMap[type][item.namespace][item.name] = relativePath;
                }
            };
            f(0, spa.const);
            f(1, spa.class);
            f(2, spa.function);
            return spa2;
        };
        var pass1main = function (someAst, spa) {
            if (someAst == null) {
                return;
            }
            if (typeof someAst !== 'object') {
                return;
            }
            var ast = someAst;
            var pass1children = function () {
                if (Array.isArray(ast.children)) {
                    compiler_1.convertNamespace(ast.children);
                }
                for (var key in ast.children) {
                    pass1main(ast.children[key], spa);
                }
            };
            switch (_const.getLocalKind(ast.kind)) {
                case _const.AST.NAMESPACE:
                    spa.namespace.push(ast.children.name);
                    pass1children();
                    spa.namespace.pop();
                    break;
                case _const.AST.USE:
                    pass1_USE(ast, spa);
                    break;
                case _const.AST.CONST_ELEM:
                    pass1_CONST(ast, spa);
                    break;
                case _const.AST.CLASS:
                    pass1_CLASS(ast, spa);
                    break;
                case _const.AST.FUNC_DECL:
                    pass1_FUNCTION(ast, spa);
                    break;
                case _const.AST.RETURN:
                    spa.return = true;
                    break;
                default:
                    pass1children();
            }
        };
        var expandNamespace = function (s) {
            return s.join('\\');
        };
        var pass1_USE = function (ast, spa) {
            var namespace = expandNamespace(spa.namespace);
            var flags = ast.flags;
            for (var _i = 0, _a = ast.children; _i < _a.length; _i++) {
                var elem = _a[_i];
                var name_1 = elem.children[_const.CHILD_NAME];
                var alias = elem.children[_const.CHILD_ALIAS];
                spa.use.push({ flags: flags, name: name_1, alias: alias, namespace: namespace });
            }
        };
        var pass1_CONST = function (ast, spa) {
            var namespace = expandNamespace(spa.namespace);
            var flags = ast.flags;
            var name = ast.children[_const.CHILD_NAME];
            spa.const.push({ flags: flags, name: name, namespace: namespace });
        };
        var pass1_CLASS = function (ast, spa) {
            var namespace = expandNamespace(spa.namespace);
            var flags = ast.flags;
            var name = ast.name;
            spa.class.push({ flags: flags, name: name, namespace: namespace });
        };
        var pass1_FUNCTION = function (ast, spa) {
            var namespace = expandNamespace(spa.namespace);
            var flags = ast.flags;
            var name = ast.name;
            spa.function.push({ flags: flags, name: name, namespace: namespace });
        };
    })(pass1 = compiler_1.pass1 || (compiler_1.pass1 = {}));
    var checkVariable = function (cb) {
        for (var _i = 0, cb_1 = cb; _i < cb_1.length; _i++) {
            var code = cb_1[_i];
            if (code.causeEval) {
                return true;
            }
            var subcode = code.code;
            if (subcode instanceof _code.CodeArray) {
                if (checkVariable(subcode)) {
                    return true;
                }
            }
        }
        return false;
    };
    var compiler = (function () {
        function compiler() {
            var _this = this;
            this.KindMethods = {};
            this.importStock = {};
            this.astStack = [];
            this.useGlobal = false;
            this.namespaceStack = [];
            this.classStack = [];
            this.outerFunction = true;
            this.initialized = false;
            this.initialize = function () {
                if (!_this.initialized) {
                    if (compiler_1.initialized) {
                        _const.KindsForeach(function (str, localNumber, originalNumber) {
                            _this.KindMethods[originalNumber] = _this[str];
                        });
                        _this.initialized = true;
                    }
                    else {
                        throw new Error('php2ts-compiler uninitialized.');
                    }
                }
            };
            this.compile = function (moduleResolver, ast, comments) {
                _this.moduleResolver = moduleResolver;
                _this.initialize();
                _scope.initialize(_this.changeLocalVarname, _this.changeSuperGlobal);
                _this.importStock = {};
                _this.astStack = [];
                _this.useGlobal = false;
                _this.namespaceStack = [];
                _this.classStack = [];
                _this.Comments = comments;
                _this.CommentsKey = [];
                for (var key in comments) {
                    _this.CommentsKey.push(parseInt(key));
                }
                if (ast === undefined || ast == null) {
                    return { code: '' };
                }
                var scope = _scope.newScope();
                scope.globals = _settings.Globals;
                var innerCode = _code.cbExpand(_this.AST_STMT_LIST(ast, { root: true }));
                var globalDeclare = _this.useGlobal ? "//let global:{[key:string]:any} = new Function('return this')();\n" : '';
                var localDeclare = _this.getLocalDeclare();
                _scope.popScope();
                var innerBlock = '';
                innerBlock += globalDeclare;
                innerBlock += localDeclare;
                innerBlock += innerCode;
                innerBlock += _this.getComment(Number.MAX_VALUE);
                var code = '';
                code += _settings.InsertComments;
                code += _this.moduleResolver.getImport();
                code += _this.getImportDeclare();
                code += _this.moduleResolver.getExport(innerBlock);
                var result = { code: code };
                return result;
            };
            this.changeLocalVarname = function (varname) {
                if (varname == 'this') {
                    return varname;
                }
                var tmpname = _settings.LocalVariableNamePre + varname + _settings.LocalVariableNamePost;
                if (tmpname == 'var') {
                    tmpname = '/* autoRename */_var';
                }
                return tmpname;
            };
            this.changeSuperGlobal = function (varname) {
                if (varname in _settings.SuperGlobals) {
                    return _settings.SuperGlobals[varname];
                }
                return undefined;
            };
            this.getVar = function (ast, pre) {
                if (ast.kind !== undefined) {
                    var varname = _this.part(ast);
                    var pret = (pre == '') ? '' : "'" + pre + "'+";
                    return 'eval(' + pret + varname + ')';
                }
                if (_scope.currentScope().inGlobal) {
                    _scope.pushGlobal(ast);
                    return pre + ast;
                }
                var scope = _scope.currentScope();
                var r = _scope.getVariableTypeAndLocalPush(scope, ast);
                return pre + r.name;
            };
            this.getLocalDeclare = function () {
                var scope = _scope.currentScope();
                var code = '';
                for (var varname in scope.locals) {
                    if (varname == 'this') {
                        continue;
                    }
                    if (scope.ignores[varname] === undefined) {
                        if (code == '') {
                            code = 'let ' + scope.locals[varname];
                        }
                        else {
                            code += ', ' + scope.locals[varname];
                        }
                    }
                }
                if (code != '') {
                    code += ";\n";
                }
                for (var _i = 0, _a = scope.temporaries; _i < _a.length; _i++) {
                    var sentence = _a[_i];
                    code += sentence + "\n";
                }
                return code;
            };
            this.pushImportModule = function (varName, moduleName) {
                if (_this.importStock[varName] !== undefined) {
                }
                _this.importStock[varName] = moduleName;
            };
            this.getImportDeclare = function () {
                var s = '';
                for (var varName in _this.importStock) {
                    var moduleName = _this.importStock[varName];
                    s += 'import ' + varName + ' = require("' + moduleName + '");\n';
                }
                return s;
            };
            this.pushNamespace = function (name) {
                _this.namespaceStack.push({
                    name: name,
                    scope: _scope.currentScope(),
                    scopeIndex: _scope.currentScopeIndex()
                });
            };
            this.currentNamespace = function () {
                var pos = _this.namespaceStack.length - 1;
                if (pos < 0) {
                    return { name: '', scope: _scope.topScope(), scopeIndex: 0 };
                }
                else {
                    return _this.namespaceStack[pos];
                }
            };
            this.getLabel = function (depth) {
                var goal = (depth == '') ? 0 : parseInt(depth);
                if (goal == 0) {
                    return '';
                }
                var pos = _this.astStack.length - 1;
                var cnt = 0;
                var target = null;
                while (pos >= 0) {
                    var tmp = _this.astStack[pos];
                    if (tmp.label !== undefined) {
                        cnt++;
                        if (cnt == goal) {
                            target = tmp;
                            break;
                        }
                    }
                    pos--;
                }
                if (target == null) {
                    return depth + '/* Unknown label */';
                }
                if (target.label != '') {
                    return target.label.slice(0, target.label.length - 1);
                }
                var label = 'L' + (_scope.currentScope().labelno++);
                target.label = label + ':';
                return label;
            };
            this.getComment = function (lno) {
                var comments = '';
                var clno = 0;
                while (_this.CommentsKey.length > 0 && (clno = _this.CommentsKey[0]) < lno) {
                    var tmp = _this.Comments[clno];
                    if (tmp.charAt(0) == '#') {
                        tmp = '//' + tmp.slice(1, tmp.length - 1);
                    }
                    comments += tmp;
                    if (tmp.charAt(1) == '*') {
                        comments += "\n";
                    }
                    _this.CommentsKey.shift();
                }
                return comments;
            };
            this.childExist = function (children, key) {
                var v = children[key];
                return (v !== undefined && v != null);
            };
            this.replaceConstantName = function (constName) {
                if (constName in _settings.Constants) {
                    return _settings.Constants[constName];
                }
                return constName;
            };
            this.replaceConstant = function (ast) {
                var cst = _this.part(ast);
                if (ast.kind == _const.getOriginalKind(_const.AST.NAME)) {
                    var name_2 = _code.cbExpand(cst);
                    if (name_2 in _settings.Constants) {
                        return _settings.Constants[name_2];
                    }
                    if (ast.flags == _const.Flags[_const.FLAG.NAME_FQ]) {
                        name_2 = '.' + name_2;
                    }
                    var result = _this.moduleResolver.getConstReference(name_2);
                    if (result !== null) {
                        return result;
                    }
                }
                return cst;
            };
            this.replaceClassNameForStatic = function (ast) {
                var cls = _this.part(ast);
                if (ast.kind == _const.getOriginalKind(_const.AST.NAME)) {
                    var name_3 = _code.cbExpand(cls);
                    if (name_3 in _settings.Classes) {
                        return _settings.Classes[name_3];
                    }
                    else if (name_3 == 'parent') {
                        return '/*parent is ' + _this.classStack[_this.classStack.length - 1].extends + '*/';
                    }
                    else if (name_3 == 'static') {
                        return '/*static*/';
                    }
                    else if (name_3 == 'self') {
                        return '/*self is ' + _this.classStack[_this.classStack.length - 1].name + '*/';
                    }
                    if (ast.flags == _const.Flags[_const.FLAG.NAME_FQ]) {
                        name_3 = '.' + name_3;
                    }
                    var result = _this.moduleResolver.getClassReference(name_3);
                    if (result !== null) {
                        return result;
                    }
                }
                return cls;
            };
            this.replaceClassName = function (ast) {
                var cls = _this.part(ast);
                if (ast.kind == _const.getOriginalKind(_const.AST.NAME)) {
                    var name_4 = _code.cbExpand(cls);
                    if (name_4 in _settings.Classes) {
                        return _settings.Classes[name_4];
                    }
                    if (ast.flags == _const.Flags[_const.FLAG.NAME_FQ]) {
                        name_4 = '.' + name_4;
                    }
                    var result = _this.moduleResolver.getClassReference(name_4);
                    if (result !== null) {
                        return result;
                    }
                }
                return cls;
            };
            this.replaceFunctionName = function (ast, args) {
                var fnc = _this.part(ast);
                var expr = fnc;
                if (ast.kind == _const.getOriginalKind(_const.AST.NAME)) {
                    var name_5 = _code.cbExpand(fnc);
                    if (name_5 in _settings.Functions) {
                        return _this.replaceFunction(name_5, args);
                    }
                    if (ast.flags == _const.Flags[_const.FLAG.NAME_FQ]) {
                        name_5 = '.' + name_5;
                    }
                    var result = _this.moduleResolver.getFunctionReference(name_5);
                    if (result !== null) {
                        expr = result;
                    }
                }
                return _code.codeBuffer(expr, '(', _this.part(args), ')');
            };
            this.replaceFunction = function (name, args) {
                var expr = _settings.Functions[name];
                if (typeof expr === 'string') {
                    return _this.replaceFunctionMain(expr, name, args);
                }
                else {
                    if (Array.isArray(expr)) {
                        return _this.replaceFunctionByCount(expr, name, args);
                    }
                    else {
                        return _this.replaceFunctionWithImport(expr, name, args);
                    }
                }
            };
            this.replaceFunctionWithImport = function (expr, name, args) {
                var varName = expr.mod[0];
                var moduleName = expr.mod[1];
                _this.pushImportModule(varName, moduleName);
                var cod = expr.cod;
                if (typeof cod === 'string') {
                    return _this.replaceFunctionMain(cod, name, args);
                }
                else {
                    return _this.replaceFunctionByCount(cod, name, args);
                }
            };
            this.replaceFunctionByCount = function (exprEx, name, args) {
                var arglen = (args.kind === _const.getOriginalKind(_const.AST.ARG_LIST)) ? args.children.length : 1;
                var expr;
                if (arglen > exprEx.length) {
                    expr = exprEx[exprEx.length - 1];
                }
                else {
                    expr = exprEx[arglen];
                }
                return _this.replaceFunctionMain(expr, name, args);
            };
            this.replaceFunctionMain = function (expr, name, args) {
                if (expr == '') {
                    var argsArr = _this.part(args);
                    return _code.codeBuffer(name + '(', argsArr, ')');
                }
                var regexp = /^[A-Z0-9_.]+$/i;
                if (regexp.test(expr) || args.kind !== _const.getOriginalKind(_const.AST.ARG_LIST)) {
                    var argsArr = _this.part(args);
                    return _code.codeBuffer(expr + '(', argsArr, ')');
                }
                var digit = /\d+/;
                var buf = new _code.CodeArray();
                var pos = 0;
                var arg = args.children;
                var push = function (n, attr, comma) {
                    if (comma) {
                        buf.push(_code.codeNormal(','));
                    }
                    if (n < arg.length) {
                        buf.append(_this.part(arg[n]));
                    }
                    else {
                        buf.push(_code.codeNormal('undefined'));
                    }
                };
                var split = function (sn) {
                    var attr = '';
                    if (!digit.test(sn.charAt(0))) {
                        attr = sn.charAt(0);
                        sn = sn.substr(1);
                    }
                    var n = parseInt(sn, 10) - 1;
                    return { n: n, attr: attr };
                };
                var rep = function (match, p1, p2, p3, p4, offset) {
                    if (pos < offset) {
                        buf.push(_code.codeNormal(expr.substr(pos, offset - pos)));
                    }
                    if (p4 === '...') {
                        var sn = match.substr(1, match.length - 4);
                        var r = split(sn);
                        var n = r.n;
                        var attr = r.attr;
                        var first = true;
                        while (n < arg.length) {
                            push(n++, attr, !first);
                            attr = '';
                            first = false;
                        }
                    }
                    else if (p1 !== undefined) {
                        var snArr = match.match(/\d+/g);
                        for (var _i = 0, snArr_1 = snArr; _i < snArr_1.length; _i++) {
                            var sn = snArr_1[_i];
                            var r = split(sn);
                            if (r.n >= arg.length) {
                                break;
                            }
                            push(r.n, r.attr, true);
                        }
                    }
                    else {
                        var sn = match.substr(1);
                        var r = split(sn);
                        push(r.n, r.attr, false);
                    }
                    pos = offset + match.length;
                    return '';
                };
                expr.replace(/(\[(,\$[r]?\d)+)+\]|(\$[r]?\d+([.]{3})?)/g, rep);
                var len = expr.length;
                if (pos < len) {
                    buf.push(_code.codeNormal(expr.substr(pos, len - pos)));
                }
                return buf;
            };
            this.lists = function (ast, signals) {
                if (signals === void 0) { signals = { toAssign: false }; }
                var codeA = [];
                for (var _i = 0, ast_1 = ast; _i < ast_1.length; _i++) {
                    var item = ast_1[_i];
                    codeA.push(_this.part(item, signals));
                }
                return codeA;
            };
            this.statements = function (ast, signals) {
                if (signals === void 0) { signals = { toAssign: false }; }
                var code = new _code.CodeArray();
                compiler_1.convertNamespace(ast);
                for (var _i = 0, ast_2 = ast; _i < ast_2.length; _i++) {
                    var item = ast_2[_i];
                    if (item == null) {
                        continue;
                    }
                    code.append(_this.statement(item, signals));
                }
                return code;
            };
            this.statement = function (ast, signals) {
                if (signals === void 0) { signals = { toAssign: false }; }
                var code = new _code.CodeArray();
                if (ast == null) {
                    return code;
                }
                var semicolon = ';';
                var kind = ast.kind;
                var precomment = '';
                var postcomment = '';
                if (kind !== undefined) {
                    if (_const.IgnoreSemicolon[kind] !== undefined) {
                        semicolon = '';
                    }
                    precomment = _this.getComment(ast.lineno);
                    postcomment = _this.getComment(ast.lineno + 1);
                }
                semicolon += postcomment;
                code.push_(_code.codeNormal(precomment));
                var stmts = _this.part(ast, signals);
                var preCode = _scope.currentScope().preCodeStock.join('');
                _scope.currentScope().preCodeStock = [];
                code.push_(_code.codeNormal(preCode));
                code.append(stmts);
                code.push_(_code.codeNormal(semicolon));
                if ((code.length > 0) && (((semicolon.length == 0) && (stmts !== null) && (stmts.length > 0)) || (semicolon.charAt(semicolon.length - 1) != "\n"))) {
                    code.push_(_code.codeNormal("\n"));
                }
                return code;
            };
            this.part = function (ast, signals) {
                if (signals === void 0) { signals = { toAssign: false }; }
                if (ast === undefined || ast == null) {
                    return new _code.CodeArray();
                }
                if (typeof ast === 'string') {
                    return _code.codeBuffer(_code.stringify(ast));
                }
                else if (typeof ast === 'number') {
                    return _code.codeBuffer(ast.toString());
                }
                else if (typeof ast === 'boolean') {
                    return _code.codeBuffer(ast.toString());
                }
                else if (ast.kind !== undefined) {
                    var comment = (ast.docComment !== undefined && ast.docComment != null) ? ast.docComment + "\n" : '';
                    var method = _this.KindMethods[ast.kind];
                    var code = new _code.CodeArray();
                    if (method === undefined) {
                        console.error('php2ts:Unknown kind(' + ast.kind + ')');
                    }
                    else {
                        _this.astStack.push(ast);
                        code = method(ast, signals);
                        _this.astStack.pop();
                    }
                    return _code.codeBuffer(comment, code);
                }
                console.error('Unknown statement');
                console.dir(ast);
                return _code.codeBuffer('/* Unknown ' + ast.toString() + ' */');
            };
            this.AST_base = function (ast) {
                var code = '(kind:' + ast.kind + ')';
                code += (ast.name === undefined) ? '' : ast.name;
                code += _const.flagsString(ast.kind, ast.flags);
                code += "{\n";
                if (Array.isArray(ast.children)) {
                    var children = ast.children;
                    for (var key in children) {
                        code += key + ':' + _this.part(children[key]);
                    }
                }
                else {
                    var children = ast.children;
                    for (var key in children) {
                        var inner = _code.cbExpand(_this.part(children[key]));
                        if (key == _const.CHILD_STMTS) {
                            if (inner.length > 0) {
                                inner = "{\n" + inner + "}";
                            }
                        }
                        code += key + ':' + inner + "\n";
                    }
                }
                code += "};";
                return _code.codeBuffer(_code.codeComment(code));
            };
            this.AST_MAGIC_CONST = function (ast) {
                var constName = '';
                switch (ast.flags) {
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
                        return _this.AST_base(ast);
                }
                return _code.codeBuffer(_this.replaceConstantName(constName));
            };
            this.AST_TYPE = function (ast) {
                switch (ast.flags) {
                    case 0:
                        return _code.codeBuffer('void');
                    case _const.Flags[_const.FLAG.TYPE_NULL]:
                        return _code.codeBuffer('null');
                    case _const.Flags[_const.FLAG.TYPE_BOOL]:
                        return _code.codeBuffer('boolean');
                    case _const.Flags[_const.FLAG.TYPE_LONG]:
                        return _code.codeBuffer('number', '/* long */');
                    case _const.Flags[_const.FLAG.TYPE_DOUBLE]:
                        return _code.codeBuffer('number', '/* double */');
                    case _const.Flags[_const.FLAG.TYPE_STRING]:
                        return _code.codeBuffer('string');
                    case _const.Flags[_const.FLAG.TYPE_ARRAY]:
                        return _code.codeBuffer('Array');
                    case _const.Flags[_const.FLAG.TYPE_OBJECT]:
                        return _code.codeBuffer('any', '/* object */');
                    case _const.Flags[_const.FLAG.TYPE_CALLABLE]:
                        return _code.codeBuffer('any', '/* callable */');
                }
                return _this.AST_base(ast);
            };
            this.AST_FUNC_DECL = function (ast) {
                var tmp = _this.outerFunction;
                _this.outerFunction = false;
                _scope.newScope();
                var modifier = _const.getModifier(ast.flags);
                var name = (ast.name === undefined) ? '' : ast.name;
                var code = new _code.CodeArray();
                var children = ast.children;
                code.push_(_code.codeNormal('('));
                if (_this.childExist(children, _const.CHILD_PARAMS)) {
                    code.append(_this.part(children[_const.CHILD_PARAMS]));
                }
                code.push_(_code.codeNormal(')'));
                if (_this.childExist(children, _const.CHILD_RETURNTYPE)) {
                    code.push_(_code.codeNormal(':'));
                    code.append(_this.part(children[_const.CHILD_RETURNTYPE]));
                }
                var uses = new _code.CodeArray();
                if (_this.childExist(children, _const.CHILD_USES)) {
                    uses.push(_code.codeComment('// use(' + _code.cbExpand(_this.part(children[_const.CHILD_USES])) + ")\n"));
                }
                var inner = _this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
                var localDeclare = _this.getLocalDeclare();
                _scope.popScope();
                _this.outerFunction = tmp;
                var namespace_ = _this.currentNamespace();
                if (name == '') {
                    return _code.codeBuffer(code, " => {\n", uses, localDeclare, inner, "}");
                }
                else if (_scope.currentScope().inIf || (_scope.currentScopeIndex() > namespace_.scopeIndex)) {
                    _scope.pushLocal(namespace_.scope, name, false);
                    return _code.codeBuffer(name + ' = ', code, " => {\n", uses, localDeclare, inner, "}");
                }
                else {
                    return _code.codeBuffer('export function ' + name, code, " {\n", uses, localDeclare, inner, "}");
                }
            };
            this.AST_CLOSURE = function (ast) {
                var tmp = _this.outerFunction;
                _this.outerFunction = false;
                _scope.newScope();
                var code = new _code.CodeArray(_code.codeNormal(_const.getModifier(ast.flags) + ' '));
                var children = ast.children;
                code.push_(_code.codeNormal(' ('));
                if (_this.childExist(children, _const.CHILD_PARAMS)) {
                    code.append(_this.part(children[_const.CHILD_PARAMS]));
                }
                code.push_(_code.codeNormal(')'));
                if (_this.childExist(children, _const.CHILD_RETURNTYPE)) {
                    code.push_(_code.codeNormal(':'));
                    code.append(_this.part(children[_const.CHILD_RETURNTYPE]));
                }
                var uses = new _code.CodeArray();
                if (_this.childExist(children, _const.CHILD_USES)) {
                    uses.push(_code.codeNormal('// use(' + _code.cbExpand(_this.part(children[_const.CHILD_USES])) + ")\n"));
                }
                var inner = _this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
                var localDeclare = _this.getLocalDeclare();
                _scope.popScope();
                _this.outerFunction = tmp;
                return _code.codeBuffer(code, " => {\n", uses, localDeclare, inner, "}");
            };
            this.AST_METHOD = function (ast) {
                var tmp = _this.outerFunction;
                _this.outerFunction = false;
                _scope.newScope();
                var code = new _code.CodeArray();
                var modifier = _const.getModifier(ast.flags) + ' ';
                if (_scope.currentScope().inInterface) {
                    modifier = '/* ' + modifier + '*/';
                }
                code.push_(_code.codeNormal(modifier));
                var arrow = ' => ';
                if (ast.name !== undefined) {
                    if (ast.name == '__construct') {
                        arrow = '';
                        code.push_(_code.codeNormal('constructor'));
                    }
                    else {
                        if (_scope.currentScope().inInterface) {
                            code.push_(_code.codeNormal(ast.name));
                        }
                        else {
                            code.push_(_code.codeNormal(ast.name + '='));
                        }
                    }
                }
                var children = ast.children;
                code.push_(_code.codeNormal(' ('));
                if (_this.childExist(children, _const.CHILD_PARAMS)) {
                    code.append(_this.part(children[_const.CHILD_PARAMS]));
                }
                code.push_(_code.codeNormal(')'));
                if (_this.childExist(children, _const.CHILD_RETURNTYPE)) {
                    code.push_(_code.codeNormal(':'));
                    code.append(_this.part(children[_const.CHILD_RETURNTYPE]));
                }
                var uses = new _code.CodeArray();
                if (_this.childExist(children, _const.CHILD_USES)) {
                    uses.push(_code.codeNormal('// use(' + _code.cbExpand(_this.part(children[_const.CHILD_USES])) + ")\n"));
                }
                var stmts = children[_const.CHILD_STMTS];
                var inner = (stmts == null) ? new _code.CodeArray() : _this.AST_STMT_LIST(stmts);
                var localDeclare = _this.getLocalDeclare();
                _scope.popScope();
                _this.outerFunction = tmp;
                if (_scope.currentScope().inInterface) {
                    return code;
                }
                return _code.codeBuffer(code, arrow, "{\n", uses, localDeclare, inner, "}");
            };
            this.AST_CLASS = function (ast) {
                var code = new _code.CodeArray();
                var cls = 'unknown class';
                switch (ast.flags) {
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
                var name = '';
                if (ast.name !== undefined) {
                    name = ast.name;
                    code.push_(_code.codeNormal(' ' + ast.name));
                }
                var children = ast.children;
                var extendsClass = '';
                if (_this.childExist(children, _const.CHILD_EXTENDS)) {
                    code.push_(_code.codeNormal(' extends '));
                    var codeArr = _this.replaceClassName(children[_const.CHILD_EXTENDS]);
                    if (typeof codeArr === 'string') {
                        extendsClass = codeArr;
                        code.push(_code.codeNormal(codeArr));
                    }
                    else {
                        extendsClass = _code.cbExpand(codeArr);
                        code.append(codeArr);
                    }
                }
                if (_this.childExist(children, _const.CHILD_IMPLEMENTS)) {
                    code.push_(_code.codeNormal(' implements '));
                    var codeArr = _this.replaceClassName(children[_const.CHILD_IMPLEMENTS]);
                    if (typeof codeArr === 'string') {
                        code.push(_code.codeNormal(codeArr));
                    }
                    else {
                        code.append(codeArr);
                    }
                }
                _this.classStack.push({ name: name, extends: extendsClass });
                var inner = _this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
                _scope.currentScope().inInterface = false;
                _this.classStack.pop();
                return _code.codeBuffer(code, "{\n", inner, "}");
            };
            this.AST_ARG_LIST = function (ast) {
                return _code.codeJoin(_this.lists(ast.children), ',');
            };
            this.AST_LIST = function (ast) {
                return _code.codeBuffer('list(', _code.codeJoin(_this.lists(ast.children), ','), ')');
            };
            this.AST_ARRAY = function (ast) {
                var codeA = [];
                var children = ast.children;
                var quote = '{';
                for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                    var item = children_1[_i];
                    codeA.push(_this.part(item));
                    if (item.children.key == null) {
                        quote = '[';
                    }
                }
                return _code.codeBuffer(quote, _code.codeJoin(codeA, ','), ((quote == '{') ? '}' : ']'));
            };
            this.AST_ENCAPS_LIST = function (ast) {
                var codeA = [];
                var children = ast.children;
                for (var _i = 0, children_2 = children; _i < children_2.length; _i++) {
                    var item = children_2[_i];
                    codeA.push(_this.part(item));
                }
                return _code.codeJoin(codeA, '+');
            };
            this.AST_EXPR_LIST = function (ast) {
                return _code.codeJoin(_this.lists(ast.children, { toAssign: true }), ',');
            };
            this.AST_STMT_LIST = function (ast, signals) {
                if (ast.kind != _const.getOriginalKind(_const.AST.STMT_LIST)) {
                    return _this.statement(ast);
                }
                var root = false;
                if (signals !== undefined) {
                    if (signals.root !== undefined && signals.root) {
                        root = true;
                    }
                }
                if (root) {
                    _this.astStack.push(ast);
                }
                var code = _this.statements(ast.children, { toAssign: true });
                return code;
            };
            this.AST_IF = function (ast) {
                var tmp = _scope.currentScope().inIf;
                _scope.currentScope().inIf = true;
                var code = new _code.CodeArray();
                var children = ast.children;
                var first = true;
                for (var _i = 0, children_3 = children; _i < children_3.length; _i++) {
                    var item = children_3[_i];
                    if (first) {
                        first = false;
                    }
                    else {
                        code.push_(_code.codeNormal(' else '));
                    }
                    code.append(_this.part(item));
                }
                _scope.currentScope().inIf = tmp;
                return code;
            };
            this.AST_SWITCH_LIST = function (ast) {
                return _this.statements(ast.children);
            };
            this.AST_PARAM_LIST = function (ast) {
                var codelist = [];
                var children = ast.children;
                for (var _i = 0, children_4 = children; _i < children_4.length; _i++) {
                    var child = children_4[_i];
                    codelist.push(_this.part(child));
                }
                return _code.codeJoin(codelist, ',');
            };
            this.AST_CLOSURE_USES = function (ast) {
                var codelist = [];
                var children = ast.children;
                for (var _i = 0, children_5 = children; _i < children_5.length; _i++) {
                    var child = children_5[_i];
                    codelist.push(_this.part(child));
                }
                return _code.codeJoin(codelist, ',');
            };
            this.AST_PROP_DECL = function (ast) {
                var modifier = _const.getModifier(ast.flags);
                var props = _this.lists(ast.children);
                var code = new _code.CodeArray();
                var first = true;
                for (var _i = 0, props_1 = props; _i < props_1.length; _i++) {
                    var prop = props_1[_i];
                    if (first) {
                        first = false;
                    }
                    else {
                        code.push_(_code.codeNormal(';\n'));
                    }
                    code.append(_code.codeBuffer(modifier, ' ', prop));
                }
                return code;
            };
            this.AST_CONST_DECL = function (ast) {
                return _code.codeBuffer('export const ', _code.codeJoin(_this.lists(ast.children), ','));
            };
            this.AST_CLASS_CONST_DECL = function (ast) {
                var modifier = _const.getModifier(ast.flags);
                if (modifier == '') {
                    modifier = 'public';
                }
                var props = _this.lists(ast.children);
                var code = new _code.CodeArray();
                var first = true;
                for (var _i = 0, props_2 = props; _i < props_2.length; _i++) {
                    var prop = props_2[_i];
                    if (first) {
                        first = false;
                    }
                    else {
                        code.push_(_code.codeNormal(';\n'));
                    }
                    code.append(_code.codeBuffer(modifier, ' /*const*/static ', prop));
                }
                return code;
            };
            this.AST_NAME_LIST = function (ast) {
                var codelist = [];
                var children = ast.children;
                for (var _i = 0, children_6 = children; _i < children_6.length; _i++) {
                    var child = children_6[_i];
                    codelist.push(_this.part(child));
                }
                return _code.codeJoin(codelist, ',');
            };
            this.AST_TRAIT_ADAPTATIONS = function (ast) {
                return _this.statements(ast.children);
            };
            this.AST_VAR = function (ast) {
                var name = ast.children[_const.CHILD_NAME];
                if (typeof name === 'string') {
                    if (_scope.currentScope().inGlobal) {
                        _scope.pushGlobal(name);
                        return _code.codeBuffer(name);
                    }
                    var scope = _scope.currentScope();
                    var r = _scope.getVariableTypeAndLocalPush(scope, name);
                    return _code.codeBuffer(r.name);
                }
                var varname = _this.part(name);
                return _code.codeBuffer(_code.codeEval(varname));
            };
            this.AST_PROP = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                code.append(_this.part(children[_const.CHILD_EXPR]));
                code.push_(_code.codeNormal('.'));
                var prop = ast.children[_const.CHILD_PROP];
                if (typeof prop === 'string') {
                    return _code.codeBuffer(code, prop);
                }
                var varname = _this.part(prop);
                var preCodeList = [];
                var inner = _this.cbExpandE(_code.codeBuffer(_code.codeNormal(code), _code.codeEval(varname)), preCodeList);
                var pre = preCodeList.join('');
                _scope.currentScope().preCodeStock.push(pre);
                return _code.codeBuffer(_code.codeEval(inner));
            };
            this.AST_STATIC_PROP = function (ast) {
                var cls = _this.replaceClassNameForStatic(ast.children[_const.CHILD_CLASS]);
                var prop = ast.children[_const.CHILD_PROP];
                if (typeof prop === 'string') {
                    return _code.codeBuffer(cls, '.', prop);
                }
                var varname = _this.part(prop);
                var preCodeList = [];
                var inner = _this.cbExpandE(_code.codeBuffer(cls, '.', _code.codeEval(varname)), preCodeList);
                var pre = preCodeList.join('');
                _scope.currentScope().preCodeStock.push(pre);
                return _code.codeBuffer(_code.codeEval(inner));
            };
            this.AST_CONST = function (ast) {
                return _code.codeBuffer(_this.replaceConstant(ast.children[_const.CHILD_NAME]));
            };
            this.AST_UNPACK = function (ast) {
                return _this.AST_base(ast);
            };
            this.AST_UNARY_PLUS = function (ast) {
                var children = ast.children;
                var expr = _this.part(children[_const.CHILD_EXPR]);
                return _code.codeBuffer("+(", expr, ")");
            };
            this.AST_UNARY_MINUS = function (ast) {
                var children = ast.children;
                var expr = _this.part(children[_const.CHILD_EXPR]);
                return _code.codeBuffer("-(", expr, ")");
            };
            this.AST_CAST = function (ast) {
                var children = ast.children;
                var expr = _this.part(children[_const.CHILD_EXPR]);
                switch (ast.flags) {
                    case _const.Flags[_const.FLAG.TYPE_LONG]:
                        return _code.codeBuffer("/* to int */+(", expr, ")");
                    case _const.Flags[_const.FLAG.TYPE_DOUBLE]:
                        return _code.codeBuffer("/* to double */+(", expr, ")");
                    case _const.Flags[_const.FLAG.TYPE_STRING]:
                        return _code.codeBuffer("/* to string */(", expr, ").toString()");
                    case _const.Flags[_const.FLAG.TYPE_BOOL]:
                        return _code.codeBuffer("/* to bool */!(", expr, " in [0,'false','FALSE'])");
                    case _const.Flags[_const.FLAG.TYPE_ARRAY]:
                        return _code.codeBuffer('/* to array */', "{let tmpArr = ", expr, ";", "if(Array.isArray(tmpArr) tmpArr else [tmpArr];}");
                    case _const.Flags[_const.FLAG.TYPE_OBJECT]:
                        return _code.codeBuffer("/* to object */(", expr, ")");
                    case _const.Flags[_const.FLAG.TYPE_CALLABLE]:
                    case _const.Flags[_const.FLAG.TYPE_NULL]:
                }
                return _this.AST_base(ast);
            };
            this.AST_EMPTY = function (ast) {
                return _this.AST_base(ast);
            };
            this.AST_ISSET = function (ast) {
                var children = ast.children;
                var v = _this.part(children[_const.CHILD_VAR]);
                return _code.codeBuffer("(", v, " !== undefined)");
            };
            this.AST_SILENCE = function (ast) {
                return _this.AST_base(ast);
            };
            this.AST_SHELL_EXEC = function (ast) {
                var children = ast.children;
                return _code.codeBuffer('child_process.execSync(', _this.part(children[_const.CHILD_EXPR]), ')');
            };
            this.AST_CLONE = function (ast) {
                return _this.AST_base(ast);
            };
            this.AST_EXIT = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_EXPR)) {
                    code = _code.codeBuffer('console.error(', _this.part(children[_const.CHILD_EXPR]), ");\n");
                }
                return _code.codeBuffer(code, "exit()");
            };
            this.AST_PRINT = function (ast) {
                var name = 'print';
                if (name in _settings.Functions) {
                    return _this.replaceFunction(name, ast.children[_const.CHILD_EXPR]);
                }
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_EXPR)) {
                    code = _this.part(children[_const.CHILD_EXPR]);
                }
                return _code.codeBuffer('console.log(', ")");
            };
            this.AST_INCLUDE_OR_EVAL = function (ast) {
                var code = '';
                var post = '';
                switch (ast.flags) {
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
                var children = ast.children;
                var expr = new _code.CodeArray();
                if (_this.childExist(children, _const.CHILD_EXPR)) {
                    expr = _this.part(children[_const.CHILD_EXPR]);
                }
                return _code.codeBuffer(code, expr, ')', post);
            };
            this.AST_UNARY_OP = function (ast) {
                var code = '';
                switch (ast.flags) {
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
                var children = ast.children;
                var expr = new _code.CodeArray();
                if (_this.childExist(children, _const.CHILD_EXPR)) {
                    expr = _this.part(children[_const.CHILD_EXPR]);
                }
                return _code.codeBuffer(code, expr);
            };
            this.AST_PRE_INC = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_VAR)) {
                    code = _this.part(children[_const.CHILD_VAR]);
                }
                return _code.codeBuffer('++', code);
            };
            this.AST_PRE_DEC = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_VAR)) {
                    code = _this.part(children[_const.CHILD_VAR]);
                }
                return _code.codeBuffer('--', code);
            };
            this.AST_POST_INC = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_VAR)) {
                    code = _this.part(children[_const.CHILD_VAR]);
                }
                return _code.codeBuffer(code, '++');
            };
            this.AST_POST_DEC = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_VAR)) {
                    code = _this.part(children[_const.CHILD_VAR]);
                }
                return _code.codeBuffer(code, '--');
            };
            this.AST_YIELD_FROM = function (ast) {
                return _this.AST_base(ast);
            };
            this.AST_GLOBAL = function (ast) {
                _this.useGlobal = true;
                var code = '//global ';
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_VAR)) {
                    if (_scope.currentScope().inGlobal) {
                        console.error('inGlobal nest.');
                    }
                    _scope.currentScope().inGlobal = true;
                    code += _code.cbExpand(_this.part(children[_const.CHILD_VAR]));
                    _scope.currentScope().inGlobal = false;
                }
                return _code.codeBuffer(code);
            };
            this.AST_UNSET = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_VAR)) {
                    code = _this.part(children[_const.CHILD_VAR]);
                }
                return _code.codeBuffer('delete ', code);
            };
            this.AST_RETURN = function (ast) {
                if (_this.outerFunction) {
                    _this.moduleResolver.setReturn();
                }
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_EXPR)) {
                    code = _code.codeBuffer(' ', _this.part(children[_const.CHILD_EXPR]));
                }
                return _code.codeBuffer('return', code);
            };
            this.AST_LABEL = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_NAME)) {
                    code = _code.codeBuffer(children[_const.CHILD_NAME], ':');
                }
                return _code.codeBuffer(code);
            };
            this.AST_REF = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_VAR)) {
                    code = _this.part(children[_const.CHILD_VAR]);
                }
                return _code.codeBuffer('/* reference */', code);
            };
            this.AST_HALT_COMPILER = function (ast) {
                return _this.AST_base(ast);
            };
            this.AST_ECHO = function (ast) {
                var name = 'echo';
                if (name in _settings.Functions) {
                    return _this.replaceFunction(name, ast.children[_const.CHILD_EXPR]);
                }
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_EXPR)) {
                    code = _this.part(children[_const.CHILD_EXPR]);
                }
                return _code.codeBuffer('console.log(', code, ")");
            };
            this.AST_THROW = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_EXPR)) {
                    code = _this.part(children[_const.CHILD_EXPR]);
                }
                return _code.codeBuffer('throw ', code);
            };
            this.AST_GOTO = function (ast) {
                var code = '';
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_LABEL)) {
                    code = children[_const.CHILD_LABEL];
                }
                return _code.codeBuffer('goto ', code);
            };
            this.AST_BREAK = function (ast) {
                var code = '';
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_DEPTH)) {
                    var depth = _this.part(children[_const.CHILD_DEPTH]);
                    code = ' ' + _this.getLabel(_code.cbExpand(depth));
                }
                return _code.codeBuffer('break', code);
            };
            this.AST_CONTINUE = function (ast) {
                var code = '';
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_DEPTH)) {
                    var depth = _this.part(children[_const.CHILD_DEPTH]);
                    code = ' ' + _this.getLabel(_code.cbExpand(depth));
                }
                return _code.codeBuffer('continue', code);
            };
            this.AST_DIM = function (ast) {
                var expr = new _code.CodeArray();
                var dim = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_EXPR)) {
                    expr = _this.part(children[_const.CHILD_EXPR]);
                }
                if (_this.childExist(children, _const.CHILD_DIM)) {
                    dim = _this.part(children[_const.CHILD_DIM]);
                }
                return _code.codeBuffer(expr, '[', dim, ']');
            };
            this.AST_CALL = function (ast) {
                var children = ast.children;
                var expr = children[_const.CHILD_EXPR];
                var args = children[_const.CHILD_ARGS];
                return _this.replaceFunctionName(expr, args);
            };
            this.AST_CLASS_CONST = function (ast) {
                var cls = _this.replaceClassNameForStatic(ast.children[_const.CHILD_CLASS]);
                var cst = ast.children[_const.CHILD_CONST];
                return _code.codeBuffer(cls, '.', cst);
            };
            this.AST_ASSIGN = function (ast, signals) {
                var left = new _code.CodeArray();
                var right = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_VAR)) {
                    left = _this.part(children[_const.CHILD_VAR]);
                }
                var scope = _scope.currentScope();
                var tmpInAssign = scope.inAssign;
                scope.inAssign = true;
                if (_this.childExist(children, _const.CHILD_EXPR)) {
                    right = _this.part(children[_const.CHILD_EXPR]);
                }
                scope.inAssign = tmpInAssign;
                if (checkVariable(left)) {
                    var preCodeList = [];
                    var str = _this.cbExpandE(_code.codeBuffer(left, "=", right), preCodeList);
                    if (tmpInAssign) {
                        var tmpName = _scope.newLocal(_scope.currentScope());
                        var pre = preCodeList.join('') + tmpName + " = eval(" + str + ");\n";
                        _scope.currentScope().preCodeStock.push(pre);
                        return _code.codeBuffer(tmpName);
                    }
                    else {
                        var preCode_1 = _scope.currentScope().preCodeStock.join('');
                        _scope.currentScope().preCodeStock = [];
                        return _code.codeBuffer(preCode_1 + preCodeList.join('') + "eval(" + str + ")");
                    }
                }
                else if (tmpInAssign) {
                    return _code.codeBuffer('(', left, '=', right, ")");
                }
                var preCode = _scope.currentScope().preCodeStock.join('');
                _scope.currentScope().preCodeStock = [];
                return _code.codeBuffer(preCode, left, '=', right);
            };
            this.cbExpandE = function (cb, preCodeList) {
                var root = (preCodeList === undefined);
                if (root) {
                    preCodeList = [];
                }
                _code.cbFormat(cb);
                var str = _this.cbExpandELoop(cb, preCodeList);
                if (root) {
                    return preCodeList.join('') + str;
                }
                return str;
            };
            this.cbExpandELoop = function (cb, preCodeList) {
                var str = '';
                var first = true;
                for (var _i = 0, cb_2 = cb; _i < cb_2.length; _i++) {
                    var code = cb_2[_i];
                    if (first) {
                        first = false;
                    }
                    else {
                        str += " + ";
                    }
                    var subcode = code.code;
                    if (typeof subcode === 'string') {
                        if (code.causeEval) {
                            str += subcode;
                        }
                        else {
                            str += _code.stringify(subcode);
                        }
                    }
                    else {
                        if (code.causeEval) {
                            if (checkVariable(subcode)) {
                                var tmpName = _scope.newLocal(_scope.currentScope());
                                preCodeList.push(tmpName + ' = ' + _code.cbExpandLoop(subcode, preCodeList) + ";\n");
                                str += tmpName;
                            }
                            else {
                                str += _code.cbExpandLoop(subcode, preCodeList);
                            }
                        }
                        else {
                            str += _this.cbExpandELoop(subcode, preCodeList);
                        }
                    }
                }
                return str;
            };
            this.AST_ASSIGN_REF = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_VAR)) {
                    code = _this.part(children[_const.CHILD_VAR]);
                }
                code.push_(_code.codeNormal(' = /* Reference */'));
                var tmp = _scope.currentScope().inAssign;
                _scope.currentScope().inAssign = true;
                if (_this.childExist(children, _const.CHILD_EXPR)) {
                    code.append(_this.part(children[_const.CHILD_EXPR]));
                }
                _scope.currentScope().inAssign = tmp;
                if (tmp) {
                    return _code.codeBuffer('(', code, ")");
                }
                return code;
            };
            this.AST_ASSIGN_OP = function (ast) {
                var _operator = '';
                var _var = new _code.CodeArray();
                var expr = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_VAR)) {
                    _var = _this.part(children[_const.CHILD_VAR]);
                }
                if (_this.childExist(children, _const.CHILD_EXPR)) {
                    expr = _this.part(children[_const.CHILD_EXPR]);
                }
                switch (ast.flags) {
                    case _const.Flags[_const.FLAG.ASSIGN_BITWISE_OR]:
                    case _const.Flags[_const.FLAG.BINARY_BITWISE_OR]:
                        _operator += '|=';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_BITWISE_AND]:
                    case _const.Flags[_const.FLAG.ASSIGN_BITWISE_AND]:
                        _operator += '&=';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_BITWISE_XOR]:
                    case _const.Flags[_const.FLAG.ASSIGN_BITWISE_XOR]:
                        _operator += '^=';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_CONCAT]:
                    case _const.Flags[_const.FLAG.ASSIGN_CONCAT]:
                        _operator += '+=';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_ADD]:
                    case _const.Flags[_const.FLAG.ASSIGN_ADD]:
                        _operator += '+=';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_SUB]:
                    case _const.Flags[_const.FLAG.ASSIGN_SUB]:
                        _operator += '-=';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_MUL]:
                    case _const.Flags[_const.FLAG.ASSIGN_MUL]:
                        _operator += '*=';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_DIV]:
                    case _const.Flags[_const.FLAG.ASSIGN_DIV]:
                        _operator += '/=';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_MOD]:
                    case _const.Flags[_const.FLAG.ASSIGN_MOD]:
                        _operator += '%=';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_POW]:
                    case _const.Flags[_const.FLAG.ASSIGN_POW]:
                        _operator += '**=';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_SHIFT_LEFT]:
                    case _const.Flags[_const.FLAG.ASSIGN_SHIFT_LEFT]:
                        _operator += '<<=';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_SHIFT_RIGHT]:
                    case _const.Flags[_const.FLAG.ASSIGN_SHIFT_RIGHT]:
                        _operator += '>>=';
                        break;
                }
                return _code.codeBuffer(_var, _operator, expr);
            };
            this.AST_BINARY_OP = function (ast) {
                var _operator = '';
                var left = new _code.CodeArray();
                var right = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_LEFT)) {
                    left = _this.part(children[_const.CHILD_LEFT]);
                }
                else {
                    left = new _code.CodeArray(_code.codeNormal('err/* left operand missing */'));
                }
                if (_this.childExist(children, _const.CHILD_RIGHT)) {
                    right = _this.part(children[_const.CHILD_RIGHT]);
                }
                else {
                    right = new _code.CodeArray(_code.codeNormal('err/* right operand missing */'));
                }
                switch (ast.flags) {
                    case _const.Flags[_const.FLAG.BINARY_BITWISE_OR]:
                        _operator += '|';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_BITWISE_AND]:
                        _operator += '&';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_BITWISE_XOR]:
                        _operator += '^';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_CONCAT]:
                        _operator += '+';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_ADD]:
                        _operator += '+';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_SUB]:
                        _operator += '-';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_MUL]:
                        _operator += '*';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_DIV]:
                        _operator += '/';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_MOD]:
                        _operator += '%';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_POW]:
                        _operator += '**';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_SHIFT_LEFT]:
                        _operator += '<<';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_SHIFT_RIGHT]:
                        _operator += '>>';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_BOOL_AND]:
                        _operator += '&&';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_BOOL_OR]:
                        _operator += '||';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_BOOL_XOR]:
                        return _code.codeBuffer('{let tmpL=', left, ';/* xor */let tmpR=', right, ';(tmpL&&!tmpR)||(!tmpL&&tmpR)}');
                    case _const.Flags[_const.FLAG.BINARY_IS_IDENTICAL]:
                        _operator += '===';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_IS_NOT_IDENTICAL]:
                        _operator += '!==';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_IS_EQUAL]:
                        _operator += '==';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_IS_NOT_EQUAL]:
                        _operator += '!=';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_IS_SMALLER]:
                        _operator += '<';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_IS_SMALLER_OR_EQUAL]:
                        _operator += '<=';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_IS_GREATER]:
                        _operator += '>';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_IS_GREATER_OR_EQUAL]:
                        _operator += '>=';
                        break;
                    case _const.Flags[_const.FLAG.BINARY_SPACESHIP]:
                        return _code.codeBuffer('{let tmpL=', left, ';/* <=> */let tmpR=', right, ';((tmpL==tmpR)?0:(tmpL>tmpR?1:-1))}');
                }
                return _code.codeBuffer('(', left, _operator, right, ')');
            };
            this.AST_GREATER = function (ast) {
                return _this.AST_base(ast);
            };
            this.AST_GREATER_EQUAL = function (ast) {
                return _this.AST_base(ast);
            };
            this.AST_AND = function (ast) {
                return _this.AST_base(ast);
            };
            this.AST_OR = function (ast) {
                return _this.AST_base(ast);
            };
            this.AST_ARRAY_ELEM = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_KEY)) {
                    code.append(_this.part(children[_const.CHILD_KEY]));
                    code.push_(_code.codeNormal(':'));
                }
                if (_this.childExist(children, _const.CHILD_VALUE)) {
                    code.append(_this.part(children[_const.CHILD_VALUE]));
                }
                return code;
            };
            this.AST_NEW = function (ast) {
                var cls = _this.replaceClassName(ast.children[_const.CHILD_CLASS]);
                var args = _this.part(ast.children[_const.CHILD_ARGS]);
                return _code.codeBuffer('new ', cls, '(', args, ')');
            };
            this.AST_INSTANCEOF = function (ast) {
                var expr = _this.part(ast.children[_const.CHILD_EXPR]);
                var cls = _this.replaceClassName(ast.children[_const.CHILD_CLASS]);
                return _code.codeBuffer(expr, ' instanceof ', cls);
            };
            this.AST_YIELD = function (ast) {
                return _this.AST_base(ast);
            };
            this.AST_COALESCE = function (ast) {
                var children = ast.children;
                var left = new _code.CodeArray();
                var right = new _code.CodeArray();
                if (_this.childExist(children, _const.CHILD_LEFT)) {
                    left = _this.part(children[_const.CHILD_LEFT]);
                }
                else {
                    left = new _code.CodeArray(_code.codeNormal('err/* left operand missing */'));
                }
                if (_this.childExist(children, _const.CHILD_RIGHT)) {
                    right = _this.part(children[_const.CHILD_RIGHT]);
                }
                else {
                    right = new _code.CodeArray(_code.codeNormal('err/* right operand missing */'));
                }
                var tmp = _scope.newLocal(_scope.currentScope());
                return _code.codeBuffer('{', tmp, '=', left, ';', tmp, '!=null?', tmp, ':', right, '}');
            };
            this.AST_STATIC = function (ast) {
                var code = 'static ';
                var def = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_VAR)) {
                    var varname = _code.cbExpand(_this.part(children[_const.CHILD_VAR]));
                    _scope.pushIgnore(varname);
                    code += varname;
                }
                if (_this.childExist(children, _const.CHILD_DEFAULT)) {
                    def = _code.codeBuffer('=', _this.part(children[_const.CHILD_DEFAULT]));
                }
                return _code.codeBuffer(code, def);
            };
            this.AST_WHILE = function (ast) {
                ast.label = '';
                var children = ast.children;
                var inner = _this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
                var cond = _this.part(children[_const.CHILD_COND]);
                return _code.codeBuffer(ast.label, "while(", cond, ") {\n", inner, "}");
            };
            this.AST_DO_WHILE = function (ast) {
                ast.label = '';
                var children = ast.children;
                var inner = _this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
                var cond = _this.part(children[_const.CHILD_COND]);
                return _code.codeBuffer(ast.label, "do {\n", inner, "} while(", cond, ");");
            };
            this.AST_IF_ELEM = function (ast) {
                var children = ast.children;
                var cond = new _code.CodeArray();
                if (children[_const.CHILD_COND] !== null) {
                    cond = _code.codeBuffer("if(", _this.part(children[_const.CHILD_COND]), ")");
                }
                var inner = _this.statement(children[_const.CHILD_STMTS]);
                return _code.codeBuffer(cond, " {\n", inner, "}");
            };
            this.AST_SWITCH = function (ast) {
                var tmp = _scope.currentScope().inIf;
                _scope.currentScope().inIf = true;
                ast.label = '';
                var children = ast.children;
                var cond = _this.part(children[_const.CHILD_COND]);
                var inner = _this.AST_SWITCH_LIST(children[_const.CHILD_STMTS]);
                _scope.currentScope().inIf = tmp;
                return _code.codeBuffer(ast.label, "switch(", cond, ") {\n", inner, "}");
            };
            this.AST_SWITCH_CASE = function (ast) {
                var children = ast.children;
                var label = new _code.CodeArray();
                if (children[_const.CHILD_COND] == null) {
                    label = new _code.CodeArray(_code.codeNormal('default:' + "\n"));
                }
                else {
                    var cond = _this.part(children[_const.CHILD_COND]);
                    label = _code.codeBuffer('case ', cond, ":\n");
                }
                var inner = _this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
                return _code.codeBuffer(label, inner);
            };
            this.AST_DECLARE = function (ast) {
                return _this.AST_base(ast);
            };
            this.AST_CONST_ELEM = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_NAME)) {
                    code = new _code.CodeArray(_code.codeNormal(children[_const.CHILD_NAME]));
                }
                if (_this.childExist(children, _const.CHILD_VALUE)) {
                    code.push_(_code.codeNormal(' = '));
                    code.append(_this.part(children[_const.CHILD_VALUE]));
                }
                return code;
            };
            this.AST_USE_TRAIT = function (ast) {
                _scope.currentScope().inUseTrait = true;
                var code = new _code.CodeArray(_code.codeNormal('use '));
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_TRAITS)) {
                    code.append(_this.part(children[_const.CHILD_TRAITS]));
                }
                if (_this.childExist(children, _const.CHILD_ADAPTATIONS)) {
                    code.push_(_code.codeNormal("{\n"));
                    code.append(_this.part(children[_const.CHILD_ADAPTATIONS]));
                    code.push_(_code.codeNormal("}"));
                }
                else {
                    code.push_(_code.codeNormal(';'));
                }
                _scope.currentScope().inUseTrait = false;
                return new _code.CodeArray(_code.codeComment(code));
            };
            this.AST_TRAIT_PRECEDENCE = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_METHOD)) {
                    code = _this.part(children[_const.CHILD_METHOD]);
                }
                if (_this.childExist(children, _const.CHILD_INSTEADOF)) {
                    code.push_(_code.codeNormal(' inteadof '));
                    code.append(_this.part(children[_const.CHILD_INSTEADOF]));
                }
                return code;
            };
            this.AST_METHOD_REFERENCE = function (ast) {
                if (_scope.currentScope().inUseTrait) {
                    var code = new _code.CodeArray();
                    var children = ast.children;
                    if (_this.childExist(children, _const.CHILD_CLASS)) {
                        code = _code.codeBuffer(_this.part(children[_const.CHILD_CLASS]), '::');
                    }
                    if (_this.childExist(children, _const.CHILD_METHOD)) {
                        code.push_(_code.codeNormal(children[_const.CHILD_METHOD]));
                    }
                    return code;
                }
                else {
                    var code = new _code.CodeArray();
                    var children = ast.children;
                    if (_this.childExist(children, _const.CHILD_CLASS)) {
                        code = _code.codeBuffer(_this.part(children[_const.CHILD_CLASS]), '.');
                    }
                    if (_this.childExist(children, _const.CHILD_METHOD)) {
                        code.push_(_code.codeNormal(children[_const.CHILD_METHOD]));
                    }
                    return code;
                }
            };
            this.AST_NAMESPACE = function (ast) {
                _scope.newScope();
                var children = ast.children;
                var name = children[_const.CHILD_NAME];
                _this.pushNamespace(name);
                var newname = _this.moduleResolver.pushNamespace(name);
                var inner = _this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
                var localDeclare = _this.getLocalDeclare();
                _this.moduleResolver.popNamespace();
                _this.namespaceStack.pop();
                _scope.popScope();
                return _code.codeBuffer("namespace ", newname, " {\n", localDeclare, inner, "}");
            };
            this.AST_USE = function (ast) {
                switch (ast.flags) {
                    case _const.Flags[_const.FLAG.USE_NORMAL]:
                        return _this.statements(ast.children);
                    case _const.Flags[_const.FLAG.USE_FUNCTION]:
                    case _const.Flags[_const.FLAG.USE_CONST]:
                }
                return _this.AST_base(ast);
            };
            this.AST_USE_ELEM = function (ast) {
                switch (ast.flags) {
                    case _const.Flags[_const.FLAG.USE_NORMAL]:
                    case _const.Flags[_const.FLAG.USE_FUNCTION]:
                    case _const.Flags[_const.FLAG.USE_CONST]:
                        return _this.AST_base(ast);
                }
                return null;
            };
            this.AST_TRAIT_ALIAS = function (ast) {
                var code = new _code.CodeArray();
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_METHOD)) {
                    code = _this.part(children[_const.CHILD_METHOD]);
                }
                if (_this.childExist(children, _const.CHILD_ALIAS)) {
                    code.push_(_code.codeNormal(' as ' + _const.getModifier(ast.flags) + ' '));
                    code.append(_this.part(children[_const.CHILD_ALIAS]));
                }
                return code;
            };
            this.AST_GROUP_USE = function (ast) {
                switch (ast.flags) {
                    case _const.Flags[_const.FLAG.USE_NORMAL]:
                    case _const.Flags[_const.FLAG.USE_FUNCTION]:
                    case _const.Flags[_const.FLAG.USE_CONST]:
                }
                return _this.AST_base(ast);
            };
            this.AST_METHOD_CALL = function (ast) {
                var expr = _this.part(ast.children[_const.CHILD_EXPR]);
                var name = ast.children[_const.CHILD_METHOD];
                var args = _this.part(ast.children[_const.CHILD_ARGS]);
                if (typeof name === 'string') {
                    return _code.codeBuffer(expr, '.' + name, '(', args, ')');
                }
                var varname = _this.part(name);
                var preCodeList = [];
                var inner = _this.cbExpandE(_code.codeBuffer(expr, '.', _code.codeEval(varname), '(', args, ')'), preCodeList);
                var pre = preCodeList.join('');
                _scope.currentScope().preCodeStock.push(pre);
                return _code.codeBuffer(_code.codeEval(inner));
            };
            this.AST_STATIC_CALL = function (ast) {
                var cls = _this.replaceClassNameForStatic(ast.children[_const.CHILD_CLASS]);
                var name = ast.children[_const.CHILD_METHOD];
                var args = _this.part(ast.children[_const.CHILD_ARGS]);
                if (typeof name === 'string') {
                    return _code.codeBuffer(cls, '.' + name + '(', args, ')');
                }
                var varname = _this.part(name);
                var preCodeList = [];
                var inner = _this.cbExpandE(_code.codeBuffer(cls, '.', _code.codeEval(varname), '(', args, ')'), preCodeList);
                var pre = preCodeList.join('');
                _scope.currentScope().preCodeStock.push(pre);
                return _code.codeBuffer(_code.codeEval(inner));
            };
            this.AST_CONDITIONAL = function (ast) {
                var children = ast.children;
                var cond = _this.part(children[_const.CHILD_COND]);
                var true_ = _this.part(children[_const.CHILD_TRUE]);
                var false_ = _this.part(children[_const.CHILD_FALSE]);
                return _code.codeBuffer("(", cond, "?", true_, ":", false_, ")");
            };
            this.AST_TRY = function (ast) {
                var children = ast.children;
                var try_ = _this.AST_STMT_LIST(ast.children[_const.CHILD_TRY]);
                var catches_ = new _code.CodeArray();
                if (ast.children[_const.CHILD_CATCHES] != null) {
                    catches_ = _this.part(ast.children[_const.CHILD_CATCHES]);
                }
                if (ast.children[_const.CHILD_FINALLY] != null) {
                    var finally_ = _this.part(ast.children[_const.CHILD_FINALLY]);
                    return _code.codeBuffer("try {\n", try_, "} ", catches_, " finally {\n", finally_, "}");
                }
                return _code.codeBuffer("try {\n", try_, "} ", catches_);
            };
            this.AST_CATCH_LIST = function (ast) {
                var codelist = [];
                var children = ast.children;
                if (children.length == 1) {
                    return _this.AST_CATCH(children[0]);
                }
                for (var _i = 0, children_7 = children; _i < children_7.length; _i++) {
                    var child = children_7[_i];
                    codelist.push(_this.AST_CATCH2(child));
                }
                return _code.codeBuffer("catch( tmpE ) {\n", _code.codeJoin(codelist, ' else '), "}");
            };
            this.AST_CATCH = function (ast) {
                var cls = _this.replaceClassName(ast.children[_const.CHILD_CLASS]);
                var var_ = _this.part(ast.children[_const.CHILD_VAR]);
                var stmts_ = _this.AST_STMT_LIST(ast.children[_const.CHILD_STMTS]);
                return _code.codeBuffer("catch (", var_, "/* ", cls, " */) {\n", stmts_, "}");
            };
            this.AST_CATCH2 = function (ast) {
                var cls = _this.replaceClassName(ast.children[_const.CHILD_CLASS]);
                var var_ = _this.part(ast.children[_const.CHILD_VAR]);
                var stmts_ = _this.AST_STMT_LIST(ast.children[_const.CHILD_STMTS]);
                return _code.codeBuffer("if (tmpE instanceof ", cls, ") {\nlet ", var_, ":", cls, " = tmpE", stmts_, "}");
            };
            this.AST_PARAM = function (ast) {
                var code = '';
                switch (ast.flags) {
                    case _const.Flags[_const.FLAG.PARAM_REF]:
                        code += '/* ref */';
                        break;
                    case _const.Flags[_const.FLAG.PARAM_VARIADIC]:
                        code += '/* val */';
                        break;
                }
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_NAME)) {
                    var varname = children[_const.CHILD_NAME];
                    code += _scope.pushParam(varname, ast.flags == _const.Flags[_const.FLAG.PARAM_REF]);
                }
                var _type = new _code.CodeArray();
                if (_this.childExist(children, _const.CHILD_TYPE)) {
                    _type = _code.codeBuffer(':', _this.part(children[_const.CHILD_TYPE]));
                }
                var _def = new _code.CodeArray();
                if (_this.childExist(children, _const.CHILD_DEFAULT)) {
                    _def = _code.codeBuffer(' = ', _this.part(children[_const.CHILD_DEFAULT]));
                }
                return _code.codeBuffer(code, _type, _def);
            };
            this.AST_PROP_ELEM = function (ast) {
                var code = '';
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_NAME)) {
                    code += children[_const.CHILD_NAME];
                }
                var def = new _code.CodeArray();
                if (_this.childExist(children, _const.CHILD_DEFAULT)) {
                    def = _code.codeBuffer(' = ', _this.part(children[_const.CHILD_DEFAULT]));
                }
                return _code.codeBuffer(code, def);
            };
            this.AST_FOR = function (ast) {
                ast.label = '';
                var children = ast.children;
                var init = _this.part(children[_const.CHILD_INIT]);
                var cond = _this.part(children[_const.CHILD_COND]);
                var loop = _this.part(children[_const.CHILD_LOOP]);
                var inner = _this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
                return _code.codeBuffer(ast.label, "for(", init, ";", cond, ";", loop, ") {\n", inner, "}");
            };
            this.AST_FOREACH = function (ast) {
                ast.label = '';
                var code = new _code.CodeArray();
                var key = null;
                var value = null;
                var array = new _code.CodeArray();
                var list = [];
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_KEY)) {
                    key = _this.part(children[_const.CHILD_KEY]);
                }
                if (_this.childExist(children, _const.CHILD_VALUE)) {
                    var kind = children[_const.CHILD_VALUE].kind;
                    if (kind !== undefined && kind == _const.getOriginalKind(_const.AST.LIST)) {
                        list = _this.lists(children[_const.CHILD_VALUE].children);
                    }
                    else {
                        value = _this.part(children[_const.CHILD_VALUE]);
                    }
                }
                if (_this.childExist(children, _const.CHILD_EXPR)) {
                    array = _this.part(children[_const.CHILD_EXPR]);
                }
                var stmts = _this.AST_STMT_LIST(children[_const.CHILD_STMTS]);
                if (key == null && value != null) {
                    code = _code.codeBuffer(ast.label, 'for(', value, ' of ', array, ") {\n", stmts, "}");
                }
                else {
                    if (key == null) {
                        key = new _code.CodeArray(_code.codeNormal(_scope.newLocal(_scope.currentScope())));
                    }
                    var tmpArr = new _code.CodeArray(_code.codeNormal(_scope.newLocal(_scope.currentScope())));
                    code.append(_code.codeBuffer('{' + tmpArr + ' = ', array, ";\n"));
                    code.push_(_code.codeNormal(ast.label));
                    code.append(_code.codeBuffer('for(', key, ' in ' + tmpArr + '){' + "\n"));
                    if (value != null) {
                        code.append(_code.codeBuffer(value, ' = ', tmpArr, '[', key, '];' + "\n"));
                    }
                    else {
                        for (var i in list) {
                            code.append(_code.codeBuffer(list[i], ' = ', tmpArr, '[', key, '][' + i + '];' + "\n"));
                        }
                    }
                    code.append(stmts);
                    code.push_(_code.codeNormal('}}'));
                }
                return code;
            };
            this.AST_NAME = function (ast) {
                var name = ast.children[_const.CHILD_NAME];
                name = name.replace(/\\/g, '.');
                switch (ast.flags) {
                    case _const.Flags[_const.FLAG.NAME_FQ]:
                    case _const.Flags[_const.FLAG.NAME_NOT_FQ]:
                        return _code.codeBuffer(name);
                    case _const.Flags[_const.FLAG.NAME_RELATIVE]:
                }
                return _this.AST_base(ast);
            };
            this.AST_CLOSURE_VAR = function (ast) {
                var code = '';
                switch (ast.flags) {
                    case _const.Flags[_const.FLAG.BY_REFERENCE]:
                        code += '/* ref */';
                }
                var children = ast.children;
                if (_this.childExist(children, _const.CHILD_NAME)) {
                    var varname = children[_const.CHILD_NAME];
                    _scope.pushUse(varname, ast.flags == _const.Flags[_const.FLAG.PARAM_REF]);
                    code += varname;
                }
                return _code.codeBuffer(code);
            };
        }
        return compiler;
    }());
    compiler_1.compiler = compiler;
})(compiler || (compiler = {}));
module.exports = compiler;
//# sourceMappingURL=php2ts-compiler.js.map