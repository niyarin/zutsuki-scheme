var Expand = {};

var is_node = typeof require !== "undefined";
if (is_node){
    module.exports = Expand;
    var Zutsuki = require("./zutsuki");
    var Macro = require("./macro");

}


//定数やタグ
Expand.BUILT_IN_FUNCTION = {0:"built-in"};
Expand.UNDEFINED_OBJECT = {0:"undefine-object"};
Expand.ELSE_SYMBOL = "ELSE SYMBOL";



Expand.syntax_error = function(syntax_name,code,reason){
    return [syntax_name,code,reason];
}



Expand.Expand_env = function(){
    this.name = "default";
    this.global = {};
    this.local = [];

    this.library = [];//define-libraryによってユーザが定義したライブラリや処理系に組み込んだライブラリを格納する

    this.core = Expand.core_environment();

    this.last_let = null;//内部defineとかでつかう?
    this.error = null;

    this.features = [];

    this.export_symbols = [];

    this.exs = null;
}



Expand.set_zutsuki_one = function(env){
    env.global["cons"] = Expand.BUILT_IN_FUNCTION;
    env.global["car"] = Expand.BUILT_IN_FUNCTION;
    env.global["cdr"] = Expand.BUILT_IN_FUNCTION;
    env.global["set-car!"] = Expand.BUILT_IN_FUNCTION;
    env.global["set-cdr!"] = Expand.BUILT_IN_FUNCTION;

    env.global["apply"] = Expand.BUILT_IN_FUNCTION;
    env.global["null?"] = Expand.BUILT_IN_FUNCTION;
    env.global["pair?"] = Expand.BUILT_IN_FUNCTION;

    env.global["+"] = Expand.BUILT_IN_FUNCTION;
    env.global["*"] = Expand.BUILT_IN_FUNCTION;
    env.global["-"] = Expand.BUILT_IN_FUNCTION;
    env.global["="] = Expand.BUILT_IN_FUNCTION;

    env.global["eqv?"] = Expand.BUILT_IN_FUNCTION;
 



    env.global["lambda"] = new Expand.Syntax.Lambda();
    env.global["let"] = new Expand.Syntax.Let();
    env.global["let*"] = new Expand.Syntax.Let_star();
    
    env.global["letrec"] = new Expand.Syntax.Letrec();

    env.global["define"] = new Expand.Syntax.Define();
   
    env.global["set!"] = new Expand.Syntax.Seti();

    env.global["define-record-type"] = new Expand.Syntax.Define_record_type();

    env.global["begin"] = new Expand.Syntax.Begin();

    env.global["syntax-rules"] = new Expand.Syntax.Syntax_rules();
    env.global["define-syntax"] = new Expand.Syntax.Define_syntax();
    env.global["let-syntax"] = new Expand.Syntax.Let_syntax();

    env.global["quote"] = new Expand.Syntax.Quote();
    env.global["quasiquote"] = new Expand.Syntax.Quasi_quote();

    env.global["if"] = new Expand.Syntax.If();


    env.global["import"] = new Expand.Syntax.Import();
    env.global["define-library"] = new Expand.Syntax.Define_library();

    env.global["cond-expand"] = new Expand.Syntax.Cond_expand();

    env.global["cond"] = new Expand.Syntax.Cond();
    env.global["and"] = new Expand.Syntax.And();
    env.global["or"] = new Expand.Syntax.Or();
    env.global["when"] = new Expand.Syntax.When();
    env.global["unless"] = new Expand.Syntax.Unless();

    env.global["let-values"] = new Expand.Syntax.Let_values();

}





Expand.set_r7rs_base = function(env){
    env.global["cons"] = Expand.BUILT_IN_FUNCTION;
    env.global["car"] = Expand.BUILT_IN_FUNCTION;
    env.global["cdr"] = Expand.BUILT_IN_FUNCTION;
    env.global["null?"] = Expand.BUILT_IN_FUNCTION;

    env.global["lambda"] = new Expand.Syntax.Lambda();
    env.global["let"] = new Expand.Syntax.Let();
    env.global["letrec"] = new Expand.Syntax.Letrec();

    env.global["define"] = new Expand.Syntax.Define();
   
    env.global["set!"] = new Expand.Syntax.Seti();

    env.global["define-record-type"] = new Expand.Syntax.Define_record_type();


    env.global["begin"] = new Expand.Syntax.Begin();

    env.global["syntax-rules"] = new Expand.Syntax.Syntax_rules();
    env.global["define-syntax"] = new Expand.Syntax.Define_syntax();
    env.global["let-syntax"] = new Expand.Syntax.Let_syntax();

    env.global["quote"] = new Expand.Syntax.Quote();

    env.global["if"] = new Expand.Syntax.If();
    
    env.global["import"] = new Expand.Syntax.Import();
    env.global["define-library"] = new Expand.Syntax.Define_library();
    env.global["cond-expand"] = new Expand.Syntax.Cond_expand();
}



Expand.core_environment = function(){
    const ret = {};
    ret["let"] = new Expand.Syntax.Let();
    ret["let*"] = new Expand.Syntax.Let_star();

    ret["letrec"] = new Expand.Syntax.Letrec();
    ret["begin"] = new Expand.Syntax.Begin();
    ret["lambda"] = new Expand.Syntax.Lambda();
    ret["set!"] = new Expand.Syntax.Seti();

    ret["if"] = new Expand.Syntax.If();
    ret["cond"] = new Expand.Syntax.Cond();
    ret["and"] = new Expand.Syntax.And();
    ret["or"] = new Expand.Syntax.Or();


    ret["let-values"] = new Expand.Syntax.Let_values();
    return ret;
}


Expand.search_from_env = function(symbol,env){
    for (var i=0;i<env.local.length;i++){
        for (var j=0;j<env.local[i].length;j++){

            if (env.local[i][j][0] == symbol){
                if (i>0 && env.local[i][0][2]){//外側のセルにアクセスした&そのセルはlet-syntaxで作られたものではないこと
                    for (var k=0;k<i;k++){
                        env.local[k][1][1] = 1;//外部アクセスフラグを立てる
                        env.local[k][2][1][env.local[i][j][0]] = true;
                    }
                }
                return env.local[i][j][1];   
            }

        }
    }
    
    var ret = env.global[symbol];
    if (ret === undefined){
        //error
    }

    return ret;
}

Expand.LOCAL_TAG_SIZE = 4;

Expand.push_local_env = function(env,cell){
    cell.unshift(["",0]);
    cell.unshift(["",{}]);//自由変数(index=2)
    cell.unshift(["",0]);//自由変数を含むTAG?(index=1)
    cell.unshift(["",0,true]);//破壊的変更用のTAG?(index=0)
    env.local.unshift(cell);
}

Expand.push_local_env_syntax = function(env,cell){
    cell.unshift(["",0]);
    cell.unshift(["",{}]);//自由変数(index=2)
    cell.unshift(["",0]);//自由変数を含むTAG?(index=1)
    cell.unshift(["",0,false]);//破壊的変更用のTAG?(index=0)
    env.local.unshift(cell);
}



Expand.pop_local_env = function(env){
    return env.local.shift();
}

Expand.is_local_environment = function(env){
    for (var i=0;i<env.local.length;i++){
        if (env.local[i][0][2]){
            return true;
        }
    }
    return false;
}



Expand.push_error_env = function(error,env){
    if (!env.error){
        env.error = error;
    }
}

Expand.check_assignment = function(symbol,env){
     for (var i=0;i<env.local.length;i++){
        if (env.local[i][0][2]){
            for (var j=0;j<env.local[i].length;j++){
                if (env.local[i][j][0] == symbol){
                    for (var k=0;k<i+1;k++){
                        env.local[k][0][1] = 1;
                    }
                    return 1;

                }
            }
        }
    }

    const tgt = env.global[symbol];
    if (tgt == Expand.BUILT_IN_FUNCTION){
        //importで読み込まれたシンボルに破壊的変更を加えることはエラー
        env.global[symbol] = Expand.UNDEFINED_OBJECT;
    }
    return 0;
}






Expand.check_proper_list = function(obj){
    //真性リスト:長さを返す その他:-1
    var cell = obj;
    var ret = 0;
    while (cell){
        if (cell && cell.type != Zutsuki.TYPE_PAIR){
            return -1;
        }
        ret++;
        cell = cell.cdr;
    }
    return ret;
}



Expand.expand_bodies = function(code,env){
    if (!code){
        //長さ0 未定義
        return Zutsuki.FALSE();
    }else if (!code.cdr){
        return Expand.expand(code.car,env);
    }else{
        var ncode1 = Zutsuki.ZP(env.core["begin"],code);
        var ncode2 = Zutsuki.ZP(env.core["let"],Zutsuki.ZP(null,Zutsuki.ZP(ncode1,null)));
        return Expand.expand(ncode2,env);
    }
}








Expand.Syntax = {};
Expand.Syntax.Lambda = function(){
    this.syntax_name = "lambda";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        //長さ3以上の真性リストかだけ調べる
        if (Expand.check_proper_list(code)>=3){
            return false;
        }
        return Expand.syntax_error("lambda",code,"?");
    }
    this.convert = function(code,env){
        var array_man_form = [];
        var array_man_else_form = null;
        
        {
            //formsをArray-man形式に変換する
            var cell = code.cdr.car;
            while (cell){
                if (cell && cell.type != Zutsuki.TYPE_PAIR){
                    if (cell.type == Zutsuki.TYPE_SYMBOL){
                        array_man_else_form = cell.data;
                        break;
                    }
                    throw "ERROR";
                }
                if (cell.car.type == Zutsuki.TYPE_SYMBOL){
                    array_man_form.push(cell.car.data);
                }else{
                    throw "ERR";
                }
                cell = cell.cdr;
            }
        }

        var filename = "";
        var line = -1;
        {
            var sym = code.car;
            if (sym.filename){
                filename = sym.filename;
                line = sym.line;
            }
        }


        const local_cell = [];
        {
            for (var i=0;i<array_man_form.length;i++){
                local_cell.push([array_man_form[i],Expand.UNDEFINED_OBJECT]);
            }
            if (array_man_else_form){
                local_cell.push([array_man_else_form,Expand.UNDEFINED_OBJECT]);
            }
        }


        //ENV PUSH
        Expand.push_local_env(env,local_cell);
        var body = Expand.expand_bodies(code.cdr.cdr,env);

        var destructive_flag = 0;
        var outside_access_flag = 0;
        const top_local = Expand.pop_local_env(env);

        if (top_local[0][1]){
            //破壊的変更を含むlambda
            destructive_flag = 1;
        }else if (top_local[1][1]){
            outside_access_flag = 1;
        }


        var unconditional_renaming = top_local[3][1];
        //ENV POP
        return ["lambda",array_man_form,array_man_else_form,body,destructive_flag,outside_access_flag,filename,line,unconditional_renaming];
    }
 
    /*
     *Array-man lambda
     *["lambda",[A1 ... ],ELSE,BODY,BREAK,DFLAG,OFLAG,FNAME,LINE,RENAME]
     *A1 ... 仮引数リスト 
     *ELSE 仮引数リストにマッチしきらなかった引数のリスト用
     *BODY 本体
     *DFLAG localに破壊的変更を含む作用があるか
     *OFLAG 外側へのアクセス
     *FNAME ファイル名
     *LINE 行数
     *RENAME 無条件でリネームする
     */
}


Expand.Syntax.Begin = function(){
    this.syntax_name = "begin";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        if (Expand.check_proper_list(code)>=1){
            return false;
        }
        return "ERROR";
    }

    this.convert = function(code,env){
        if (!code.cdr){
            return Zutsuki.FALSE();
        }else if (!code.cdr.cdr){
            return Expand.expand(code.cdr.car,env);
        }else{
            var ret
            if (Expand.is_local_environment(env)){
                ret = ["lbegin"];
                var cell = code.cdr;
                while (cell){
                    ret.push(Expand.expand(cell.car,env));
                    cell = cell.cdr;
                }
                return ret;
            }else{
                ret = ["gbegin"];
                var cell = code.cdr;
                while (cell){
                    ret.push(Expand.expand(cell.car,env));
                    cell = cell.cdr;
                }           
                return ret;
            }           
        }
        /*
         *Array-man begin
         *[BEGIN_TYPE,EXP ...]
         *BEGIN_TYPE トップレベル "gbegin" それ以外 "lbegin"
         *EXP 任意の式
         */

    }
}


Expand.Syntax.Cond_expand = function(){
    this.syntax_name = "cond-expand";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        return false;
    }


    this.check_feature_requirement = function(fr,code,env){
        if (fr.type == Zutsuki.TYPE_SYMBOL){
            if (fr.data == "else"){
                return true;
            }

            for (var i=0;i<env.features.length;i++){
                if (env.features[i] == fr.data){
                    return true;
                }
            }
            return false;
        }else if (fr.type == Zutsuki.TYPE_PAIR){
            if (fr.car.type == Zutsuki.TYPE_SYMBOL){
                if (fr.car.data == "and"){
                    var cell = fr.cdr;
                    while (cell){
                        if (!this.check_feature_requirement(cell.car,code,env)){
                            return false;
                        }
                        cell = cell.cdr;
                    }
                }else if (fr.car.data == "or"){
                    var cell = fr.cdr;
                    while (cell){
                        if (this.check_feature_requirement(cell.car,code,env)){
                            return true;
                        }
                        cell = cell.cdr;
                    }
                    
                }else if (fr.car.data == "not"){
                    if (fr.cdr){
                        return this.check_feature_requirement(fr.cdr.car,code,env);
                    
                    }
                }else if (fr.car.data == "library"){
                    return faqlse;
                }
            }
        }
        throw Zutsuki.generate_error_with_hint_object("syntax error cond-expand",code);
        return false;
    }

    this.convert = function(code,env){
        for (var i=1;i<code.length;i++){
            if (this.check_feature_requirement(code.car,code,env)){
                var res = [];
                if (env.local.length){
                    res.push("lbegin");
                }else{
                    res.push("gbegin");
                }
                var cell = code.cdr;
                while (cell){
                    ret.push(Expand.expand(cell.car,env));
                    cell = cell.cdr;
                }
                return res;
            }
        }
        return ["gbegin"];
    }
}


Expand.Syntax.Cond = function(){
    this.syntax_name = "cond";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        return false;
    }

    this.convert = function(code,env){
        var clause = code.cdr.car;
        if (clause.type != Zutsuki.TYPE_PAIR){
            throw Zutsuki.generate_error_with_hint_object("syntax error cond",code);
        }
        
        if (clause.car && clause.car.type == Zutsuki.TYPE_SYMBOL && clause.car.data == "else"){
            var res = Zutsuki.ZP(env.core["begin"],clause.cdr);
            return Expand.expand(res,env);
        }else if (!clause.cdr){
            //(<test>)
            if (code.cdr.cdr){
                var res =  Zutsuki.gencode([env.core["let"],[["tmp",clause.car]],[env.core["if"],"tmp","tmp",Zutsuki.ZP(env.core["cond"],code.cdr.cdr)]]);
                return Expand.expand(res,env);
            }else{
                return Expand.expand(clause,env);
            }
        }else if (clause.cdr && clause.cdr.car && clause.cdr.car.type == Zutsuki.TYPE_SYMBOL && clause.cdr.car.data == "=>" && clause.cdr.cdr){
            var last = Zutsuki.FALSE();
            if (code.cdr.cdr){
                last = Zutsuki.ZP(env.core["cond"],code.cdr.cdr);
            }
            var res = Zutsuki.gencode([env.core["let"],[["tmp",clause.car]],[env.core["if"],"tmp",[clause.cdr.cdr.car,"tmp"],last]]);
            return Expand.expand(res,env);
        }else{
            var last = Zutsuki.FALSE();
            if (code.cdr.cdr){
                last = Zutsuki.ZP(env.core["cond"],code.cdr.cdr);
            }
            var res = Zutsuki.gencode([env.core["if"],clause.car,Zutsuki.ZP(env.core["begin"],clause.cdr),last]);
            return Expand.expand(res,env);
        }
    }
    
}

Expand.Syntax.And = function(){
    this.syntax_name = "and";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        return false;
    }
    this.convert = function(code,env){
        if (code.cdr == null){
            return Zutsuki.TRUE();
        }else if (code.cdr.cdr == null){
            return code.cdr.car;
        }else{
            var res = Zutsuki.gencode([env.core["if"],code.cdr.car,Zutsuki.ZP(env.core["and"],code.cdr.cdr),Zutsuki.FALSE()]);
            return Expand.expand(res,env);
                
        }
    }
}


Expand.Syntax.Or = function(){
    this.syntax_name = "or";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        return false;
    }
    this.convert = function(code,env){
        if (code.cdr == null){
            return Zutsuki.FALSE();
        }else if (code.cdr.cdr == null){
            return code.cdr.car;
        }else{
            var res = Zutsuki.gencode([env.core["let"],[["x",code.cdr.car]],[env.core["if"],"x","x",Zutsuki.ZP(env.core["or"],code.cdr.cdr)]]);
            return Expand.expand(res,env);
                
        }
    }
}



Expand.Syntax.When = function(){
    this.syntax_name = "when";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        return false;
    }
    this.convert = function(code,env){
        var res = Zutsuki.gencode([env.core["if"],code.cdr.car,Zutsuki.ZP(env.core["begin"],code.cdr.cdr)]);
        return Expand.expand(res,env);
    }
}

Expand.Syntax.Unless = function(){
    this.syntax_name = "unless";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        return false;
    }
    this.convert = function(code,env){
        var res = Zutsuki.gencode([env.core["if"],code.cdr.car,Zutsuki.FALSE(),Zutsuki.ZP(env.core["begin"],code.cdr.cdr)]);
        return Expand.expand(res,env);
    }
}


Expand.Syntax.Let = function(){
    this.syntax_name = "let";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        if (Expand.check_proper_list(code)<=2){
            return Expand.syntax_error("let",code,"?");
        }
        return false;
    }

    this.convert = function(code,env){
        if (code.cdr.car && code.cdr.car.type == Zutsuki.TYPE_SYMBOL){
            var cell = code.cdr.cdr.car;

            var vars = Zutsuki.ZP(null,null);
            var inits = Zutsuki.ZP(null,null);
            var vars_top = vars;
            var inits_top = inits;

            while (cell){
                inits.cdr = Zutsuki.ZP(cell.car.cdr.car,null);
                inits = inits.cdr;
                vars.cdr = Zutsuki.ZP(cell.car.car,null);
                vars = vars.cdr;
                cell = cell.cdr;
            }
            vars = vars_top.cdr;
            inits = inits_top.cdr;
            var lmd = Zutsuki.ZP(env.core["lambda"],Zutsuki.ZP(vars,code.cdr.cdr.cdr));
            var letrec_init = Zutsuki.ZP(Zutsuki.ZP(code.cdr.car,Zutsuki.ZP(lmd,null)),null);
            var letrec = Zutsuki.ZP(env.core["letrec"],
                            Zutsuki.ZP(letrec_init,
                                Zutsuki.ZP(Zutsuki.ZP(code.cdr.car,inits),null)));
                
            return Expand.expand(letrec,env);
        }else{
            var bindings = code.cdr.car;
            var array_bindings = [];
            while (bindings){
                if (bindings.type != Zutsuki.TYPE_PAIR){
                    throw Zutsuki.generate_error_with_hint_object("syntax error let",code);
                }
                var binding = bindings.car;

                if (binding.type == Zutsuki.TYPE_PAIR && binding.cdr && binding.cdr.type == Zutsuki.TYPE_PAIR && !binding.cdr.cdr){
                    if (binding.car.type == Zutsuki.TYPE_SYMBOL){
                        array_bindings.push([binding.car.data,Expand.expand(binding.cdr.car,env)]);
                    }else if (binding.car.type == Zutsuki.TYPE_RENAMED_SYMBOL){
                        //内側に対してgensym
                        var renamed_symbol = binding.car;
                        var gensym = Expand.internal_gensym(renamed_symbol.org.data,code.cdr.cdr);
                        renamed_symbol.rename_flag = gensym;
                        array_bindings.push([gensym,Expand.expand(binding.cdr.car,env)]);
                    }else{
                        throw Zutsuki.generate_error_with_hint_object("syntax error let",code);
                    }
                }else{
                    throw Zutsuki.generate_error_with_hint_object("syntax error let",code);
                }
                bindings = bindings.cdr;
            }
            
            //環境用
           const local_cell = [];
            {
                for (var i=0;i<array_bindings.length;i++){
                    local_cell.push([array_bindings[i][0],Expand.UNDEFINED_OBJECT]);
                }
            }
            

            Expand.push_local_env(env,local_cell);
            var prev_ll = env.last_let;
            env.last_let = [local_cell,array_bindings];
            var body = Expand.expand_bodies(code.cdr.cdr,env);
            env.last_let = prev_ll;
            const top_local = Expand.pop_local_env(env);
           

            var destructive_flag = 0;
            var outside_access_flag = 0;
            if (top_local[0][1]){
                destructive_flag = 1;
            }else if (top_local[1][1]){
                outside_access_flag = 1;
            }

            var free_variables = Object.keys(top_local[2][1]);
            var unconditional_renaming = top_local[3][1];
            return ["let",array_bindings,body,destructive_flag,outside_access_flag,free_variables,unconditional_renaming];
        }
    }
}



Expand.Syntax.Let_star = function(){
    this.syntax_name = "let_star";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        return false;
    }
    this.convert = function(code,env){
        if (!code.cdr){
            throw Zutsuki.generate_error_with_hint_object("syntax error let*",code);
        }
        var bindings = code.cdr.car;
        var bodies = code.cdr.cdr;

        var res = null;


        if (!bindings.cdr){
            res = Zutsuki.ZP(env.core["let"],Zutsuki.ZP(bindings,bodies));
        }else if (bindings){
            res = Zutsuki.ZP(env.core["let"],
                    Zutsuki.ZP(Zutsuki.ZP(bindings.car,null),
                        Zutsuki.ZP(
                            Zutsuki.ZP(env.core["let*"],Zutsuki.ZP(bindings.cdr,bodies)),
                            null)));
        }else{
            res = Zutsuki.ZP(env.core["let"],
                Zutsuki.ZP(null,bodies));
        }
        return Expand.expand(res,env);
    }
}




Expand.Syntax.Letrec = function(){
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        return false;
    }

    this.convert = function(code,env){
       var bindings = code.cdr.car;
       var new_bindings = null;
       var allocates = [];
       while (bindings){
            var bind = bindings.car;
            if (bind.cdr.car.type == Zutsuki.TYPE_PAIR){

               //new_bindings.push([bindings.car.data,Zutsuki.FALSE()]);
               new_bindings = Zutsuki.ZP(Zutsuki.ZP(bind.car,Zutsuki.ZP(Zutsuki.FALSE(),null)),new_bindings);

               allocates.push([bind.car,bind.cdr.car]);
            }else{

               //new_bindings.push([bindings.car.data,bindings.cdr.car]);
               new_bindings = Zutsuki.ZP(Zutsuki.ZP(bind.car,Zutsuki.ZP(bind.cdr.car,null)),new_bindings);
            }
            bindings = bindings.cdr;   
       }

       //bindingsの順番が逆転するけど、set!の順番はそのままなので問題ない。

       
       var bodies = code.cdr.cdr;
       for (var i=allocates.length-1;i>-1;i--){
            seti_code = Zutsuki.ZP(env.core["set!"],Zutsuki.ZP(allocates[i][0],Zutsuki.ZP(allocates[i][1],null)));
            bodies = Zutsuki.ZP(seti_code,bodies);
       }
    
       var let_expression  = Zutsuki.ZP(env.core["let"],Zutsuki.ZP(new_bindings,bodies));


      return Expand.expand(let_expression,env);

    }
}



Expand.Syntax.Define_record_type = function(){
    this.syntax_name = "define-record-type";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        return false;
    }

    this.convert = function(code,env){
        const record_name = code.cdr.car.data;
        const unique_field = {};//フィールドの識別子 {識別子:id, ... }
        
        var field_arr = [];//フィールドの識別子をいれる
        var field_id = 1;

        var cell = code.cdr.cdr.car;//コンストラクタ部
        if (cell.type != Zutsuki.TYPE_PAIR){
            throw "ERR";
        }
        if (cell.car.type != Zutsuki.TYPE_SYMBOL){
            throw "ERR";
            //コンストラクタ名の確認
        }

        const constructor = cell.car.data;
        cell = cell.cdr;
        while (cell){
            if (cell.type != Zutsuki.TYPE_PAIR){
                throw "ERR";   
            }
            if (cell.car.type != Zutsuki.TYPE_SYMBOL){
                throw "ERR";
            }
            
            if (unique_field[cell.car.data]){
                //すでに登録済み
                throw "ERR";
            }

            unique_field[cell.car.data] = field_id;
            field_arr.push(cell.car.data);
            field_id++;
            cell = cell.cdr;
        }
        
        cell = code.cdr.cdr.cdr;//述語
        if (cell.car.type != Zutsuki.TYPE_SYMBOL){
            throw "ERR";
        }
        
        const predicate = cell.car.data;
        
        cell = cell.cdr;
        var ret_field = [];
        while (cell){
            if (cell.type != Zutsuki.TYPE_PAIR){
                throw "ERR";
            }
            if (cell.car.type != Zutsuki.TYPE_PAIR){
                throw "ERR";
            }
            
            var fname = cell.car.car.data;
            if (!unique_field[fname]){
                throw "ERR";
            }

            var fld = [];
            fld.push(cell.car.cdr.car.data);
            if (cell.car.cdr.cdr){
                fld.push(cell.car.cdr.cdr.car.data);
            }
            ret_field[unique_field[fname]-1] = fld;
            cell = cell.cdr;
        }
        var d_predicate = ["define",predicate,["lambda",["obj"],null,["record-predicate",record_name,new Zutsuki.Symbol("obj",0,"")],false,false,"",0,false]];

        var d_constructor_body = ["record-constructor",record_name];
        for (var i=0;i<field_arr.length;i++){
            d_constructor_body.push(new Zutsuki.Symbol(field_arr[i],0,""));
        }

        var d_constructor = ["define",constructor,["lambda",field_arr,null,d_constructor_body]];
        var res = [];
        res.push("gbegin");
        res.push(d_predicate);
        res.push(d_constructor);

        for (var i=0;i<ret_field.length;i++){
            if (ret_field[i].length == 1){
                var d_accessor = ["define",ret_field[i][0],["lambda",["obj"],null,
                    ["if",["record-predicate",record_name,new Zutsuki.Symbol("obj",0,"")],
                    ["record-access",record_name,i,new Zutsuki.Symbol("obj",0,"")],
                    ["error","It is not record-type:"+record_name,"NONAME",0],
                    ],
                        false,false,"",0,false]];
                res.push(d_accessor);


            }else if (ret_field[i].length == 2){
                var d_accessor = ["define",ret_field[i][0],["lambda",["obj"],null,
                    ["if",["record-predicate",record_name,new Zutsuki.Symbol("obj",0,"")],
                    ["record-access",record_name,i,new Zutsuki.Symbol("obj",0,"")],
                    ["error","It is not record-type:"+record_name,"NONAME",0],
                    ],
                        false,false,"",0,false]];
                res.push(d_accessor);


                var d_modifier = ["define",ret_field[i][1],["lambda",["obj","obj2"],null,
                    ["if",["record-predicate",record_name,new Zutsuki.Symbol("obj",0,"")],
                    ["record-modifier",record_name,i,new Zutsuki.Symbol("obj",0,""),new Zutsuki.Symbol("obj2",0,"")],
                    ["error","It is not record-type:"+record_name,"NONAME",0],
                    ],
                        false,false,"",0,false]];
                res.push(d_modifier);
            }else{
                throw Zutsuki.generate_error_with_hint_object("syntax-error define-record-type",code);
            }
        }
        return res;

    }
}




Expand.Syntax.Seti = function(){
    this.syntax_name = "set!";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        if (Expand.check_proper_list(code)== 3){
            return false;
        }
        return Expand.syntax_error("set!",code,"?");
    }

    this.convert = function(code,env){

        const variable = code.cdr.car.data;
        var body = code.cdr.cdr.car;
        body = Expand.expand(body,env);
        if (Expand.check_assignment(variable,env)){
            return ["lset!",variable,body];
        }else{
            return ["gset!",variable,body];
        }
    }
    /*
     * Array-man lset! , gset!
     * [set! VARIABLE BODY SCOPE]
     * VARIABLE 束縛対象
     * BODY 本体
     */
}


Expand.push_local_define = function(last_let,name){
    const env_let_cell = last_let[0];
    const array_man_let_cell = last_let[1];
    env_let_cell.push([name,Expand.UNDEFINED_OBJECT]);
    array_man_let_cell.push([name,Zutsuki.FALSE()]);
}


Expand.Syntax.Define = function(){
    this.syntax_name = "define";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        if (Expand.check_proper_list(code) >= 3){
            return false;
        }
        return Expand.syntax_error("define",code,"?");
    }

    this.convert = function(code,env){
        var variable,body;
        if (code.cdr.car.type == Zutsuki.TYPE_PAIR){
            variable = code.cdr.car.car.data;
            //variable はsymbolである必要がある。
            var form = code.cdr.car.cdr;
            var lmd = Zutsuki.ZP(env.core["lambda"],
                         Zutsuki.ZP(form,
                            code.cdr.cdr));

            body = Expand.expand(lmd,env);
            
            if (code.car.filename){
                if (body[0] == "function" || body[0] == "lambda"){
                    body[6] = code.car.filename;
                    body[7] = code.car.line;
                }
            }
        }else if (code.cdr.car.type == Zutsuki.TYPE_SYMBOL){
            variable = code.cdr.car.data;
            body = code.cdr.cdr.car;
            body = Expand.expand(body,env);
        }else{
            throw Zutsuki.generate_error_with_hint_object("syntax error",code);
        }

        if (Expand.is_local_environment(env)){
            Expand.push_local_define(env.last_let,variable);
            Expand.check_assignment(variable,env);//追加
            return ["lset!",variable,body];
        }
        Expand.check_assignment(variable,env);
        return ["define",variable,body];
    }
    /*
     * Array-man define
     */
}

Expand.Syntax.Define_syntax = function(){
    this.syntax_name = "define-syntax";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        if (Expand.check_proper_list(code) == 3){
            return false;
        }
        return Expand.syntax_error("define-syntax",code,"?");
    }
    this.convert = function(code,env){
        const variable = code.cdr.car.data;
        var syntax_data = Expand.expand(code.cdr.cdr.car,env);
        env.global[variable] = syntax_data;
        //return variable;
        return [];
    }
}


Expand.Syntax.Let_syntax = function(){
    this.syntax_name = "let-syntax";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        return false;   
    }
    this.convert = function(code,env){
        var bindings = [];
        var local_cell = [];
        {
            var cell = code.cdr.car;
            while (cell){
                if (cell.type != Zutsuki.TYPE_PAIR){
                    throw Zutsuki.generate_error_with_hint_object("let-syntax bindings  must be proper list",code);
                    break;
                }
                var sym = cell.car.car;
                var syntax = cell.car.cdr.car;
                var syntax_data = Expand.expand(syntax,env);
                
                if (syntax_data.type != Zutsuki.TYPE_SYNTAX){
                    throw Zutsuki.generate_error_with_hint_object("syntax-transformer required",cell.car);
                }

                bindings.push([sym.data,syntax_data]);
                local_cell.push([sym.data,syntax_data]);
                cell = cell.cdr;
            }
        }

        Expand.push_local_env_syntax(env,local_cell);
        var body = code.cdr.cdr.car;
        var array_man_body = Expand.expand(body,env);
        const top_local = Expand.pop_local_env(env);
        
        return array_man_body;
    }
}

Expand.Syntax.Let_values = function(){
    this.syntax_name = "let-values";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        return false;   
    }
    this.convert = function(code,env){
        var bodies = code.cdr.cdr;
        var bindings = code.cdr.car;
        
        if (!bindings){
            return Expand.expand(Zutsuki.ZP(new Zutsuki.Symbol("begin"),bodies),env);
        }else{
            var top_bind_args = bindings.car.car;
            var top_bind_body = bindings.car.cdr.car;

            var res = ["call-with-values"];
            var res1 = Expand.expand(Zutsuki.gencode(["lambda",[],top_bind_body]),env);
            var res2 = null;
            if (bindings.cdr){
                res2 = Expand.expand(Zutsuki.gencode(["lambda",top_bind_args,[env.core["let-values"],bindings.cdr,Zutsuki.ZP(new Zutsuki.Symbol("begin"),bodies)]]),env);
            }else{
                res2 = Expand.expand(Zutsuki.gencode(["lambda",top_bind_args,Zutsuki.ZP(new Zutsuki.Symbol("begin"),bodies)]),env);
            }
            res.push(res1);
            res.push(res2);
            return res;
        }
    }
}




Expand.Syntax.Syntax_rules = function(){
    this.syntax_name = "syntax-rules";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        return false;
    }

    this.convert = function(code,env){
        
        var copied_local = [];
        for (var i=0;i<env.local.length;i++){
            copied_local.push(env.local[i]);
        }

        var rules = Macro.create_syntax_rules(code);
        return new Expand.Syntax.Rules_wrapper(rules,code,env.global,copied_local);
    }
}

Expand.Syntax.If = function(){
    this.syntax_name = "if";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        if (Expand.check_proper_list(code)<=2){
            return Expand.syntax_error("if",code,"?");
        }
        return false;
    }

    this.convert = function(code,env){
        const test_code = Expand.expand(code.cdr.car,env);
        const true_case_code = Expand.expand(code.cdr.cdr.car,env);
        var false_case_code = Zutsuki.FALSE();
        if (code.cdr.cdr.cdr){
            false_case_code = Expand.expand(code.cdr.cdr.cdr.car,env);
        }
        const ret = ["if",test_code,true_case_code,false_case_code];
        return ret;
    }
}




Expand.Syntax.Quote = function(){
    this.syntax_name = "quote";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        return false;
    }

    this.convert = function(code,env){
        return ["quote",code.cdr.car];
    }
}




Expand.Syntax.Quasi_quote = function(){
    this.syntax_name = "quasiquote";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        if (code.cdr && code.cdr.type == Zutsuki.TYPE_PAIR){
            return false;
        }
        return Expand.syntax_error("quasiquote",code,"?");
    }
    
    this.convert = function(code,env){
        var qq_template = code.cdr.car;
     
        var res = ["quasiquote",this.qq_expand(qq_template,env)];
        return res;
    }

    this.qq_expand = function(code,env){
        if (code.type == Zutsuki.TYPE_PAIR){
            var opecode = code.car;
            if (opecode.data == "unquote"){
                if (code.cdr && code.cdr.type == Zutsuki.TYPE_PAIR){
                    return ["unquote",Expand.expand(code.cdr.car,env)];
                }else{
                    throw "SORRY";
                }
            }else if (opecode.data == "unquote-splicing"){
                if (code.cdr && code.cdr.type == Zutsuki.TYPE_PAIR){
                    return ["unquote-splicing",Expand.expand(code.cdr.car,env)];
                }else{
                    throw "SORRY";
                }

            }else{
                var cell = code;
                var qqlist = [];
                var qqtail = null;
                while(cell){
                    if (cell.type != Zutsuki.TYPE_PAIR){
                        qqtail = this.qq_expand(cell,env);
                        break;
                    }
                    var qqcar = this.qq_expand(cell.car,env);
                    qqlist.push(qqcar);
                    cell = cell.cdr;
                }
                return ["qqlist",qqlist,qqtail];
            }
        }else if (code.type == Zutsuki.TYPE_VECTOR){
            throw "SORRY";
        }else{
            return ["qqconst",code];
        }
    
    }

}





Expand.Syntax.Import = function(){
    //未完成:letやlambdaのbody部でも宣言可能にする必要がある。
    this.syntax_name = "import";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(){
        return false;
    }
    this.convert = function(code,env){
        var cell = code.cdr;
        var ret = ["import"];
        var user_libraries = env.library;
        while (cell){

            var libname = cell.car;
            var is_internal_library = false;
            if (libname.car.type == Zutsuki.TYPE_SYMBOL && libname.car.data == "scheme"){
                if (libname.cdr.car.data == "base"){
                    Expand.set_r7rs_base(env);
                    ret.push(["scheme","base"]);
                    is_internal_library = true;
                }
            }else if (libname.car.type == Zutsuki.TYPE_SYMBOL && libname.car.data == "zutsuki"){
                if (libname.cdr.car.data == "zero"){
                    Expand.set_zutsuki_one(env);
                    ret.push(["zutsuki","zero"]);
                    is_internal_library = true;
                }
            }else if (libname.car.type == Zutsuki.TYPE_SYMBOL && libname.car.data == "ex"){
                var exname = libname.cdr.car.data;
                if (is_node){
                    Interface.load_excode(exname);
                }
                ret.push(["ex",exname]);
                is_internal_library = true;
            }
            if (!is_internal_library){
                //ユーザ定義ライブラリ
                
                var c = cell.car;
                var ulib = [];//ライブラリ名をjsarrayとjsstringに変換する
                while (c){
                    ulib.push(c.car.data);
                    c = c.cdr;
                }
                ret.push(ulib);

                //現在の環境からユーザ定義ライブラリを探して
                //現在の環境にsyntaxをexportする
                var is_hit = false;
                for (var i=0;i<user_libraries.length;i++){
                    if (user_libraries[i][0].length == ulib.length){
                        var is_same_name = true;
                        for (var j=0;j<ulib.length;j++){
                            if (ulib[j] != user_libraries[i][0][j]){
                                is_same_name = false;
                            }
                        }

                        if (is_same_name){
                            var lenv = user_libraries[i][1];
                            var export_symbols = lenv.export_symbols;
                            for (var k=0;k<export_symbols.length;k++){
                                if (export_symbols[k].length == 1){
                                    //exportを外側の環境に加える
                                    //syntax用
                                    var output_symbol = export_symbols[k][0];
                                    env.global[output_symbol] = lenv.global[output_symbol];
                                }else{
                                    env.global[export_symbols[k][1]] = lenv.global[export_symbols[k][0]];
                                }
                            }
                            is_hit = true;
                            break;
                        }
                    }
                }
                if (!is_hit){
                    throw Zutsuki.generate_error_with_hint_object("unknown library " + Zutsuki.printer(cell.car),code);
                }
            }

            cell = cell.cdr;
        }

        return ret;
    }
}

Expand.Syntax.Export = function(){
    this.syntax_name = "export";
    this.type = Zutsuki.TYPE_SYNTAX;
    //define-library内で使われる
    
    this.check = function(code){
        return false;
    }

    this.convert = function(code,env){
       var cell = code.cdr;
       while (cell){
            if (cell.car.type == Zutsuki.TYPE_PAIR){
                if (cell.car.car.type == Zutsuki.TYPE_SYMBOL && cell.car.car.data == "rename"){
                    //!要エラーチェック
                    env.export_symbols.push([cell.car.cdr.car.data,cell.car.cdr.cdr.car.data]);
                }else{
                    throw "ERR";
                }
            }else if (cell.car.type == Zutsuki.TYPE_SYMBOL){
                env.export_symbols.push([cell.car.data]);
            }
           cell = cell.cdr;

       }
        //環境に情報を与えるので、返り値はnull
        return null;
    }
}




Expand.Syntax.Define_library = function(){
    this.syntax_name = "define-library";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        if (Expand.check_proper_list(code)>=1){
            return false;
        }
        throw "ERROR";
    }

    this.convert = function(code,env){
        //defien-libraryを呼び出した環境に展開したデータを置く。
        //importした時になんかさせる

        const c_libname = code.cdr.car;
        var libname = "";
        if (c_libname.type == Zutsuki.TYPE_SYMBOL){
            libname = c_libname.data;
        }else if (c_libname.type == Zutsuki.TYPE_PAIR){
            var cell = c_libname;
            libname = [];
            while (cell){
                //cell.carがsymbolか確認
                libname.push(cell.car.data);
                cell = cell.cdr;
            }
        }
        var bodies = code.cdr.cdr;

        var lib_env = Expand.create_empty_env();
        
        //新しいenvにexport import begin include include-ci ...とかをセットする
        lib_env.global["import"] = new Expand.Syntax.Import();
        lib_env.global["export"] = new Expand.Syntax.Export();
        lib_env.global["begin"] = new Expand.Syntax.Begin();
        var library_code = [];
        while (bodies){
            var body = Expand.expand(bodies.car,lib_env);
            if (body){
                library_code.push(body);
            }
            bodies = bodies.cdr;
        }

        env.library.push([libname,lib_env,library_code,true]);
        //外側の環境に加える。
        return null;
    }
}




Expand.Syntax.Func_run = function(){
    this.syntax_name = "func-run";
    this.type = Zutsuki.TYPE_SYNTAX;
    this.check = function(code){
        //長さ1以上の真性リストかどうか
        if (Expand.check_proper_list(code)>=1){
            return false;
        }
        throw "ERROR";
        return "ERROR";
    }


    this.convert = function(code,env){
        var ret = [];
        var cell = code;
        while (cell){
            ret.push(Expand.expand(cell.car,env));
            cell = cell.cdr;
        }
        return ret;
    }
}


Expand.Syntax.Rules_wrapper = function(rules,org_code,global,local){
    this.syntax_name = "user-syntax";
    this.type = Zutsuki.TYPE_SYNTAX;

    this.rules = rules[1];
    this.ellipsis = rules[0];
    this.org_code = org_code;

    this.global = global;
    this.local = local;

    this.check = function(code){
        return false;
    }


    this.convert = function(code,env){
        var err = {"ERROR":"ERROR"};
        var r = Macro.match_and_convert(code,this.rules,this.ellipsis,err);
        if (r == err){
          throw "ERROR";
        }

        var renamed_symbols = Expand.catch_renamed_symbols(r);

        for (var i=0;i<renamed_symbols.length;i++){
            renamed_symbols[i].global = this.global;
            renamed_symbols[i].local = this.local;
        }

        var ret = null;
        try{
            ret = Expand.expand(r,env);
        }catch(e){
            if (e && typeof e == "object" && e.type == Zutsuki.TYPE_ERROR){
                e.error_stack.push(Zutsuki.generate_error_with_hint_object("in macro",org_code));
                e.error_stack.push(Zutsuki.generate_error_with_hint_object("from",code));
                e.filename = null;
                e.line = -1;
            }
            throw e;   
        }


        for (var i=0;i<renamed_symbols.length;i++){
            if (renamed_symbols[i].rename_flag){
                var gen_sym = renamed_symbols[i].rename_flag;
                var osym = renamed_symbols[i].org.data;

                for (var j=0;j<renamed_symbols.length;j++){
                    /*
                    var org_sym = renamed_symbols[j].org;
                    renamed_symbols[j].data = gen_sym;
                    renamed_symbols[j].filename = org_sym.filename;
                    renamed_symbols[j].line = org_sym.line;
                    renamed_symbols[j].type == Zutsuki.TYPE_SYMBOL;
                    */
                    if (renamed_symbols[j].org.data == osym){
                        Zutsuki.renamed_symbol2symbol(renamed_symbols[j],gen_sym);
                    }
                    
                }   
            }           
        }

        var new_renamed_symbols = [];

        for (var i=0;i<renamed_symbols.length;i++){
            if (renamed_symbols[i].type == Zutsuki.TYPE_RENAMED_SYMBOL){
                new_renamed_symbols.push(renamed_symbols[i]);
            }
        }
        

        //内部用のシンボル衝突は回避したので、あとは外部の衝突を回避する。
        if (new_renamed_symbols.length ){
            var stack_start = 0;
            var stack_end = env.local.length;
            if (this.local.length){
                var syntax_local_end = this.local[this.local.length-1];

                for (var i=stack_start;i<stack_end;i++){
                    if (env.local[i] == syntax_local_end){
                        stack_end = i-1;
                        break;
                    }   
                }
            }

            for (var k=0;k<new_renamed_symbols.length;k++){
                var conflict_flag = false;
                var tgt_symbol = new_renamed_symbols[k].org.data;
                for (var i=stack_start;i<stack_end;i++){
                    for (var j =Expand.LOCAL_TAG_SIZE;j<env.local[i].length;j++){
                        if (tgt_symbol == env.local[i][j][0]){
                            conflict_flag = true;
                            env.local[i][3][1] = 1;
                            //ここでstack情報に細工する。
                            break;
                        }
                    }
                }

                if (!conflict_flag){
                    Zutsuki.renamed_symbol2symbol(new_renamed_symbols[k],gen_sym);
                }
            }


        }
     
        return ret;
    }
}






Expand.create_default_env = function(env){
    const ret = new Expand.Expand_env();
    Expand.set_zutsuki_one(ret);
    return ret;
}


Expand.create_empty_env = function(env){
    const ret = new Expand.Expand_env();
    return ret;
}





Expand.catch_renamed_symbols = function(code){
    var res = [];
    function loop(co){
        if (co.type == Zutsuki.TYPE_PAIR){
            var cell = co;
            while (cell){
                if (cell.type != Zutsuki.TYPE_PAIR){
                    loop(cell);
                    break;
                }
                loop(cell.car);
                cell = cell.cdr;
            }
                   
        }else if (co.type == Zutsuki.TYPE_VECTOR){
            var vd = co.data;
            for (var i=0;i<vd.length;i++){
                loop(vd[i]);
            }
        }else if (co.type == Zutsuki.TYPE_RENAMED_SYMBOL){
            res.push(co);
        }
    }
    loop(code);
    return res;
}



Expand.internal_gensym = function(sym,code){
    var rename_index = 0;
    function update_sym(){
        return sym + "_" +  rename_index
    }

    var current_sym = sym;

    function loop(co){
        if (co.type == Zutsuki.TYPE_PAIR){
            var cell = co;
            while (cell){
                if (cell.type != Zutsuki.TYPE_PAIR){
                    loop(cell);
                }
                loop(cell.car);
                cell = cell.cdr;
            }
        }else if (co.type == Zutsuki.TYPE_VECTOR){
            var vd = co.data;
            for (var i=0;i<vd.length;i++){
                loop(vd[i]);
            }
        }else if (co.type == Zutsuki.TYPE_SYMBOL){
            if (co.data == current_sym){
                current_sym = update_sym();
            }
        }
    }
    loop(code);
    return current_sym;
}





Expand.expand = function(code,env){
    if (code.type == Zutsuki.TYPE_PAIR){
        if (code.circle_flag){
            throw("^_^");
        }

        var opecode = code.car;
        if (opecode.type == Zutsuki.TYPE_SYMBOL){
            opecode = Expand.search_from_env(opecode.data,env);
        }else if (opecode.type ==  Zutsuki.TYPE_RENAMED_SYMBOL){
            var r_global = opecode.global;
            var r_local = [];
            for (var i=0;i<opecode.local.length;i++){
                r_local.push(opecode.local[i]);
            }

            var e_global = env.global;
            var e_local = env.local;

            env.global = r_global;
            env.local = r_local;
            var oopecode =  opecode;
            opecode = Expand.search_from_env(opecode.org.data,env);

            env.global = e_global;
            env.local = e_local;

            if (opecode && opecode.type == Zutsuki.TYPE_SYNTAX){
                Zutsuki.renamed_symbol2symbol(oopecode);
            }

        }


        
        if (opecode && opecode.type == Zutsuki.TYPE_SYNTAX){
            const error = opecode.check(code);
            if (error){
                //error
                Expand.push_error_env(error,env);
                throw Zutsuki.generate_error_with_hint_object("syntax error::" + error[0],error[1],false);
            }
            return opecode.convert(code,env);
        }

        const frun = new Expand.Syntax.Func_run();
        if (frun.check(code)){
            throw "ERR";
        }

        return frun.convert(code,env);
    }else{
        if (code.type == Zutsuki.TYPE_SYMBOL){
            Expand.search_from_env(code.data,env);
        }else if (code.type == Zutsuki.TYPE_RENAMED_SYMBOL){
        }
        return code;
    }
}
