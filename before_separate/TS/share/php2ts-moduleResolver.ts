/// <reference path="../typings/main.d.ts" />;
/// <reference path="./php2ts-code.ts" />;
import path = require('path');
import _code = require('./php2ts-code');

class moduleResolver implements ModuleResolver {
    private pass1Result:Pass1Result;
    
    private namespaces:string[] = [];
    private namespaceStack:string[] = [];
    private references:{[key:string]:string} = {};
    private useReturn = false;
    
    private importList:{[key:string]:string} = {};
    private letList:{[key:string]:string} = {};
    
    constructor(pass1Result:Pass1Result) {
        this.pass1Result = pass1Result;
    }
    private rename = (type:nameType, name:string):string => {
        // http://php.net/manual/ja/language.namespaces.rules.php
        let full = name.charAt(0) == '.';
        let names = name.split('.');
        // full:完全修飾名か否か names:名前空間及び名前
        if(full) {
            names.splice(0,1); // delete ''
        } else {
            // useによる変換。 namespace\name1 を完全修飾名に変換する
            if(names[0] in this.pass1Result.aliasTable) {
                // 名前空間 A\B\C が C という名前でインポートされている場合、 C\D\e() へのコールは A\B\C\D\e() と変換されます。
                let alias = names[0];
                names.splice(0,1);
                names = this.pass1Result.aliasTable[alias].concat(names);
            } else {
                if(names.length > 1) { /* 修飾名 */
                    // 名前空間内で、インポートルールによる変換が行われなかった修飾名は 現在の名前空間が先頭に付加されます。
                    let namespace = this.namespaceStack.join('\\');
                    names = namespace.split('\\').concat(names);
                } else { /* 非修飾名 */
                    if(type == nameType.function) {
                        // 名前空間内で、非修飾な関数へのコールは実行時に解決されます。
                        // 関数 foo() のコール
                        // 1.まず現在の名前空間から関数 A\B\foo() を探します。
                        // 2.次に グローバル 関数 foo() を探します。
                        
                        // 「つまり、変換しない」
                    } else if(type == nameType.class) {
                        // 名前空間内で、 非修飾あるいは (完全修飾でない) 修飾なクラスへのコールは実行時に解決されます。 
                        // new C() の場合
                        // 1.まず現在の名前空間からクラス A\B\C を探します。
                        // 2.A\B\C を autoload します。
                        // グローバル名前空間内のグローバルクラスを参照するには、完全修飾形式の new \C() を使わなければなりません。
                        let namespace = this.namespaceStack.join('\\');
                        names = namespace.split('\\').concat(names);
                    } else {
                        // 定数は？
                    }
                }
            }
        }
        // ここからは、独自のルールを定義する。
        if(type !== nameType.class) {
            // 定数）　そのまま展開。
            // 関数）　そのまま展開。
            let _name = names[names.length - 1];
            names.pop();
            let _namespace = this.changeNamespace(names.join('\\'));
            if(_namespace != '') {
                _namespace += '.';
            }
            return _namespace + _name;
        }
        // クラス）　map に存在していない場合、spl_autoload の規則で import を生成する。
        let _name = names[names.length - 1];
        names.pop();
        let namespace = names.join('\\');
        if(namespace in this.pass1Result.nameMap[type]) {
            if(_name in this.pass1Result.nameMap[type][namespace]) {
                let phpFilePath = this.pass1Result.nameMap[type][namespace][_name];
                if(phpFilePath !== this.pass1Result.relativePath) {
                    //プロジェクト内の別ファイルに存在している
                    return this.pushImportList(namespace,_name,phpFilePath);
                }
                let _namespace = this.changeNamespace(namespace);
                let currentNamespace = this.changeNamespace(this.namespaceStack.join('\\'));
                if(currentNamespace == _namespace) {
                    return _name;
                }
                let className = _namespace;
                if(className != '') {
                    className += '.';
                }
                className += _name;
                return className;
            }
        }
        // 作ろうとしている import 文のイメージ
        // import a__b__c = require('a/b/c').a__b.c;
        // new a__b__c();
        
        // spl_autoload , psr-4
        let autoloadFilePath = namespace.replace('\\','/');
        if(namespace != '') {
            autoloadFilePath += '/';
        }
        autoloadFilePath += name;
        return this.pushImportList(namespace,_name,autoloadFilePath);
    }
    private pushImportList = (namespace:string,name:string,phpFilePath:string):string => {
        let _namespace = this.changeNamespace(namespace);
        let className = _namespace;
        if(className != '') {
            className += '__';
        }
        className += name;
        let relativePath = this.relativePathFileToFile(this.pass1Result.relativePath,phpFilePath);
        let modulePath = this.phpPathToModulePath(relativePath);
        let moduleVar = this.modulePathToVar(modulePath);
        this.importList[moduleVar] = 'import ' + moduleVar + ' = require("' + modulePath + '");\n';
        this.letList[className] = 'let ' + className + ' = ' + moduleVar + '.' + _namespace + '.' + name + ';\n';
        return className;
    }
    private relativePathFileToFile = (fromFile:string,toFile:string):string => {
        let parsedPath = path.parse(fromFile);
        return path.relative(parsedPath.dir,toFile);
    }
    private phpPathToModulePath = (phpPath:string):string => {
        let c = '';
        if(phpPath.charAt(0) != '.') {
            c = './';
        }
        let parsedPath = path.parse(phpPath);
        if(parsedPath.ext.toLowerCase() == '.php') {
            return c + phpPath.substr(0,phpPath.length - 4);
        } else {
            return c + phpPath;
        }
    }
    private modulePathToVar = (modulePath:string):string => {
        return modulePath.replace(/[./\\]/g,'_');
    }
    private changeNamespace = (name:string):string => {
        return name.replace('\\','__');
    }
    public pushNamespace = (name:string):string => {
        let newName = this.changeNamespace(name);
        this.namespaceStack.push(name);
        this.namespaces.push(newName);
        return newName;
    }
    public popNamespace = () => {
        this.namespaceStack.pop();
    }
    public setReturn = () => {
        this.useReturn = true;
    }
    private makeReferenceKey = (name:string,type:nameType) => {
        return type.toString() + ':' + this.namespaceStack.join('\\') + '/' + name; 
    }
    public getConstReference = (name:string):string => {
        let key = this.makeReferenceKey(name,nameType.const);
        if(key in this.references) {
            return this.references[key];
        }
        return this.references[key] = this.rename(nameType.const, name);
    }
    public getClassReference = (name:string):string => {
        let key = this.makeReferenceKey(name,nameType.class);
        if(key in this.references) {
            return this.references[key];
        }
        return this.references[name] = this.rename(nameType.class, name);
    }
    public getFunctionReference = (name:string):string => {
        let key = this.makeReferenceKey(name,nameType.function);
        if(key in this.references) {
            return this.references[key];
        }
        return this.references[name] = this.rename(nameType.function, name);
    }
    public getImport = ():string => {
        let code = '';
        for(let key in this.importList) {
            code += this.importList[key];
        }
        for(let key in this.letList) {
            code += this.letList[key];
        }
        return code;
    }
    public getExport = (body:string):string => {
        // ex) with return;
        //     export = () => {body};
        // ex) use namespace
        //     body; export = {a,b};
        // ex) other
        //     module someModule {body}; export = someModule;
        if(this.useReturn !== this.pass1Result.return) {
            throw new Error('Logic error');
        }
        if(this.useReturn) {
            return 'export = () => {\n' + body + '}';
        }
        if(this.namespaces.length > 0) {
            return body + 'export = {' + this.namespaces.join(',') + '}';
        }
        return 'module someModule {\n' + body + '}\nexport = someModule;';
    }
}
export = moduleResolver;
