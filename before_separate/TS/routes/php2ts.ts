/// <reference path="../typings/main.d.ts" />;
/// <reference path="../typings/jsonnet.d.ts" />;
import async = require('async');
import fs = require('fs');
import path = require('path');
import express = require('express');
var router = express.Router();
import ast = require('../lib/php-ast');
import compiler = require('../share/php2ts-compiler');
import moduleResolver = require('../share/php2ts-moduleResolver');
import Jsonnet = require('jsonnet');
let jsonnet = new Jsonnet();

ast.phpAst.initialize();

router.get('/', function(req:express.Request, res:express.Response, next:express.NextFunction) {
    res.redirect(req.baseUrl + '/top');
});
router.get('/top', function(req:express.Request, res:express.Response, next:express.NextFunction) {
    res.render('php2ts/top');
});
router.get('/document', function(req:express.Request, res:express.Response, next:express.NextFunction) {
    res.render('php2ts/document');
});
router.get('/download', function(req:express.Request, res:express.Response, next:express.NextFunction) {
    res.render('php2ts/download');
});
router.get('/demo', function(req:express.Request, res:express.Response, next:express.NextFunction) {
    res.render('php2ts/demo');
});

router.get('/phpfiles', function(req:express.Request, res:express.Response, next:express.NextFunction) {
    let files = fs.readdirSync(path.join(req.app.get('public'), 'php2ts/phpfiles'));
    let filenames:any[] = [];
    files.forEach(function(file){
        if(path.extname(file) == '.php') {
            filenames.push(path.basename(file));
        }
    });
    res.json(filenames);
});

router.post('/compile', compileExec);

function compileExec(req:express.Request, res:express.Response, next:express.NextFunction) {
    let Compiler = getCompiler(req);
    let src = fs.readFileSync('share/php2ts.Settings.json', 'utf8');
    let settings:Settings = jsonnet.eval(src);
    
    async.waterfall([
            (callback:AsyncResultCallback<any>):void => {
                if(compiler.initialized) {
                    callback(null,{status:false,initialized:true});
                }else{
                    ast.phpAst.getConstants(callback);
                }
            },
            (getConstantsResult:ast.ResultArray,callback:AsyncResultCallback<any>):void => {
                if(getConstantsResult.status && getConstantsResult.body.parse_status) {
                    compiler.initialize(settings,getConstantsResult.body.constants);
                }
                ast.phpAst.parse(req.body['code'],callback);
            },
            (result:ast.ResultArray,callback:AsyncResultCallback<any>):void => {
                let parse_result:any = {
                    parse_status : result.status,
                    parse_message : result.message
                };
                if(result.body !== undefined){
                    parse_result.parse_status = result.status && result.body.parse_status;
                    if(result.body.parse_message != '') {
                        parse_result.parse_message = result.body.parse_message;
                    }
                    parse_result.parse_error = result.body.parse_error;
                    parse_result.ast = result.body.ast;
                    parse_result.ast_dump = result.body.ast_dump;
                    parse_result.comments = result.body.comments;
                }
                if(parse_result.ast !== undefined) {
                    let ast = parse_result.ast;
                    let pass1_result = compiler.pass1.pass1(ast,'dummy.php');
                    let ModuleResolver = new moduleResolver(pass1_result);
                    let compile_result = Compiler.compile(ModuleResolver,ast,parse_result.comments);
                    parse_result.compile_result = compile_result.code;
                }
                callback(null,parse_result);
            }
        ],
        (err:Error,parse_result:any):void => {
            res.json(parse_result);
        }
    );
}

function getCompiler(req:express.Request):compiler.compiler {
    let key = 'php2ts.compiler';
    let Compiler:compiler.compiler = req.app.get(key);
    if(Compiler === undefined) {
        Compiler = new compiler.compiler();
        req.app.set(key, Compiler);
    }
    return Compiler;
}

module.exports = router;
