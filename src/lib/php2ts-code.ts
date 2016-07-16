namespace code {
    type Code = {code:string|CodeArray,causeEval:boolean,commentOut:boolean};

    export class CodeArray extends Array<Code> {
        constructor(...items: Array<Code>) {
            super();
            this.append(items);
        }
        public push_(code:Code):void {
            if(code != null) {
                this.push(code);
            }
        }
        public append(args:CodeArray|Array<Code>):void {
            this.push.apply(this,args);
        }
    }

    export function codeNormal(code:string|CodeArray):Code {
        if(code === null || code === '') {
            return null;
        }
        return {code:code,causeEval:false,commentOut:false};
    }

    export function codeEval(code:string|CodeArray):Code {
        if(code === null || code === '') {
            return null;
        }
        return {code:code,causeEval:true,commentOut:false};
    }

    export function codeComment(code:string|CodeArray):Code {
        if(code === null || code === '') {
            return null;
        }
        return {code:code,causeEval:false,commentOut:true};
    }

    export function codeJoin(list:CodeArray[],delimiter:string):CodeArray {
        let code:CodeArray = new CodeArray();
        let first = true;
        for(let cb of list) {
            if(first) {
                first = false;
            } else {
                code.push(codeNormal(delimiter));
            }
            code.append(cb);
        }
        return code;
    }

    export function codeBuffer(...args:(string|Code|CodeArray)[]):CodeArray {
        let bf:CodeArray = new CodeArray();
        for(let code of args) {
            if(code === null) {
            } else if(typeof code === 'string') {
                if(code != '') {
                    bf.push({code:code,causeEval:false,commentOut:false});
                }
            } else if(code instanceof CodeArray) {
                bf.append(code);
            } else {
                bf.push(code);
            }
        }
        return bf;
    }

    export function cbDump(cb:CodeArray):string {
        let str = '[';
        for(let code of cb) {
            let subcode:string|CodeArray = code.code;
            let substr = '';
            if(typeof subcode === 'string') {
                substr = stringify(subcode);
            } else {
                substr = cbDump(subcode);
            }
            str += '{' + substr + ',' + code.causeEval + '}';
        }
        return str + ']';
    }

    /**
     * <string>code かつ causeEval:false のとき、結合する
     */
    export function cbFormat(cb:CodeArray):boolean|string {
        if(cb.length == 0) {
            return '';
        }
        let all = true;
        let str:any = cb[0].code;
        for(let key=cb.length - 1; key >= 0; key--) {
            if(cb[key] == null){
                cb.splice(key,1);
            }
        }
        for(let key=cb.length - 1; key >= 0; key--) {
            let code = cb[key];
            if(code.causeEval || code.commentOut) {
                all = false;
                continue;
            }
            let subcode:string|CodeArray = code.code;
            if(typeof subcode !== 'string') {
                let result = cbFormat(subcode);
                if(typeof result === 'string') {
                    code.code = result;
                } else {
                    all = false;
                    continue;
                }
            }
            if(key > 0) {
                if(cb[key-1].causeEval || cb[key-1].commentOut) {
                    continue;
                }
                if(typeof cb[key-1].code !== 'string') {
                    continue;
                }
                str = <string>cb[key-1].code + <string>code.code;
                cb[key-1].code = str;
                cb.splice(key,1);
            }
        }
        if(!all) {
            return false;
        }
        if(cb[0].causeEval || cb[0].commentOut) {
            return false;
        }
        if(typeof cb[0].code !== 'string') {
            return false;
        }
        return str;
    }

    export function cbExpand(cb:CodeArray,preCodeList?:string[]):string {
        let root = (preCodeList === undefined);
        if(root) {
            preCodeList = [];
        }
        cbFormat(cb);
        let str = cbExpandLoop(cb,preCodeList);
        if(root) {
            return preCodeList.join('') + str;
        }
        return str;
    }
    
    export function cbExpandLoop(cb:CodeArray,preCodeList:string[]):string {
        let str = '';
        for(let code of cb) {
            let substr = '';
            let subcode:string|CodeArray = code.code;
            if(typeof subcode === 'string') {
                substr = subcode;
            } else {
                substr = cbExpandLoop(subcode,preCodeList);
            }
            if(code.causeEval) {
                substr = 'eval(' + substr + ')';
            }
            if(code.commentOut) {
                substr = commentOut(substr);
            }
            str += substr;
        }
        return str;
    }
    
    let quote = "'";
    let escMap:any = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
    let escFunc = function (m:string) { quote='"'; return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1); };
    let escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;

    // from https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/JSON
    export let stringify = (str:string):string => {
        quote = "'";
        let result = str.replace(escRE, escFunc);
        return quote + result + quote;
    }

    function commentOut(code:string):string {
        let tmp = code.split("\n");
        return "\n//" + tmp.join("\n//") + "\n";
    }
}
export = code;
