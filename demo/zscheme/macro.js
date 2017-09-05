Macro = {};

var is_node = typeof require !== "undefined";
if (is_node){
    module.exports = Macro;
    var Zutsuki = require("./zutsuki");
}

var scheme_test_print = function(a){
    if (!a){
        console.log("()");
        return;
    }

    if (a.type == Zutsuki.TYPE_PAIR){
        if (a.circle_flag){
            console.log(" ( ... ) ");
            return;
        }

        var p = a;
        console.log("(");
        while (p){
            if (p && p.type != Zutsuki.TYPE_PAIR){
                scheme_test_print(p);
                break;
            }
            scheme_test_print(p.car);
            p = p.cdr
        }
        console.log(")");
    }else{
        console.log("OBJCT>>",a);
    }
}


Macro.check_template = function(template,ellipsis,pattern_vars){
    //<ellipsis>内のパターン変数のマッチ木の形が同じ形である集合を作る
    //こうすることで、マッチ木が違う形だった場合、
    //・短い方に合わせる場合、
    // ->expand前にdummyを挿入してむりやり同じ形に直す
    // ・エラーにする場合、
    // ->expand前にエラーが検出できる。
    //
    //あと、パターン変数の<ellipsis>のネストを保存しておく。
    //template内の2つ以上のパターン変数の<ellipsis>ネストが一致しなかったりしたり、
    //マッチ済みの木の形の深さと合わなかったらエラーにできるぞ。

    //パターン部のネストと一致しないケースは今現状取得できない。
    
    function loop(template,data,stack,nest){
        if (template === null){
            return null;
        }

        if (template.type == Zutsuki.TYPE_PAIR){
            console.log("TEMPLATE_CHECK::PAIR");
            console.log(template);
            var cell = template;
            while (cell){
                if (cell.type != Zutsuki.TYPE_PAIR){
                    //N:cellがpattern-varのときのチェック
                    break;
                }
                if (cell.cdr && cell.cdr.type == Zutsuki.TYPE_PAIR && cell.cdr.car && cell.cdr.car.type == Zutsuki.TYPE_SYMBOL && cell.cdr.car.data == ellipsis){
                    stack.unshift([]);
                    loop(cell.car,data,stack,nest+1);
                    data.push(stack.shift());
                    cell = cell.cdr;
                }else{
                    loop(cell.car,data,stack,nest);
                }
                cell = cell.cdr;
            }
        }else if (template.type == Zutsuki.TYPE_VECTOR){

        }else if (template.type == Zutsuki.TYPE_SYMBOL){
            //pattern-variableかどうか調べる
            if (pattern_vars[template.data]){
                if (nest){
                    stack[0].push(template.data);
                }
            }
        }else{
        

        }
    }

    const data = [];
    loop(template,data,[],0);
    console.log("!",data,pattern_vars);
    return data;
}



Macro.TYPE_PATTERN_VARS = {};
Macro.pattern_convert = function(pattern,ellipsis,literals,pattern_symbols){
    if (pattern.type == Zutsuki.TYPE_PAIR){
        var cell = pattern;

        var eflag = false;//ellispis が含まれるか
        var dot_flag = false;//非真正リストか
        //var prev = null;
        var ret = [];
        var tmp_left = [];
        while (cell){
            if (cell && cell.type != Zutsuki.TYPE_PAIR){
                //非真性リスト
                dot_flag = true;
                cell = Macro.pattern_convert(cell,ellipsis,literals,pattern_symbols);
                if (eflag){
                    tmp_left.push(ret);
                    tmp_left.push(cell);
                    ret = tmp_left;
                    ret.unshift(4);
                    ret.unshift(Zutsuki.TYPE_PAIR);
                }else{
                    ret = [Zutsuki.TYPE_PAIR,3,ret,cell];
                }
                break;
            }

            if (cell.car.type == Zutsuki.TYPE_SYMBOL && cell.car.data == ellipsis){
                var prev = ret.pop();       
                tmp_left = [ret,prev];
                ret = [];
                eflag = true;
            }else{
                ret.push(Macro.pattern_convert(cell.car,ellipsis,literals,pattern_symbols));
            }
            cell = cell.cdr;
        }

        if (eflag == false && dot_flag == false){
            //パターン1(真正固定長リスト)
            ret = [ret];
            ret.unshift(1);
            ret.unshift(Zutsuki.TYPE_PAIR);
            return ret;
        }else if (eflag == true && dot_flag == false){
            //パターン2(真正可変長リスト)
            console.log("2",ret);
            tmp_left.unshift(2);
            tmp_left.unshift(Zutsuki.TYPE_PAIR);
            tmp_left.push(ret);
            ret = tmp_left;
            return ret;
        }else if (eflag == false && dot_flag == true){
            console.log("2");
            return ret;
        }else if (eflag == true && dot_flag == true){
            //パターン4(非真正可変長リスト)
            return ret;
        }

    }else if (pattern.type == Zutsuki.TYPE_VECTOR){
        var vdata = pattern.data;
        var ret = [];
        var tmp_left = []
        var eflag = false;
        for (var i=0;i<vdata.length;i++){
            if (vdata[i].type == Zutsuki.TYPE_SYMBOL && vdata[i].data == ellipsis){
                if (ret.length == 0){
                    throw generate_error_with_hint_object("syntax error",vdata)
                }
                var rtop = ret.pop();
                tmp_left = [ret,rtop];
                ret = []
            }else{
                ret.push(Macro.pattern_convert(vdata[i],ellipsis,literals,pattern_symbols));
            }
        }

        if (eflag){
            tmp_left.push(ret);
            ret = tmp_left;
            tmp_left.unshift(1);
            tmp_left.unshift(Zutsuki.TYPE_VECTOR);
        }else{
            ret.unshift(0);
            ret.unshift(Zutsuki.TYPE_VECTOR);
        }
        return ret;
    }else{
        if (pattern.type == Zutsuki.TYPE_SYMBOL){
            for (var i=0;i<literals.length;i++){
                if (literals[i] == pattern.data){
                    return [pattern.type,pattern];
                }
            }
            if (pattern_symbols[pattern.data]){
                //複数のpattern変数が出てくるのはエラー。
                pattern_symbols[0] =  "syntax variable <" + pattern.data + "> is duplicated";
                return null;
            }

            pattern_symbols[pattern.data] = true;

            return [Macro.TYPE_PATTERN_VARS,pattern.data];
        }
        return [pattern.type,pattern];
    }
}


Macro.pattern_visualizar = function(rule){
    function loop(rule){
        if (rule.length == 0){
            return "NULL";
        }

        if (rule[0] == Zutsuki.TYPE_PAIR){
            var pair_type = rule[1];
            var ret = "";

            if (pair_type == 1){
                ret += "(PAIR1 {";
                for (var i=0;i<rule[2].length;i++){
                    ret += " " +  loop(rule[2][i]);
                }
                ret += " })";
                return ret;
            }else if (pair_type == 2){
                ret += "(PAIR2 {";
                for (var i=0;i<rule[2].length;i++){
                    ret += " " + loop(rule[2][i]);
                }
                ret += "} ";

                ret += loop(rule[3]);
                ret += " ...  ";
                ret += loop(rule[4]);
                ret += " )";
                return ret;
            }else{
                exit(2);
            }
        }else if (rule[0] == Macro.TYPE_PATTERN_VARS){
            return "<PATTERN VARIABLE " + rule[1] + " >";
        }else if (rule[0] == Zutsuki.TYPE_SYMBOL){
            return "<SYMBOL " + rule[1] + " >";
        }else if (rule[0] == Zutsuki.TYPE_VECTOR){
            return "<VECTOR>";
        }else{
            console.log("ELSE=",rule);
            exit();
        }
    }
    var x = loop(rule);
    return x;
}







Macro.create_syntax_rules = function(code){
    var ellipsis_symbol = "...";
    var tail = null;
    var literals = null;
    var rules = null;
    if (code.cdr.car == null || code.cdr.car.type == Zutsuki.TYPE_PAIR){
        literals = code.cdr.car;   
        rules = code.cdr.cdr;
    }else if (code.cdr.car.type == Zutsuki.TYPE_SYMBOL){
        ellipsis_symbol = code.cdr.car.data;
        literals = code.cdr.cdr.car;
        rules = code.cdr.cdr.cdr;
    }else{
        //error
        throw "SYNTAX RULES ERROR";
    }
    

    var cell = literals;
    literals = [];
    while (cell){
        if (cell.type != Zutsuki.TYPE_PAIR){
            throw Zutsuki.generate_error_with_hint_object("syntax-rules literals list must be  proper list",code);
        }
        if (cell.car && cell.car.type != Zutsuki.TYPE_SYMBOL){
            throw Zutsuki.generate_error_with_hint_object("syntax-rules literals list contains no-symbol-object",code);
        }
        literals.push(cell.car.data);
        cell = cell.cdr;
    }

    cell = rules;

    console.log("MACRO",cell);
    
    var syntax_list = [];
    while (cell){
        var pattern = cell.car.car;
        var template = cell.car.cdr.car;

        var pattern_vars = {};
        pattern_vars[0] = null;//エラー情報をここにいれる。
        
        var _pattern = Macro.pattern_convert(pattern,ellipsis_symbol,literals,pattern_vars);
        var nest_set = Macro.check_template(template,ellipsis_symbol,pattern_vars);
        if (pattern_vars[0]){
            throw Zutsuki.generate_error_with_hint_object(pattern_vars[0],pattern);
        } 
        syntax_list.push([_pattern,template,nest_set]);
        cell = cell.cdr;
    }

    console.log("SYNTAX-LIST",syntax_list);
    return [ellipsis_symbol,syntax_list];
}






Macro.Ellipsis_tree = function(type){
    this.type = type;

    this.position = [];
    this.last_shape_stack = null;
    
    this.push = function(nest,code,graph,shape_stack){
        if (!this.last_shape_stack){
            console.log("NEST=",nest);
            for (var i=1;i<nest+1;i++){
                graph.push([i+1]);
                this.position.push(i);
            }
            console.log("p",this.position);
            graph.push(code);
        }else{
            var id = -1;
            console.log(shape_stack,this.last_shape_stack);
            console.log("PREV POS",this.position,code);
            for (var i=0;i<shape_stack.length;i++){
                if (this.last_shape_stack[i] != shape_stack[i]){
                    if (i != nest-1){
                        console.log("I=",i);
                        var pid = this.position[i];
                        for (var j=i;j<nest;j++){
                            id = graph.length;
                            graph.push([]);
                            graph[pid].push(id);
                            if (j+1<nest){
                                this.position[j+1] = id;
                            }
                            pid = id;
                        }
                    }
                    break;
                }
            }
            console.log("AFTER POSITION",this.position);

            if (id == -1){
                var pid = this.position[this.position.length - 1];
                var id = graph.length;
                console.log("PID=",pid,graph[pid],this.position,code);
                graph[pid].push(id);
                graph.push(id);
            }
            graph[id] = code;

            console.log(this.position);
        }

        this.last_shape_stack = [];
        for (var i=0;i<shape_stack.length;i++){
            this.last_shape_stack.push(shape_stack[i]);
        }

    }
} 

Macro.Expand_tree = function(){
    this.stack = null;
    this.position = null;
    this.next = function(graph,nest){
        if (!this.stack){
            this.stack = [];
            this.position = [];
            var pos = 1;
            for (var i=0;i<nest+1;i++){
                this.stack.unshift(pos);
                this.position.push(0);
                pos = graph[pos][0];
            }
            return [0,graph[this.stack[0]]];
        }else{
            if (this.stack.length == 1){
                this.stack = null;
                return this.next(graph,nest);
            }
            this.stack.shift();
            this.position.shift();

            
            if (graph[this.stack[0]].length == this.position[0]+1){
                return 1;
            }else{
                this.position[0]++;
                if (this.stack.length!= nest){
                    var id = graph[this.stack[0]][this.position[0]];
                    for (var i=this.stack.length;i<nest+1;i++){
                        this.position.unshift(0);
                        this.stack.unshift(id);
                        id = graph[id][0];
                    }
                    return [0,graph[this.stack[0]]];
                }
                //ここに深さが足りないノードに関する処理をいれる
                this.stack.unshift(graph[this.stack[0]][this.position[0]]);
                this.position.unshift(0);
                return [0,graph[this.stack[0]]];
            }
            exit(1);
        }

        console.log("GRAPH=",graph);
        exit(1);
    
    }
}



Macro.match_proper_list= function(arr,list){
    //リストの長さがたりなかったり非真正リストであった場合falseを返す.
    //(ただし、返り値がfalseでなかったとしても非真正リストでないという保証はない。)
    //それ以外は、[のこりのリスト,マッチさせるもの]を返す。
    //
    var cell = list;
    var match = [];
    for (var i=0;i<arr.length;i++){
        if (!cell || cell.type != Zutsuki.TYPE_PAIR){
            return false;
        }
        match.push([cell.car,arr[i]]);
        cell = cell.cdr;
    }

    return [cell,match];
}



Macro.push_null = function(rule,env){
    console.log(rule);
    if (rule[0] == Zutsuki.TYPE_PAIR){
        if (rule[1] == 1){
            for (var i=0;i<rule[2].length;i++){
                Macro.push_null(rule[2][i],env);
            }
        }else if (rule[1] == 2){
            for (var i=0;i<rule[2].length;i++){
                Macro.push_null(rule[2][i],env);
            }
            for (var i=0;i<rule[4].length;i++){
                Macro.push_null(rule[4][i],env);
            }
            Macro.push_null(rule[3],env);
        }else{
            exit(1);   
        }
    }else if (rule[0] == Zutsuki.TYPE_VECTOR){
    
    }else if (rule[0] == Zutsuki.TYPE_PATTERN_VARS){
        if (env[rule[1]]){
            
        }
    }
    exit(1);
}





Macro.match = function(code,rule,env,nest){
    console.log("");
    console.log("code=");
    scheme_test_print(code);
    console.log("rule=",Macro.pattern_visualizar(rule));
    if (rule[0] == Zutsuki.TYPE_PAIR){
        console.log("rule[0] is PAIR");
        if (code == null){
            console.log("CODE IS NULL");
            if (nest > 0){
                Macro.push_null(rule,env);
                console.log("nul",env);
                exit(1);
            }else{
                return false;
            }
        }

        var top_match = Macro.match_proper_list(rule[2],code);
        if (!top_match){
            //長さが足りなかったか、非真正リストだったかのどちらか。
            return false;
        }
        console.log("TOP-MATCH OK!");


        for (var i=0;i<top_match[1].length;i++){
            if (!Macro.match(top_match[1][i][0],top_match[1][i][1],env,nest)){
                return false;
            }
        }
        
        console.log("PATARN MATCHING PTN=",rule[1]);
        var pair_matching_pattern = rule[1];
        if (pair_matching_pattern == 1){
            if (!top_match[0]){ 
                //↑ 末尾cellがnull
                console.log("MATCH-PTN1-OK");
                return true;
            }
            console.log("MATCH-PTN1- NO MATCH");
            return false;
        }else if (pair_matching_pattern == 2){
            console.log(top_match[0]);
            var center = rule[3];
            var tail = rule[4];
            console.log("CENTER",center,"TAIL",tail);
            
            var tail_matchings = [];
            var center_matchings = [];
            
            {
                var bcell = top_match[0];
                var tcell = bcell;
                //まず、bcellをtailの長さ分だけすすめるa
                for (var i=0;i<tail.length;i++){
                    if (!bcell||bcell.type != Zutsuki.TYPE_PAIR){
                        //長さがたりないか真性リストではない
                        return false;
                    }
                    bcell = bcell.cdr;   
                }
                
                //続いてbcellを末尾まで移動させる。tcellも同時に動かす。tcellの通過したcellのcarをellipsisマッチさせる。
                while (bcell){
                    if (bcell.type != Zutsuki.TYPE_PAIR){
                        return false;
                    }
                    center_matchings.push([tcell.car,center]);
                    tcell = tcell.cdr;
                    bcell = bcell.cdr;
                }

                var p = 0;
                while (tcell){
                    tail_matchings.push([tcell.car,tail[p]]);
                    tcell = tcell.cdr;
                    p++;
                }
            }

            console.log("CENTER-MATCHINGS=",center_matchings);
            console.log("TAIL-MATCHINGS=",tail_matchings);
            console.log("");

            console.log("PUSH!",env[0]);
            for (var i=0;i<center_matchings.length;i++){
                env[0][0]++;
                env[0][1].push(env[0][0]);

                console.log("CM=",center_matchings[i]);
                if (!Macro.match(center_matchings[i][0],center_matchings[i][1],env,nest+1)){
                    console.log("MATCH-MACRO-ERROR");
                    return false;
                }
                env[0][1].pop();
            }
            
            for (var i=0;i<tail_matchings.length;i++){
                if (!Macro.match(tail_matchings[i][0],tail_matchings[i][1],env,nest)){
                    return false;
                }
            }
            return true;
        }else if (pair_matching_pattern == 3){
            exit(1);
        }else if (pair_matching_pattern == 4){
            exit(1);
        }
    }else if (rule[0] == Macro.TYPE_PATTERN_VARS){
        if (nest == 0){
            env[rule[1]] = [0,code];
        }else{
            if (!env[rule[1]]){
                env[rule[1]] = [new Macro.Ellipsis_tree(1)];
            }

            var tree = env[rule[1]][0];
            var shape_stack = env[0][1];
            
            tree.push(nest,code,env[rule[1]],shape_stack);
            console.log("NEST=",nest);
        }
        return true;
    }else if (rule[0] == Zutsuki.TYPE_VECTOR){
        if (rule[1]){
            exit(1);
        }else{
            if (code.type != Zutsuki.TYPE_VECTOR){
                return false;
            }
            console.log("BOO");

            var vdata = code.data;
            if (vdata.length != rule.length - 2){
                return false;
            }

            var j = 0;
            for (var i=2;i<rule.length;i++){
                if (!Macro.match(vdata[j],rule[i],env,nest)){
                    return false;
                }
                j++;
            }

        }
        return true;
    }else{
        if (rule[0] != code.type){
            return false;
        }


        if (rule[0]  == Zutsuki.TYPE_SYMBOL){
            if (rule[1].data == code.data){
                return true;
            }
               
            return false;
        }else{
        
            error("!!!!!!!!!!!!");
        
        }

        console.log("RULE",rule);
        return true;
    }
}

Macro.MATCH_END = {"a":3};

Macro.expand = function(template,env,ellipsis,nest){
   if (template.type == Zutsuki.TYPE_PAIR){ 
        var ret = Zutsuki.ZP(null,null);
        var ret_top = ret;
        var cell = template;
        
        while (cell){
            if (cell.type != Zutsuki.TYPE_PAIR){
            
            }else if (cell.cdr && cell.cdr.type == Zutsuki.TYPE_PAIR && cell.cdr.car.type == Zutsuki.TYPE_SYMBOL && cell.cdr.car.data == ellipsis){
                var ellipsis_counter = 0;
                while (true){
                    var ellipsis_res = Macro.expand(cell.car,env,ellipsis,nest+1);
                    console.log("FOOOO",ellipsis_res);

                    if (ellipsis_res == Macro.MATCH_END){
                        break;
                    }
                    ret.cdr = Zutsuki.ZP(ellipsis_res,null);
                    ret = ret.cdr;
                    ellipsis_counter++;
                }
                
                if (ellipsis_counter == 0){
                    if (nest){
                        return Macro.MATCH_END;
                    }
                }


                cell = cell.cdr;
            }else{
                
                ret.cdr = Zutsuki.ZP(Macro.expand(cell.car,env,ellipsis,nest),null);
                ret = ret.cdr;
            }
            cell = cell.cdr;
        }

        if (nest){
            
            
            var rcell = ret_top.cdr;
            while (rcell){
                if (rcell.type != Zutsuki.TYPE_PAIR){
                    if (rcell == Macro.MATCH_END){
                        return Macro.MATCH_END;
                    }
                }
                console.log("NE",rcell.car);
                if (rcell.car == Macro.MATCH_END){
                    console.log("END");
                    return Macro.MATCH_END;
                }
                rcell = rcell.cdr;
            }
        }


        return ret_top.cdr;
   }else if (template.type == Zutsuki.VECTOR){

   }else if (template.type == Zutsuki.TYPE_SYMBOL){
        if (env[template.data]){
            if (env[template.data][0] == 0){
                return env[template.data][1];
            }else{
                var next = env[template.data][0].next(env[template.data],nest);
                if (next){
                    if (next[0] == 0){
                        return next[1];
                    }else if (next == 1){
                        return Macro.MATCH_END;
                    }else{
                        exit(1);
                    }
                }
            }
        }else{
            //(syntaxを定義した場所の環境で識別しを評価する)
            console.log("TEMP",template);
            return new Zutsuki.RenamedSymbol(template);

        }
        return template;
   }else{
        return template;
   }
    
}





Macro.compare_tree_shape = function(env,nest_set){
    console.log(nest_set);
    for (var i=0;i<nest_set.length;i++){
        console.log("!!!",nest_set[i]);   
        if (nest_set[i].length == 0){
            continue;
        }

        var a = env[nest_set[i][0]];
        for (var j=1;j<nest_set[i].length;j++){
            var b = env[nest_set[i][j]];
            
            var stack_a = [];
            var stack_b = [];
            while (stack_a.length && stack_b.length){
                var a_x = stack_a.shift();
                var b_x = stack_b.shift();
                if (a[a_x].length != b[b_x].length){
                    return false;
                }
                if (!a[a_x].length){
                    continue;
                }
                for (var k=0;k<a[a_x].length;k++){
                    stack_a.push(a[a_x][k]);
                    stack_b.push(b[b_x][k]);
                }
            }
            a = b;
        }
    }
    return true;
}



Macro.match_and_convert = function(code,rules,ellipsis,err){
    console.log("CODE=",code);
    // RULE -> [ pattern template nest_set]
    for (var i=0;i<rules.length;i++){
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        console.log("....");
        console.log("....");
        console.log("....");
        console.log("PATTERN=",Macro.pattern_visualizar(rules[i][0]));
        console.log("....");
        console.log("....");
        console.log("=============================================");

        var env = {};
        env[0] = [0,[]];
        if (Macro.match(code,rules[i][0],env,0)){
            console.log("ENV=",env);

            //nest_setとmatch木を比較する。
            if (!Macro.compare_tree_shape(env,rules[i][2])){
                return err;
            }

            env[1] = [0];
            var keys = Object.keys(env);
            for (var j=0;j<keys.length;j++){
                if (keys[j] && env[keys[j]][0]){
                    env[keys[j]][0] = new Macro.Expand_tree();
                }
            }

            var ret = Macro.expand(rules[i][1],env,ellipsis,0);
            scheme_test_print(ret);
            return ret;
        }
        console.log("!!!",env);
    }

    //ひとつもマッチしなかった(error)
    
    throw Zutsuki.generate_error_with_hint_object("un match",code);
}


