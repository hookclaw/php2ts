/// <reference path="./browser.d.ts" />;
/// <reference path="./typescriptServices.1.8.10.d.ts" />;

type bufferedReadFileSync = (fileName:string) => string;

// TypeScriptソースコードの整形と診断結果の取得
function formatTypeScriptCode(sourceCode:string, defaultLibFileName:string, bufferedReadFileSync:bufferedReadFileSync, compilerOptions?:ts.CompilerOptions):any {
    // ホストの作成
    let host = new MyLanguageServiceHost(compilerOptions);
    host.bufferedReadFileSync = bufferedReadFileSync;
    host.setSourceFile(host.fileName, sourceCode);
    host.defaultLibFileName = defaultLibFileName;
    
    // サービスの作成
    let service: ts.LanguageService = ts.createLanguageService(host);
    
    // ソースコードの整形
    let edits: ts.TextChange[] = service.getFormattingEditsForDocument(host.fileName, myFormatCodeOptions());
    host.applyEdits(host.fileName, edits);
    
    // ソースコードが更新されたため、サービスの再作成
    // ほかに方法が見つからなかった。
    service.dispose();
    service = ts.createLanguageService(host);
    let sourceFile: ts.SourceFile = service.getSourceFile(host.fileName);
    let formated_code = sourceFile.getFullText();
    
    // Transpileする
    let transpile_result = ts.transpile(formated_code,compilerOptions);
    
    // 診断結果を取得する
    let syntacticDiagnostics: ts.Diagnostic[] = service.getSyntacticDiagnostics(host.fileName);
    let semanticDiagnostics: ts.Diagnostic[] = service.getSemanticDiagnostics(host.fileName);
    giveLineNo(syntacticDiagnostics, sourceFile);
    giveLineNo(semanticDiagnostics, sourceFile);
    return {
        transpile_result : transpile_result,
        formated_code : formated_code,
        ts_diag1: syntacticDiagnostics,
        ts_diag2:semanticDiagnostics,
        sourceFile:sourceFile
    };
}

function giveLineNo(diag:any[], sourceFile:ts.SourceFile):void {
    for(let key in diag) {
        let lc:ts.LineAndCharacter = sourceFile.getLineAndCharacterOfPosition(diag[key].start);
        diag[key].line = lc.line;
        diag[key].character = lc.character;
    }
}

function myFormatCodeOptions():ts.FormatCodeOptions {
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
    public bufferedReadFileSync:bufferedReadFileSync;
    public defaultLibFileName:string = '';
    public fileName:string = 'editing.ts';
    private sourceFiles:{[key:string]:{code:string,version:number}} = {};
    
    constructor(compilerOptions?:ts.CompilerOptions) {
        if(compilerOptions !== undefined){
            for(let key in compilerOptions) {
                this.compilerOptions[key] = compilerOptions[key];
            }
        }
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
        return [this.fileName];
    };
    //getScriptKind?(fileName: string): ScriptKind;
    getScriptVersion = (fileName: string): string => {
        return this.sourceFiles[fileName].version.toString();
    };
    getScriptSnapshot = (fileName: string): ts.IScriptSnapshot => {
        let code:string;
        if(this.sourceFiles[fileName] === undefined) {
            code = this.bufferedReadFileSync(fileName);
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
        if(this.defaultLibFileName != "") {
            return this.defaultLibFileName;
        }
        return options.target === ts.ScriptTarget.ES6 /* 2:ES6 */ ? "lib.es6.d.ts" : "lib.d.ts";
    };
    //log?(s: string): void => {};
    //trace?(s: string): void => {};
    //error?(s: string): void => {};
    //useCaseSensitiveFileNames?(): boolean => {};
    //resolveModuleNames?(moduleNames: string[], containingFile: string): ResolvedModule[] => {};
    //directoryExists?(directoryName: string): boolean => {};
}
