var ZLexer= {};
    var is_node = typeof require !== "undefined";
    if (is_node){
        module.exports = ZLexer;
        var Zutsuki = require("./zutsuki");
    }
    ZLexer.filename = "__filename__";

ZLexer.LIMIT = 94;
ZLexer.regex_list = [/^(\ |\t)/ , /^\n/ , /^#\(/ , /^\(/ , /^\)/ , /^\./ , /^\'/ , /^\`/ , /^,@/ , /^,/ , /^(((\+|-)?)([0-9]+))/ , /^((((\+|-)?)(([0-9]+)\.([0-9]+)))|(\+inf\.0|-inf\.0|\+nan\.0|-nan\.0))/ , /^(([a-zA-Z]|[0-9]|[-!$%&*+./:<=>?@^_~])+)/ , /^(#true|#false|#t|#f)/ , /^((#\\(alarm|backspace|delete|escape|newline|null|return|space|tab)|#\\x(([0-9]|[a-f])+)|#\\.))/ , /^(\".*?\")/ , /^(((;.*\n)|(#\|(.|\n)*\|#)))/ , /^#([0-9]+)/ , /^#/ , ];
ZLexer.do_list = [function(ztext,zline){
}, function(ztext,zline){
}, function(ztext,zline){
    return "#(";
}, function(ztext,zline){
    return "(";
}, function(ztext,zline){
    return ")";
}, function(ztext,zline){
    return ".";
}, function(ztext,zline){
    return "'";
}, function(ztext,zline){
    return "`";
}, function(ztext,zline){
    return ",@";
}, function(ztext,zline){
    return ",";
}, function(ztext,zline){
    return new Zutsuki.Number(ztext,Zutsuki.NUMBER_TYPE_UNSIGNED_INTEGER);
}, function(ztext,zline){
    return new Zutsuki.Number(ztext,Zutsuki.NUMBER_TYPE_REAL);
}, function(ztext,zline){
    return new Zutsuki.Symbol(ztext,zline,ZLexer.filename);
}, function(ztext,zline){
    return new Zutsuki.Boolean(ztext);
}, function(ztext,zline){
    return new Zutsuki.Char(ztext);
}, function(ztext,zline){
    return new Zutsuki.String(ztext.substr(1,ztext.length-2));
}, function(ztext,zline){
}, function(ztext,zline){
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
ZLexer.current_input = null;
ZLexer.old_input = null;
ZLexer.input = null;

ZLexer.set_input = function(input){
    ZLexer.input = input;
    ZLexer.old_input = null;
    ZLexer.current_input = null;
}




ZLexer.lex = function(){
    if (!ZLexer.old_input || ZLexer.old_input != ZLexer.input){
        ZLexer.old_input = ZLexer.input;
        ZLexer.current_input = ZLexer.old_input;
    }
    
    var input = ZLexer.current_input;
    var match_length = 0;
    var match_index = 0;
    var match_string = 0;
    while (input.length){
        for (var i=0;i<ZLexer.regex_list.length;i++){
            var ma = input.match(ZLexer.regex_list[i]);
            if (ma){
                if (match_length < ma[0].length){
                    match_length = ma[0].length;
                    match_index = i;
                    match_string = ma[0];
                }
            }
        }
        
        if (match_length){
            for (var i=0;i<match_length;i++){
                if (ZLexer.current_input[i] == "\n"){
                    ZLexer.line++;
                }
            }

            ZLexer.current_input = ZLexer.current_input.substring(match_length);
            return ZLexer.do_list[match_index](match_string,ZLexer.line);
        }
        
        if (ZLexer.current_input[0] == "\n"){
            ZLexer.line++;
        }

        ZLexer.current_input = ZLexer.current_input.substring(1);
        input = ZLexer.current_input;
    }

    
    
    return null;
}




