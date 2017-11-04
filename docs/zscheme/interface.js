Interface = {};

var is_node = typeof require !== "undefined";
if (is_node){
    module.exports = Interface;
    var ZLexer = require("./lexer.js");
    var Exr = require("./external_representations");
    var Expand = require("./expand");
    var Array_man = require("./array_man");
    var Compile = require("./compile.js");
    var Pachycephalo = require("./pachycephalo");
    var Pachycephalo_Code = require("./pachycephalo_code");
}

Interface.exports = [];


Interface.run_lex = function(){
    var ret = [];
    while (true){
        var v = ZLexer.lex();
        if (v === null){
            break;   
        }
        if (v){
            ret.push(v);
        }
    }
    return ret;
}


Interface.print_error = function(x){}
if (is_node){
    Interface.print_error = function(x){
        console.error("ERROR:::"+x);
    }
}




Interface.load_excode = function(name){
    var fs = require("fs");
    var exobj = JSON.parse(fs.readFileSync("./" + name + ".json","utf8"));   
    Interface.exports.push([name,exobj]);
}




Interface.node_read_file = function(filename){
    var fs = require("fs");
    var text = null;
    try{
        text = fs.readFileSync(filename);
    }catch(e){
        return -1;
    }


    ZLexer.input = text.toString();
    ZLexer.filename = filename;
    var tokens = Interface.run_lex();

    var exps = null;
    try {
        exps = Exr.convert_external_representation(tokens,true,false);
    }catch(e){
        if (e && typeof e == "object" && e.type == Zutsuki.TYPE_ERROR){
            Interface.print_error(e.message);

        }else{
            console.error("???ERROR",e);
        }
        return -1;
    }
    return exps;
}


Interface.read_line = function(code,reread){
    ZLexer.set_input(code);
    ZLexer.filename = "";
    var tokens = Interface.run_lex();
    var exps = null;
    try {
        if (reread){
            exps = Exr.convert_external_representation(tokens,true,true,reread.atom_and_container_objects,reread.parentheses_stack);
        }else{
            exps = Exr.convert_external_representation(tokens,true,true);
        }

    }catch(e){
        if (e && typeof e == "object" && e.type == Zutsuki.TYPE_ERROR){
            Interface.print_error(e.message);
        }else{
            console.error("???ERROR",e);
        }
        return -1;
    }
    return exps;
}




Interface.library_expand = function(name,code,env,const_code,library_codes){
    var export_symbols = env.export_symbols;
    
    for (var i=0;i<code.length;i++){
        if (code[i][0] == "import"){
            code[i][0] = "import-with-export";
            var new_code = [0,0];
            for (var j=1;j<code[i].length;j++){
                new_code.push(code[i][j]);
            }
            code[i][1] = export_symbols;
            for (var j=2;j<new_code.length;j++){
                code[i][j] = new_code[j];
            }
        }
    }
    
    array_man_data = Array_man.phase1(code,env,const_code[0]);
    var array_man_code = array_man_data[0];
    var array_man_const = array_man_data[1];


    var aman_code = Array_man.library_tuning(name,array_man_code,const_code[0],array_man_const,export_symbols);

    //ライブラリのconst_dataをマージする
    for (var i=const_code[0]+1;i<array_man_const[0]+1;i++){
        const_code[i] = array_man_const[i];
    }
    const_code[0] = array_man_const[0];

    library_codes.push(aman_code);
    
    //aman_code.push(env.export_symbols);
}




Interface.node_export_code = function(input_file,output_file){
    var exps = Interface.node_read_file(input_file);
    if (exps == -1){
        return -1;
    }
    {

        var array_man1 = [];
        var env1 = Expand.create_default_env();
     

        ///*  
        for (var i=0;i<exps.length;i++){
            var a = Expand.expand(exps[i],env1);
            array_man1.push(a);
        }
        //*/

        /*
        try {
            for (var i=0;i<exps.length;i++){
                var a = Expand.expand(exps[i],env1);
                array_man1.push(a);
                console.log("A",a);
            }
        }catch(e){
            if (typeof e == "object"){
                var message = Zutsuki.zerror2string(e);
                Interface.print_error(message);
            }else{
                console.error("???ERROR",e);   
            }
            return -1;
        }
        */
    }
    
    var array_man_data = Array_man.phase1(array_man1,env1,0);
    var array_man_const = array_man_data[1];
    var array_man_code = array_man_data[0];
    
    var library_codes = [];
    if (env1.library.length>0){
        for (var i=0;i<env1.library.length;i++){
            Interface.library_expand(env1.library[i][0],env1.library[i][2],env1.library[i][1],array_man_const,library_codes);
        }
    }

    var new_code = [];
    for (var i=0;i<library_codes.length;i++){
        new_code.push(library_codes[i]);
    }
    for (var i=0;i<array_man_code.length;i++){
        if (array_man_code[i]){
            new_code.push(array_man_code[i]);
        }
    }

    var exs = Pachycephalo_Code.const_shift(array_man_const,Interface.exports);
    env1.exs = exs;


    compiled_code = Compile.compile(new_code,array_man_const,env1);
    var compiled_const_code = [array_man_const[0]+1];

    for (var i=1;i<array_man_const[0]+1;i++){
        var ccd = Compile.compile_one(array_man_const[i],array_man_const,env1);
        compiled_const_code.push(ccd);
    }


    for (var i=1;i<compiled_const_code[0];i++){
        if (compiled_const_code[i].type == Pachycephalo.TYPE_ENVIRONMENT){
            compiled_const_code[i].const_data = compiled_const_code;
        }    
    }

    var et = Pachycephalo_Code.export("test",compiled_code,compiled_const_code);
    if (!output_file){
        console.log(et); 
    }else{
    
    }
}





Interface.node_run_from_file2 = function(filename){
    var exps = Interface.node_read_file(filename);
    if (exps == -1){
        return -1;
    }
    {

        var array_man1 = [];
        var env1 = Expand.create_default_env();
     

        /*  
        for (var i=0;i<exps.length;i++){
            var a = Expand.expand(exps[i],env1);
            array_man1.push(a);
        }
        */

        try {
            for (var i=0;i<exps.length;i++){
                var a = Expand.expand(exps[i],env1);
                array_man1.push(a);
            }
        }catch(e){
            if (typeof e == "object"){
                var message = Zutsuki.zerror2string(e);
                Interface.print_error(message);
            }else{
                console.error("???ERROR",e);   
            }
            return -1;
        }
    }
    
    var array_man_data = Array_man.phase1(array_man1,env1,0);
    var array_man_const = array_man_data[1];
    var array_man_code = array_man_data[0];
    
    var library_codes = [];
    if (env1.library.length>0){
        for (var i=0;i<env1.library.length;i++){
            Interface.library_expand(env1.library[i][0],env1.library[i][2],env1.library[i][1],array_man_const,library_codes);
        }
    }

    var new_code = [];
    for (var i=0;i<library_codes.length;i++){
        new_code.push(library_codes[i]);
    }
    for (var i=0;i<array_man_code.length;i++){
        if (array_man_code[i]){
            new_code.push(array_man_code[i]);
        }
    }

    var exs = Pachycephalo_Code.const_shift(array_man_const,Interface.exports);
    env1.exs = exs;


    compiled_code = Compile.compile(new_code,array_man_const,env1);
    var compiled_const_code = [array_man_const[0]+1];

    for (var i=1;i<array_man_const[0]+1;i++){
        var ccd = Compile.compile_one(array_man_const[i],array_man_const,env1);
        compiled_const_code.push(ccd);
    }


    for (var i=1;i<compiled_const_code[0];i++){
        if (compiled_const_code[i].type == Pachycephalo.TYPE_ENVIRONMENT){
            compiled_const_code[i].const_data = compiled_const_code;
        }    
    }

    /*
    var et = Pachycephalo_Code.export("test",compiled_code,compiled_const_code);
    console.log(et);
    throw "exit";
    */
    
    var env = Pachycephalo.create_zutsuki_zero_env(compiled_const_code);

    Pachycephalo.vm(compiled_code,[env,[],env]);
}







Interface.node_repl = function(){
    {
        //message
        console.log("Zutsuki-Scheme-repl");
        console.log("Copyright (c) Niyarin 2017");
    }


    var env1 = Expand.create_default_env();
    var const_data = {0:0};
    var compiled_const_data = [0];
    var last_const_index = 1;
    var pachycephalo_env_a = [Pachycephalo.create_zutsuki_zero_env(compiled_const_data),[],null];
    pachycephalo_env_a[2] = pachycephalo_env_a[0];
    
    var used_libraries = {};
    {
        //read loop
        var reader = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        reader.setPrompt(">> ");
        reader.prompt();


        var reread = null;
        reader.on('line', function(line) {
            var exps = Interface.read_line(line + "\n",reread);
            if (!Array.isArray(exps)){
                if (exps.type == Zutsuki.TYPE_REREAD){
                    reread = exps;
                    reader.setPrompt("... ");
                    reader.prompt();
                    return;
                }
            }
            reread = null;
            reader.setPrompt(">> ");

            if (exps.length == 0){
                return;
            }


            var array_man1 = [];
            {
                    try {
                        for (var i=0;i<exps.length;i++){
                            var a = Expand.expand(exps[i],env1);
                            array_man1.push(a);
                        }
                    }catch(e){
                        if (typeof e == "object"){
                            var message = Zutsuki.zerror2string(e);
                            Interface.print_error(message);
                        }else{
                            console.error("???ERROR",e);   
                            throw "?";
                        }
                    }
            }
            var array_man_data = Array_man.phase1(array_man1,env1,0,const_data);

            const_data = array_man_data[1];
            var array_man_code = array_man_data[0];

            {
                //libraryの後処理
                var library_codes = [];
                if (env1.library.length>0){
                    for (var i=0;i<env1.library.length;i++){
                        if (env1.library[i][3]){
                        Interface.library_expand(env1.library[i][0],env1.library[i][2],env1.library[i][1],const_data,library_codes);
                            env1.library[i][3] = false;
                        }
                    }
                }

                var new_code = [];
                for (var i=0;i<library_codes.length;i++){
                    new_code.push(library_codes[i]);
                }
                for (var i=0;i<array_man_code.length;i++){
                    if (array_man_code[i]){
                        new_code.push(array_man_code[i]);
                    }
                }
            }
            
            var res_init = [];
            {
                //各exportsに対して一度だけ行えるようにしたい
                var exs = Pachycephalo_Code.const_shift(const_data,Interface.exports);//アドレスをシフトさせる
                env1.exs = exs;
                

                for (var i=0;i<exs.length;i++){
                    if (!used_libraries[exs[i][0]]){
                        for (var j=0;j<exs[i][1].length;j++){
                            res_init.push(exs[i][1][j]);
                        }
                        used_libraries[exs[i][0]] = true;
                    }
                }
                if (!res_init.length){
                    res_init = false;
                }
            }



            compiled_code = Compile.compile(new_code,const_data,env1,res_init);

            for (var i=last_const_index;i<const_data[0]+1;i++){
                var ccd = Compile.compile_one(const_data[i],const_data,env1);
                compiled_const_data.push(ccd);
                compiled_const_data[0]++;
            }
            
            last_const_index = const_data[0]+1;

            for (var i=1;i<compiled_const_data[0]+1;i++){
                if (compiled_const_data[i] && compiled_const_data[i].type == Pachycephalo.TYPE_ENVIRONMENT){
                    compiled_const_data[i].const_data = compiled_const_data;
                }    
            }


            {
                //repl用のみexportsをリセットする
                env1.exs = [];
                Interface.exports = [];
            }

            Pachycephalo.vm(compiled_code,pachycephalo_env_a);

            reader.prompt();
        });
    }

}


Interface.node_argparse = function(argv){
    var res = {"run_mode":"normal",
               "file_name":null,
               "output_filename":null};

    if (argv.length == 2){
        res["run_mode"] = "repl";
    }else if (argv.length == 3){
        res["file_name"] = argv[2];
    }else {
        var i=2;
        while (i<argv.length){
            if (argv[i] == "-exlib"){
               res["run_mode"] = "exlib";
            }else if (argv[i] == "-o"){
                if (i+1 >= argv.length ){
                    throw "error:no output file !";
                }
                res["output_filename"] = argv[i+1];
                i++;
            }else {
                res["file_name"] = argv[i];
            }
            i++;
        }
    }
    return res;
}





Interface.node_main = function(){
    var option = Interface.node_argparse(process.argv);
    if (option["run_mode"] == "repl"){
        Interface.node_repl();
    }else if (option["run_mode"] == "normal"){
        var filename = option["file_name"];
        Interface.node_run_from_file2(filename);
    }else if (option["run_mode"] == "exlib"){
        if (option["file_name"]){
            Interface.node_export_code(option["file_name"]);
        }
    }
}




//
//
// Brower 
//
//




Interface.Repl = function(){
    this.input_fun = null;
}


Interface.repl_create = function(){
    var res = new Interface.Repl();



    var env1 = Expand.create_default_env();
    var const_data = {0:0};
    var compiled_const_data = [0];
    var last_const_index = 1;
    var pachycephalo_env_a = [Pachycephalo.create_zutsuki_zero_env(compiled_const_data),[],null];
    pachycephalo_env_a[2] = pachycephalo_env_a[0];
    var used_libraries = {};
    var reread = null;

    res.input_fun = function(line){
        var exps = Interface.read_line(line + "\n",reread);
        if (!Array.isArray(exps)){
            if (exps.type == Zutsuki.TYPE_REREAD){
                reread = exps;

                return [["set-prompt","... "]];
            }
        }

        if (exps.length == 0){
            return [];
        }

        reread = null;

        var array_man1 = [];
        {
                try {
                    for (var i=0;i<exps.length;i++){
                        var a = Expand.expand(exps[i],env1);
                        array_man1.push(a);
                    }
                }catch(e){
                    if (typeof e == "object"){
                        var message = Zutsuki.zerror2string(e);
                        Interface.print_error(message);//console用
                        return [["error",message]];
                    }else{
                        console.error("???ERROR",e);   
                        throw [];
                    }
                }
        }      

        var array_man_data = Array_man.phase1(array_man1,env1,0,const_data);
        const_data = array_man_data[1];
        var array_man_code = array_man_data[0];


        {
            //libraryの後処理
            var library_codes = [];
            if (env1.library.length>0){
                for (var i=0;i<env1.library.length;i++){
                    if (env1.library[i][3]){
                    Interface.library_expand(env1.library[i][0],env1.library[i][2],env1.library[i][1],const_data,library_codes);
                        env1.library[i][3] = false;
                    }
                }
            }

            var new_code = [];
            for (var i=0;i<library_codes.length;i++){
                new_code.push(library_codes[i]);
            }
            for (var i=0;i<array_man_code.length;i++){
                if (array_man_code[i]){
                    new_code.push(array_man_code[i]);
                }
            }
        }
        
        var res_init = [];
        {
            //各exportsに対して一度だけ行えるようにしたい
            var exs = Pachycephalo_Code.const_shift(const_data,Interface.exports);//アドレスをシフトさせる
            env1.exs = exs;
            

            for (var i=0;i<exs.length;i++){
                if (!used_libraries[exs[i][0]]){
                    for (var j=0;j<exs[i][1].length;j++){
                        res_init.push(exs[i][1][j]);
                    }
                    used_libraries[exs[i][0]] = true;
                }
            }
            if (!res_init.length){
                res_init = false;
            }
        }



        compiled_code = Compile.compile(new_code,const_data,env1,res_init);

        for (var i=last_const_index;i<const_data[0]+1;i++){
            var ccd = Compile.compile_one(const_data[i],const_data,env1);
            compiled_const_data.push(ccd);
            compiled_const_data[0]++;
        }
        
        last_const_index = const_data[0]+1;

        for (var i=1;i<compiled_const_data[0]+1;i++){
            if (compiled_const_data[i] && compiled_const_data[i].type == Pachycephalo.TYPE_ENVIRONMENT){
                compiled_const_data[i].const_data = compiled_const_data;
            }    
        }


        {
            //repl用のみexportsをリセットする
            env1.exs = [];
            Interface.exports = [];
        }

        var vmres = Pachycephalo.vm(compiled_code,pachycephalo_env_a);
     

        return [["set-prompt",">>> "],vmres];
    }
    return res;
}
