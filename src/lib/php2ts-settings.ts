namespace settings {
    export let InsertComments:string = '';
    export let LocalVariableNamePre: string = '';
    export let LocalVariableNamePost: string = '';
    export let SuperGlobals:SettingVariables;
    export let Globals:SettingVariables;
    export let Constants:SettingVariables;
    export let Classes:SettingVariables;
    export let Functions:SettingVariables;
    
    export let initialize = (settings:Settings):void => {
        SuperGlobals = {};
        Globals = {};
        Constants = {};
        Classes = {};
        Functions = {};
        
        if(settings.Translate !== undefined) {
            if(settings.Translate.UseReplaceSets !== undefined) {
                for(let _set of settings.Translate.UseReplaceSets) {
                    if(settings.ReplaceSets !== undefined) {
                        if(settings.ReplaceSets[_set] !== undefined) {
                            mergeSettings(SuperGlobals, settings.ReplaceSets[_set].SuperGlobals);
                            mergeSettings(Globals, settings.ReplaceSets[_set].Globals);
                            mergeSettings(Constants, settings.ReplaceSets[_set].Constants);
                            mergeSettings(Classes, settings.ReplaceSets[_set].Classes);
                            mergeSettings(Functions, settings.ReplaceSets[_set].Functions);
                        } else {
                            console.error(" Unknown Set '" + _set + "'");
                        }
                    }
                }
            }
            if(settings.Translate.InsertComments !== undefined) {
                InsertComments = settings.Translate.InsertComments;
            }
            if(settings.Translate.LocalVariableNamePre !== undefined) {
                LocalVariableNamePre = settings.Translate.LocalVariableNamePre;
            }
            if(settings.Translate.LocalVariableNamePost !== undefined) {
                LocalVariableNamePost = settings.Translate.LocalVariableNamePost;
            }
        }
    }
    
    export let mergeSettings = (base:{[key:string]:string}, source:{[key:string]:string}):void => {
        if(source === undefined) {
            return;
        }
        for(let key in source) {
            base[key] = source[key];
        }
    }
}
export = settings;
