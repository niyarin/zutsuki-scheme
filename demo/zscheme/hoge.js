    const is_node = typeof require !== "undefined";
    if (is_node){
        module.exports = ZLexer;
        var Zutsuki = require("./zutsuki");
        var Exr = require("./external_representations");
        var Expand = require("./expand");
        var Array_man = require("./array_man");
        var Compile = require("./compile");
        var Pachycephalo = require("./pachycephalo");
    }


var ZLexer= {};
ZLexer.LIMIT = 94;
ZLexer.regex_list = [/^(\ |\t)/ , /^\n/ , /^#\(/ , /^\(/ , /^\)/ , /^\./ , /^\'/ , /^\`/ , /^,@/ , /^,/ , /^(([0-9]+))/ , /^(([a-zA-Z]|[0-9]|[-!$%&*+./:<=>?@^_~])+)/ , /^(#true|#false|#t|#f)/ , /^((#\\(alarm|backspace|delete|escape|newline|null|return|space|tab)|#\\x(([0-9]|[a-f])+)|#\\.))/ , /^(\".*\")/ , /^(((;.*\n)|(#\|(.|\n)*\|#)))/ , /^#([0-9]+)/ , /^#/ , ];
ZLexer.do_list = [function(ztext,zline){
    console.log("SP");
}, function(ztext,zline){
    console.log("NL");
}, function(ztext,zline){
    console.log("VECTOR-LP");
    return "#(";
}, function(ztext,zline){
    console.log("LP");   
    return "(";
}, function(ztext,zline){
    console.log("RP");
    return ")";
}, function(ztext,zline){
    console.log("DOT");   
    return ".";
}, function(ztext,zline){
    console.log("QUOTE");
    return "'";
}, function(ztext,zline){
    console.log("QQ");
    return "`";
}, function(ztext,zline){
    console.log("UNQUOTE SPLICING");   
    return ",@";
}, function(ztext,zline){
    console.log("UNQUOTE");
    return ",";
}, function(ztext,zline){
    console.log("NUMBER",ztext,zline);
    return new Zutsuki.Number(ztext,Zutsuki.NUMBER_TYPE_UNSIGNED_INTEGER);
}, function(ztext,zline){
    console.log("SYMBOL",ztext,zline);   
    return new Zutsuki.Symbol(ztext,zline,"FILE");
}, function(ztext,zline){
    console.log("BOOLEAN",ztext,zline);
    return new Zutsuki.Boolean(ztext);
}, function(ztext,zline){
    console.log("CHAR",ztext,zline);
    return new Zutsuki.Char(ztext);
}, function(ztext,zline){
    console.log("STRING",ztext,zline);
}, function(ztext,zline){
    console.log("COMMENT");
}, function(ztext,zline){
    console.log("DATUM LABEL",ztext);
    return new Zutsuki.Datum_label(parseInt(ztext.substr(1)));
}, function(ztext,zline){
    return "#";
}, ];
ZLexer.is_node = typeof require !== "undefined";
ZLexer.is_rhino = typeof load !== "undefined";

ZLexer.zprint = function(x){
    if (ZLexer.is_node){
        console.log(x);
    }else if (ZLexer.is_rhino){
        print(x);
    }else{
        console.log(x);
    }
}

  ZLexer.line = 1;
ZLexer.position = 0;

ZLexer.lex = function(){


    var tmp = "";
    var loop_counter = 0;

    var prev_match_index = -1;
    var end = ZLexer.input.length;
    
    while (true){
        
        var ctmp = tmp;
        var cline = ZLexer.line;

        var match_index = -1;
        var pos;

        for (pos=0;pos<ZLexer.LIMIT;pos++){
            if (pos+ZLexer.position == end){
                break;
            }
            var c = ZLexer.input[ZLexer.position+pos];
            ctmp += c;
            if (c == "\n"){
                cline++;
            }
            match_index = -1;
            for (var j=0;j<ZLexer.regex_list.length;j++){
                var ma = ctmp.match(ZLexer.regex_list[j]);
                if (ma){
                    if (ma[0] == ctmp){
                        match_index = j;
                        break;
                    }
                }
            }

            if (match_index != -1){
                break;
            }
        }
    


        if (match_index != -1 && ZLexer.position != end){
            tmp = ctmp;
            ZLexer.line = cline;
            ZLexer.position += pos+1;
        }else{
            if (loop_counter == 0){
                if (ZLexer.position == end){
                    break;
                }


                var c = ZLexer.input[ZLexer.position];
                if (c == "\n"){
                    ZLexer.line++;
                }
                ZLexer.zprint(c);
                ZLexer.position++;
                continue;
            }else{
                return ZLexer.do_list[prev_match_index](tmp,ZLexer.line);
            }
        }

        prev_match_index = match_index;
        loop_counter++;
    }
    return null;
}


//テスト
ZLexer.input = "(lambda (a b) (cons a b))";


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
    console.log(a);
    array_man1.push(a);
}

var array_man3 = Array_man.phase1(array_man1,env1);
var compiled_code = Compile.compile(array_man3[0],array_man3[1],array_man3[2]);

var const_data = array_man3[1];
for (var i=1;i<const_data[0]+1;i++){
    console.log("CONST_DATA=",const_data[i]);
    var compiled_const_data = Compile.compile([const_data[i]],array_man3[1],array_man3[2]);
}
console.log("CONSTS=",consts);
var env = new Pachycephalo.Environment(consts);
console.log(env);
//Pachycephalo.vm(compiled_code,env);





