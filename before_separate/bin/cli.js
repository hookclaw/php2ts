"use strict";
var ts = require('typescript');
var async = require('async');
var fs = require('fs');
var argv = require('argv');
var path = require('path');
var ast = require('../lib/php-ast');
var compiler2pass = require('../share/php2ts-compiler2pass');
var Jsonnet = require('jsonnet');
var jsonnet = new Jsonnet();
var OPTION_SETTINGS = 'settings';
var OPTION_BASE_SETTINGS = 'base';
var DEFAULT_SETTINGS = 'php2ts.json';
var DEFAULT_BASE_SETTINGS = 'php2ts.Settings.json';
var COMPOSER_JSON = 'composer.json';
var processArg = function () {
    argv.option([
        { name: OPTION_SETTINGS, type: 'path', short: 's', description: 'default:' + DEFAULT_SETTINGS },
        { name: OPTION_BASE_SETTINGS, type: 'path', short: 'b', description: 'default:' + DEFAULT_BASE_SETTINGS }
    ]);
    var args = argv.run(process.argv);
    var file = args.targets[2];
    var base_settings_file = args.options[OPTION_BASE_SETTINGS];
    if (base_settings_file === undefined) {
        var scriptPath = path.parse(args.targets[1]).dir;
        base_settings_file = (scriptPath + '/' + DEFAULT_BASE_SETTINGS);
    }
    var settings_file = args.options[OPTION_SETTINGS];
    settings_file = (settings_file !== undefined) ? settings_file : DEFAULT_SETTINGS;
    var base_settings = { Translate: {}, ReplaceSets: {} };
    if (fs.existsSync(base_settings_file)) {
        var base_settings_json = fs.readFileSync(base_settings_file, 'utf8');
        base_settings = jsonnet.eval(base_settings_json);
    }
    var mergeSettings = function (base, source) {
        var mergeSettingsSub = function (base, source) {
            if (source === undefined) {
                return;
            }
            for (var key in source) {
                base[key] = source[key];
            }
        };
        if (base.Translate === undefined) {
            base.Translate = {};
        }
        if (base.ReplaceSets === undefined) {
            base.ReplaceSets = {};
        }
        mergeSettingsSub(base.Translate, source.Translate);
        mergeSettingsSub(base.ReplaceSets, source.ReplaceSets);
    };
    var userSettingsRead = function (settings_file) {
        if (fs.existsSync(settings_file)) {
            var settings_json = fs.readFileSync(settings_file, 'utf8');
            var settings = jsonnet.eval(settings_json);
            mergeSettings(base_settings, settings);
        }
    };
    if (file === undefined) {
        if (!fs.existsSync(settings_file)) {
            argv.help();
            process.exit();
        }
        file = '.';
        userSettingsRead(settings_file);
    }
    else {
        var parsedPath = path.parse(file);
        if (parsedPath.ext.toLowerCase() == 'json') {
            userSettingsRead(file);
            file = '.';
        }
        else {
            userSettingsRead(settings_file);
        }
    }
    return { base_settings: base_settings, file: file };
};
var compile = function (resultStok, startFolder, settings, constants) {
    var formatter = new TypeScriptFormatter();
    var stats = fs.statSync(startFolder);
    compiler2pass.initialize(settings, constants);
    var files = {};
    for (var _i = 0, resultStok_1 = resultStok; _i < resultStok_1.length; _i++) {
        var target = resultStok_1[_i];
        var relativePath = path.relative(startFolder, target.file);
        var ast_1 = target.result.body.ast;
        var comments = target.result.body.comments;
        files[relativePath] = { ast: ast_1, comments: comments };
    }
    var outputFolder = startFolder;
    compiler2pass.compile(startFolder, files, function (filepath, code) {
        var file = path.join(outputFolder, filepath);
        var parsedPath = path.parse(file);
        parsedPath.ext = '.ts';
        parsedPath.base = parsedPath.name + parsedPath.ext;
        var tsFilename = path.format(parsedPath);
        var formattedText = formatter.formatTypeScriptCode(tsFilename, code);
        fs.writeFileSync(tsFilename, formattedText);
        console.log('create -> ' + tsFilename);
    });
};
var TypeScriptFormatter = (function () {
    function TypeScriptFormatter() {
        var _this = this;
        this.createService = function () {
            _this.host = new MyLanguageServiceHost();
            _this.service = ts.createLanguageService(_this.host);
        };
        this.formatTypeScriptCode = function (fileName, sourceCode) {
            _this.host.setSourceFile(fileName, sourceCode);
            var edits = _this.service.getFormattingEditsForDocument(fileName, _this.myFormatCodeOptions());
            _this.host.applyEdits(fileName, edits);
            var sourceFile = _this.service.getSourceFile(fileName);
            return sourceFile.getFullText();
        };
        this.createService();
    }
    TypeScriptFormatter.prototype.myFormatCodeOptions = function () {
        return {
            IndentSize: 4,
            TabSize: 4,
            NewLineCharacter: '\n',
            ConvertTabsToSpaces: true,
            IndentStyle: ts.IndentStyle.Smart,
            InsertSpaceAfterCommaDelimiter: true,
            InsertSpaceAfterSemicolonInForStatements: true,
            InsertSpaceBeforeAndAfterBinaryOperators: true,
            InsertSpaceAfterKeywordsInControlFlowStatements: true,
            InsertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
            InsertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: true,
            InsertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: true,
            InsertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: true,
            PlaceOpenBraceOnNewLineForFunctions: false,
            PlaceOpenBraceOnNewLineForControlBlocks: false
        };
    };
    return TypeScriptFormatter;
}());
var MyLanguageServiceHost = (function () {
    function MyLanguageServiceHost() {
        var _this = this;
        this.compilerOptions = {};
        this.sourceFiles = {};
        this.setSourceFile = function (fileName, sourceCode) {
            _this.sourceFiles[fileName] = { code: sourceCode, version: 1 };
        };
        this.applyEdits = function (fileName, edits) {
            var result = _this.sourceFiles[fileName].code;
            for (var i = edits.length - 1; i >= 0; i--) {
                var change = edits[i];
                var head = result.slice(0, change.span.start);
                var tail = result.slice(change.span.start + change.span.length);
                result = head + change.newText + tail;
            }
            _this.sourceFiles[fileName].code = result;
            _this.sourceFiles[fileName].version++;
        };
        this.getCompilationSettings = function () {
            return _this.compilerOptions;
        };
        this.getNewLine = function () {
            return "\n";
        };
        this.getScriptFileNames = function () {
            return [];
        };
        this.getScriptVersion = function (fileName) {
            return _this.sourceFiles[fileName].version.toString();
        };
        this.getScriptSnapshot = function (fileName) {
            var code;
            if (_this.sourceFiles[fileName] === undefined) {
                code = fs.readFileSync(fileName).toString();
                _this.setSourceFile(fileName, code);
            }
            else {
                code = _this.sourceFiles[fileName].code;
            }
            if (code == null) {
                return null;
            }
            return ts.ScriptSnapshot.fromString(code);
        };
        this.getCurrentDirectory = function () {
            return './';
        };
        this.getDefaultLibFileName = function (options) {
            return options.target === ts.ScriptTarget.ES6 ? "lib.es6.d.ts" : "lib.d.ts";
        };
    }
    return MyLanguageServiceHost;
}());
var initializeServer = function (callback) {
    async.waterfall([
        ast.phpAst.initialize,
        function (childAlive, callback) {
            if (childAlive) {
                callback(null);
            }
            else {
                callback(new Error("Server do'nt started."));
            }
        },
        ast.phpAst.getConstants,
        function (result, callback) {
            if (result.status) {
                callback(null, result.body.constants);
            }
            else {
                callback(new Error('Initialize error :' + result.message), undefined);
            }
        }
    ], callback);
};
var searchFiles = function (targetPath, callback) {
    var files = [];
    searchFilesSync(targetPath, files);
    callback(null, files);
};
var searchFilesSync = function (targetPath, list) {
    var stat = fs.statSync(targetPath);
    if (stat.isFile()) {
        if (path.extname(targetPath).toLowerCase() == '.php') {
            list.push(targetPath);
        }
    }
    else if (stat.isDirectory()) {
        var filelist = fs.readdirSync(targetPath);
        for (var _i = 0, filelist_1 = filelist; _i < filelist_1.length; _i++) {
            var file = filelist_1[_i];
            searchFilesSync(targetPath + '/' + file, list);
        }
    }
};
var run = function () {
    var resultArg = processArg();
    var startFolder = resultArg.file;
    var settings = resultArg.base_settings;
    var constants;
    var resultStok = [];
    async.waterfall([
        initializeServer,
        function (_constants, callback) {
            constants = _constants;
            callback(null);
        },
        async.apply(searchFiles, startFolder),
        function (files, callback) {
            async.each(files, function (file, callback) {
                var code = fs.readFileSync(file);
                async.waterfall([async.apply(ast.phpAst.parse, code.toString())], function (err, result) {
                    resultStok.push({ file: file, result: result });
                    callback(null);
                });
            }, callback);
        }
    ], function (err, result) {
        ast.phpAst.stopServer();
        if (err === undefined || err === null) {
            compile(resultStok, startFolder, settings, constants);
        }
        else {
            console.error(err.message);
            for (var _i = 0, resultStok_2 = resultStok; _i < resultStok_2.length; _i++) {
                var result_1 = resultStok_2[_i];
                if (!result_1.result.status) {
                    console.error('"' + result_1.file + '" ' + result_1.result.message);
                }
            }
        }
    });
};
run();
//# sourceMappingURL=cli.js.map