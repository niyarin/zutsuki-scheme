const Exr = {};

const is_node = typeof require !== "undefined";
if (is_node){
    module.exports = Exr;
    const Zutsuki = require("./zutsuki");
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




Exr.convert_external_representation = function(input,prepro_flag){
    const atom_and_container_objects = [];
    {
        //括弧を内部表現化する。
        const quote_symbol = new Zutsuki.Symbol("quote",-1,Zutsuki.GENERATED_TAG);
        const quasiquote_symbol = new Zutsuki.Symbol("quasiquote",-1,Zutsuki.GENERATED_TAG);
        const unquote_symbol = new Zutsuki.Symbol("unquote",-1,Zutsuki.GENERATED_TAG);
        const unquote_splicing_symbol = new Zutsuki.Symbol("unquote-splicing",-1,Zutsuki.GENERATED_TAG);


        function a2p(a){
            //js arrayをscm listに変換する
            var ret = Zutsuki.ZP(null,null);
            var ret_head = ret;
            for (var i=1;i<a.length;i++){
                if (a[i] == "."){
                  if (i == a.length-1){
                    throw "ERR";
                  }
                  ret.cdr = a[i+1];
                }else{
                  ret.cdr = Zutsuki.ZP(a[i],null);
                }
                ret = ret.cdr;
            }
            return ret_head.cdr;
        }

        function label_expand(obj,key,data){
            // <label># をobjectに変換する。
            if (typeof obj == "object"){
                if (obj.type == Zutsuki.TYPE_PAIR){
                    var cell = obj;
                    var prev_cell = null;
                    while (cell){
                        if (cell && typeof cell == "object" && cell.type != Zutsuki.TYPE_PAIR){
                            prev_cell.cdr = label_expand(cell,key,data);   
                            break;
                        }
                        cell.circle_flag = true;
                        cell.car = label_expand(cell.car,key,data);
                        prev_cell = cell;
                        cell = cell.cdr;
                    }
                    return obj;
                }else if (obj.type == Zutsuki.TYPE_VECTOR){
                    //未実装
                }else{
                    return obj;
                }
            }
            if (key == obj){
                return data;
            }
            return obj;
        }
        


        function datum_expand(list){
            //quote quasiquote の記号を展開、<label>=の展開
            var ret = [];
            var p = list.length-1;
            while (p>0){
                if (list[p-1] == "'"){
                    list[p-1] = Zutsuki.ZP(quote_symbol,Zutsuki.ZP(list[p],null));
                }else if (list[p-1] == "`"){
                    list[p-1] = Zutsuki.ZP(quasiquote_symbol,Zutsuki.ZP(list[p],null));
                }else if (list[p-1] == ","){
                    list[p-1] = Zutsuki.ZP(unquote_symbol,Zutsuki.ZP(list[p],null));
                }else if (list[p-1] == ",@"){
                    list[p-1] = Zutsuki.ZP(unquote_splicing_symbol,Zutsuki.ZP(list[p],null));
                }else if (list[p] == "#"){
                    if (typeof list[p-1] == "object" && list[p-1].type == Zutsuki.TYPE_DATUM_LABEL){
                        list[p-1] = list[p-1].data;
                    }
                }else if (typeof list[p-1] == "object" && list[p-1] && list[p-1].data == "="){
                    //list[p]がdatum_labelのときerror
                    if (typeof list[p-2] == "object" && list[p-2].type == Zutsuki.TYPE_DATUM_LABEL){
                        list[p-2] = label_expand(list[p],list[p-2].data,list[p]);
                        p--;
                    }else{
                        //error
                    }

                }else{
                    ret.unshift(list[p]);
                }
                p--;
            }

            ret.unshift(list[0]);
            return ret;
        }



        const parentheses_stack = [];
        const end = input.length;
        var pos = 0; 
        while (pos<end){

            if (input[pos]  == "("){
                parentheses_stack.unshift([0]);
            }else if (input[pos] == "#("){
                parentheses_stack.unfhift([1]);
            }else {
                var tgt = null;
                if (input[pos] == ")"){
                    if (parentheses_stack.length){
                        tgt = datum_expand(parentheses_stack.shift());
                        if (tgt[0] == 0){
                            tgt = a2p(tgt);
                        }
                    }else{
                        //error(extra close)
                    }
                }else{
                    tgt = input[pos];
                }

                
                if (parentheses_stack.length){
                    parentheses_stack[0].push(tgt);
                }else{
                    atom_and_container_objects.push(tgt);
                }
            }
            pos++;
        }
    }

    console.log("");
    console.log("");
    console.log("");
    for (var i=0;i<atom_and_container_objects.length;i++){
        scheme_test_print(atom_and_container_objects[i]);
    }
    
    return atom_and_container_objects;
}


