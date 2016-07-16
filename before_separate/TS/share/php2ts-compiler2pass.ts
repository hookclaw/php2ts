/// <reference path="./php2ts-compiler.ts" />;

import compiler = require('./php2ts-compiler');
import moduleResolver = require('../share/php2ts-moduleResolver');

namespace compiler2pass {
    // type Autoload = {'psr-4':{[key:string]:string}};
    // type psr4Tree = {[key:string]:{path:string[],child:psr4Tree}};
    // type FindPathResult = {namespace:string,path:string[]}[];
    
    let Compiler = new compiler.compiler();
    //let _const = compiler.getConst();
    // let psr4Tree:psr4Tree;
    let inputFiles:parsedFiles = {};
    let pass1Results:{[key:string]:Pass1Result} = {};
    // let mapper:compiler.TypeMaper = {const:{},class:{},function:{}};
    
    export let initialize = (settings:Settings, constants:Constants) => {
        compiler.initialize(settings,constants);
        // psr4Tree = convertToPsr4Tree(autoload);
    }
    
    export let compile = (baseFolder:string,files:parsedFiles,callback:(filepath:string,code:string) => void) => {
        inputFiles = files;
        let nameMap:nameMap = {};
        for(let filePath in files) {
            let ast = files[filePath].ast;
            let result = pass1(filePath,ast);
            pass1Results[filePath] = result;
            for(let key1 in result.nameMap) {
                for(let key2 in result.nameMap[key1]) {
                    for(let key3 in result.nameMap[key1][key2]) {
                        if(nameMap[key1] === undefined) {
                            nameMap[key1] = {};
                        }
                        if(nameMap[key1][key2] === undefined) {
                            nameMap[key1][key2] = {};
                        }
                        nameMap[key1][key2][key3] = result.nameMap[key1][key2][key3];
                    }
                }
            }
            // regist(spa.const,mapper.const,relativePath);
            // regist(spa.class,mapper.class,relativePath);
            // regist(spa.function,mapper.function,relativePath);
        }
        for(let filePath in files) {
            let ast = files[filePath].ast;
            let comments = files[filePath].comments;
            let pass1Result = pass1Results[filePath];
            pass1Result.nameMap = nameMap;
            let result = pass2(filePath,pass1Result,ast,comments);
            callback(filePath,result.code);
        }
    }
    
    let pass1 = (relativePath:string,ast:baseAst):Pass1Result => {
        let result = compiler.pass1.pass1(ast,relativePath);
        return result;
    }
    
    let pass2 = (relativePath:string,pass1Result:Pass1Result,ast:baseAst,comments:Comments):CompileResult => {
        let ModuleResolver = new moduleResolver(pass1Result);
        return Compiler.compile(ModuleResolver,ast,comments);
    }
    
    // let regist = (list:TypeSource[],map:compiler.TypeMaping,modulepath:string) => {
    //     for(let item of list) {
    //         let fullname = item.namespace + item.name;
    //         //TODO fullname を基に autoload を検索してパスに変換する。
    //         let result = findPath(fullname);
    //         //TODO autoload の名前空間と fullname から export する名前空間を求める
    //         //TODO autoload のパスと relativepath ,fullname から importname を求める
    //         //let importname = .replace('\\','_');
    //         //let varname = importname + item.name;
    //         //map[fullname] = {importname,varname,modulepath};
    //     }
    // }
    
    // let convertToPsr4Tree = (autoload:Autoload):psr4Tree => {
    //     let psr4Tree:psr4Tree = {};
    //     let psr4 = autoload['psr-4'];
    //     for(let baseNamespace in psr4) {
    //         let splitNamespace = baseNamespace.split('\\');
    //         let basePath = psr4[baseNamespace];
    //         let current:{path:string[],child:psr4Tree} = {path:[],child:psr4Tree};
    //         let i = 0;
    //         while(i < splitNamespace.length) {
    //             let k = splitNamespace[i++];
    //             if(current.child[k] === undefined) {
    //                 current.child[k] = {path:[],child:{}};
    //             }
    //             current = current.child[k];
    //         }
    //         current.path.push(basePath);
    //     }
    //     return psr4Tree;
    // }
    
    // // fullname を基に psr4Tree を検索してパスに変換する。
    // let findPath = (fullname:string):FindPathResult => {
    //     let splitNamespace = fullname.split('\\');
    //     let current:{path:string[],child:psr4Tree} = {path:[],child:psr4Tree};
    //     let i = 0;
    //     let namespace:string = '';
    //     let result:FindPathResult = [];
    //     while(i < splitNamespace.length) {
    //         if(current.path.length > 0) {
    //             result.push({namespace,path:current.path});
    //         }
    //         let k = splitNamespace[i++];
    //         namespace += k + '\\';
    //         if(current.child[k] === undefined) {
    //             break;
    //         }
    //         current = current.child[k];
    //         continue;
    //     }
    //     return result;
    // }
    
}

export = compiler2pass;
