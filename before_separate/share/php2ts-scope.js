"use strict";
var scope;
(function (scope_1) {
    scope_1.scopeStack = [];
    var changeLocalVarname;
    var changeSuperGlobal;
    scope_1.initialize = function (p_changeLocalVarname, p_changeSuperGlobal) {
        scope_1.scopeStack = [];
        changeLocalVarname = p_changeLocalVarname;
        changeSuperGlobal = p_changeSuperGlobal;
    };
    scope_1.newScope = function () {
        var scope = {
            paramsAndUses: {},
            locals: {},
            globals: {},
            temporaries: [],
            ignores: {},
            preCodeStock: [],
            localno: 0,
            labelno: 0,
            inIf: false,
            inInterface: false,
            inUseTrait: false,
            inGlobal: false,
            inAssign: false
        };
        scope_1.scopeStack.push(scope);
        return scope;
    };
    scope_1.popScope = function () {
        scope_1.scopeStack.pop();
    };
    scope_1.topScope = function () {
        return scope_1.scopeStack[0];
    };
    scope_1.currentScopeIndex = function () {
        return scope_1.scopeStack.length - 1;
    };
    scope_1.currentScope = function () {
        var pos = scope_1.scopeStack.length - 1;
        return scope_1.scopeStack[pos];
    };
    scope_1.parentScope = function () {
        var pos = scope_1.scopeStack.length - 2;
        return scope_1.scopeStack[pos];
    };
    scope_1.pushGlobal = function (varname) {
        var scope = scope_1.currentScope();
        scope.globals[varname] = "global['" + varname + "']";
    };
    scope_1.pushParam = function (varname, byref) {
        var scope = scope_1.currentScope();
        if (byref) {
            return scope.paramsAndUses[varname] = '_prm_' + varname;
        }
        else {
            var tmpname = '_prm_' + varname;
            var localname = changeLocalVarname(varname);
            scope.temporaries.push('let ' + localname + '=' + tmpname + ';');
            scope.paramsAndUses[varname] = localname;
            return tmpname;
        }
    };
    scope_1.pushUse = function (varname, byref) {
        var scope = scope_1.currentScope();
        var _parentScope = scope_1.parentScope();
        var r = scope_1.getVariableTypeAndLocalPush(_parentScope, varname);
        var tmpname = r.name;
        if (byref) {
            return scope.paramsAndUses[varname] = tmpname;
        }
        else {
            var useName = '_use_' + tmpname;
            scope.temporaries.push('let ' + useName + '=' + tmpname + ';');
            return scope.paramsAndUses[varname] = useName;
        }
    };
    scope_1.newLocal = function (scope) {
        var varname = 'tmpLocal' + (scope.localno++);
        return scope_1.pushLocal(scope, varname);
    };
    scope_1.pushLocal = function (scope, varname, change) {
        if (change === void 0) { change = true; }
        var tmpname = change ? changeLocalVarname(varname) : varname;
        scope.locals[varname] = tmpname;
        return tmpname;
    };
    scope_1.pushIgnore = function (varname) {
        var scope = scope_1.currentScope();
        scope.ignores[varname] = varname;
    };
    scope_1.getVariableTypeAndLocalPush = function (scope, varname) {
        var name = changeSuperGlobal(varname);
        if (name !== undefined) {
            return { type: 0, name: name };
        }
        if (varname in scope.globals) {
            return { type: 1, name: scope.globals[varname] };
        }
        if (varname in scope.paramsAndUses) {
            return { type: 2, name: scope.paramsAndUses[varname] };
        }
        return { type: 3, name: scope_1.pushLocal(scope, varname) };
    };
})(scope || (scope = {}));
module.exports = scope;
//# sourceMappingURL=php2ts-scope.js.map