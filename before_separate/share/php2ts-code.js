"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var code;
(function (code_1) {
    var CodeArray = (function (_super) {
        __extends(CodeArray, _super);
        function CodeArray() {
            var items = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                items[_i - 0] = arguments[_i];
            }
            _super.call(this);
            this.append(items);
        }
        CodeArray.prototype.push_ = function (code) {
            if (code != null) {
                this.push(code);
            }
        };
        CodeArray.prototype.append = function (args) {
            this.push.apply(this, args);
        };
        return CodeArray;
    }(Array));
    code_1.CodeArray = CodeArray;
    function codeNormal(code) {
        if (code === null || code === '') {
            return null;
        }
        return { code: code, causeEval: false, commentOut: false };
    }
    code_1.codeNormal = codeNormal;
    function codeEval(code) {
        if (code === null || code === '') {
            return null;
        }
        return { code: code, causeEval: true, commentOut: false };
    }
    code_1.codeEval = codeEval;
    function codeComment(code) {
        if (code === null || code === '') {
            return null;
        }
        return { code: code, causeEval: false, commentOut: true };
    }
    code_1.codeComment = codeComment;
    function codeJoin(list, delimiter) {
        var code = new CodeArray();
        var first = true;
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var cb = list_1[_i];
            if (first) {
                first = false;
            }
            else {
                code.push(codeNormal(delimiter));
            }
            code.append(cb);
        }
        return code;
    }
    code_1.codeJoin = codeJoin;
    function codeBuffer() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var bf = new CodeArray();
        for (var _a = 0, args_1 = args; _a < args_1.length; _a++) {
            var code_2 = args_1[_a];
            if (code_2 === null) {
            }
            else if (typeof code_2 === 'string') {
                if (code_2 != '') {
                    bf.push({ code: code_2, causeEval: false, commentOut: false });
                }
            }
            else if (code_2 instanceof CodeArray) {
                bf.append(code_2);
            }
            else {
                bf.push(code_2);
            }
        }
        return bf;
    }
    code_1.codeBuffer = codeBuffer;
    function cbDump(cb) {
        var str = '[';
        for (var _i = 0, cb_1 = cb; _i < cb_1.length; _i++) {
            var code_3 = cb_1[_i];
            var subcode = code_3.code;
            var substr = '';
            if (typeof subcode === 'string') {
                substr = code_1.stringify(subcode);
            }
            else {
                substr = cbDump(subcode);
            }
            str += '{' + substr + ',' + code_3.causeEval + '}';
        }
        return str + ']';
    }
    code_1.cbDump = cbDump;
    function cbFormat(cb) {
        if (cb.length == 0) {
            return '';
        }
        var all = true;
        var str = cb[0].code;
        for (var key = cb.length - 1; key >= 0; key--) {
            if (cb[key] == null) {
                cb.splice(key, 1);
            }
        }
        for (var key = cb.length - 1; key >= 0; key--) {
            var code_4 = cb[key];
            if (code_4.causeEval || code_4.commentOut) {
                all = false;
                continue;
            }
            var subcode = code_4.code;
            if (typeof subcode !== 'string') {
                var result = cbFormat(subcode);
                if (typeof result === 'string') {
                    code_4.code = result;
                }
                else {
                    all = false;
                    continue;
                }
            }
            if (key > 0) {
                if (cb[key - 1].causeEval || cb[key - 1].commentOut) {
                    continue;
                }
                if (typeof cb[key - 1].code !== 'string') {
                    continue;
                }
                str = cb[key - 1].code + code_4.code;
                cb[key - 1].code = str;
                cb.splice(key, 1);
            }
        }
        if (!all) {
            return false;
        }
        if (cb[0].causeEval || cb[0].commentOut) {
            return false;
        }
        if (typeof cb[0].code !== 'string') {
            return false;
        }
        return str;
    }
    code_1.cbFormat = cbFormat;
    function cbExpand(cb, preCodeList) {
        var root = (preCodeList === undefined);
        if (root) {
            preCodeList = [];
        }
        cbFormat(cb);
        var str = cbExpandLoop(cb, preCodeList);
        if (root) {
            return preCodeList.join('') + str;
        }
        return str;
    }
    code_1.cbExpand = cbExpand;
    function cbExpandLoop(cb, preCodeList) {
        var str = '';
        for (var _i = 0, cb_2 = cb; _i < cb_2.length; _i++) {
            var code_5 = cb_2[_i];
            var substr = '';
            var subcode = code_5.code;
            if (typeof subcode === 'string') {
                substr = subcode;
            }
            else {
                substr = cbExpandLoop(subcode, preCodeList);
            }
            if (code_5.causeEval) {
                substr = 'eval(' + substr + ')';
            }
            if (code_5.commentOut) {
                substr = commentOut(substr);
            }
            str += substr;
        }
        return str;
    }
    code_1.cbExpandLoop = cbExpandLoop;
    var quote = "'";
    var escMap = { '"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t' };
    var escFunc = function (m) { quote = '"'; return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1); };
    var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
    code_1.stringify = function (str) {
        quote = "'";
        var result = str.replace(escRE, escFunc);
        return quote + result + quote;
    };
    function commentOut(code) {
        var tmp = code.split("\n");
        return "\n//" + tmp.join("\n//") + "\n";
    }
})(code || (code = {}));
module.exports = code;
//# sourceMappingURL=php2ts-code.js.map