const is_node = typeof require !== "undefined";
if (is_node){
    var ZLexer = require("./lexer.js");
    //var Zutsuki = require("./zutsuki");
    //var Exr = require("./external_representations");
    //var Expand = require("./expand");
    //var Array_man = require("./array_man");
    //var Compile = require("./compile.js");
    //var Pachycephalo = require("./pachycephalo");
    var Interface = require("./interface.js");
}


ZLexer.input = "";
/*
function node_mode(){
    //コマンドライン引数でファイルを指定して、読み込む
    console.log("NODE MODE");
    var argv = process.argv;
    if (argv.length == 2){
        throw "no input file";
    }
    if (argv.length != 3){
        throw "args error";
    }

    var fname = argv[2];
    var fs = require("fs");

    var text = fs.readFileSync(fname);
    ZLexer.input = text.toString();
}


if (is_node){
    node_mode();   
}



function test_lex(){
    var ret = [];
    while (true){
        var v = ZLexer.lex();
        if (v === null){
            break;   
        }
        if (v){
            ret.push(v);
            console.log(v);
        }
    }
    return ret;
}


var exps = Exr.convert_external_representation(test_lex(),true);

var env1 = Expand.create_default_env();
var array_man1 = [];
for (var i=0;i<exps.length;i++){
    var a = Expand.expand(exps[i],env1);
    array_man1.push(a);
}

var array_man_data = Array_man.phase1(array_man1,env1);
// 0:arrayman3-code
// 1:const-data
// 2:environment



var compiled_code = null;
var compiled_const_code = [];

{
    //COMPILE SCM-MAIN to VM-CODE
    compiled_code = Compile.compile(array_man_data[0],array_man_data[1],array_man_data[2]);

    console.log(compiled_code);
}

{
    compiled_const_code.push(array_man_data[1][0]+1);
    //COMPILE CONST-CODE to VMCODE   
    for (var i=1;i<array_man_data[1][0]+1;i++){
        console.log("TGT=",array_man_data[1][i]);
        //var ccd = Compile.compile([array_man_data[1][i]],array_man_data[1],array_man_data[2]);
        var ccd = Compile.compile_one(array_man_data[1][i],array_man_data[1],array_man_data[2]);
        compiled_const_code.push(ccd);
    }

}

{
    //RUN   
    console.log("RUN..");
    console.log(compiled_code);
    //console.log(compiled_const_code);
    var env = new Pachycephalo.Environment(compiled_const_code);
    Pachycephalo.vm(compiled_code,env);
}
*/

Interface.node_main();
