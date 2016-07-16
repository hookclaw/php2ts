"use strict";
var settings;
(function (settings_1) {
    settings_1.InsertComments = '';
    settings_1.LocalVariableNamePre = '';
    settings_1.LocalVariableNamePost = '';
    settings_1.initialize = function (settings) {
        settings_1.SuperGlobals = {};
        settings_1.Globals = {};
        settings_1.Constants = {};
        settings_1.Classes = {};
        settings_1.Functions = {};
        if (settings.Translate !== undefined) {
            if (settings.Translate.UseReplaceSets !== undefined) {
                for (var _i = 0, _a = settings.Translate.UseReplaceSets; _i < _a.length; _i++) {
                    var _set = _a[_i];
                    if (settings.ReplaceSets !== undefined) {
                        if (settings.ReplaceSets[_set] !== undefined) {
                            settings_1.mergeSettings(settings_1.SuperGlobals, settings.ReplaceSets[_set].SuperGlobals);
                            settings_1.mergeSettings(settings_1.Globals, settings.ReplaceSets[_set].Globals);
                            settings_1.mergeSettings(settings_1.Constants, settings.ReplaceSets[_set].Constants);
                            settings_1.mergeSettings(settings_1.Classes, settings.ReplaceSets[_set].Classes);
                            settings_1.mergeSettings(settings_1.Functions, settings.ReplaceSets[_set].Functions);
                        }
                        else {
                            console.error(" Unknown Set '" + _set + "'");
                        }
                    }
                }
            }
            if (settings.Translate.InsertComments !== undefined) {
                settings_1.InsertComments = settings.Translate.InsertComments;
            }
            if (settings.Translate.LocalVariableNamePre !== undefined) {
                settings_1.LocalVariableNamePre = settings.Translate.LocalVariableNamePre;
            }
            if (settings.Translate.LocalVariableNamePost !== undefined) {
                settings_1.LocalVariableNamePost = settings.Translate.LocalVariableNamePost;
            }
        }
    };
    settings_1.mergeSettings = function (base, source) {
        if (source === undefined) {
            return;
        }
        for (var key in source) {
            base[key] = source[key];
        }
    };
})(settings || (settings = {}));
module.exports = settings;
//# sourceMappingURL=php2ts-settings.js.map