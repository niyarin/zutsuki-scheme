const Exr = {};

const is_node = typeof require !== "undefined";
if (is_node){
    module.exports = Exr;
    const Zutsuki = require("./zutsuki");
}



Exr.convert_external_representation = function(input,prepro_flag,is_repl_mode,acobjects,pstack){
    var atom_and_container_objects = [];
    var parentheses_stack = [];
    if (acobjects){
        atom_and_container_objects = acobjects;
    }

    if (pstack){
        parentheses_stack = pstack;
    }



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
            while (p>0){//!!後ろから探索している
                console.log("!!",list[p]);
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
                    ;// <label> = <datum> | <label>#
                    if (typeof list[p-2] == "object" && list[p-2].type == Zutsuki.TYPE_DATUM_LABEL){
                        list[p-2] = label_expand(list[p],list[p-2].data,list[p]);
                        p--;
                    }else{
                        //ただの=
                        ret.unshift(list[p]);
                    }
                }else{
                    ret.unshift(list[p]);
                }
                p--;
            }

            ret.unshift(list[0]);
            return ret;
        }



        const end = input.length;

        var global_atoms = [];//括弧の外側のdatum labelを別で処理するためのコンテナ
        var pos = 0; 
        while (pos<end){

            if (input[pos]  == "("){
                parentheses_stack.unshift([0]);
            }else if (input[pos] == "#("){
                parentheses_stack.unshift([1]);
            }else {
                var tgt = null;
                if (input[pos] == ")"){
                    if (parentheses_stack.length){
                        tgt = datum_expand(parentheses_stack.shift());
                        if (tgt[0] == 0){
                            tgt = a2p(tgt);
                        }else if (tgt[0] == 1){
                            //vector literal
                            var vector_data = new Array(tgt.length-1);
                            for (var i=1;i<tgt.length;i++){
                                vector_data[i-1] = tgt[i];
                            }
                            tgt = new Zutsuki.Vector(vector_data);
                        }
                    }else{
                        //余計な括弧がある
                        throw new Zutsuki.Error("extra close parentheses");
                    }
                }else{
                    tgt = input[pos];
                }

                
                if (parentheses_stack.length){
                    parentheses_stack[0].push(tgt);
                }else{
                    if (tgt && typeof tgt == "object" && tgt.type == Zutsuki.TYPE_PAIR){
                        if (global_atoms.length == 0){
                            atom_and_container_objects.push(tgt);
                        }else{
                            global_atoms.push(tgt);
                            var dexpand_res = datum_expand(global_atoms);
                            for (var i=0;i<dexpand_res.length;i++){
                                atom_and_container_objects.push(dexpand_res[i]);
                            }
                            global_atoms = [];
                        }
                    }else{
                        global_atoms.push(tgt);
                    }
                }
            }
            pos++;
        }
        
        for (var i=0;i<global_atoms.length;i++){
            atom_and_container_objects.push(global_atoms[i]);
        }

        if (parentheses_stack.length > 0){
            //括弧が閉じられていないケース
            if (is_repl_mode){
                return new Zutsuki.Reread(parentheses_stack,atom_and_container_objects);
            }else{
                throw new Zutsuki.Error("missing close parentheses");
            }           

        }
    }

   
    return atom_and_container_objects;
}


