/*
 * zutsuki-lex  - lexical generator written in JavaScript
 * Copyright (c) 2017 Niyarin
 */



//処理系場合分け
const is_node = typeof require !== "undefined";
const is_rhino = typeof load !== "undefined";

var zprint = function(x){
    if (is_node){
        console.log(x);
    }else if (is_rhino){
        print(x);
    }else{
        console.log(x);
    }
}

//定数
const ZERROR = Object();

const GENERATE_TEXT = 'LIBNAME.is_node = typeof require !== "undefined";\nLIBNAME.is_rhino = typeof load !== "undefined";\n\nLIBNAME.zprint = function(x){\n    if (LIBNAME.is_node){\n        console.log(x);\n    }else if (LIBNAME.is_rhino){\n        print(x);\n    }else{\n        console.log(x);\n    }\n}\n\n  LIBNAME.line = 1;\nLIBNAME.position = 0;\n\nLIBNAME.lex = function(){\n\n\n    var tmp = "";\n    var loop_counter = 0;\n\n    var prev_match_index = -1;\n    var end = LIBNAME.input.length;\n    \n    while (true){\n        \n        var ctmp = tmp;\n        var cline = LIBNAME.line;\n\n        var match_index = -1;\n        var pos;\n\n        for (pos=0;pos<LIBNAME.LIMIT;pos++){\n            if (pos+LIBNAME.position == end){\n                break;\n            }\n            var c = LIBNAME.input[LIBNAME.position+pos];\n            ctmp += c;\n            if (c == "\\n"){\n                cline++;\n            }\n            match_index = -1;\n            for (var j=0;j<LIBNAME.regex_list.length;j++){\n                var ma = ctmp.match(LIBNAME.regex_list[j]);\n                if (ma){\n                    if (ma[0] == ctmp){\n                        match_index = j;\n                        break;\n                    }\n                }\n            }\n\n            if (match_index != -1){\n                break;\n            }\n        }\n    \n\n\n        if (match_index != -1 && LIBNAME.position != end){\n            tmp = ctmp;\n            LIBNAME.line = cline;\n            LIBNAME.position += pos+1;\n        }else{\n            if (loop_counter == 0){\n                if (LIBNAME.position == end){\n                    break;\n                }\n\n\n                var c = LIBNAME.input[LIBNAME.position];\n                if (c == "\\n"){\n                    LIBNAME.line++;\n                }\n                LIBNAME.zprint(c);\n                LIBNAME.position++;\n                continue;\n            }else{\n                return LIBNAME.do_list[prev_match_index](tmp,LIBNAME.line);\n            }\n        }\n\n        prev_match_index = match_index;\n        loop_counter++;\n    }\n    return null;\n}\n';







var error_reason = "";
var error_line = -1;

var option_env = {"ztext":"ztext","zline":"zline","zlib":"zlex"};


function parse_definition(text){
    var left = "";
    var right = "";
    
    var mode = 0;
    for (var i=0;i<text.length;i++){
        if (mode == 0){
            if (text[i] == " " || text[i] == "\t"){
                mode = 1;
            }else{
                left += text[i];
            }
        }else if (mode == 1){
            right += text[i];
        }

    }
    if (mode == 0){
        return ZERROR;
    }
    return [left,right];
}


function parse_zoption(text){
    var option_name = "";
    var arg = "";
    var no_arg = true;
    for (var i=0;i<text.length;i++){
        if (text[i] == " "){
            arg = text.substring(i+1);
            no_arg = false;
            break;
        }   
        option_name+= text[i];
    }

    if (option_env[option_name]){
        option_env[option_name] = arg;
    }else{
        return ZERROR;
    }
}





function parse_definitions(text){
    var line = 1;
    var error_flag = 1;
    var prev = "";
    var p;

    const GLOBAL_MODE = 1;
    const JS_MODE = 2;

    var js_code = [""];
    var zutsuki_code = [["",0]];
    var mode = GLOBAL_MODE;

    for (p=0;p<text.length-2;p++){
        if (mode == GLOBAL_MODE){
            var char_push = true;
            if (prev == "" || prev == "\n"){
                if (text[p] == "%" && text[p+1] == "%" && text[p+2] == "\n"){
                    error_flag = 0;
                    char_push = false;
                    break;
                }else if (text[p] == "%" && text[p+1] == "{" && text[p+2] == "\n"){
                    mode = JS_MODE;
                    p+=2;
                    char_push = false;
                }
            }

            if (text[p] == "\n"){
                zutsuki_code.unshift(["",0]);
                char_push = false;
            }

            if (char_push){
                zutsuki_code[0][1] = line;
                zutsuki_code[0][0] += text[p];
            }
        }else if (mode == JS_MODE){
            if (prev == "" || prev == "\n"){
                if (text[p] == "%" && text[p+1] == "}" && text[p+2] == "\n"){
                    mode = GLOBAL_MODE;
                    p+=2;
                    js_code.unshift("");
                }
            }
            js_code[0]+= text[p];
        }
        
        if (text[p] == "\n"){
            line++;
        }
        prev = text[p];
    }
    
    if (error_flag){
        error_reason = "premature EOF";
        error_line = line+1;
        return ZERROR;
    }

    
    var env = {};
    for (var i=0;i<zutsuki_code.length;i++){
        if (zutsuki_code[i][1]){
            var effective_char_flag = false;
            for (var j=0;j<zutsuki_code[i][0].length;j++){
                var c = zutsuki_code[i][0][j];
                if ((c != "\n" && c != " " && c != "\t")){
                    effective_char_flag = true;
                }
            }
            if (effective_char_flag){
                var lr = parse_definition(zutsuki_code[i][0]);
                if (lr == ZERROR){
                    error_line = line-1;
                    error_reason = "incomplete name definition.";
                    return ZERROR;
                }

                if (lr[0] == "%zoption"){
                    parse_zoption(lr[1]);
                }else{
                    env[lr[0]] = lr[1];
                }
            }
        }
    }
    
    var concatted_js_code =  "";
    for (var i=js_code.length-1;i>-1;i--){
        concatted_js_code+=js_code[i];
    }

    return [concatted_js_code,env,text.substring(p+3),line];
}




function expand_left(left,env){
    while (true){
        var read_end_flag = true;
        var p=0;
        var ret = "";
        var end = left.length;

        while (p<end){
            var c = left[p];
            if (c == "{"){
                var key = "";
                p++;
                while (p<end){
                    c = left[p];
                    if (c == "}"){
                        break;
                    }
                    key += c;
                    p++;
                }

                if (env[key]){
                    ret += "("+env[key]+")";
                }else{
                    return ZERROR;
                }
                read_end_flag = false;
            }else if (c == "\""){
                p++;
                ret += "\"";
                while (p<end){
                    c = left[p];
                    if (c == "\""){
                        break;
                    }
                    ret += c;
                    p++;
                }
                ret += "\"";
            }else{
                ret += c;
            }
            p++;
        }
        left = ret;


        if (read_end_flag){
            break;
        }

    }
    return ret;
}






function parse_rules(text,env,line){
    var p=0;
    var ptns = [[]];
    var body_mode = false;
    var prev = "";

    var left = "";
    var right = "";

    var right_top = "";
    var p_init = 0;
    while (p_init<text.length){
        if (text[p_init] != "\n"){
            break;
        }
        prev = "\n";
        line++;
        p_init++;
    }

    var is_string_literal = false;
    for (p=p_init;p<text.length-3;p++){
        if (body_mode){
            if (right_top == "{"){
                if (is_string_literal){
                    if (text[p] == "\""){
                        is_string_literal = 0;
                    }
                    right += text[p];
                }else{
                    if (prev == "\\"){
                        right += text[p];
                    }else if (text[p] == "\""){
                        is_string_listral = 1;
                        right += text[p];
                    }else if (text[p] == "}"){

                        right += text[p];
                        ptns[0].push(right);
                        right = "";
                        ptns.unshift([]);
                        body_mode = false;
                        p++;
                        while (p<text.length){
                            if (text[p] != "\n"){
                                break;   
                            }
                            line++;
                            p++;
                        }
                        line--;
                        
                        p--;

                    }else{
                        right += text[p];
                    }
                }
            }else{
                if (text[p] == "\n"){
                    ptns[0].push(right);
                    
                    right = "";
                    ptns.unshift([]);
                    body_mode = false;

                    while (p<text.length){
                        if (text[p] != "\n"){
                            break;
                        }
                        line++;
                        p++;
                    }

                    line--;
                    p--;
                }else{
                    right += text[p];
                }
            }
        }else{
            if (prev == "\\"){
                left += text[p];
            }else {
                if (text[p] == " "){
                    body_mode = true;
                    left = expand_left(left,env);
                    ptns[0].push(left);
                    left = "";
                    p++;
                    right_top = text[p];
                    ptns[0].push(text[p]);
                    p--;

                }else if (text[p] == "\n"){
                    error_line = line;
                    error_reason = "No lex action"
                    return ZERROR;
                }else if (text[p] == "%" && text[p+1] == "%" && text[p+2] == "\n" && prev == "\n"){
                    p+=3;
                    return [ptns,text.substring(p),line+1];
                }else{
                    left += text[p];
                }
            }
        }

        if (text[p] == "\n"){
            line++;
        }
        prev = text[p];
    }
    
}


function generate(rule_obj,head_code){
    var ptn_rules = rule_obj[0];

    var lname = option_env["zlib"];
    var ztext = option_env["ztext"];
    var zline = option_env["zline"];
    

    const regex_list_symbol  = lname + ".regex_list";
    const do_list_symbol = lname + ".do_list";
    
    var limit = 0;

    var reg_code = regex_list_symbol + " = [";
    var do_code = do_list_symbol + " = [";
    var namespace_code = "var " + lname + "= {};\n";
    for (var i=ptn_rules.length-1;i>0;i--){
        if (ptn_rules[i][1] == "{"){
            do_code += "function("+ztext+","+zline+")" + ptn_rules[i][2] + ", ";
        }else{
            do_code += "function("+ztext+","+zline+"){" + ptn_rules[i][2] + "} , ";      
        }
        reg_code += '/' + "^" + ptn_rules[i][0] + "/ , ";

        limit = ( ptn_rules[i][0].length > limit)?ptn_rules[i][0].length:limit;
    }
    reg_code += "];\n";
    do_code += "];\n";
    
    var gentext = GENERATE_TEXT;

    while (gentext.indexOf("LIBNAME",0) != -1){
        gentext = gentext.replace("LIBNAME",lname);
    }


    var limit_text = lname + ".LIMIT = " + limit + ";\n";
    var ret = namespace_code + head_code + limit_text + reg_code + do_code + gentext + "\n" + rule_obj[1];
    zprint(ret);
}






function parse(text){
    var def_obj = parse_definitions(text);
    if (def_obj == ZERROR){
        //zprint("ERROR!!");
        //zprint("line:"+error_line + " " + error_reason);
        throw  "line:"+error_line + " " + error_reason;
        return;
        //ERROR
    }

    var rule_obj = parse_rules(def_obj[2],def_obj[1],def_obj[3]+1);
    if (rule_obj == ZERROR){
        throw "line:" + error_line + " " + error_reason;
        return;
    }
    generate(rule_obj,def_obj[0]);

}


function node_mode(){
    var argv = process.argv;
    if (argv.length == 2){
        throw "no input file";
    }
    if (argv.length != 3){
        throw "args error";
    }

    var fname = argv[2];
    var fs = require("fs");
    fs.readFile(fname,"utf8",function (err,text){
        parse(text);
    });
}

function rhino_mode(){
    if (arguments.length == 0){
        zprint("no input file");
    }
    zprint("SORRY!");
}

if (is_node){
    node_mode();
}else if (is_rhino){
    rhino_mode();
}else{
    zprint("SORRY!\n");
}
