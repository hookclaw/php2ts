/// <reference path="../typings/main.d.ts" />
/// <reference path="../../node_modules/typescript/lib/typescript.d.ts" />

import ts = require('typescript');
import async = require('async');
import fs = require('fs');
import argv = require('argv');
import path = require('path');
import ast = require('../lib/php-ast');
import compiler2pass = require('../lib/php2ts-compiler2pass');
import Jsonnet = require('jsonnet');
let jsonnet = new Jsonnet();

const OPTION_SETTINGS = 'settings';
const OPTION_BASE_SETTINGS = 'base';
const DEFAULT_SETTINGS = 'php2ts.json';
const DEFAULT_BASE_SETTINGS = 'php2ts.Settings.json';
const COMPOSER_JSON = 'composer.json';

type resultStok = {file:string,result:ast.ResultArray}[];

let processArg = () => {
// 引数の取得
    argv.option([
        {name:OPTION_SETTINGS,type:'path',short:'s',description:'default:' + DEFAULT_SETTINGS},
        {name:OPTION_BASE_SETTINGS,type:'path',short:'b',description:'default:' + DEFAULT_BASE_SETTINGS}
    ]);
    let args = argv.run(process.argv);

    // 引数の処理
    // 想定する引数のパターン
    // 1) 引数なし
    //    設定ファイルを探して見つかれば、設定ファイルに従って処理する。(※)
    //    設定ファイルがなければ、ヘルプを表示して終わる。
    // 2) 第１引数に、jsonファイル
    //    設定ファイルとみなして処理する。
    // 3) 第１引数に、PHPファイル
    //    設定ファイルを探して見つかれば、設定ファイルに従って処理する。(※)
    //    設定ファイルがなければ、デフォルト値で指定されたファイルを処理する。
    // 4) 第１引数に、フォルダ
    //    設定ファイルを探して見つかれば、設定ファイルに従って処理する。(※)
    //    設定ファイルがなければ、デフォルト値で指定されたフォルダ以下のファイルを処理する。
    // (※) オプションで設定ファイルが指定されているとき、使用する。

    //input
    //    ソースファイル   phpファイル or フォルダ
    //    User Settings
    //    Default Settings
    //to Compiler
    //    ソースファイル   phpファイル
    //    Settings
    //Output
    //    TSファイル
    //    main.d.ts
    //    tsconfig.json (ソースファイル名)

    let file = args.targets[2];

    let base_settings_file = args.options[OPTION_BASE_SETTINGS];
    if(base_settings_file === undefined) {
        let scriptPath = path.parse(args.targets[1]).dir;
        base_settings_file = (scriptPath + '/' + DEFAULT_BASE_SETTINGS);
    }

    let settings_file = args.options[OPTION_SETTINGS];
    settings_file = (settings_file !== undefined)?settings_file:DEFAULT_SETTINGS;

    let base_settings:Settings = {Translate:{},ReplaceSets:{}};
    if(fs.existsSync(base_settings_file)){
        let base_settings_json = fs.readFileSync(base_settings_file, 'utf8');
        base_settings = jsonnet.eval(base_settings_json);
    }
    let mergeSettings = (base:Settings, source:Settings):void => {
        let mergeSettingsSub = (base:{[key:string]:any}, source:{[key:string]:any}):void => {
            if(source === undefined) {
                return;
            }
            for(let key in source) {
                base[key] = source[key];
            }
        }
        if(base.Translate === undefined) {
            base.Translate = {};
        }
        if(base.ReplaceSets === undefined) {
            base.ReplaceSets = {};
        }
        mergeSettingsSub(base.Translate,source.Translate);
        mergeSettingsSub(base.ReplaceSets,source.ReplaceSets);
    }
    let userSettingsRead = (settings_file:string):void => {
        if(fs.existsSync(settings_file)){
            let settings_json = fs.readFileSync(settings_file, 'utf8');
            let settings:Settings = jsonnet.eval(settings_json);
            mergeSettings(base_settings,settings);
        }
    }
    if(file === undefined) {
        if(!fs.existsSync(settings_file)){
            argv.help();
            process.exit();
        }
        file = '.';
        userSettingsRead(settings_file);
    } else {
        let parsedPath = path.parse(file);
        if(parsedPath.ext.toLowerCase() == 'json') {
            userSettingsRead(file);
            file = '.';
        } else {
            userSettingsRead(settings_file);
        }
    }
    return {base_settings,file};
}
    

/**
 * コンパイル処理
 */
let compile = (resultStok:resultStok,startFolder:string,settings:Settings,constants:Constants):void => {
    // initialize
    let formatter = new TypeScriptFormatter();
    let stats = fs.statSync(startFolder);
    compiler2pass.initialize(settings,constants);
    
    let files:parsedFiles = {};
    for(let target of resultStok) {
        let relativePath = path.relative(startFolder,target.file);
        let ast = target.result.body.ast;
        let comments = target.result.body.comments;
        files[relativePath] = {ast,comments};
    }
    let outputFolder = startFolder;
    compiler2pass.compile(startFolder, files, (filepath:string,code:string) => {
        // write
        let file = path.join(outputFolder,filepath);
        let parsedPath = path.parse(file);
        parsedPath.ext = '.ts';
        parsedPath.base = parsedPath.name + parsedPath.ext;
        let tsFilename = path.format(parsedPath);
        let formattedText = formatter.formatTypeScriptCode(tsFilename,code);
        fs.writeFileSync(tsFilename,formattedText);
        console.log('create -> '+tsFilename);
    });
}

//TypeScript整形用

class TypeScriptFormatter {
    private host:MyLanguageServiceHost;
    private service:ts.LanguageService;
    
    constructor() {
        this.createService();
    }
    
    // TypeScriptソースコードの整形と診断結果の取得
    private createService = ():void => {
        // ホストの作成
        this.host = new MyLanguageServiceHost();
        // サービスの作成
        this.service = ts.createLanguageService(this.host);
    }

    // TypeScriptソースコードの整形と診断結果の取得
    public formatTypeScriptCode = (fileName:string,sourceCode:string):string => {
        this.host.setSourceFile(fileName, sourceCode);
        
        // ソースコードの整形
        let edits: ts.TextChange[] = this.service.getFormattingEditsForDocument(fileName, this.myFormatCodeOptions());
        this.host.applyEdits(fileName, edits);
        
        let sourceFile: ts.SourceFile = this.service.getSourceFile(fileName);
        
        return sourceFile.getFullText();
    }

    private myFormatCodeOptions():ts.FormatCodeOptions {
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
    }
}

/**
 * implements Single file mode.
 */
class MyLanguageServiceHost implements ts.LanguageServiceHost {
    public compilerOptions:ts.CompilerOptions = {
            //allowNonTsExtensions?: boolean;
            //charset?: string;
            //declaration?: boolean;
            //diagnostics?: boolean;
            //emitBOM?: boolean;
            //help?: boolean;
            //init?: boolean;
            //inlineSourceMap?: boolean;
            //inlineSources?: boolean;
            //jsx?: JsxEmit;
            //reactNamespace?: string;
            //listFiles?: boolean;
            //locale?: string;
            //mapRoot?: string;
            //module?: ModuleKind;
            //newLine?: NewLineKind;
            //noEmit?: boolean;
            //noEmitHelpers?: boolean;
            //noEmitOnError?: boolean;
            //noErrorTruncation?: boolean;
            //noImplicitAny?: boolean;
            //noLib?: boolean;
            //noResolve?: boolean;
            //out?: string;
            //outFile?: string;
            //outDir?: string;
            //preserveConstEnums?: boolean;
            //project?: string;
            //removeComments?: boolean;
            //rootDir?: string;
            //sourceMap?: boolean;
            //sourceRoot?: string;
            //suppressExcessPropertyErrors?: boolean;
            //suppressImplicitAnyIndexErrors?: boolean;
            //target?: ScriptTarget;
            //version?: boolean;
            //watch?: boolean;
            //isolatedModules?: boolean;
            //experimentalDecorators?: boolean;
            //emitDecoratorMetadata?: boolean;
            //moduleResolution?: ModuleResolutionKind;
            //allowUnusedLabels?: boolean;
            //allowUnreachableCode?: boolean;
            //noImplicitReturns?: boolean;
            //noFallthroughCasesInSwitch?: boolean;
            //forceConsistentCasingInFileNames?: boolean;
            //allowSyntheticDefaultImports?: boolean;
            //allowJs?: boolean;
            //noImplicitUseStrict?: boolean;
            //disableSizeLimit?: boolean;
            //[option: string]: string | number | boolean;
        };
    private sourceFiles:{[key:string]:{code:string,version:number}} = {};
    
    constructor() {
    }
    
    setSourceFile = (fileName:string, sourceCode:string):void => {
        this.sourceFiles[fileName] = {code:sourceCode,version:1};
    };
    
    applyEdits = (fileName:string, edits:ts.TextChange[]):void => {
        var result = this.sourceFiles[fileName].code;
        for (var i = edits.length - 1; i >= 0; i--) {
            var change = edits[i];
            var head:string = result.slice(0, change.span.start);
            var tail:string = result.slice(change.span.start + change.span.length);
            result = head + change.newText + tail;
        }
        this.sourceFiles[fileName].code = result;
        this.sourceFiles[fileName].version++;
    };
    
    getCompilationSettings = (): ts.CompilerOptions => {
        return this.compilerOptions;
    };
    getNewLine = (): string => {
        return "\n";
    };
    //getProjectVersion?(): string;
    getScriptFileNames = (): string[] => {
        return [];
    };
    //getScriptKind?(fileName: string): ScriptKind;
    getScriptVersion = (fileName: string): string => {
        return this.sourceFiles[fileName].version.toString();
    };
    getScriptSnapshot = (fileName: string): ts.IScriptSnapshot => {
        let code:string;
        if(this.sourceFiles[fileName] === undefined) {
            code = fs.readFileSync(fileName).toString();
            this.setSourceFile(fileName, code);
        } else {
            code = this.sourceFiles[fileName].code;
        }
        if(code == null) {
            return null;
        }
        return ts.ScriptSnapshot.fromString(code);
    };
    //getLocalizedDiagnosticMessages?(): any => {};
    //getCancellationToken?(): HostCancellationToken => {};
    getCurrentDirectory = (): string => {
        return './';
    };
    getDefaultLibFileName = (options: ts.CompilerOptions): string => {
        return options.target === ts.ScriptTarget.ES6 /* 2:ES6 */ ? "lib.es6.d.ts" : "lib.d.ts";
    };
    //log?(s: string): void => {};
    //trace?(s: string): void => {};
    //error?(s: string): void => {};
    //useCaseSensitiveFileNames?(): boolean => {};
    //resolveModuleNames?(moduleNames: string[], containingFile: string): ResolvedModule[] => {};
    //directoryExists?(directoryName: string): boolean => {};
}

// 非同期処理定義


// サーバーとの接続を確立させて、定数を取得する
let initializeServer = (callback:AsyncResultCallback<any>) => {
    async.waterfall([
            // 初期化 （サーバー起動）
            ast.phpAst.initialize,
            (childAlive:boolean,callback:ErrorCallback) => {
                if(childAlive) {
                    callback(null);
                } else {
                    callback(new Error("Server do'nt started."));
                }
            },
            // 初期化 （サーバーから定数リストを取得）
            ast.phpAst.getConstants,
            (result:ast.ResultArray,callback:AsyncResultCallback<any>) => {
                if(result.status) {
                    callback(null, result.body.constants);
                } else {
                    callback(new Error('Initialize error :' + result.message), undefined);
                }
            }
    ],
    callback);
}

/**
 * PHPファイル検索処理
 */
let searchFiles = (targetPath:string,callback:AsyncResultCallback<string[]>):void => {
    let files:string[] = [];
    searchFilesSync(targetPath,files);
    callback(null,files);
};
let searchFilesSync = (targetPath:string,list:string[]) => {
    let stat = fs.statSync(targetPath);
    if(stat.isFile()) {
        if(path.extname(targetPath).toLowerCase() == '.php') {
            list.push(targetPath);
        }
    } else if(stat.isDirectory()) {
        let filelist = fs.readdirSync(targetPath);
        for(let file of filelist) {
            searchFilesSync(targetPath + '/' + file,list);
        }
    }
};

// 処理開始
let run = ():void => {
    let resultArg = processArg();
    let startFolder = resultArg.file;
    let settings = resultArg.base_settings;
    let constants:Constants;
    let resultStok:resultStok = [];
    async.waterfall([
            // 初期化 （サーバー起動）
            initializeServer,
            (_constants:Constants,callback:ErrorCallback) => {
                constants = _constants;
                callback(null);
            },
            // 実際の処理の開始 （ファイルを検索する）
            async.apply(searchFiles,startFolder),
            (files:string[],callback:ErrorCallback) => {
                async.each(files,(file:string,callback:ErrorCallback) => {
                    // ファイル読み込み
                    let code = fs.readFileSync(file);
                    // パース
                    async.waterfall([async.apply(ast.phpAst.parse,code.toString())],
                        (err:Error,result:ast.ResultArray) => {
                            // 結果をストック
                            resultStok.push({file,result});
                            callback(null);
                        }
                    );
                },callback);
            }
        ],(err:Error, result?:any)=>{
            ast.phpAst.stopServer();
            if(err === undefined || err === null) {
                // PHPファイルをコンパイルする
                compile(resultStok,startFolder,settings,constants);
            } else {
                console.error(err.message);
                for(let result of resultStok) {
                    if(!result.result.status) {
                        console.error('"' + result.file + '" ' + result.result.message);
                    }
                }
            }
        }
    );
}

run();
