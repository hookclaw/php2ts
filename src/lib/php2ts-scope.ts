namespace scope {
    
    export let scopeStack:Scope[] = []; // 添え字ゼロは、グローバル。
    let changeLocalVarname:(varname:string) =>string;
    let changeSuperGlobal:(varname:string) =>string;

    export let initialize = (
        p_changeLocalVarname:(varname:string) =>string,
        p_changeSuperGlobal:(varname:string) =>string
    ) => {
        scopeStack = [];
        changeLocalVarname = p_changeLocalVarname;
        changeSuperGlobal = p_changeSuperGlobal;
    }
    
    export let newScope = ():Scope => {
        let scope:Scope = {
            paramsAndUses: {},
            locals: {},
            globals: {},
            temporaries: [],
            ignores: {},
            preCodeStock: [],
            localno: 0,
            labelno: 0,
            inIf: false,
            inInterface: false,
            inUseTrait: false,
            inGlobal: false,
            inAssign: false
        };
        scopeStack.push(scope);
        return scope;
    }
    
    export let popScope = ():void => {
        scopeStack.pop();
    }
    
    export let topScope = ():Scope => {
        return scopeStack[0];
    }
    
    export let currentScopeIndex = ():number => {
        return scopeStack.length - 1;
    }
    
    export let currentScope = ():Scope => {
        let pos = scopeStack.length - 1;
        return scopeStack[pos];
    }
    
    export let parentScope = ():Scope => {
        let pos = scopeStack.length - 2;
        return scopeStack[pos];
    }
    
    // GLOBAL 文で定義された変数
    export let pushGlobal = (varname:string):void => {
        let scope = currentScope();
        scope.globals[varname] = "global['"+varname+"']";
        // ==> ツリーをたどる前にローカル変数一覧を事前に把握しておく必要がある。
        //親階層でローカル定義されていない時は、そのままで問題なし
        // ==> TypeScriptにとっては綱渡り状態なので、全てのグローバル宣言は、代替処理にしてしまう選択肢を与える。
        //親階層でローカル定義されている時は、代替処理
        // ==> Ans. 一旦、警告表示と代替処理を前提としたコーディングを書いておく。
    }
    
    // メソッドや関数の引数として受け取った変数
    export let pushParam = (varname:string, byref:boolean):string => {
        let scope = currentScope();
        if(byref){
            return scope.paramsAndUses[varname] = '_prm_' + varname;
            //値渡しの型はＮＧ
            //参照渡しの型はＯＫ
            // ==> これらは実行時にしか判定できない。
            // ==> Ans. 警告を表示する。変数名はそのまま使う。
        }else{
            let tmpname = '_prm_' + varname;
            let localname = changeLocalVarname(varname);
            scope.temporaries.push('let '+localname+'='+tmpname+';');
            scope.paramsAndUses[varname] = localname;
            return tmpname;
            //値渡しの型はＯＫ
            //参照渡しの型はＮＧ
            // ==> これらは実行時にしか判定できない。
            // ==> Ans. テンポラリ変数を使うように置き換える。
        }
    }
    
    //scope
    // 無名関数の use で使用された変数
    export let pushUse = (varname:string, byref:boolean):string => {
        let scope = currentScope();
        let _parentScope = parentScope();
        let r:VariableTypeAndTemporaryNames = getVariableTypeAndLocalPush(_parentScope,varname);
        let tmpname = r.name;
        if(byref){
            return scope.paramsAndUses[varname] = tmpname;
            // Ans. そのままで問題なし
        }else{
            let useName = '_use_' + tmpname;
            scope.temporaries.push('let '+useName+'='+tmpname+';');
            return scope.paramsAndUses[varname] = useName;
            // Ans. テンポラリ変数を使う
        }
    }
    
    // 一時変数をローカル変数として定義する
    export let newLocal = (scope:Scope):string => {
        let varname = 'tmpLocal' + (scope.localno++);
        return pushLocal(scope,varname);
    }
    
    // ローカル変数と判断されたもの
    export let pushLocal = (scope:Scope, varname:string, change=true):string => {
        let tmpname = change?changeLocalVarname(varname):varname;
        scope.locals[varname] = tmpname;
        return tmpname;
    }
    
    // static などで定義されているため、let 不要な変数
    export let pushIgnore = (varname:string):void => {
        let scope = currentScope();
        scope.ignores[varname] = varname;
    }
    
    export let getVariableTypeAndLocalPush = (scope:Scope, varname:string):VariableTypeAndTemporaryNames => {
        let name = changeSuperGlobal(varname);
        if(name !== undefined){
            return {type:VariableType.SuperGlobal,name:name};
        }
        if(varname in scope.globals){
            return {type:VariableType.Global,name:scope.globals[varname]};
        }
        if(varname in scope.paramsAndUses){
            return {type:VariableType.ParamsOrUses,name:scope.paramsAndUses[varname]};
        }
        return {type:VariableType.Local,name:pushLocal(scope, varname)};
    }
}
export = scope;
