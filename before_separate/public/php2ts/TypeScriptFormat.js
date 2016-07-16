/// <reference path="./browser.d.ts" />;
/// <reference path="./typescriptServices.1.8.10.d.ts" />;
// TypeScriptソースコードの整形と診断結果の取得
function formatTypeScriptCode(sourceCode, defaultLibFileName, bufferedReadFileSync, compilerOptions) {
    // ホストの作成
    var host = new MyLanguageServiceHost(compilerOptions);
    host.bufferedReadFileSync = bufferedReadFileSync;
    host.setSourceFile(host.fileName, sourceCode);
    host.defaultLibFileName = defaultLibFileName;
    // サービスの作成
    var service = ts.createLanguageService(host);
    // ソースコードの整形
    var edits = service.getFormattingEditsForDocument(host.fileName, myFormatCodeOptions());
    host.applyEdits(host.fileName, edits);
    // ソースコードが更新されたため、サービスの再作成
    // ほかに方法が見つからなかった。
    service.dispose();
    service = ts.createLanguageService(host);
    var sourceFile = service.getSourceFile(host.fileName);
    var formated_code = sourceFile.getFullText();
    // Transpileする
    var transpile_result = ts.transpile(formated_code, compilerOptions);
    // 診断結果を取得する
    var syntacticDiagnostics = service.getSyntacticDiagnostics(host.fileName);
    var semanticDiagnostics = service.getSemanticDiagnostics(host.fileName);
    giveLineNo(syntacticDiagnostics, sourceFile);
    giveLineNo(semanticDiagnostics, sourceFile);
    return {
        transpile_result: transpile_result,
        formated_code: formated_code,
        ts_diag1: syntacticDiagnostics,
        ts_diag2: semanticDiagnostics,
        sourceFile: sourceFile
    };
}
function giveLineNo(diag, sourceFile) {
    for (var key in diag) {
        var lc = sourceFile.getLineAndCharacterOfPosition(diag[key].start);
        diag[key].line = lc.line;
        diag[key].character = lc.character;
    }
}
function myFormatCodeOptions() {
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
var MyLanguageServiceHost = (function () {
    function MyLanguageServiceHost(compilerOptions) {
        var _this = this;
        this.compilerOptions = {};
        this.defaultLibFileName = '';
        this.fileName = 'editing.ts';
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
        //getProjectVersion?(): string;
        this.getScriptFileNames = function () {
            return [_this.fileName];
        };
        //getScriptKind?(fileName: string): ScriptKind;
        this.getScriptVersion = function (fileName) {
            return _this.sourceFiles[fileName].version.toString();
        };
        this.getScriptSnapshot = function (fileName) {
            var code;
            if (_this.sourceFiles[fileName] === undefined) {
                code = _this.bufferedReadFileSync(fileName);
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
        //getLocalizedDiagnosticMessages?(): any => {};
        //getCancellationToken?(): HostCancellationToken => {};
        this.getCurrentDirectory = function () {
            return './';
        };
        this.getDefaultLibFileName = function (options) {
            if (_this.defaultLibFileName != "") {
                return _this.defaultLibFileName;
            }
            return options.target === ts.ScriptTarget.ES6 /* 2:ES6 */ ? "lib.es6.d.ts" : "lib.d.ts";
        };
        if (compilerOptions !== undefined) {
            for (var key in compilerOptions) {
                this.compilerOptions[key] = compilerOptions[key];
            }
        }
    }
    return MyLanguageServiceHost;
}());
//# sourceMappingURL=TypeScriptFormat.js.map