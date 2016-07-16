/// <reference path="./php2ts-compiler.ts" />;

import compiler = require('./php2ts-compiler');
import moduleResolver = require('./php2ts-moduleResolver');

namespace compiler2pass {
    
    let Compiler = new compiler.compiler();
    let inputFiles:parsedFiles = {};
    let pass1Results:{[key:string]:Pass1Result} = {};
    
    export let initialize = (settings:Settings, constants:Constants) => {
        compiler.initialize(settings,constants);
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
    
}

export = compiler2pass;
