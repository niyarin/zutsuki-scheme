var Compile = {};

var is_node = typeof require !== "undefined";
if (is_node){
    module.exports = Compile;
    const Pachycephalo = require("./pachycephalo");
}

const VMCODE = Pachycephalo.VmCode;


Compile.zutsuki_object2pachycephalo_object = function(zobject){
    var searched = {};
    function loop(zobj){
        if (!zobj){
            return Pachycephalo.NULL_OBJECT;
        }

        if (zobj.type == Zutsuki.TYPE_PAIR){
            var car_data = loop(zobj.car);
            var cdr_data = loop(zobj.cdr);
            return new Pachycephalo.Pair(car_data,cdr_data);   
        }else if (zobj.type == Zutsuki.TYPE_VECTOR){
            var vec_data = [];
            for (var i=0;i<zobj.data.length;i++){
                vec_data.push(Compile.zutsuki_object2pachycephalo_object(zobj.data[i]));   
            }
            return new Pachycephalo.Vector(vec_data);
        }else if (zobj.type == Zutsuki.TYPE_NUMBER){
            if (zobj.number_type == Zutsuki.NUMBER_TYPE_UNSIGNED_INTEGER ){
                return new Pachycephalo.Integer(parseInt(zobj.data));
            }
        }else if (zobj.type == Zutsuki.TYPE_SYMBOL){
            return new Pachycephalo.Symbol(zobj.data);
        }else{
            throw "SORRY1";
        }
    }

    return loop(zobject);
}


Compile.libname_compile = function(arr){
    var res = [];
    for (var i=0;i<arr.length;i++){
        res.push(new Pachycephalo.Vector(arr[i]));
    }
    return new Pachycephalo.Vector(res);
}


Compile.compile_loop = function(code,env,ret,tail){
    if (Array.isArray(code)){
        var opecode = code[0];
        if (opecode == "if"){
            Compile.compile_loop(code[1],env,ret);
            ret.push(VMCODE.UNLESS);
            var true_case = [];
            Compile.compile_loop(code[2],env,true_case,tail);
            var false_case = [];
            Compile.compile_loop(code[3],env,false_case,tail);

            
            //ret.push(["skip",true_case.length + 1]);
            ret.push(VMCODE.SKIP);
            ret.push(true_case.length+3);
            for (var i=0;i<true_case.length;i++){
                ret.push(true_case[i]);
            }
            //ret.push(["skip",false_case.length ]);
            ret.push(VMCODE.SKIP)
            ret.push(false_case.length+1);
            for (var i=0;i<false_case.length;i++){
                ret.push(false_case[i]);
            }
        }else if (opecode == "function"){
            var body = [];
            Compile.compile_loop(code[3],env,body,tail);
            body.push(VMCODE.RET);
            var proc = new Pachycephalo.Procedure(body,code[1],code[2],code[5],code[4]);
            /*
            ret.push(["function"]);
            ret.push(code[1]);
            ret.push(code[2]);
            ret.push(["push-addr",body.length + 1]);
            for (var i=0;i<body.length;i++){
                ret.push(body[i]);
            }
            ret.push(["ret"]);
            */
            ret.push(proc);
        }else if (opecode == "closure"){
            //ret.push(["closure",code[1]]);
            ret.push(VMCODE.CLOSURE);
            ret.push(code[1]);
        }else if (opecode == "global"){

            ret.push(VMCODE.LOADG);
            ret.push(code[1].data);
        }else if (opecode == "local0"){
            //ret.push(["lload",code[1]]);
            ret.push(VMCODE.LOADL);
            ret.push(code[1]);
        }else if (opecode == "local1"){
            //ret.push(["lxload",code[1],code[2]]);
            ret.push(VMCODE.LOADLX);
            ret.push(code[1]-1);
            ret.push(code[2]);
        }else if (opecode == "gset!"){
            Compile.compile_loop(code[2],env,ret,0);
            ret.push(VMCODE.SETG);
            ret.push(code[1]);           
        }else if (opecode == "lset!"){
            Compile.compile_loop(code[2],env,ret,0);
            var sym = code[1];

            if (sym[0] == "local1"){
                ret.push(VMCODE.SETLX);
                ret.push(sym[1]-1);
                ret.push(sym[2]);
            }else if (sym[0] == "local0"){
                ret.push(VMCODE.SETL);
                ret.push(sym[1]);
            }
        }else if (opecode == "lbegin"){
            for (var i=1;i<code.length-1;i++){
                Compile.compile_loop(code[i],env,ret,0);
                ret.push(VMCODE.POP);
            }
            Compile.compile_loop(code[code.length-1],env,ret,tail);
        }else if (opecode == "gbegin"){
            for (var i=1;i<code.length-1;i++){
                Compile.compile_loop(code[i],env,ret,1);
                ret.push(VMCODE.POP);
            }
            if (code.length == 1){
                ret.push(VMCODE.PUSH);
                ret.push(Pachycephalo.UNDEF_OBJECT);
            }else{
                Compile.compile_loop(code[code.length-1],env,ret,1);
            }
        }else if (opecode == "CONS"){
            Compile.compile_loop(code[1],env,ret,0);
            Compile.compile_loop(code[2],env,ret,0);
            ret.push(VMCODE.CONS);
        }else if (opecode == "CAR"){
            Compile.compile_loop(code[1],env,ret,0);
            ret.push(VMCODE.CAR);
        }else if (opecode == "CDR"){
            Compile.compile_loop(code[1],env,ret,0);
            ret.push(VMCODE.CDR);
        }else if (opecode == "NULL?"){
            Compile.compile_loop(code[1],env,ret,0);
            ret.push(VMCODE.IS_NULL);
        }else if (opecode == "PAIR?"){
            Compile.compile_loop(code[1],env,ret,0);
            ret.push(VMCODE.IS_PAIR);
        }else if (opecode == "APPLY"){
            //ARGSデータはリストとして管理しているので、VMCODE.CALLするだけでよい
            Compile.compile_loop(code[2],env,ret,0);
            Compile.compile_loop(code[1],env,ret,0);
            ret.push(VMCODE.CALL);
        }else if (opecode == "SET-CAR!"){
            Compile.compile_loop(code[1],env,ret,0);
            Compile.compile_loop(code[2],env,ret,0);
            ret.push(VMCODE.SET_CAR);
        }else if (opecode == "SET-CDR!"){
            Compile.compile_loop(code[1],env,ret,0);
            Compile.compile_loop(code[2],env,ret,0);
            ret.push(VMCODE.SET_CDR);
        }else if (opecode == "EQV?"){
            Compile.compile_loop(code[1],env,ret,0);
            Compile.compile_loop(code[2],env,ret,0);
            ret.push(VMCODE.EQV);
        }else if (opecode == "ADD"){
            Compile.compile_loop(code[1],env,ret,0);
            Compile.compile_loop(code[2],env,ret,0);
            ret.push(VMCODE.ADD2);
        }else if (opecode == "MUL"){
            Compile.compile_loop(code[1],env,ret,0);
            Compile.compile_loop(code[2],env,ret,0);
            ret.push(VMCODE.MUL2);
        }else if (opecode == "SUB"){
            Compile.compile_loop(code[1],env,ret,0);
            Compile.compile_loop(code[2],env,ret,0);
            ret.push(VMCODE.SUB2);
        }else if (opecode == "EQ2"){
            Compile.compile_loop(code[1],env,ret,0);
            Compile.compile_loop(code[2],env,ret,0);
            ret.push(VMCODE.EQ2);
        }else if (opecode == "EQ2X"){
            ret.push(VMCODE.PUSH_TRUE);
            Compile.compile_loop(code[1],env,ret,0);
            Compile.compile_loop(code[2],env,ret,0);
            ret.push(VMCODE.EQ2X); 
            for (var i=3;i<code.length;i++){
                Compile.compile_loop(code[i],env,ret,0);
                ret.push(VMCODE.EQ2X);     
            }
            ret.push(VMCODE.POP);
        }else if (opecode == "call-with-values"){
            ret.push(VMCODE.PUSH_NULL);
            Compile.compile_loop(code[1],env,ret,0);
            ret.push(VMCODE.CALL);
            ret.push(VMCODE.RECEIVE);
            ret.push(VMCODE.CONS);
            Compile.compile_loop(code[2],env,ret,0);
            ret.push(VMCODE.CALL);
        }else if (opecode == "built_in"){
            exit(111);
        }else if (opecode == "define"){
            Compile.compile_loop(code[2],env,ret,0);
            ret.push(VMCODE.SETG);
            ret.push(code[1]);
        }else if (opecode == "quote"){
            if (!code[1]){
                ret.push(Pachycephalo.NULL_OBJECT);
            }else{
                ret.push(Compile.zutsuki_object2pachycephalo_object(code[1]));
            }
       }else if (opecode == "env-object"){
            var env = new Pachycephalo.Environment(null);
            for (var i=1;i<code.length;i++){
                if (code[i][0] == "zutsuki"){
                    if (code[i][1] == "zero"){
                        Pachycephalo.set_pachycephalo_zero(env);
                    }else{
                        throw "SORRY";
                    }
                }else if (code[i][0] == "scheme"){
                    throw "SORRY!!!!";
                }else if (code[i][0] == "ex"){
                    throw "SORRY??";
                }else{

                    throw "SORRY!!";
                }
            }

            ret.push(env);
       }else if (opecode == "env-object-with-export"){
           var env = new Pachycephalo.Environment(null);
           env.export_symbols = code[1];
           for (var i=2;i<code.length;i++){
                if (code[i][0] == "zutsuki"){
                    if (code[i][1] == "zero"){
                        Pachycephalo.set_pachycephalo_zero(env);
                    }else{
                        throw "SORRY";
                    }
                }else{
                    throw "SORRY!!";
                }
           }
           ret.push(env);
       }else if (opecode == "globalx"){
           Compile.compile_loop(code[1],env,ret,0);
           ret.push(VMCODE.LOADGX);
           ret.push(code[2].data);
       }else if (opecode == "import"){
           Compile.compile_loop(code[1],env,ret,0);//env-objectをstackにpushさせる
           ret.push(VMCODE.IMPORT);

           //ユーザ定義ライブラリ
           for (var i=0;i<code[2].length;i++){
               ret.push(VMCODE.PUSH);
               ret.push(Compile.libname_compile(code[2][i]));//arrayからPachycephalo.Vectorに変換
               ret.push(VMCODE.ADD_LIBRARY);
           }
            
           /*
           //外部ライブラリを展開
           for (var i=0;i<code[3].length;i++){
               for (var j=0;j<env.exs.length;j++){
                   if (env.exs[j][0] == code[3][i]){
                       for (var k=0;k<env.exs[j][1].length;k++){
                            ret.push(env.exs[j][1][k]);
                       }
                   }
               }
           }
           */
            
           for (var i=0;i<code[3].length;i++){
                ret.push(VMCODE.PUSH);
               ret.push(Compile.libname_compile(["ex",code[3][i]]));
               ret.push(VMCODE.ADD_LIBRARY);
           }
        }else if (opecode == "qappend"){
            console.log(code);
            exit(10000000);
        }else if (opecode == "define-library"){
            //[define-library,name,env_object,codes]
            Compile.compile_loop(code[2],env,ret,0);//環境をpush
            ret.push(VMCODE.IMPORT);
            Compile.compile_loop(code[3],env,ret,0);//コードをpush
            ret.push(VMCODE.POP);
            ret.push(VMCODE.PUSH);
            ret.push(Compile.libname_compile(code[1]));//ライブラリ名をpush
            ret.push(VMCODE.SET_LIBNAME);
            ret.push(VMCODE.RESET_ENV);
        }else if (opecode == "record-predicate"){
            Compile.compile_loop(code[2],env,ret,0);
            ret.push(VMCODE.PUSH);
            ret.push(new Pachycephalo.Symbol(code[1]));
            ret.push(VMCODE.RECORD_PREDICATE);
        }else if (opecode == "record-constructor"){
            for (var i=2;i<code.length;i++){
                Compile.compile_loop(code[i],env,ret,0);
            }
            ret.push(VMCODE.CREATE_VECTOR);
            ret.push(code.length - 2);
            ret.push(VMCODE.PUSH);
            ret.push(new Pachycephalo.Symbol(code[1]));
            ret.push(VMCODE.RECORD_CONSTRUCTOR);
        }else if (opecode == "record-access"){
            //ここで引数の型チェックは行わない
            Compile.compile_loop(code[3],env,ret,0);   
            ret.push(VMCODE.RECORD_TO_VECTOR);
            ret.push(VMCODE.VECTOR_REF);
            ret.push(code[2]);
        }else if (opecode == "record-modifier"){
            Compile.compile_loop(code[4],env,ret,0);   
            Compile.compile_loop(code[3],env,ret,0);   
            ret.push(VMCODE.RECORD_TO_VECTOR);
            ret.push(VMCODE.VECTOR_SET);
            ret.push(code[2]);
        }else if (opecode == "error"){
            ret.push(VMCODE.GEN_ERROR);
            ret.push(code[1]);
            ret.push(0);
            ret.push(0);
            ret.push(0);
        }else if (opecode == "pass"){
            ret.push(code[1]);
        }else{

            for (var i=1;i<code.length;i++){
                Compile.compile_loop(code[i],env,ret,0);
            }

            //ret.push(["arg",code.length-1]);
            ret.push(VMCODE.ARGS);
            ret.push(code.length-1);
            Compile.compile_loop(code[0],env,ret,0);
            if (tail){
                ret.push(VMCODE.TAIL_CALL);
            }else{
                ret.push(VMCODE.CALL);
            }
            /*
            exit(1);
            Compile.compile_loop(code[0],env,ret,0);
            if (tail){
                //最適化のために,
                //末尾呼び出しのcall命令は別にする。
                ret.push(["tail-call"]);
            }else{
                ret.push(["call"]);
            }
            */
        }
    }else{
        if (code.type == Zutsuki.TYPE_BOOLEAN){
            if (code.data){
                //ret.push(["push-boolean",1]);
                ret.push(VMCODE.PUSH_TRUE);
            }else{
                //ret.push(["push-boolean",0]);
                ret.push(VMCODE.PUSH_FALSE);
            }
        }else if (code.type == Zutsuki.TYPE_NUMBER){
            //ret.push(["push-number",code.data]);
            if (code.number_type == Zutsuki.NUMBER_TYPE_UNSIGNED_INTEGER){
                ret.push(VMCODE.PUSH);
                ret.push(new Pachycephalo.Integer(parseInt(code.data)));
            }else if (code.number_type == Zutsuki.NUMBER_TYPE_REAL){
                ret.push(VMCODE.PUSH);
                if (code.data == "+inf.0"){
                    ret.push(new Pachycephalo.Float(Infinity));
                }else if (code.data == "-inf.0"){
                    ret.push(new Pachycephalo.Float(-Infinity));
                }else if (code.data == "+nan.0"){
                    ret.push(new Pachycephalo.Float(NaN));
                }else if (code.data == "-nan.0"){
                    ret.push(new Pachycephalo.Float(NaN));
                }else{
                    ret.push(new Pachycephalo.Float(parseFloat(code.data)));
                }
            }else{
                error("ERR");
            }
        }else if (code.type == Zutsuki.TYPE_CONST_VARIABLE){
            //ret.push(["load-const",code.data]);
            ret.push(VMCODE.LOAD_CONST);
            ret.push(code.data);
        }else if (code.type == Zutsuki.TYPE_CHAR){
            ret.push(VMCODE.PUSH);
            ret.push(new Pachycephalo.Char(code.data[2]));
        }else if (code.type == Zutsuki.TYPE_STRING){
            ret.push(VMCODE.PUSH);
            ret.push(new Pachycephalo.String(code.data));
        }else if (code.type == Zutsuki.TYPE_VECTOR){
            ret.push(VMCODE.PUSH);
            ret.push(Compile.zutsuki_object2pachycephalo_object(code));
        }else{
            console.log("???",code);
            exit(1);
        }
    }
}






Compile.compile = function(code,const_data,env,ret_init){
    var ret = [];
    if (ret_init){
        ret = ret_init;
    }

    for (var i=0;i<code.length;i++){
        ret.push(VMCODE.TOP);
        var idx = ret.length;
        ret.push(0);
        Compile.compile_loop(code[i],env,ret,1);
        ret[idx] = ret.length;
        ret.push(VMCODE.END);

    }
    ret.push(VMCODE.EXIT);
    return ret;
}


Compile.compile_one = function(code,const_data,env){
    var ret = [];
    Compile.compile_loop(code,env,ret,1);
    return ret[0];
}

