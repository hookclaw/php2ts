var locutus = require('locutus');
var loc = locutus;
var run = function () {
    if (process.argv.length > 1) {
        switch (process.argv[2]) {
            case 'settings':
                settings();
                return;
            case 'list':
                list();
                return;
            case 'define':
                define();
                return;
        }
    }
    console.log('settings,list,define');
};
var settings = function () {
    var s = '';
    for (var key1 in loc) {
        if (key1 != 'php') {
            continue;
        }
        for (var key2 in loc[key1]) {
            for (var key3 in loc[key1][key2]) {
                if (s != '') {
                    s += ',\n';
                }
                var len = 21 - key3.length;
                var tab = '';
                while (len > 0) {
                    tab += '\t';
                    len -= 4;
                }
                s += '\t\t\t\t"' + key3 + '":' + tab + '{"cod":"' + key3 + '","mod":["' + key3 + '","locutus/' + key1 + '/' + key2 + '/' + key3 + '"]}';
            }
        }
    }
    console.log(s);
};
var list = function () {
    for (var key1 in loc) {
        for (var key2 in loc[key1]) {
            for (var key3 in loc[key1][key2]) {
                console.log(key1 + '\t' + key2 + '\t' + key3);
            }
        }
    }
};
var define = function () {
    console.log('/**');
    console.log(' * http://locutusjs.io');
    console.log(' */');
    console.log('');
    for (var key1 in loc) {
        for (var key2 in loc[key1]) {
            for (var key3 in loc[key1][key2]) {
                printSingle(loc, key1, key2, key3);
            }
        }
    }
    for (var key1 in loc) {
        for (var key2 in loc[key1]) {
            var modulename_1 = 'locutus/' + key1 + '/' + key2;
            printGroup(modulename_1, loc[key1][key2]);
        }
    }
    for (var key1 in loc) {
        var modulename_2 = 'locutus/' + key1;
        printGroup(modulename_2, loc[key1]);
    }
    var modulename = 'locutus';
    printGroup(modulename, loc);
};
var printSingle = function (loc, key1, key2, key3) {
    console.log('declare module "locutus/' + key1 + '/' + key2 + '/' + key3 + '" {');
    console.log('\tfunction ' + key3 + arg(loc, key1, key2, key3) + ':any;');
    console.log('\texport = ' + key3 + ';');
    console.log('}');
};
var printGroup = function (modulename, loc) {
    var s = [];
    var c = '';
    console.log('declare module "' + modulename + '" {');
    for (var key in loc) {
        var com = '';
        var tmp = replace(key);
        if (tmp == key) {
            s.push(key);
        }
        else {
            com = '// ';
            c += ' /* ,"' + key + '":' + tmp + ' */';
        }
        console.log('\t' + com + 'import ' + tmp + ' = require("' + modulename + '/' + key + '");');
    }
    console.log('\texport {' + s.join(',') + c + '};');
    console.log('}');
};
var replace = function (name) {
    if (name == 'var') {
        return 'Var';
    }
    return name.replace('-', '_');
};
var func = function (loc, key1, key2, key3) {
    return '"' + key3 + '":' + arg(loc, key1, key2, key3) + ' => any';
};
var ARG1 = "(...args:any[])";
var arg = function (loc, key1, key2, key3) {
    var src = loc[key1][key2][key3].toString();
    var mArguments = /[^a-zA-Z0-9_]arguments[^a-zA-Z0-9_]/;
    if (mArguments.test(src)) {
        return ARG1;
    }
    var mFunction = /^function [a-zA-Z0-9_]+\(/g;
    var result1 = mFunction.exec(src);
    if (result1 == null) {
        return ARG1;
    }
    var mFunction2 = /(\s*[,]?\s*[a-zA-Z0-9_]+)*\)/g;
    mFunction2.lastIndex = mFunction.lastIndex;
    var result12 = mFunction2.exec(src);
    var mParameter = /\s*[,]?\s*[a-zA-Z0-9_]+/g;
    var args = [];
    var i = 0;
    var result2;
    while ((result2 = mParameter.exec(result12[0])) != null) {
        args.push(result2[0] + '?:any');
        i++;
    }
    return '(' + args.join('') + ')';
};
run();
//# sourceMappingURL=locutus_print.js.map