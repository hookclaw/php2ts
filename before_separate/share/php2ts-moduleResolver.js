"use strict";
var path = require('path');
var moduleResolver = (function () {
    function moduleResolver(pass1Result) {
        var _this = this;
        this.namespaces = [];
        this.namespaceStack = [];
        this.references = {};
        this.useReturn = false;
        this.importList = {};
        this.letList = {};
        this.rename = function (type, name) {
            var full = name.charAt(0) == '.';
            var names = name.split('.');
            if (full) {
                names.splice(0, 1);
            }
            else {
                if (names[0] in _this.pass1Result.aliasTable) {
                    var alias = names[0];
                    names.splice(0, 1);
                    names = _this.pass1Result.aliasTable[alias].concat(names);
                }
                else {
                    if (names.length > 1) {
                        var namespace_1 = _this.namespaceStack.join('\\');
                        names = namespace_1.split('\\').concat(names);
                    }
                    else {
                        if (type == 2) {
                        }
                        else if (type == 1) {
                            var namespace_2 = _this.namespaceStack.join('\\');
                            names = namespace_2.split('\\').concat(names);
                        }
                        else {
                        }
                    }
                }
            }
            if (type !== 1) {
                var _name_1 = names[names.length - 1];
                names.pop();
                var _namespace = _this.changeNamespace(names.join('\\'));
                if (_namespace != '') {
                    _namespace += '.';
                }
                return _namespace + _name_1;
            }
            var _name = names[names.length - 1];
            names.pop();
            var namespace = names.join('\\');
            if (namespace in _this.pass1Result.nameMap[type]) {
                if (_name in _this.pass1Result.nameMap[type][namespace]) {
                    var phpFilePath = _this.pass1Result.nameMap[type][namespace][_name];
                    if (phpFilePath !== _this.pass1Result.relativePath) {
                        return _this.pushImportList(namespace, _name, phpFilePath);
                    }
                    var _namespace = _this.changeNamespace(namespace);
                    var currentNamespace = _this.changeNamespace(_this.namespaceStack.join('\\'));
                    if (currentNamespace == _namespace) {
                        return _name;
                    }
                    var className = _namespace;
                    if (className != '') {
                        className += '.';
                    }
                    className += _name;
                    return className;
                }
            }
            var autoloadFilePath = namespace.replace('\\', '/');
            if (namespace != '') {
                autoloadFilePath += '/';
            }
            autoloadFilePath += name;
            return _this.pushImportList(namespace, _name, autoloadFilePath);
        };
        this.pushImportList = function (namespace, name, phpFilePath) {
            var _namespace = _this.changeNamespace(namespace);
            var className = _namespace;
            if (className != '') {
                className += '__';
            }
            className += name;
            var relativePath = _this.relativePathFileToFile(_this.pass1Result.relativePath, phpFilePath);
            var modulePath = _this.phpPathToModulePath(relativePath);
            var moduleVar = _this.modulePathToVar(modulePath);
            _this.importList[moduleVar] = 'import ' + moduleVar + ' = require("' + modulePath + '");\n';
            _this.letList[className] = 'let ' + className + ' = ' + moduleVar + '.' + _namespace + '.' + name + ';\n';
            return className;
        };
        this.relativePathFileToFile = function (fromFile, toFile) {
            var parsedPath = path.parse(fromFile);
            return path.relative(parsedPath.dir, toFile);
        };
        this.phpPathToModulePath = function (phpPath) {
            var c = '';
            if (phpPath.charAt(0) != '.') {
                c = './';
            }
            var parsedPath = path.parse(phpPath);
            if (parsedPath.ext.toLowerCase() == '.php') {
                return c + phpPath.substr(0, phpPath.length - 4);
            }
            else {
                return c + phpPath;
            }
        };
        this.modulePathToVar = function (modulePath) {
            return modulePath.replace(/[./\\]/g, '_');
        };
        this.changeNamespace = function (name) {
            return name.replace('\\', '__');
        };
        this.pushNamespace = function (name) {
            var newName = _this.changeNamespace(name);
            _this.namespaceStack.push(name);
            _this.namespaces.push(newName);
            return newName;
        };
        this.popNamespace = function () {
            _this.namespaceStack.pop();
        };
        this.setReturn = function () {
            _this.useReturn = true;
        };
        this.makeReferenceKey = function (name, type) {
            return type.toString() + ':' + _this.namespaceStack.join('\\') + '/' + name;
        };
        this.getConstReference = function (name) {
            var key = _this.makeReferenceKey(name, 0);
            if (key in _this.references) {
                return _this.references[key];
            }
            return _this.references[key] = _this.rename(0, name);
        };
        this.getClassReference = function (name) {
            var key = _this.makeReferenceKey(name, 1);
            if (key in _this.references) {
                return _this.references[key];
            }
            return _this.references[name] = _this.rename(1, name);
        };
        this.getFunctionReference = function (name) {
            var key = _this.makeReferenceKey(name, 2);
            if (key in _this.references) {
                return _this.references[key];
            }
            return _this.references[name] = _this.rename(2, name);
        };
        this.getImport = function () {
            var code = '';
            for (var key in _this.importList) {
                code += _this.importList[key];
            }
            for (var key in _this.letList) {
                code += _this.letList[key];
            }
            return code;
        };
        this.getExport = function (body) {
            if (_this.useReturn !== _this.pass1Result.return) {
                throw new Error('Logic error');
            }
            if (_this.useReturn) {
                return 'export = () => {\n' + body + '}';
            }
            if (_this.namespaces.length > 0) {
                return body + 'export = {' + _this.namespaces.join(',') + '}';
            }
            return 'module someModule {\n' + body + '}\nexport = someModule;';
        };
        this.pass1Result = pass1Result;
    }
    return moduleResolver;
}());
module.exports = moduleResolver;
//# sourceMappingURL=php2ts-moduleResolver.js.map