declare module "jsonnet" {
    class Jsonnet {
        constructor();
        eval(code: string): any;
        evalFile(): any;
        destroy(): void;
    }
    export = Jsonnet;
}
