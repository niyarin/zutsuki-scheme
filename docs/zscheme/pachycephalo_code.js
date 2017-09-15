var is_node = typeof require !== "undefined";


var Pachycephalo_Code = {};

if (is_node){
    module.exports = Pachycephalo_Code;

    const Pachycephalo = require("./pachycephalo");
    const Expand = require("./expand");
}



Pachycephalo_Code.conv_excode = function(code){
    if (code === null){
        return "null";
    }

    if (Array.isArray(code)){
        var st = "[";
        for (var i=0;i<code.length;i++){
            st+=Pachycephalo_Code.conv_excode(code[i]);
            if (i != code.length-1){
                st+=",";
            }
        }
        st += "]";
        return st;
    }else if (typeof code == "object"){
        if (code.type == Pachycephalo.TYPE_INTEGER){
            return '{"type":' + Pachycephalo.TYPE_INTEGER + "," + '"number":' + code.number + "}";
        }else if (code.type == Pachycephalo.TYPE_PROCEDURE){
            var ex_fcode = Pachycephalo_Code.conv_excode(code.code);
            var ex_arg1 = Pachycephalo_Code.conv_excode(code.arg1);
            var ex_arg2 = Pachycephalo_Code.conv_excode(code.arg2);
            return '{"type":' + Pachycephalo.TYPE_PROCEDURE + ',"arg1":' + ex_arg1 + ',"arg2":' + ex_arg2 + ',"arg1_size":' + code.arg1_size + ',"code":' + ex_fcode + "}";
        }else if (code.type == Pachycephalo.TYPE_STRING){
            return '{"type":'+Pachycephalo.TYPE_STRING + ',"data":"' + code.data + '"}';
        }else if (code.type == Pachycephalo.TYPE_NULL){
            return '{"type":'+ code.type + "}";
        }else if (code.type == Pachycephalo.TYPE_VECTOR){
            throw "SORRY";
        }
        console.log(code);
        throw "SORRY";
    }else if (typeof code == "string"){
        return '"' + code + '"';
    }else{
        return code;
    }
}





Pachycephalo_Code.export = function(name,code,const_code){
    //Pachycephaloコードをjsonに出力する
    var main_excode = Pachycephalo_Code.conv_excode(code);
    var const_excode = "[";
    for (var i=0;i<const_code[0];i++){
        const_excode+=Pachycephalo_Code.conv_excode(const_code[i]);
        if (i != const_code[0]-1){
            const_excode += ",";
        }
    }
    const_excode += "]";
    
    var res = '{"code":'+main_excode + ',"const_code":' + const_excode + ',"name":"' + name + '"}';
    return res;
}




Pachycephalo_Code.code_shift = function(shift,code,to_lib,eid,env,res_init){
    var new_res = [];
    if (res_init){
        new_res = res_init;
    }

    var skip_update = function(arr){
        var res = [];
        for (var i=0;i<arr.length;i++){
            if (arr[i][0]-1>0){
                arr[i][0]--;
                res.push(arr[i]);
            }
        }    
        return res;
    }


    var i=0;
    var skipper = [];
    while (i<code.length){
        var c = code[i];
        if (c == Pachycephalo.VmCode.PUSH ||
            c == Pachycephalo.VmCode.LOADL||c == Pachycephalo.VmCode.SETL||c == Pachycephalo.VmCode.ARGS || c == Pachycephalo.VmCode.LOADGX||c == Pachycephalo.VmCode.CREATE_VECTOR || c == Pachycephalo.VmCode.VECTOR_REF||
            c == Pachycephalo.VmCode.VECTOR_SET){
            new_res.push(c);
            new_res.push(code[i+1]);
            i++;
            skipper = skip_update(skipper);
        }else if (c == Pachycephalo.VmCode.SKIP){
            new_res.push(c);
            new_res.push(code[i+1]);
            skipper.push([code[i+1],new_res.length-1]);
            i++;
        }else if (c == Pachycephalo.VmCode.LOADG){
            if (to_lib){
                new_res.push(Pachycephalo.VmCode.LOAD_CONST);
                new_res.push(eid);
                new_res.push(Pachycephalo.VmCode.LOADGX);
                new_res.push(code[i+1]);
                i++;
                
                skipper = skip_update(skipper);
                for (var j=0;j<skipper.length;j++){
                    new_res[skipper[j][1]] += 2;
                }

            }else{
                new_res.push(c);
                new_res.push(code[i+1]);
                i++;
                skipper = skip_update(skipper);
            }
        }else if (c == Pachycephalo.VmCode.SETG){
            new_res.push(c);
            new_res.push(code[i+1]);
            env.export_symbols.push(code[i+1]);
            i++;

            skipper = skip_update(skipper);

        }else if (c == Pachycephalo.VmCode.LOADLX || c == Pachycephalo.VmCode.SETLX || c == Pachycephalo.VmCode.PUSH_WIND){
            new_res.push(c);
            new_res.push(code[i+1]);
            new_res.push(code[i+2]);
            i+=2;

            skipper = skip_update(skipper);
            skipper = skip_update(skipper);

        }else if (c == Pachycephalo.VmCode.TOP){
            i++;
            skipper = skip_update(skipper);
        }else if (c == Pachycephalo.VmCode.END){
            new_res.push(Pachycephalo.VmCode.POP);
        }else if (c == Pachycephalo.VmCode.EXIT){
            break;
        }else if (c == Pachycephalo.VmCode.LOAD_CONST||c == Pachycephalo.VmCode.CLOSURE){
            new_res.push(c);
            new_res.push(code[i+1]+shift);
            i++;
            skipper = skip_update(skipper);
        }else{
            new_res.push(c);
        }
        i++;
        skipper = skip_update(skipper);
    }
    return new_res;
}

Pachycephalo_Code.const_code_shift = function(shift,obj,to_lib,eid,env){
    if (obj.type == Pachycephalo.TYPE_PROCEDURE){
        obj.code = Pachycephalo_Code.code_shift(shift,obj.code,to_lib,eid,env,false);
        //コピーしたほうが良い??
        return obj;
    }else{
        return obj;
    }
}


Pachycephalo_Code.const_shift = function(const_code,exs,to_lib){
    to_lib = true;
    var shift = 0;
    var res = [];
    var eid = false;
    var env  = null;
    for (var i=0;i<exs.length;i++){
        var exports = [];
        if (to_lib){
            env = new Expand.Expand_env();
            const_code[0]++;
            eid = const_code[0];
            const_code[eid] = ["env-object-with-export",exports,["zutsuki","zero"]];
        }
            
 
        shift = const_code[0];
        var eobj = exs[i][1];
        var res_ex = [exs[i][0]];

        var res_init = [Pachycephalo.VmCode.LOAD_CONST,eid,Pachycephalo.VmCode.IMPORT];
        var main_code = Pachycephalo_Code.code_shift(shift,eobj.code,to_lib,eid,env,res_init)
        res_ex.push(main_code);
        {
           for (var k=0;k<env.export_symbols.length;k++){
                exports.push([env.export_symbols[k]]);
            }
        }
        
        for (var j=1;j<eobj.const_code[0];j++){
            const_code[shift+j] = ["pass",Pachycephalo_Code.const_code_shift(shift,eobj.const_code[j],to_lib,eid,env)];
        }
        const_code[0]+=eobj.const_code[0]-1;
        res.push(res_ex);
        if (to_lib){
            main_code.push(Pachycephalo.VmCode.PUSH);
            main_code.push(new Pachycephalo.Vector([new Pachycephalo.Symbol("ex"),new Pachycephalo.Symbol(exs[i][0])]));
            main_code.push(Pachycephalo.VmCode.SET_LIBNAME);
            main_code.push(Pachycephalo.VmCode.RESET_ENV);
        }
    }
    return res;
}

