// from Settings
type SettingVariables = {[key:string]:string};
type Settings = {
    Translate: {
        UseReplaceSets?: string[],
        InsertComments?: string,
        LocalVariableNamePre?: string,
        LocalVariableNamePost?: string
    },
    ReplaceSets?: {
        [key:string]: {
            SuperGlobals?: SettingVariables,
            Globals?: SettingVariables,
            Constants?: SettingVariables,
            Classes?: SettingVariables,
            Functions?: SettingVariables
        }
    }
};

// from Scope
type Scope = {
    paramsAndUses:SettingVariables;
    locals:SettingVariables;
    globals:SettingVariables;
    temporaries:string[];
    ignores:SettingVariables;
    preCodeStock:string[];
    localno:number;
    labelno:number;
    inIf:boolean;
    inInterface:boolean;
    inUseTrait:boolean;
    inGlobal:boolean;
    inAssign:boolean;
};
type VariableTypeAndTemporaryNames = {type:VariableType,name:string};
const enum VariableType {
    SuperGlobal,Global,ParamsOrUses,Local
};

// from ModuleResolver
interface ModuleResolver {
    pushNamespace(name:string):string;
    popNamespace():void;
    setReturn():void;
    getConstReference(name:string):string;
    getClassReference(name:string):string;
    getFunctionReference(name:string):string;
    getImport():string;
    getExport(body:string):string;
}

// from Const
type Constants = {kinds:{[key:string]:number},flags:{[key:string]:number}};

// from Compiler [general]
type baseAst = {kind:number,flags:number,lineno:number,children:any,
    endLineno?:number,name?:string,docComment?:string,label?:string};

// from Compiler [pass1]
const enum nameType {
    const,
    class,
    function
};
type nameMap = {[key:number]:{[key:string]:{[key:string]:string}}};
type Pass1Result = {relativePath:string,
    nameMap:nameMap,
    aliasTable:{[key:string]:string[]},
    return:boolean};

// from Compiler [pass2]
type Comments = {[key:number]:string};
type CompileResult = {code:string};

// from Compiler2pass
type parsedFiles = {[key:string]:{ast:baseAst,comments:Comments}};
