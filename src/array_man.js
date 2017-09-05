var Array_man = {};

var is_node = typeof require !== "undefined";
if (is_node){
    module.exports = Array_man;
    var Zutsuki = require("./zutsuki");
    var Expand = require("./expand");

}



//
//phase0
//
//lambda lbegin let lset! gset!
//
//phase1
//
//<phase0> + let2



Array_man.P1_Inline = {};


Array_man.P1_Inline.inlining = function(fbody,fcell){
    var ret = [];
    if (Array.isArray(fbody)){
        for (var i=0;i<fbody.length;i++){
            if (fbody[i].type == Zutsuki.TYPE_SYMBOL){
                if (fcell[fbody[i].data]){
                    ret.push(fcell[fbody[i].data]);
                }else{
                    ret.push(fbody[i]);
                }
            }else{
                ret.push(fbody[i]);
            }
        }
    }else{
        if (fbody.type == Zutsuki.TYPE_SYMBOL){
            if (fcell[fbody.data]){
                ret = fcell[fbody.data];
            }else{
                ret = fbody;
            }
        }else{
            ret = fbody;
        }
    
    }
    return ret;
}





Array_man.P1_Inline.is_inline_function = function(f){
    if (f[0] == "function"){
        const body = f[3];
        if (f[2]){
            return false;
        }
        for (var i=0;i<body.length;i++){
            if (Array.isArray(body[i])){
                return false;
            }
        }
    }
    return true;
}




Array_man.phase_1_is_beta_object = function(object,const_data){
    //quoted value:0
    //アトム:1
    //手続き:2


    if (object.type == Zutsuki.TYPE_CONST_VARIABLE){
        //consta-data
        var c = const_data[object.data];
        if (c[0] == "function"){
            if (Array_man.P1_Inline.is_inline_function(c)){
                return 2;
            }
            return 0;
        }else if (c[0] == "quote"){
            
            return 0;
        }
        return 0;
    }else if (object.type == Zutsuki.TYPE_BOOLEAN){
        return 1;
    }else if (object.type == Zutsuki.TYPE_NUMBER){
        return 1;
    }else if (object.type  == Zutsuki.TYPE_SYMBOL){
        return 1;
    }

    return 0;
}




Array_man.phase1_is_conflict_object = function(symbol,stack,global,local_cell){
    var x = 0;
    var new_symbol = symbol;
    while (true){
        var flag = false;
        for (var i=0;i<stack.length;i++){
            if (stack[i][new_symbol]){
                new_symbol = "_$" + x + "_" + symbol + "_";
                x++;
                flag = true;
                break;
            }
        }
        if (flag){
            continue;
        }

        if (global[new_symbol] || local_cell[new_symbol]){
            x++;
            new_symbol = "_" + x + symbol + "_";
            continue;
        }
        break;
    }
    if (x){
        return new_symbol;
    }
    return false;
}


Array_man.phase_1_unconditional_rename = function(symbol,stack,global,local_cell){
    var rsym = symbol + "-renamed";
    var res = Array_man.phase1_is_conflict_object(rsym,stack,global,local_cell);
    if (!res){
        res = rsym;
    }
    return rsym;
}





Array_man.convert_phase_1_let = function(array_man_code1,const_data,global,stack){
    const bindings = array_man_code1[1];
    const free_variables = array_man_code1[5];
    const body = array_man_code1[2];
    const unconditional_renaming = array_man_code1[6];//強制的にrenameさせる(hygenic macroによって)

    if (stack.length>0 && bindings.length ==  0){
        return Array_man.convert_phase_1(body,const_data,global,stack);
    }

    const local_cell = {};
    const new_bindings = [];
    if (array_man_code1[3]){
        //bindingsに対して、破壊的変更が行われるケース。
        //いろんな最適化をさせないようにする。
        
        /*
        for (var i=0;i<free_variables.length;i++){
            bindings.push([free_variables[i],Zutsuki.SYM(free_variables[i])]);
        }
        */

        for (var i=0;i<bindings.length;i++){
            bindings[i][1] = Array_man.convert_phase_1(bindings[i][1],const_data,global,stack);
            var gen_sym = null;
            if (unconditional_renaming){
                gen_sym = Array_man.phase_1_unconditional_rename(bindings[i][0],stack,global,local_cell);
            }else{
                gen_sym = Array_man.phase1_is_conflict_object(bindings[i][0],stack,global,local_cell);
            }

            if (gen_sym){
                 local_cell[bindings[i][0]] = [3,gen_sym];
                 local_cell[gen_sym] = local_cell[bindings[i][0]];
                 new_bindings.push([gen_sym,bindings[i][1]]);
            }else{
                local_cell[bindings[i][0]] = Expand.UNDEFINED_OBJECT;
                new_bindings.push(bindings[i]);
            }
        }

        stack.unshift(local_cell);
        array_man_code1[2] = Array_man.convert_phase_1(body,const_data,global,stack);
        stack.shift();
        return ["let2",new_bindings,array_man_code1[2]];
    }else{
        var org_bindings_length = bindings.length;
        //自由変数をbindingsに加える。
        for (var i=0;i<free_variables.length;i++){
            bindings.push([free_variables[i],Zutsuki.SYM(free_variables[i])]);
        }
        
        //一回bindingsを更新する
        for (var i=0;i<bindings.length;i++){
            bindings[i][1] = Array_man.convert_phase_1(bindings[i][1],const_data,global,stack);

            var gen_sym = null;//名前の衝突によってrenameされた識別子
            if (unconditional_renaming){
                gen_sym = Array_man.phase_1_unconditional_rename(bindings[i][0],stack,global,local_cell);
            }else{
                gen_sym = Array_man.phase1_is_conflict_object(bindings[i][0],stack,global,local_cell);
            }

            //body内で展開してもいいオブジェクトかどうか
            var is_beta_object = Array_man.phase_1_is_beta_object(bindings[i][1],const_data);
           
            if (is_beta_object == 1){//拘束されているものがatomの場合、実行前に代入しても問題ない
                if (bindings[i][1].data == bindings[i][0]){
                    //lambda-lifting用に追加されたコードは、
                    //val == initが成立しているのでalpha_renamingは適用させない
                    is_beta_object = 0;
                }
            }


            
            if (gen_sym){
                //名前が衝突しているのでalpha-renamingする
                if (is_beta_object == 1){
                    //アトム
                    local_cell[bindings[i][0]] = [1,bindings[i][1],gen_sym];
                }else if (is_beta_object==2){
                    //手続き
                    local_cell[bindings[i][0]] = [2,bindings[i][1],gen_sym];
                    new_bindings.push([gen_sym,bindings[i][1]]);
                }else{
                    //その他(quoted objectとか)
                    local_cell[bindings[i][0]] = [3,gen_sym];
                    new_bindings.push([gen_sym,bindings[i][1]]);
                }
                local_cell[gen_sym] = local_cell[bindings[i][0]];
            }else{
                if (is_beta_object==1){
                    local_cell[bindings[i][0]] = [1,bindings[i][1]];
                }else if (is_beta_object==2){
                    local_cell[bindings[i][0]] = [2,bindings[i][1]];
                    new_bindings.push(bindings[i]);
                }else{
                    local_cell[bindings[i][0]] = Expand.UNDEFINED_OBJECT;
                    new_bindings.push(bindings[i]);
                }
            }
        }



        stack = [];

        stack.unshift(local_cell);
        array_man_code1[2] = Array_man.convert_phase_1(body,const_data,global,stack);
        stack.shift();

        if (stack.length>0 && new_bindings.length ==  0){
            return array_man_code1[2];
        }
        return ["let",new_bindings,array_man_code1[2]];
    }
}



Array_man.convert_qq_list = function(jsarray,tail){
    if (jsarray.length == 0){
        return tail;
    }else{
        var lsdata = ["CONS"];
        var lstop = lsdata;
        for (var i=0;i<jsarray.length -1;i++){
             lsdata.push(jsarray[i]);
             lsdata.push(["CONS"]);
             lsdata = lsdata[2];
        }

        lsdata.push(jsarray[jsarray.length-1]);
        lsdata.push(tail);
        return lsdata;
    }
}

Array_man.convert_list_literal = function(jsarray,tail){
    
    var cell = new Zutsuki.Pair(null,null);
    var cell_top = cell;
    for (var i=0;i<jsarray.length;i++){
        cell.cdr = new Zutsuki.Pair(jsarray[i],null);
        cell = cell.cdr;
    }

    if (tail){
        cell.cdr = tail;
    }
    return cell_top.cdr;
}




Array_man.convert_phase_1 = function(array_man_code1,const_data,global,stack){
    if (array_man_code1 === null){
        return null;
    }

    if (Array.isArray(array_man_code1)){
        var opecode = array_man_code1[0];
        if (opecode == "lambda" || opecode == "function"){
            const global_function = (!array_man_code1[4]) && (!array_man_code1[5]);
            const unconditional_renaming = array_man_code1[8];
            if (global_function){
                stack = []
            }

            var new_local_cell = [];

            const local_cell = {};
            for (var i=0;i<array_man_code1[1].length;i++){
                var gen_sym = Array_man.phase1_is_conflict_object(array_man_code1[1][i],stack,global,local_cell);

                if (unconditional_renaming){
                    gen_sym = Array_man.phase_1_unconditional_rename(array_man_code1[1][i],stack,global,local_cell);
                }else{
                    gen_sym = Array_man.phase1_is_conflict_object(array_man_code1[1][i],stack,global,local_cell);
                }

                if (gen_sym){
                    //名前が衝突
                    local_cell[array_man_code1[1][i]] = [3,gen_sym];
                    new_local_cell.push(gen_sym);
                    local_cell[gen_sym] = [3,gen_sym];
                }else{
                    local_cell[array_man_code1[1][i]] = Expand.UNDEFINED_OBJECT;
                    new_local_cell.push(array_man_code1[1][i]);
                }
            }
            array_man_code1[1] = new_local_cell;//追加した

            //可変長用
            var gen_sym = Array_man.phase1_is_conflict_object(array_man_code1[2],stack,global,local_cell);

            if (unconditional_renaming){
                gen_sym = Array_man.phase_1_unconditional_rename(array_man_code1[2],stack,global,local_cell);
            }else{
                gen_sym = Array_man.phase1_is_conflict_object(array_man_code1[2],stack,global,local_cell);
            }



            if (gen_sym){
                local_cell[array_man_code1[2]] = [3,gen_sym];
                local_cell[gen_sym] = [3,gen_sym];
            }else{
                local_cell[array_man_code1[2]] = Expand.UNDEFINED_OBJECT;
            }


            stack.unshift(local_cell);
            array_man_code1[3] = Array_man.convert_phase_1(array_man_code1[3],const_data,global,stack);
            stack.shift();

            if (global_function){
                const_data[0]++;
                const name = const_data[0];
                
                var new_code = ["function",array_man_code1[1],array_man_code1[2],array_man_code1[3],array_man_code1[6],array_man_code1[7]];
                const_data[name] = new_code;

                return new Zutsuki.Const_variable(name);
            }


            return array_man_code1;
        }else if (opecode == "let"){
            return Array_man.convert_phase_1_let(array_man_code1,const_data,global,stack);
        }else if (opecode == "lbegin"){
            for (var i=1;i<array_man_code1.length;i++){
                array_man_code1[i] = Array_man.convert_phase_1(array_man_code1[i],const_data,global,stack);
            }
            return array_man_code1;
        }else if (opecode == "lset!"){
            //alpha-renamingによって変更対象が変換されているかもしれないね。
            const tgt_sym = array_man_code1[1];
            for (var i=0;i<stack.length;i++){
                if (stack[i][tgt_sym]){
                    if (stack[i][tgt_sym][0] == 3){
                        array_man_code1[1] = stack[i][tgt_sym][1];
                        break;
                    }
                }
            }
            array_man_code1[2] = Array_man.convert_phase_1(array_man_code1[2],const_data,global,stack);
            return array_man_code1;
        }else if (opecode == "if"){
            for (var i=1;i<array_man_code1.length;i++){
                array_man_code1[i] = Array_man.convert_phase_1(array_man_code1[i],const_data,global,stack);
            }
            return array_man_code1;
        }else if (opecode == "quote"){
            return array_man_code1;
        }else if (opecode == "quasiquote"){
            array_man_code1[1] = Array_man.convert_phase_1(array_man_code1[1],const_data,global,stack);
            if (Array.isArray(array_man_code1[1]) && array_man_code1[1][0] == "quote"){
                return array_man_code1[1];
            }

            return array_man_code1;
        }else if (opecode == "qqlist"){
            var ls_len = array_man_code1[1].length ;
            var list_data = [];
            var plist_data = [];
            var list_list = ["qappend"];
            
            var rebuild_flag = false;//再構築が必要かどうか

            for (var i=0;i<ls_len ;i++){
                var c = array_man_code1[1][i];
                if (Array.isArray(c) && c[0] == "unquote-splicing"){
                    list_data = Array_man.convert_qq_list(list_data,["quote",null]);
                    list_list.push(list_data);
                    list_list.push(Array_man.convert_phase_1(c,const_data,global,stack));
                    list_data = [];
                    plist_data = [];
                    rebuild_flag = false;
                }else if (Array.isArray(c) && c[0] == "unquote"){
                    rebuild_flag = true;
                    var d = Array_man.convert_phase_1(c,const_data,global,stack);
                    list_data.push(["CONS",d,["quote",null]]);
                }else{
                    var d = Array_man.convert_phase_1(c,const_data,global,stack);
                    list_data.push(d);
                    plist_data.push(c[1]);
                }
            }
                
            var tail = null;
            if (array_man_code1[2]){
                tail = Array_man.convert_phase_1(array_man_code1[2],const_data,global,stack);
            }
 
                       
            if (!rebuild_flag){
                list_data = ["quote",Array_man.convert_list_literal(plist_data,array_man_code1[2])];

            }else{
                if (!tail){
                    tail = ["quote",null];
                }
                list_data = Array_man.convert_qq_list(list_data,tail);
            }

            if (list_list.length == 1){
                return list_data;
            }else{
                list_list.push(list_data);
                return list_list;
            }
        }else if (opecode == "qqconst"){
            if (!array_man_code1[1] || array_man_code1[1].type == Zutsuki.TYPE_PAIR || array_man_code1[1].type == Zutsuki.TYPE_VECTOR){
                const_data[0]++;
                const qqconstname = const_data[0];
                const_data[qqconstname] = ["quote",array_man_code1[1]];
                return new Zutsuki.Const_variable(qqconstname);
            }else{
                return array_man_code1[1];
            }
        }else if (opecode == "unquote"){
            return Array_man.convert_phase_1(array_man_code1[1],const_data,global,stack);
        }else if (opecode == "unquote-splicing"){
            return Array_man.convert_phase_1(array_man_code1[1],const_data,global,stack);
        }else if (opecode == "define-record-type"){
            return array_man_code1;
        }else if (opecode == "import"){
            //[import,libname ... ]
            var built_in_libraries = ["env-object"];//組み込みライブラリ
            var user_libraries = [];//ユーザ定義ライブラリ
            var ex_libraries = [];//コンパイル済み外部コードライブラリ
            {
                for (var i=1;i<array_man_code1.length;i++){
                    var is_internal_library = false;
                    if (array_man_code1[i][0] == "zutsuki"){
                        if (array_man_code1[i].length > 1){
                            if (array_man_code1[i][1] == "zero"){
                                built_in_libraries.push(array_man_code1[i]);
                                is_internal_library = true;
                            }
                        }
                    }else if (array_man_code1[i][0] == "scheme"){
                        built_in_libraries.push(array_man_code1[i]);
                        is_internal_library = true;
                    }else if (array_man_code1[i][0] == "ex"){
                        //built_in_libraries.push(array_man_code1[i]);
                        ex_libraries.push(array_man_code1[i][1]);
                        is_internal_library = true;
                    }
                    if (!is_internal_library){
                        //ユーザ定義ライブラリ
                        user_libraries.push(array_man_code1[i]);
                        is_internal_library = true;
                    }
                }
            }
            const_data[0]++;
            var qname = const_data[0];
            const_data[qname] = ["pass",built_in_libraries];//環境をconst_dataにセット
            return ["import",new Zutsuki.Const_variable(qname),user_libraries,ex_libraries];

        }else if (opecode == "import-with-export"){
            //library内のimport
            //第一要素にimportされるライブラリのexportされる識別子の集合が入っている
            //他は、importと同じ


            /*
            array_man_code1[0] = "env-object-with-export";
            const_data[0]++;
            var qname = const_data[0];
            const_data[qname] = ["pass",array_man_code1];
            return ["import",new Zutsuki.Const_variable(qname)];
            */
            var built_in_libraries = ["env-object-with-export",array_man_code1[1]];
            var user_libraries = [];
            {
                for (var i=2;i<array_man_code1.length;i++){
                    if (array_man_code1[i][0] == "zutsuki"){
                        built_in_libraries.push(array_man_code1[i]);
                    }else if (array_man_code1[i][0] == "scheme"){
                        built_in_libraries.push(array_man_code1[i]);
                    }else{
                        user_libraries.push(array_man_code1[i]);
                    }
                    //exライブラリ未追加
                }
            }
            

            const_data[0]++;
            var qname = const_data[0];
            const_data[qname] = ["pass",built_in_libraries];
                
            return ["import",new Zutsuki.Const_variable(qname),user_libraries];

        }else{
            //関数適用
            
            var fun = Array_man.convert_phase_1(opecode,const_data,global,stack);
            array_man_code1[0] = fun;

            var not_const = false;
            for (var i=1;i<array_man_code1.length;i++){
                array_man_code1[i] = Array_man.convert_phase_1(array_man_code1[i],const_data,global,stack);
                if (array_man_code1[i].type == Zutsuki.TYPE_INLINE_FUNCTION){
                    array_man_code1[i] = array_man_code1[i].const_sym;//引数部にinline functionが来た場合
                }

                if (Array.isArray(array_man_code1[i])){
                    not_const = true;
                }
            }
            //引数がすべてconstデータか変数だった場合
            //not_const はfalseとなる。


            if (!not_const && fun.type == Zutsuki.TYPE_INLINE_FUNCTION){

                var inline_cell = {};
                for (var i=0;i<fun.data[1].length;i++){
                    inline_cell[fun.data[1][i]] = array_man_code1[i+1];
                }
                var inline_ret = Array_man.P1_Inline.inlining(fun.data[3],inline_cell);//インライン展開
                return Array_man.convert_phase_1(inline_ret,const_data,global,stack);
            }

            return array_man_code1;
        }
    }else{

        if (array_man_code1.type == Zutsuki.TYPE_SYMBOL){
            const sym = array_man_code1.data;
            for (var i=0;i<stack.length;i++){
                if (stack[i][sym]){
                    if (stack[i][sym] == Expand.UNDEFINED_OBJECT){
                        
                    }else if (stack[i][sym][0] == 1){
                        return stack[i][sym][1];
                    }else if (stack[i][sym][0] == 2){
                        //インライン関数
                        return  new Zutsuki.Inline_function(const_data[stack[i][sym][1].data],stack[i][sym][1]);
                    }else if (stack[i][sym][0] == 3){
                        return Zutsuki.SYM(stack[i][sym][1]);
                    }else{
                        throw "ERR";
                    }
                    break;
                }
            }
        }else if (array_man_code1.type == Zutsuki.TYPE_RENAMED_SYMBOL){
            return array_man_code1.org;
        }

        return array_man_code1;
    }
}




Array_man.phase1 = function(array_man_code1,env,const_index,init_const_data){
    //このフェーズでやること
    //・定数データやグローバルに移動できる手続きを移動させる。
    //・ローカル関数のinline展開

    if (!const_index){
        const_index = 0;
    }
    var c = array_man_code1[0];
    while (1){
        if (c && c[0] == "let"){//?
            c = c[2];
        }else{
            break;
        }
    }


    var const_data = {0:const_index};
    if (init_const_data){
        const_data = init_const_data;
    }

    const array_man2 = [];
    for (var i=0;i<array_man_code1.length;i++){
        if (Array.isArray(array_man_code1[i]) && array_man_code1[i].length){
            array_man2.push(Array_man.convert_phase_1(array_man_code1[i],const_data,env.global,[]));
        }else{
            array_man2.push(array_man_code1[i]);
        }
    }

    return Array_man.phase2(array_man2,const_data,env);
}






Array_man.phase2_un_code_test = function(code,const_data){

    var const_base_symbol = "DATA_";

    var stack = [];
    function uncode(code){
        var ret = "";
        if (Array.isArray(code)){
            if (code[0] == "function" || code[0] == "lambda"){
                ret += "(lambda (";
                var cell = [];
                for (var i=0;i<code[1].length;i++){
                    ret += " " + code[1][i];
                    cell.push(code[1][i]);
                }
                if (code[2]){
                    ret += " . " + code[2];
                }
                
                ret += ")";

                ret += "   ";
                stack.unshift(cell);
                ret += uncode(code[3]) + ")";
                stack.shift();
            }else if (code[0] == "lbegin"){
                ret = "(  begin";
                for (var i=1;i<code.length;i++){
                    ret += " " + uncode(code[i]);
                }
                ret += " )";
            }else if (code[0] == "lset!"){
                ret += "(set! ";
                ret += code[1] + " ";
                ret += uncode(code[2]) + " ";
                ret += ")";
            }else if (code[0] == "local0"){
                ret += stack[0][code[1]];
            }else if (code[0] == "CONS"){
                ret += "(cons ";
                ret += uncode(code[1]) + " ";
                ret += uncode(code[2]) +")";
            }else if (code[0] == "CAR"){
                ret += "(car ";
                ret += uncode(code[1]) +")";
            }else if (code[0] == "CDR"){
                ret += "cdr ";
                ret += uncode(code[1]) + ")";
            }else if (code[0] == "NULL?"){
                ret += "null? ";
                ret += uncode(code[1]) + ")";
            }else if (code[0] == "global"){
                ret += code[1].data;
            }else if (code[0] == "built_in"){
                ret += code[1];
            }else{
                ret = "(";
                for (var i=0;i<code.length;i++){
                    ret += " " + uncode(code[i]);               
                }
                ret += " )";
            }
        
        }else{
            if (code === null){
                return "'()";
            }
            if (code.type == Zutsuki.TYPE_SYMBOL){
                ret = code.data;
            }else if (code.type == Zutsuki.TYPE_BOOLEAN){
                if (code.data){
                    ret = "#t";
                }else{
                    ret = "#f";
                }
            }else if (code.type == Zutsuki.TYPE_NUMBER){
                ret = code.data;
            }else if (code.type == Zutsuki.TYPE_CONST_VARIABLE){
                ret = const_base_symbol + code.data;
            }else if (code.type == Zutsuki.TYPE_CHAR){
                ret = code.data;
            }else{
                ret = "" + code;
            }
        }


        return ret;
    }

    var ret = "";
    for (var i=1;i<const_data[0]+1;i++){
        ret += "(define " + const_base_symbol + i + " ";
        ret += uncode(const_data[i]);
        ret += " ) \n";
    }
    for (var i=0;i<code.length;i++){
        ret += uncode(code[i]) + "\n";
    }



}






Array_man.convert_phase_2_let2 = function(code,const_data,env,stack){
    //破壊的変更なケース
    const func = ["lambda",[]];
    const args = [func];
    
    const local_cell = [];
    //const_data[const_data[0]] = func;

    for (var i=0;i<code[1].length;i++){
        func[1].push(code[1][i][0]);
        args.push(Array_man.convert_phase_2(code[1][i][1],const_data,env,stack));
        local_cell.push(code[1][i][0]);
    }
    func.push(null);
    
    stack.unshift(local_cell);
    code[2] = Array_man.convert_phase_2(code[2],const_data,env,stack);
    stack.shift();

    func.push(["pass",code[2]]);
    var res = Array_man.convert_phase_2(args,const_data,env,stack);
    return res;
}


Array_man.convert_phase_2_let = function(code,const_data,env,stack){
    if (code[1].length == 0){
        code[2] = Array_man.convert_phase_2(code[2],const_data,env,stack);
        return code[2];
    }else{
        const func = ["function",[]];
        const_data[0]++;
        const func_name = const_data[0];
        const func_run = [new Zutsuki.Const_variable(func_name)];
        
        const local_cell = [];
        const_data[const_data[0]] = func;

        for (var i=0;i<code[1].length;i++){
            func[1].push(code[1][i][0]);
            func_run.push(Array_man.convert_phase_2(code[1][i][1],const_data,env,stack));
            local_cell.push(code[1][i][0]);
        }
        func.push(null);
        //call-stackの長さは0なので以前までのstack情報にlocal_cellを加える必要性はない。
        code[2] = Array_man.convert_phase_2(code[2],const_data,env,[local_cell]);
        func.push(["pass",code[2]]);
        
        return func_run;
    }
}

Array_man.convert_phase2_function = function(code,const_data,env,stack){
    var local_cell = [];
    for (var i=0;i<code[1].length;i++){
        local_cell.push(code[1][i]);
    }
    if (code[2]){
        local_cell.push(code[2]);
    }
    stack.unshift(local_cell);
    code[3] = Array_man.convert_phase_2(code[3],const_data,env,stack);
    stack.shift();
    return code;
}


Array_man.convert_phase2_lambda = function(code,const_data,env,stack){
    var local_cell = [];
    for (var i=0;i<code[1].length;i++){
        local_cell.push(code[1][i]);
    }
    if (code[2]){
        local_cell.push(code[2]);
    }
    stack.unshift(local_cell);
    code[3] = ["pass",Array_man.convert_phase_2(code[3],const_data,env,stack)];
    stack.shift();
    code[0] = "function";
    const_data[0]++;
    const_data[const_data[0]] = code;
    return ["closure",const_data[0]];
}



Array_man.convert_phase_2 = function(code,const_data,env,stack){
    if (code === null){
    return null;
    }

    if (Array.isArray(code)){
        if (code[0] == "let"){
            return Array_man.convert_phase_2_let(code,const_data,env,stack);
        }else if (code[0] == "let2"){
            return Array_man.convert_phase_2_let2(code,const_data,env,stack);
        }else if (code[0] == "function"){
            return Array_man.convert_phase2_function(code,const_data,env,stack);
        }else if (code[0] == "lambda"){
            return Array_man.convert_phase2_lambda(code,const_data,env,stack);
        }else if (code[0] == "pass"){
            return code[1];
        }else if (code[0] == "lset!"){
            var tmp_symbol = new Zutsuki.Symbol(code[1],-1,null);
            code[1] = Array_man.convert_phase_2(tmp_symbol,const_data,env,stack);
            code[2] = Array_man.convert_phase_2(code[2],const_data,env,stack);
            
            return code;
        }else if (code[0] == "import"){
            return code;
        }else if (code[0] == "quote"){
            var qobj = code[1];
            if (!qobj){
                
            }else if (qobj.type == Zutsuki.TYPE_PAIR){
            
            }else if (qobj.type == Zutsuki.TYPE_VECTOR){

            }else if (qobj.type == Zutsuki.TYPE_SYMBOL){
            
            }else{
                return qobj;
            }
            const_data[0]++;
            var qname = const_data[0];
            const_data[qname] = ["pass",code];
            
            return new Zutsuki.Const_variable(qname);
        }

        for (var i=1;i<code.length;i++){
            code[i] = Array_man.convert_phase_2(code[i],const_data,env,stack);
        }



        if (code[0].type == Zutsuki.TYPE_SYMBOL){
            //REPLモードかつlocal内(評価が遅延される場合-globalに直接つながっているletは除いても良いと思う)の場合、この機能は切っておく。/
            //-REPLモードは、expand時にenv.globalの初期値にExpand.UNDEFINED_OBJECTを入れるのでチェック不要だった。
  

            //import時にrenameできる機能があるので、現在の判定方法はまずい          
            if (code[0].data == "cons"){
                if (env[code[0].data] == Expand.BUILT_IN_FUNCTION){
                    code[0] = "CONS";
                    return code;
                }
            }else if (code[0].data == "car"){
                if (env[code[0].data] == Expand.BUILT_IN_FUNCTION){
                    code[0] = "CAR";
                    return code;
                }
            }else if (code[0].data == "cdr"){
                if (env[code[0].data] == Expand.BUILT_IN_FUNCTION){
                    code[0] = "CDR";
                    return code;
                }
            }else if (code[0].data == "apply"){
               if (env[code[0].data] == Expand.BUILT_IN_FUNCTION && code.length == 3){
                    code[0] = "APPLY";
                    return code;
                }
            }else if (code[0].data == "null?"){
                if (env[code[0].data] == Expand.BUILT_IN_FUNCTION){
                    code[0] = "NULL?";
                    return code;
                }
            }else if (code[0].data == "pair?"){
                 if (env[code[0].data] == Expand.BUILT_IN_FUNCTION){
                    code[0] = "PAIR?";
                    return code;
                }               
            }else if (code[0].data == "set-car!"){
                  if (env[code[0].data] == Expand.BUILT_IN_FUNCTION){
                    code[0] = "SET-CAR!";
                    return code;
                  }
            }else if (code[0].data == "set-cdr!"){
              if (env[code[0].data] == Expand.BUILT_IN_FUNCTION){
                    code[0] = "SET-CDR!";
                    return code;
                }               
            }else if (code[0].data == "eqv?"){
                if (env[code[0].data] == Expand.BUILT_IN_FUNCTION){
                    code[0] = "EQV?";
                    return code;
                }               
            }else if (code[0].data == "+"){
                if (env[code[0].data] == Expand.BUILT_IN_FUNCTION){
                    if (code.length == 1){
                        //(+) -> 0
                        return new Zutsuki.Number("0",Zutsuki.NUMBER_TYPE_UNSIGNED_INTEGER);
                    }else if (code.length == 2){
                        //(+ NUM) -> NUM
                        return code[1];
                    }else{
                        var first = code[1];
                        var second = code[2];
                        var res_exp = ["ADD",first,second];
                        for (var i=3;i<code.length;i++){
                            res_exp = ["ADD",code[i],res_exp];
                        }
                        return res_exp;
                    }


                }
            }else if (code[0].data == "*"){
                 if (env[code[0].data] == Expand.BUILT_IN_FUNCTION){
                    if (code.length == 1){
                        //(*) -> 1
                        return new Zutsuki.Number("1",Zutsuki.NUMBER_TYPE_UNSIGNED_INTEGER);
                    }else if (code.length == 2){
                        //(* NUM) -> NUM
                        return code[1];
                    }else{
                        var first = code[1];
                        var second = code[2];
                        var res_exp = ["MUL",first,second];
                        for (var i=3;i<code.length;i++){
                            res_exp = ["MUL",code[i],res_exp];
                        }
                        return res_exp;
                    }


                }           
            }else if (code[0].data == "-"){
                 if (env[code[0].data] == Expand.BUILT_IN_FUNCTION){
                    if (code.length == 1){
                        throw "ERROR!";
                    }else if (code.length == 2){
                        //(- NUM) -> -NUM
                        return ["SUB",new Zutsuki.Number("0",Zutsuki.NUMBER_TYPE_UNSIGNED_INTEGER),code[1]];

                    }else if (code.length == 3){
                        return ["SUB",code[1],code[2]];
                    }else{
                        var first = code[1];  
                        var second = code[2];  
                        var third = code[3];  
                        var res_exp = ["SUB",second,third];
                        for (var i=4;i<code.length;i++){
                            res_exp = ["SUB",code[i],res_exp];
                        }
                        res_exp = ["SUB",first,res_exp];
                        return res_exp;
                    }

                }           
            }else if (code[0].data == "="){
                 if (env[code[0].data] == Expand.BUILT_IN_FUNCTION){
                     if (code.length < 3){
                        throw "ERROR";
                     }else{
                        var first = code[1];
                        var second = code[2];
                        var res_exp = ["EQ2",first,second];
                        for (var i=3;i<code.length;i++){
                            res_exp = ["EQ2X",code[i],res_exp];
                        }
                        return res_exp;
                     }
                 }
            }
        }

        code[0] = Array_man.convert_phase_2(code[0],const_data,env,stack);
    }else{
        if (code.type == Zutsuki.TYPE_SYMBOL){
            for (var i=0;i<stack.length;i++){
                for (var j=0;j<stack[i].length;j++){
                    if (code.data == stack[i][j]){
                        if (i == 0){
                            return ["local0",j];
                        }else{
                            return ["local1",i,j];
                        }
                    }
                }
            }
            /*
            いらなさそうなのでカット
            復活させるかも
            if (env[code.data] == Expand.BUILT_IN_FUNCTION){
                return ["built_in",code.data];
            }
            */

            return ["global",code];
        }
    }
    return code;
}



Array_man.phase2 = function(array_man_code2,const_data,env){
    //このフェーズでやること
    //let を lambdaに展開
    //スコープの判断
    //組み込み関数であるかの判断

    var phase3 = [];
    for (var i=0;i<array_man_code2.length;i++){
        var ret = Array_man.convert_phase_2(array_man_code2[i],const_data,env.global,[]);
        //ret = array_man_code2[i];
        phase3.push(ret);
    }

    //Array_man.phase2_un_code_test(phase3,const_data);
    
    for (var i=1;i<const_data[0]+1;i++){
        if (const_data[i]){
            const_data[i] = Array_man.convert_phase_2(const_data[i],const_data,env.global,[]);
        }
    }
    return [phase3,const_data,env];
}



Array_man.library_tuning = function(name,code,const_start,const_data,export_symbols){
    function loop(code){
        if (Array.isArray(code)){
            var opecode = code[0];
            if (opecode == "function"){
                loop(code[3]);
            }else if (opecode == "quote"){
            
            }else if (opecode == "global"){
                var name = code[1];
                code[0] = "globalx";
                code[1] = env_object;
                code[2] = name;
            }else if (opecode == "gset!"){
                var name = code[1];
                var body = code[2];
                code[0] = "gsetx!";
                code[1] = env_object;
                code[2] = name;
                code[3] = body;
                loop(body);
            }else {
                for (var i=0;i<code.length;i++){
                    loop(code[i]);
                }
            }
        }else{
            
        }
    }

    var env_object = null;//内部のimport要素から取り出す
    var codes = [];
    for (var i=0;i<code.length;i++){
        if (code[i][0] == "import"){
            env_object = code[i][1];
        }else{
            loop(code[i]);
            codes.push(code[i]);
        }
    }

    for (var i=const_start;i<const_data[0]+1;i++){
        loop(const_data[i]);
    }
    if (codes.length == 1){
        codes = codes[0];
    }else{
        var _codes = ["gbegin"];
        for (var i=0;i<codes.length;i++){
            _codes.push(codes[i]);
        }
        codes = _codes;
    }


    var res = ["define-library",name,env_object,codes];
    return res;
}
