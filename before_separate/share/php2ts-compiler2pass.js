"use strict";
var compiler = require('./php2ts-compiler');
var moduleResolver = require('../share/php2ts-moduleResolver');
var compiler2pass;
(function (compiler2pass) {
    var Compiler = new compiler.compiler();
    var inputFiles = {};
    var pass1Results = {};
    compiler2pass.initialize = function (settings, constants) {
        compiler.initialize(settings, constants);
    };
    compiler2pass.compile = function (baseFolder, files, callback) {
        inputFiles = files;
        var nameMap = {};
        for (var filePath in files) {
            var ast = files[filePath].ast;
            var result = pass1(filePath, ast);
            pass1Results[filePath] = result;
            for (var key1 in result.nameMap) {
                for (var key2 in result.nameMap[key1]) {
                    for (var key3 in result.nameMap[key1][key2]) {
                        if (nameMap[key1] === undefined) {
                            nameMap[key1] = {};
                        }
                        if (nameMap[key1][key2] === undefined) {
                            nameMap[key1][key2] = {};
                        }
                        nameMap[key1][key2][key3] = result.nameMap[key1][key2][key3];
                    }
                }
            }
        }
        for (var filePath in files) {
            var ast = files[filePath].ast;
            var comments = files[filePath].comments;
            var pass1Result = pass1Results[filePath];
            pass1Result.nameMap = nameMap;
            var result = pass2(filePath, pass1Result, ast, comments);
            callback(filePath, result.code);
        }
    };
    var pass1 = function (relativePath, ast) {
        var result = compiler.pass1.pass1(ast, relativePath);
        return result;
    };
    var pass2 = function (relativePath, pass1Result, ast, comments) {
        var ModuleResolver = new moduleResolver(pass1Result);
        return Compiler.compile(ModuleResolver, ast, comments);
    };
})(compiler2pass || (compiler2pass = {}));
module.exports = compiler2pass;
//# sourceMappingURL=php2ts-compiler2pass.js.map