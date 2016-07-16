"use strict";
var async = require('async');
var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var ast = require('../lib/php-ast');
var compiler = require('../share/php2ts-compiler');
var moduleResolver = require('../share/php2ts-moduleResolver');
var Jsonnet = require('jsonnet');
var jsonnet = new Jsonnet();
ast.phpAst.initialize();
router.get('/', function (req, res, next) {
    res.redirect(req.baseUrl + '/top');
});
router.get('/top', function (req, res, next) {
    res.render('php2ts/top');
});
router.get('/document', function (req, res, next) {
    res.render('php2ts/document');
});
router.get('/download', function (req, res, next) {
    res.render('php2ts/download');
});
router.get('/demo', function (req, res, next) {
    res.render('php2ts/demo');
});
router.get('/phpfiles', function (req, res, next) {
    var files = fs.readdirSync(path.join(req.app.get('public'), 'php2ts/phpfiles'));
    var filenames = [];
    files.forEach(function (file) {
        if (path.extname(file) == '.php') {
            filenames.push(path.basename(file));
        }
    });
    res.json(filenames);
});
router.post('/compile', compileExec);
function compileExec(req, res, next) {
    var Compiler = getCompiler(req);
    var src = fs.readFileSync('share/php2ts.Settings.json', 'utf8');
    var settings = jsonnet.eval(src);
    async.waterfall([
        function (callback) {
            if (compiler.initialized) {
                callback(null, { status: false, initialized: true });
            }
            else {
                ast.phpAst.getConstants(callback);
            }
        },
        function (getConstantsResult, callback) {
            if (getConstantsResult.status && getConstantsResult.body.parse_status) {
                compiler.initialize(settings, getConstantsResult.body.constants);
            }
            ast.phpAst.parse(req.body['code'], callback);
        },
        function (result, callback) {
            var parse_result = {
                parse_status: result.status,
                parse_message: result.message
            };
            if (result.body !== undefined) {
                parse_result.parse_status = result.status && result.body.parse_status;
                if (result.body.parse_message != '') {
                    parse_result.parse_message = result.body.parse_message;
                }
                parse_result.parse_error = result.body.parse_error;
                parse_result.ast = result.body.ast;
                parse_result.ast_dump = result.body.ast_dump;
                parse_result.comments = result.body.comments;
            }
            if (parse_result.ast !== undefined) {
                var ast_1 = parse_result.ast;
                var pass1_result = compiler.pass1.pass1(ast_1, 'dummy.php');
                var ModuleResolver = new moduleResolver(pass1_result);
                var compile_result = Compiler.compile(ModuleResolver, ast_1, parse_result.comments);
                parse_result.compile_result = compile_result.code;
            }
            callback(null, parse_result);
        }
    ], function (err, parse_result) {
        res.json(parse_result);
    });
}
function getCompiler(req) {
    var key = 'php2ts.compiler';
    var Compiler = req.app.get(key);
    if (Compiler === undefined) {
        Compiler = new compiler.compiler();
        req.app.set(key, Compiler);
    }
    return Compiler;
}
module.exports = router;
//# sourceMappingURL=php2ts.js.map